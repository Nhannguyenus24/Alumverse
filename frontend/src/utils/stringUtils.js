export const truncateText = (text, maxLen = 72, fallback = '-') => {
  if (text == null || text === '') return fallback;
  const s = String(text);
  return s.length <= maxLen ? s : `${s.slice(0, maxLen)}…`;
};

export const forumModerationLabel = (status, t) => {
  const key = String(status || '').toUpperCase();
  const map = {
    PENDING: 'admin:forum_status_pending',
    FLAGGED: 'admin:forum_status_flagged',
    APPROVED: 'admin:forum_status_approved',
    REJECTED: 'admin:forum_status_rejected',
  };
  return map[key] && t ? t(map[key]) : key || '-';
};

export const stringifyJson = (value, fallback = '-') => {
  if (value == null) return fallback;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const NBSP_CODE_POINT = 160;
const NBSP_CHAR = String.fromCharCode(NBSP_CODE_POINT);

export const normalizeNbsp = (html) =>
  typeof html === "string"
    ? html.split(NBSP_CHAR).join(" ").replace(/&nbsp;/g, " ")
    : html;

export const toPlainText = (value) => {
  if (value == null) return '';
  const withoutTags = String(value).replace(/<[^>]*>/g, '');
  const decoded = withoutTags
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
  return decoded.replace(/\s+/g, ' ').trim();
};
