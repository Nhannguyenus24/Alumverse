/** @deprecated Use getAcademicEmptyLabel(t) instead */
const ACADEMIC_EMPTY_LABEL = 'Chưa cập nhật';

/**
 * Returns a translated "not updated" label, or falls back to the Vietnamese
 * literal when no t function is provided (backward compatibility).
 * @param {Function} [t] - optional i18next t function
 * @returns {string}
 */
export const getAcademicEmptyLabel = (t) => t ? t('common:not_updated') : ACADEMIC_EMPTY_LABEL;

function parseAcademicList(value) {
  if (value == null) return [];

  if (Array.isArray(value)) {
    return normalizeAcademicItems(value);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return normalizeAcademicItems(parsed);
    } catch {
      // Keep plain text values as a single item.
    }

    return normalizeAcademicItems([trimmed]);
  }

  return normalizeAcademicItems([value]);
}

export function buildAcademicRecords(source = {}) {
  const academicSource = source ?? {};

  const lists = {
    faculty: parseAcademicList(academicSource.faculty),
    major: parseAcademicList(academicSource.major),
    program: parseAcademicList(academicSource.program),
    startedYear: parseAcademicList(academicSource.startedYear),
    graduatedYear: parseAcademicList(academicSource.graduatedYear),
    graduationStatus: parseAcademicList(academicSource.graduationStatus),
    department: parseAcademicList(academicSource.department),
  };

  const recordCount = Math.max(
    1,
    ...Object.values(lists).map((items) => items.length),
  );

  return Array.from({ length: recordCount }, (_, index) => ({
    faculty: lists.faculty[index] ?? null,
    major: lists.major[index] ?? null,
    program: lists.program[index] ?? null,
    startedYear: lists.startedYear[index] ?? null,
    graduatedYear: lists.graduatedYear[index] ?? null,
    graduationStatus: lists.graduationStatus[index] ?? null,
    department: lists.department[index] ?? null,
  }));
}

export function buildProgramMajorRows(program, major) {
  const programs = parseAcademicList(program);
  const majors = parseAcademicList(major);
  const rowCount = Math.max(programs.length, majors.length, 1);

  return Array.from({ length: rowCount }, (_, index) => ({
    program: programs[index] ?? null,
    major: majors[index] ?? null,
  })).filter((row) => row.program || row.major);
}

function normalizeAcademicItems(items) {
  return items
    .map((item) => {
      if (item == null) return null;
      const text = String(item).trim();
      return text && text !== '0' ? text : null;
    })
    .filter(Boolean);
}
