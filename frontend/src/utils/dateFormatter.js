const DEFAULT_LOCALE = 'vi-VN';

const toValidDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDate = (value, fallback = '-') => {
  const date = toValidDate(value);
  if (!date) return fallback;
  return date.toLocaleDateString(DEFAULT_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatDateTime = (value, fallback = '-') => {
  const date = toValidDate(value);
  if (!date) return fallback;
  return date.toLocaleString(DEFAULT_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateTimeWithSeconds = (value, fallback = '-') => {
  const date = toValidDate(value);
  if (!date) return fallback;
  return date.toLocaleString(DEFAULT_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const formatRelativeTimeVi = (value, fallback = '—') => {
  const date = toValidDate(value);
  if (!date) return fallback;

  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  return formatDate(date, fallback);
};

export const formatTimeAgoVi = (value, fallback = '—') => {
  const date = toValidDate(value);
  if (!date) return fallback;

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  if (diffInSeconds < 60) return 'Vừa xong';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
};

export const formatDateRange = (start, end, fallback = '') => {
  const from = formatDate(start, fallback);
  if (!from) return fallback;
  if (!end) return from;
  return `${from} - ${formatDate(end, fallback)}`;
};
