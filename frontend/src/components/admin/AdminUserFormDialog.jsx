import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import {
  GRADUATION_STATUSES,
  USER_ROLES,
  VERIFICATION_LEVELS,
} from '../../constants/adminDefaultUsers';
import { formatAccountStatusLabel } from '../../constants/adminStatusDisplay';
import { GENDER_OPTIONS, GENDER_LABEL_KEYS, normalizeGender } from '../../constants/gender';
import { getTrustedVerifiers } from '../../utils/api';

const defaultEmptyForm = {
  email: '',
  studentId: '',
  fullName: '',
  phone: '',
  dob: '',
  gender: '',
  password: '',
  role: 'USER',
  status: 'ACTIVE',
  organizationId: '',
  verificationLevel: 0,
  isTrustedVerifier: false,
  academicRows: [],
  requirePasswordChange: false,
};

const emptyAcademicRow = {
  faculty: '',
  department: '',
  program: '',
  major: '',
  startedYear: '',
  graduatedYear: '',
  graduationStatus: '',
};

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  return value || value === 0 ? [value] : [];
};

const normalizeGraduationStatus = (value) => {
  if (!value) return '';
  const raw = String(value).trim();
  const upper = raw.toUpperCase();
  if (upper === 'STUDYING' || upper.includes('ĐANG') || upper.includes('DANG')) return 'STUDYING';
  if (upper === 'GRADUATED' || upper.includes('TỐT') || upper.includes('TOT')) return 'GRADUATED';
  if (upper === 'DROPPED' || upper.includes('BỎ') || upper.includes('BO') || upper.includes('NGHỈ') || upper.includes('NGHI') || upper.includes('THÔI') || upper.includes('THOI')) return 'DROPPED';
  return raw;
};

const buildAcademicRows = (source = {}) => {
  const programs = asArray(source.program);
  const faculties = asArray(source.faculty);
  const departments = asArray(source.department);
  const majors = asArray(source.major);
  const startedYears = asArray(source.startedYear);
  const graduatedYears = asArray(source.graduatedYear);
  const graduationStatuses = asArray(source.graduationStatus);
  const count = Math.max(
    1,
    faculties.length,
    departments.length,
    programs.length,
    majors.length,
    startedYears.length,
    graduatedYears.length,
    graduationStatuses.length,
  );
  return Array.from({ length: count }, (_, index) => ({
    faculty: faculties[index] ?? source.organizationName ?? '',
    department: departments[index] ?? '',
    program: programs[index] ?? '',
    major: majors[index] ?? '',
    startedYear: startedYears[index] ?? '',
    graduatedYear: graduatedYears[index] ?? '',
    graduationStatus: normalizeGraduationStatus(graduationStatuses[index] ?? ''),
  }));
};

const compactAcademicArray = (rows, key, mapper = (value) => value) => {
  const values = rows
    .map((row) => row[key])
    .map((value) => (typeof value === 'string' ? value.trim() : value))
    .map((value) => (value === '' || value === null || value === undefined ? null : mapper(value)));
  const hasAny = values.some((value) => value !== null && value !== undefined && value !== '');
  return hasAny ? values.map((value) => value ?? '') : undefined;
};

const resolvedFullNameForEdit = (u) => {
  if (!u) return '';
  const found = [u.fullName, u.studentId, u.email]
    .map((x) => (typeof x === 'string' ? x.trim() : x))
    .find(Boolean);
  return typeof found === 'string' ? found : '';
};

const getVerifierUserId = (verifier) => verifier?.userId ?? verifier?.id ?? verifier?.user_id;

const normalizeComparableValue = (value) => {
  if (Array.isArray(value)) {
    const normalized = value
      .map(normalizeComparableValue)
      .filter((item) => item !== null && item !== '');
    return normalized.length === 1 ? normalized[0] : normalized;
  }
  if (typeof value === 'string') return value.trim();
  if (value === undefined || value === null || value === '') return null;
  return value;
};

const sameFormValue = (left, right) => (
  JSON.stringify(normalizeComparableValue(left)) === JSON.stringify(normalizeComparableValue(right))
);

const ACCOUNT_STATUS_OPTIONS = [
  'ACTIVE',
  'INACTIVE',
  'BANNED',
  'SUSPENDED',
  'DELETED',
  'DISABLED',
];

const AdminUserFormDialog = ({ open, mode, user, onClose, onSubmit, organizationOptions = [], canAssignAdmin = false }) => {
  const { t } = useTranslation(['admin', 'common', 'profile']);
  const { enqueueSnackbar } = useSnackbar();
  const firstOrganizationId = useMemo(
    () => (organizationOptions.length > 0 ? Number(organizationOptions[0].id) : ''),
    [organizationOptions],
  );
  const [form, setForm] = useState(() => ({ ...defaultEmptyForm, organizationId: firstOrganizationId }));
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [initialTrustedVerifier, setInitialTrustedVerifier] = useState(false);
  const [initialForm, setInitialForm] = useState(null);
  const isEditMode = mode === 'edit';
  const isMembershipReadOnly = false;
  const isProfileReadOnly = false;
  const roleOptions = useMemo(
    () => USER_ROLES.filter((role) => canAssignAdmin || role !== 'ADMIN'),
    [canAssignAdmin],
  );

  useEffect(() => {
    if (!open) return;
    let active = true;
    const timer = setTimeout(() => {
      setShowPassword(false);
      if (mode === 'edit' && user) {
        const resolvedOrganizationId = user.organizationId ?? firstOrganizationId;
        const trustedVerifierValue = Boolean(user.isTrustedVerifier);
        const academicRows = buildAcademicRows(user);
        const nextForm = {
          email: user.email || '',
          studentId: user.studentId || '',
          fullName: resolvedFullNameForEdit(user),
          phone: user.phone || '',
          dob: user.dob || '',
          gender: user.gender ? normalizeGender(user.gender) : '',
          password: '',
          role: user.role || 'USER',
          status: user.status || 'ACTIVE',
          organizationId: resolvedOrganizationId,
          verificationLevel: user.verificationLevel ?? 0,
          isTrustedVerifier: trustedVerifierValue,
          faculty: academicRows.map((row) => row.faculty),
          department: academicRows.map((row) => row.department),
          program: asArray(user.program),
          major: asArray(user.major),
          startedYear: asArray(user.startedYear).map(String),
          graduatedYear: asArray(user.graduatedYear).map(Number),
          graduationStatus: asArray(user.graduationStatus).map(normalizeGraduationStatus),
          academicRows,
          requirePasswordChange: false,
        };
        setInitialTrustedVerifier(trustedVerifierValue);
        setInitialForm(nextForm);
        setForm(nextForm);
        if (resolvedOrganizationId && (user.isTrustedVerifier === undefined || user.isTrustedVerifier === null)) {
          getTrustedVerifiers(resolvedOrganizationId)
            .then((response) => {
              if (!active) return;
              const verifiers = Array.isArray(response?.data?.data) ? response.data.data : [];
              const isTrusted = verifiers.some((verifier) => Number(getVerifierUserId(verifier)) === Number(user.id));
              setInitialTrustedVerifier(isTrusted);
              setInitialForm((prev) => (prev ? { ...prev, isTrustedVerifier: isTrusted } : prev));
              setForm((prev) => ({ ...prev, isTrustedVerifier: isTrusted }));
            })
            .catch(() => {
              // Keep the current form value if the public verifier lookup is unavailable.
            });
        }
      } else {
        setInitialTrustedVerifier(false);
        setInitialForm(null);
        setForm({ ...defaultEmptyForm, role: 'USER', organizationId: firstOrganizationId, academicRows: [{ ...emptyAcademicRow }] });
      }
      setErrors({});
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [open, mode, user, firstOrganizationId]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'role' && value === 'STAFF') {
        next.verificationLevel = 4;
      }
      return next;
    });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleAcademicRowChange = (index, field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({
      ...prev,
      academicRows: prev.academicRows.map((row, rowIndex) => (
        rowIndex === index ? { ...row, [field]: value } : row
      )),
    }));
    const errorKey = `${field}-${index}`;
    if (errors[errorKey]) setErrors((prev) => ({ ...prev, [errorKey]: '' }));
  };

  const addAcademicRow = () => {
    setForm((prev) => ({
      ...prev,
      academicRows: [...(prev.academicRows.length ? prev.academicRows : [{ ...emptyAcademicRow }]), { ...emptyAcademicRow }],
    }));
  };

  const removeAcademicRow = (index) => {
    setForm((prev) => ({
      ...prev,
      academicRows: prev.academicRows.length <= 1
        ? [{ ...emptyAcademicRow }]
        : prev.academicRows.filter((_, rowIndex) => rowIndex !== index),
    }));
  };

  const validate = () => {
    const next = {};
    if (!form.email.trim()) next.email = t('admin:error_email_required');
    if (!form.fullName.trim()) next.fullName = t('admin:error_full_name_required');
    if (!canAssignAdmin && String(form.role || '').toUpperCase() === 'ADMIN') {
      next.role = t('admin:staff_cannot_assign_admin', {
        defaultValue: 'STAFF cannot create or assign ADMIN accounts.',
      });
    }
    if (form.password && form.password.length < 8) next.password = t('admin:error_password_min_length');
    form.academicRows.forEach((row, index) => {
      if (row.graduatedYear && !/^\d{4}$/.test(String(row.graduatedYear).trim())) {
        next[`graduatedYear-${index}`] = t('admin:error_graduated_year_format');
      }
      if (row.startedYear && !/^\d{4}$/.test(String(row.startedYear).trim())) {
        next[`startedYear-${index}`] = t('admin:error_started_year_format', { defaultValue: 'Khóa phải là 4 chữ số (vd: 2020)' });
      }
    });
    setErrors(next);
    const keys = Object.keys(next);
    if (keys.length > 0) enqueueSnackbar(next[keys[0]], { variant: 'error' });
    return keys.length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!form.organizationId) {
      enqueueSnackbar(t('admin:error_org_required'), { variant: 'error' });
      return;
    }
    const org = organizationOptions.find((o) => Number(o.id) === Number(form.organizationId));
    const academicRows = form.academicRows.length ? form.academicRows : [{ ...emptyAcademicRow }];
    const hasAcademicContent = academicRows.some((row) => (
      row.faculty || row.department || row.program || row.major || row.startedYear || row.graduatedYear || row.graduationStatus
    ));
    const fullPayload = {
      email: form.email,
      studentId: form.studentId,
      fullName: form.fullName,
      phone: form.phone,
      dob: form.dob,
      gender: form.gender,
      role: form.role,
      status: form.status,
      verificationLevel: Number(form.verificationLevel),
      faculty: hasAcademicContent ? compactAcademicArray(academicRows, 'faculty') : undefined,
      department: hasAcademicContent ? compactAcademicArray(academicRows, 'department') : undefined,
      program: compactAcademicArray(academicRows, 'program'),
      major: compactAcademicArray(academicRows, 'major'),
      startedYear: compactAcademicArray(academicRows, 'startedYear', String),
      graduatedYear: compactAcademicArray(academicRows, 'graduatedYear', Number),
      graduationStatus: compactAcademicArray(academicRows, 'graduationStatus', normalizeGraduationStatus),
    };
    if (!isEditMode) {
      Object.assign(fullPayload, {
        organizationId: Number(form.organizationId),
        organizationName: org?.name ?? '',
      });
    }
    const payload = mode === 'edit' && initialForm ? {} : { ...fullPayload };
    if (mode === 'edit' && initialForm) {
      Object.entries(fullPayload).forEach(([key, value]) => {
        if (!sameFormValue(value, initialForm[key])) {
          payload[key] = value;
        }
      });
    }
    if (mode !== 'edit' || Boolean(form.isTrustedVerifier) !== initialTrustedVerifier) {
      payload.isTrustedVerifier = Boolean(form.isTrustedVerifier);
      payload.organizationId = Number(form.organizationId);
    }
    if (mode === 'edit' && form.requirePasswordChange) {
      payload.requirePasswordChange = true;
    }
    if (form.password) payload.password = form.password;
    try {
      await Promise.resolve(onSubmit(payload));
      onClose();
    } catch {
      // Parent shows errors; keep dialog open
    }
  };

  const slotProps = { inputLabel: { shrink: true } };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" scroll="body">
      <DialogTitle sx={{ color: 'primary.main', fontWeight: 700 }}>
        {mode === 'create' ? t('admin:create_user') : t('admin:edit_user')}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1, overflow: 'visible' }}>

        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
          {t('admin:account_info_section')}
        </Typography>

        <TextField
          label="Email"
          type="email"
          value={form.email}
          onChange={handleChange('email')}
          error={!!errors.email}
          fullWidth
          required
          slotProps={slotProps}
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label={t('admin:student_id_label')}
            value={form.studentId}
            onChange={handleChange('studentId')}
            disabled={isMembershipReadOnly}
            fullWidth
            slotProps={slotProps}
          />
          <TextField
            label={t('profile:full_name')}
            value={form.fullName}
            onChange={handleChange('fullName')}
            error={!!errors.fullName}
            disabled={isProfileReadOnly}
            fullWidth
            required
            slotProps={slotProps}
          />
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <TextField
            label={t('admin:user_detail_field_phone')}
            value={form.phone}
            onChange={handleChange('phone')}
            fullWidth
            slotProps={slotProps}
          />
          <TextField
            label={t('admin:user_detail_field_dob')}
            type="date"
            value={form.dob}
            onChange={handleChange('dob')}
            fullWidth
            slotProps={slotProps}
          />
          <TextField
            select
            label={t('admin:user_detail_field_gender')}
            value={form.gender}
            onChange={handleChange('gender')}
            fullWidth
            slotProps={slotProps}
          >
            <MenuItem value="">{t('admin:no_selection')}</MenuItem>
            {GENDER_OPTIONS.map((g) => (
              <MenuItem key={g} value={g}>{t(`admin:${GENDER_LABEL_KEYS[g]}`, { defaultValue: t(`settings:${GENDER_LABEL_KEYS[g]}`) })}</MenuItem>
            ))}
          </TextField>
        </Box>

        <Divider />

        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
          {t('admin:password_section', { defaultValue: 'Mật khẩu' })}
        </Typography>
        <TextField
          label={mode === 'edit' ? t('admin:password_new_optional') : t('admin:password_default_hint')}
          type={showPassword ? 'text' : 'password'}
          value={form.password}
          onChange={handleChange('password')}
          error={!!errors.password}
          helperText={errors.password ?? (mode === 'edit' ? t('admin:password_keep_hint') : t('admin:password_default_keep_hint'))}
          fullWidth
          autoComplete="new-password"
          slotProps={{
            inputLabel: { shrink: true },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword((v) => !v)} onMouseDown={(e) => e.preventDefault()} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <Divider />

        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
          {t('admin:organization_section', { defaultValue: 'Tổ chức' })}
        </Typography>
        <TextField
          select
          label={t('admin:organization_label')}
          value={form.organizationId}
          onChange={handleChange('organizationId')}
          disabled={isMembershipReadOnly}
          fullWidth
          slotProps={slotProps}
        >
          {organizationOptions.map((org) => (
            <MenuItem key={org.id} value={org.id}>{org.name}</MenuItem>
          ))}
        </TextField>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            select
            label={t('admin:role_label')}
            value={form.role}
            onChange={handleChange('role')}
            error={!!errors.role}
            helperText={errors.role}
            fullWidth
            slotProps={slotProps}
          >
            {!canAssignAdmin && String(form.role || '').toUpperCase() === 'ADMIN' && (
              <MenuItem value="ADMIN" disabled>{t('admin:role.ADMIN', { defaultValue: 'ADMIN' })}</MenuItem>
            )}
            {roleOptions.map((r) => <MenuItem key={r} value={r}>{t(`admin:role.${r}`, { defaultValue: r })}</MenuItem>)}
          </TextField>
          <TextField
            select
            label={t('admin:status_label')}
            value={form.status}
            onChange={handleChange('status')}
            fullWidth
            slotProps={slotProps}
          >
            {ACCOUNT_STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s}>{formatAccountStatusLabel(s, t)}</MenuItem>)}
          </TextField>
        </Box>

        <Divider />

        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
          {t('admin:education_verification_section')}
        </Typography>

        {(form.academicRows.length ? form.academicRows : [{ ...emptyAcademicRow }]).map((row, index) => {
          return (
            <Box key={`academic-${index}`} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {t('admin:academic_record_title', { defaultValue: 'Học vấn {{index}}', index: index + 1 })}
                </Typography>
                <IconButton size="small" color="error" onClick={() => removeAcademicRow(index)} disabled={form.academicRows.length <= 1}>
                  <DeleteOutlineOutlinedIcon fontSize="small" />
                </IconButton>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  label={t('admin:education_faculty_label', { defaultValue: 'Khoa' })}
                  value={row.faculty}
                  onChange={handleAcademicRowChange(index, 'faculty')}
                  disabled={isMembershipReadOnly}
                  fullWidth
                  slotProps={slotProps}
                />
                <TextField
                  label={t('admin:edu_field_department', { defaultValue: 'Bộ môn' })}
                  value={row.department}
                  onChange={handleAcademicRowChange(index, 'department')}
                  disabled={isMembershipReadOnly}
                  fullWidth
                  slotProps={slotProps}
                />
                <TextField
                  label={t('admin:education_major_label')}
                  value={row.major}
                  onChange={handleAcademicRowChange(index, 'major')}
                  disabled={isMembershipReadOnly}
                  fullWidth
                  placeholder={t('admin:education_major_placeholder')}
                  slotProps={slotProps}
                />
                <TextField
                  label={t('admin:education_program_label')}
                  value={row.program}
                  onChange={handleAcademicRowChange(index, 'program')}
                  disabled={isMembershipReadOnly}
                  fullWidth
                  placeholder={t('admin:education_program_placeholder')}
                  slotProps={slotProps}
                />
                <TextField
                  label={t('admin:started_year_label', { defaultValue: 'Khóa' })}
                  value={row.startedYear}
                  onChange={handleAcademicRowChange(index, 'startedYear')}
                  error={!!errors[`startedYear-${index}`]}
                  helperText={errors[`startedYear-${index}`]}
                  disabled={isMembershipReadOnly}
                  fullWidth
                  placeholder={t('admin:year_placeholder')}
                  slotProps={slotProps}
                />
                <TextField
                  label={t('admin:graduated_year_label')}
                  value={row.graduatedYear}
                  onChange={handleAcademicRowChange(index, 'graduatedYear')}
                  error={!!errors[`graduatedYear-${index}`]}
                  helperText={errors[`graduatedYear-${index}`]}
                  disabled={isMembershipReadOnly}
                  fullWidth
                  placeholder={t('admin:year_placeholder')}
                  slotProps={slotProps}
                />
                <TextField
                  select
                  label={t('admin:graduation_status_label')}
                  value={row.graduationStatus}
                  onChange={handleAcademicRowChange(index, 'graduationStatus')}
                  disabled={isMembershipReadOnly}
                  fullWidth
                  slotProps={slotProps}
                >
                  <MenuItem value="">{t('admin:no_selection')}</MenuItem>
                  {GRADUATION_STATUSES.map((s) => (
                    <MenuItem key={s} value={s}>
                      {t(`admin:graduation_status.${s}`)}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>
          );
        })}
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<AddOutlinedIcon />}
          onClick={addAcademicRow}
          sx={{ alignSelf: 'flex-end', mt: 0.5, mb: 1.5 }}
        >
          {t('admin:add_academic_record', { defaultValue: 'Thêm học vấn' })}
        </Button>
        <TextField
          select
          label={t('admin:verification_level_label')}
          value={form.verificationLevel}
          onChange={handleChange('verificationLevel')}
          fullWidth
          slotProps={slotProps}
        >
          {VERIFICATION_LEVELS.map((level) => (
            <MenuItem key={level} value={level}>
              {level} - {t(`admin:verification_level.${level}`, { defaultValue: String(level) })}
            </MenuItem>
          ))}
        </TextField>

        <FormControlLabel
          control={
            <Switch
              checked={Boolean(form.isTrustedVerifier)}
              onChange={(e) => setForm((prev) => ({ ...prev, isTrustedVerifier: e.target.checked }))}
            />
          }
          label={t('admin:trusted_verifier_label')}
        />

        {mode === 'edit' && (
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(form.requirePasswordChange)}
                onChange={(e) => setForm((prev) => ({ ...prev, requirePasswordChange: e.target.checked }))}
              />
            }
            label={t('admin:require_password_change_label', { defaultValue: 'Yêu cầu thay đổi mật khẩu (Gửi email)' })}
          />
        )}

      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" color="secondary" onClick={onClose} sx={{ textTransform: 'none' }}>
          {t('common:cancel')}
        </Button>
        <Button variant="contained" onClick={handleSubmit} sx={{ textTransform: 'none', fontWeight: 700 }}>
          {mode === 'create' ? t('admin:create_user') : t('admin:save_user_info')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminUserFormDialog;
