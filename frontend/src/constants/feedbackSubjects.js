// Subject codes for the public contact form (ContactPage). The DB stores the raw
// code (e.g. "system_error"), and it is mapped to a translated label at display
// time so both the form and the admin School Feedback views stay bilingual.
export const FEEDBACK_SUBJECTS = [
  'general',
  'admissions',
  'alumni',
  'partnership',
  'system_error',
  'other',
];

// code -> i18n key. The labels live in the `contact` namespace, shared by
// ContactPage and the admin feedback pages.
export const FEEDBACK_SUBJECT_LABEL_KEYS = {
  general: 'contact:subject_general',
  admissions: 'contact:subject_admissions',
  alumni: 'contact:subject_alumni',
  partnership: 'contact:subject_partnership',
  system_error: 'contact:subject_system_error',
  other: 'contact:subject_other',
};

// Resolve a stored subject code to its translated label. Legacy rows that already
// hold free text (not a known code) fall through to the raw value.
export const formatFeedbackSubject = (t, raw) => {
  if (raw == null || raw === '') return '—';
  const key = FEEDBACK_SUBJECT_LABEL_KEYS[String(raw).toLowerCase()];
  return key ? t(key, { defaultValue: raw }) : raw;
};
