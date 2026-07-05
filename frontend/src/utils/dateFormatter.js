import dayjs from "dayjs";

const DEFAULT_LOCALE = 'vi-VN';

const toValidDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};


/**
 * Formats a date string or object into a human-readable format using dayjs.
 * @param {string|Date|dayjs.Dayjs} value - The date to format.
 * @param {string} formatStr - The dayjs format string.
 * @returns {string} The formatted date string.
 */
export const formatDate = (value, formatStr = "DD/MM/YYYY") => {
  if (!value) return "--";
  const d = dayjs(value);
  return d.isValid() ? d.format(formatStr) : "--";
};


/**
 * Formats a date with time using dayjs.
 * @param {string|Date} value 
 * @returns {string}
 */
export const formatDateTime = (value) => formatDate(value, "DD/MM/YYYY HH:mm");

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

export const formatRelativeTimeVi = (value, fallback = '—', t = null) => {
  const date = toValidDate(value);
  if (!date) return fallback;

  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return t ? t('common:just_now') : 'Vừa xong';
  if (diffMins < 60) return t ? t('common:minutes_ago', { count: diffMins }) : `${diffMins} phút trước`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return t ? t('common:hours_ago', { count: diffHours }) : `${diffHours} giờ trước`;

  return formatDate(date);
};

export const formatTimeAgoVi = (value, fallback = '—', t = null) => {
  const date = toValidDate(value);
  if (!date) return fallback;

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  if (diffInSeconds < 60) return t ? t('common:just_now') : 'Vừa xong';
  if (diffInSeconds < 3600) return t ? t('common:minutes_ago', { count: Math.floor(diffInSeconds / 60) }) : `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return t ? t('common:hours_ago', { count: Math.floor(diffInSeconds / 3600) }) : `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  return t ? t('common:days_ago', { count: Math.floor(diffInSeconds / 86400) }) : `${Math.floor(diffInSeconds / 86400)} ngày trước`;
};

export const formatDateRange = (start, end, fallback = '') => {
  const from = formatDate(start);
  if (!from || from === "--") return fallback;
  if (!end) return from;
  const to = formatDate(end);
  if (to === "--") return from;
  return `${from} - ${to}`;
};
