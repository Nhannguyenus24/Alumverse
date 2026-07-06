export const truncateText = (text, maxLen = 72, fallback = '-') => {
  if (text == null || text === '') return fallback;
  const s = String(text);
  return s.length <= maxLen ? s : `${s.slice(0, maxLen)}…`;
};

export const forumModerationLabel = (status) => {
  const key = String(status || '').toUpperCase();
  const map = {
    PENDING: 'Chờ duyệt',
    FLAGGED: 'Bị báo cáo',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Bị từ chối',
  };
  return map[key] || key || '-';
};

export const stringifyJson = (value, fallback = '-') => {
  if (value == null) return fallback;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export const toPlainText = (value) => {
  if (value == null) return '';
  return String(value).replace(/<[^>]*>/g, '').trim();
};
