const DEFAULT_LOCALE = 'vi-VN';

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const formatNumberVi = (value, fallback = '0') => {
  const num = toNumber(value);
  if (num === null) return fallback;
  return num.toLocaleString(DEFAULT_LOCALE);
};

export const formatCurrencyVnd = (value, fallback = '0 ₫') => {
  const num = toNumber(value);
  if (num === null) return fallback;
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency: 'VND',
  }).format(num);
};

export const formatFixed = (value, digits = 1, fallback = '—') => {
  const num = toNumber(value);
  if (num === null) return fallback;
  return num.toFixed(digits);
};

export const formatRating = (value, fallback = '—') => formatFixed(value, 1, fallback);
