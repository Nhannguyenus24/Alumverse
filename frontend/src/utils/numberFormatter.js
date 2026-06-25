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

/**
 * Formats a number as a currency string for Vietnam (vi-VN).
 * @param {number|string} value - The value to format.
 * @returns {string} The formatted currency string.
 */
export function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN").format(Number(value ?? 0));
}

/**
 * Formats a number as a currency string with "VND" suffix.
 * @param {number|string} value - The value to format.
 * @returns {string} The formatted string (e.g., "1.000.000 VND").
 */
function formatVND(value) {
  return `${formatCurrency(value)} VND`;
}

const ONES = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
// Bậc cho từng nhóm 3 chữ số: '', nghìn, triệu rồi lặp lại kèm 'tỷ'.
const SCALE_BASE = ['', 'nghìn', 'triệu'];

const scaleFor = (groupIndex) => {
  const base = SCALE_BASE[groupIndex % 3];
  const ty = ' tỷ'.repeat(Math.floor(groupIndex / 3));
  return `${base}${ty}`.trim();
};

// Đọc một nhóm 3 chữ số (0..999). isLeading: nhóm cao nhất (không cần "không trăm").
const readGroup = (num, isLeading) => {
  const tram = Math.floor(num / 100);
  const chuc = Math.floor((num % 100) / 10);
  const donvi = num % 10;
  const parts = [];

  if (tram > 0) {
    parts.push(ONES[tram], 'trăm');
  } else if (!isLeading && (chuc > 0 || donvi > 0)) {
    parts.push('không', 'trăm');
  }

  if (chuc > 1) {
    parts.push(ONES[chuc], 'mươi');
    if (donvi === 1) parts.push('mốt');
    else if (donvi === 5) parts.push('lăm');
    else if (donvi > 0) parts.push(ONES[donvi]);
  } else if (chuc === 1) {
    parts.push('mười');
    if (donvi === 5) parts.push('lăm');
    else if (donvi > 0) parts.push(ONES[donvi]);
  } else if (donvi > 0) {
    if (tram > 0 || !isLeading) parts.push('lẻ');
    parts.push(ONES[donvi]);
  }

  return parts;
};

/**
 * Đọc một số nguyên thành chữ tiếng Việt. Ví dụ: 1000000 → "một triệu".
 * @param {number|string} value
 * @returns {string}
 */
function readVietnameseNumber(value) {
  const parsed = toNumber(value);
  if (parsed === null) return '';
  let num = Math.floor(Math.abs(parsed));
  if (num === 0) return 'không';

  const groups = [];
  while (num > 0) {
    groups.push(num % 1000);
    num = Math.floor(num / 1000);
  }

  const words = [];
  const highest = groups.length - 1;
  for (let i = highest; i >= 0; i--) {
    if (groups[i] === 0) continue;
    words.push(...readGroup(groups[i], i === highest));
    const scale = scaleFor(i);
    if (scale) words.push(scale);
  }

  return words.join(' ');
}

/**
 * Đọc số tiền thành chữ tiếng Việt kèm đơn vị "đồng", viết hoa chữ đầu.
 * Ví dụ: 1000000 → "Một triệu đồng". Trả về '' nếu không phải số dương.
 * @param {number|string} value
 * @returns {string}
 */
export function readVietnameseDong(value) {
  const parsed = toNumber(value);
  if (parsed === null || parsed <= 0) return '';
  const sentence = `${readVietnameseNumber(parsed)} đồng`;
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}
