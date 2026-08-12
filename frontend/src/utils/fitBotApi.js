const FITBOT_API_URL = import.meta.env.VITE_FITBOT_API_URL?.replace(/\/+$/, '');

const buildRequestBody = (question) => ({
  question,
  top_k: 7,
  model: 'gemini-2.5-flash',
  use_reranker: false,
});

const requestHeaders = (headers = {}) => ({
  accept: 'application/json',
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
  ...headers,
});

const getEndpoint = (path) => {
  if (!FITBOT_API_URL) {
    throw new Error('VITE_FITBOT_API_URL is not configured');
  }
  return `${FITBOT_API_URL}${path}`;
};

const ensureSuccessfulResponse = (response) => {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
};

// Keep the non-streaming API available for scripts and consumers that need one
// complete JSON response instead of incremental SSE events.
export const queryFitBotJson = async (question, { signal, headers } = {}) => {
  const response = await fetch(getEndpoint('/api/query'), {
    method: 'POST',
    headers: requestHeaders(headers),
    body: JSON.stringify(buildRequestBody(question)),
    signal,
  });

  ensureSuccessfulResponse(response);
  return response.json();
};

const parseSseEvent = (eventText, { onContent, onSources }) => {
  const payload = eventText
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n')
    .trim();

  if (!payload) return false;
  if (payload === '[DONE]') return true;

  const event = JSON.parse(payload);
  if (event.type === 'error') {
    throw new Error(event.content || 'FitBot stream failed');
  }
  if (event.type === 'sources' || Array.isArray(event.sources)) {
    onSources?.(event.sources || []);
  }
  if (event.type === 'content' && typeof event.content === 'string') {
    onContent?.(event.content);
  } else if (typeof event.answer === 'string') {
    // Backward compatibility with the older stream response shape.
    onContent?.(event.answer);
  }

  return event.type === 'done';
};

// ---------------------------------------------------------------------------
// Knowledge base management (admin)
//
// These mirror the FitBOT /api/knowledge/* endpoints and share the same base
// URL / path handling as the chat endpoints above. Every knowledge endpoint on
// the FitBOT side requires a Bearer JWT (editor/admin scope), so callers must
// pass an `Authorization` header via `headers`.
// ---------------------------------------------------------------------------

// Upload/download requests must not force a JSON Content-Type: the browser sets
// the correct multipart boundary for FormData, and downloads carry their own.
const baseHeaders = (headers = {}) => ({
  'ngrok-skip-browser-warning': 'true',
  ...headers,
});

export const listKnowledge = async ({ signal, headers } = {}) => {
  const response = await fetch(getEndpoint('/api/knowledge'), {
    headers: baseHeaders(headers),
    signal,
  });
  ensureSuccessfulResponse(response);
  const data = await response.json();
  return data.items || [];
};

export const importKnowledge = async (file, { signal, headers, overwrite = false } = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(
    getEndpoint(`/api/knowledge/import?overwrite=${overwrite ? 'true' : 'false'}`),
    {
      method: 'POST',
      headers: baseHeaders(headers),
      body: formData,
      signal,
    }
  );
  ensureSuccessfulResponse(response);
  return response.json();
};

export const deleteKnowledge = async (name, { signal, headers } = {}) => {
  const response = await fetch(getEndpoint(`/api/knowledge/${encodeURIComponent(name)}`), {
    method: 'DELETE',
    headers: baseHeaders(headers),
    signal,
  });
  ensureSuccessfulResponse(response);
  return response.json();
};

export const downloadKnowledgeFile = async (name, { signal, headers } = {}) => {
  const response = await fetch(
    getEndpoint(`/api/knowledge/${encodeURIComponent(name)}/file`),
    { headers: baseHeaders(headers), signal }
  );
  ensureSuccessfulResponse(response);
  const contentType = response.headers.get('content-type') || '';
  const isTextual =
    contentType.includes('text/') ||
    contentType.includes('application/json') ||
    /\.(txt|md|csv|json)$/i.test(name);
  return { contentType, isTextual, text: isTextual ? await response.text() : null };
};

export const streamFitBotResponse = async (
  question,
  { signal, headers, onContent, onSources } = {}
) => {
  const response = await fetch(getEndpoint('/api/stream-query'), {
    method: 'POST',
    headers: requestHeaders({ accept: 'text/event-stream', ...headers }),
    body: JSON.stringify(buildRequestBody(question)),
    signal,
  });

  ensureSuccessfulResponse(response);
  if (!response.body) throw new Error('FitBot stream is unavailable');

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let completed = false;

  while (!completed) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });

    let boundary = buffer.match(/\r?\n\r?\n/);
    while (boundary) {
      const eventText = buffer.slice(0, boundary.index);
      buffer = buffer.slice(boundary.index + boundary[0].length);
      completed = parseSseEvent(eventText, { onContent, onSources });
      if (completed) break;
      boundary = buffer.match(/\r?\n\r?\n/);
    }

    if (done) {
      if (!completed && buffer.trim()) {
        completed = parseSseEvent(buffer, { onContent, onSources });
      }
      break;
    }
  }

  if (completed) await reader.cancel();
};
