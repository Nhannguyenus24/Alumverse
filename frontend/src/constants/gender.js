// Canonical gender enum. Gender is free-text in the DB (legacy rows use "Male",
// the settings form saves "male", seed data has "Other"...), so all reads must be
// normalized to exactly these three values.
const GENDER = Object.freeze({
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
});

export const GENDER_OPTIONS = [GENDER.MALE, GENDER.FEMALE, GENDER.OTHER];

// i18n keys (present in the `settings` and `admin` namespaces).
export const GENDER_LABEL_KEYS = Object.freeze({
  [GENDER.MALE]: 'gender_male',
  [GENDER.FEMALE]: 'gender_female',
  [GENDER.OTHER]: 'gender_other',
});

/**
 * Map any raw gender value to one of the three canonical genders.
 * Anything that is not clearly male/female (empty, unknown, other languages...)
 * collapses into OTHER, guaranteeing only three buckets.
 */
export const normalizeGender = (raw) => {
  const v = String(raw ?? '').trim().toLowerCase();
  if (v === 'male' || v === 'm' || v === 'nam') return GENDER.MALE;
  if (v === 'female' || v === 'f' || v === 'nu' || v === 'nữ') return GENDER.FEMALE;
  return GENDER.OTHER;
};
