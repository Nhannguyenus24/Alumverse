const DISPLAY_ROLE_KEYS = {
  ADMIN: 'role_admin',
  STAFF: 'role_staff',
  MODERATOR: 'role_moderator',
};

const normalizeRole = (value) => {
  if (Array.isArray(value)) return normalizeRole(value[0]);
  if (!value) return '';
  return String(value).replace(/^ROLE_/i, '').trim().toUpperCase();
};

const normalizeList = (value) => {
  if (Array.isArray(value)) return value.map(String);
  if (value == null || value === '') return [];
  return [String(value)];
};

const hasAnyAcademicValue = (profile, academicProfile) => {
  const source = academicProfile || profile || {};
  return Boolean(
    profile?.studentId ||
    source.program ||
    source.major ||
    source.faculty ||
    source.department ||
    source.startedYear ||
    source.graduatedYear,
  );
};

export const resolveProfileRoleLabel = ({ profile, academicProfile, t }) => {
  const role = normalizeRole(profile?.role ?? profile?.userRole ?? profile?.roles);
  const roleLabelKey = DISPLAY_ROLE_KEYS[role];

  if (roleLabelKey) {
    return t(`profile:${roleLabelKey}`, { defaultValue: role });
  }

  const graduationStatuses = normalizeList(
    academicProfile?.graduationStatus ?? profile?.organizationMember?.graduationStatus ?? profile?.graduationStatus,
  ).map((status) => status.toUpperCase());

  if (graduationStatuses.some((status) => status.includes('GRADUATED') || status.includes('ALUMNI'))) {
    return t('profile:alumni');
  }

  if (hasAnyAcademicValue(profile, academicProfile)) {
    return t('profile:student');
  }

  if (role && role !== 'USER') {
    return t(`profile:role_${role.toLowerCase()}`, { defaultValue: role });
  }

  return t('profile:member_role_default');
};

