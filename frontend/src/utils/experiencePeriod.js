/**
 * Work-experience period helpers. Storage contract (kept backward-compatible):
 *  - `period`: a display string. When NOT current: "MM/YYYY - MM/YYYY".
 *    When current (`isCurrent === true`): "MM/YYYY" (start only).
 *  - `isCurrent`: boolean flag for an ongoing job.
 *
 * For an ongoing job we store only the start month and compute the end as the
 * CURRENT month at display time, so it auto-updates over time without any
 * server write.
 */

const SEP = ' - ';

const currentLabel = (t) =>
  (t ? t('signup_profile_exp_current', 'Hiện tại') : 'Hiện tại');

/** Split a stored period into [start, end] month-year strings. */
export const splitPeriod = (period) => {
  if (!period) return ['', ''];
  const parts = String(period).split(/\s*[-—]\s*/);
  return [(parts[0] || '').trim(), (parts[1] || '').trim()];
};

/** "MM/YYYY" for the current month. */
export const currentMonthYear = () => {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return `${mm}/${now.getFullYear()}`;
};

/** Valid "MM/YYYY" (month 01-12, 4-digit year). Empty allowed (optional). */
const isValidMonthYear = (v) => {
  const s = (v || '').trim();
  if (!s) return true;
  const m = /^(\d{2})\/(\d{4})$/.exec(s);
  if (!m) return false;
  const month = Number(m[1]);
  return month >= 1 && month <= 12;
};

/**
 * Build the stored `period` string from the two inputs + isCurrent flag.
 * Current job → start only. Otherwise → "start - end" (or just one side if the
 * other is empty).
 */
export const buildPeriod = (start, end, isCurrent) => {
  const s = (start || '').trim();
  if (isCurrent) return s;
  const e = (end || '').trim();
  if (s && e) return `${s}${SEP}${e}`;
  return s || e;
};

/**
 * Display string for an experience entry. For a current job, the end is the
 * live current month (auto-updates), rendered as "MM/YYYY - Hiện tại".
 */
export const formatPeriodDisplay = (entry, t) => {
  if (!entry) return '';
  const isCurrent = entry.isCurrent === true || entry.isCurrent === 'true';
  const [start] = splitPeriod(entry.period);
  if (isCurrent) {
    const s = start || splitPeriod(entry.period)[0];
    return s ? `${s}${SEP}${currentLabel(t)}` : currentLabel(t);
  }
  return entry.period || '';
};
