import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  Autocomplete, Alert, Box, Card, Container, Chip, TextField, Typography, Button, MenuItem,
  FormControlLabel, Switch, Divider, Paper, FormControl, InputLabel, Select, Stack,
  InputAdornment, IconButton, List, ListItem, ListItemText, CircularProgress,
} from '@mui/material';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SecurityIcon from '@mui/icons-material/Security';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PeopleIcon from '@mui/icons-material/People';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import DialogActions from '@mui/material/DialogActions';
import Slider from '@mui/material/Slider';
import { useTranslation } from 'react-i18next';
import Page from '../../components/Page';
import NetworkConnectionsPanel from '../../components/network/NetworkConnectionsPanel';
import Sidebar from '../../components/Sidebar';
import { userSettingsApi } from '../../utils/api';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import SendIcon from '@mui/icons-material/Send';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import useAuthStore from '../../stores/authStore';
import { useNotification } from '../../hooks/useNotification';
import { useOrganization } from '../../hooks/useOrganization';
import { useOrgPath } from '../../hooks/useOrgNavigate';
import { formatDateTime } from '../../utils/dateFormatter';
import AvatarUploadDialog from "../../components/profile/AvatarUploadDialog";
import useAvatarCrop from "../../hooks/profile/useAvatarCrop";
import ChangeEmailModal from '../../components/profile/ChangeEmailModal';
import { useUploadImage } from '../../utils/imageUtils';
import { GENDER_OPTIONS, GENDER_LABEL_KEYS } from '../../constants/gender';
import { resolveProfileRoleLabel } from '../../utils/profileRoleUtils';

const parseOrganizationOptions = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item ?? '').trim()).filter(Boolean);

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item ?? '').trim()).filter(Boolean);
    } catch {
      return trimmed.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
};

const normalizeAcademicList = (value) => {
  if (value == null) return [];
  if (Array.isArray(value)) return value.map((item) => String(item ?? '').trim()).filter(Boolean);

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item ?? '').trim()).filter(Boolean);
    } catch {
      return [trimmed];
    }
  }
  return [String(value).trim()].filter(Boolean);
};

const normalizeIntegerList = (value) => normalizeAcademicList(value).map((item) => Number(item)).filter((item) => Number.isInteger(item));

const dateInputSx = {
  '& input[type="date"]::-webkit-calendar-picker-indicator': {
    opacity: 0.75,
    filter: (theme) => (theme.palette.mode === 'dark' ? 'invert(1)' : 'none'),
  },
};

export default function SettingPage() {
  const { t } = useTranslation(['settings', 'profile']);
  const { showSuccess, showError, showWarning } = useNotification();
  const { organization } = useOrganization();
  const organizationId = useMemo(() => Number(organization?.id) || null, [organization?.id]);

  const organizationProgramOptions = useMemo(() => parseOrganizationOptions(organization?.programs), [organization?.programs]);
  const organizationMajorOptions = useMemo(() => parseOrganizationOptions(organization?.majors), [organization?.majors]);

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'personal';
  const setActiveTab = useCallback((newTab) => {
    setSearchParams({ tab: newTab });
  }, [setSearchParams]);

  const [isTrustedVerifier, setIsTrustedVerifier] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const [pendingEduRequest, setPendingEduRequest] = useState(null);
  const [isEduEditMode, setIsEduEditMode] = useState(false);
  const [originalEducations, setOriginalEducations] = useState(null);
  const [submitEduPending, setSubmitEduPending] = useState(false);

  const menuItems = useMemo(() => {
    const items = [
      { id: 'personal', label: t('tab_personal'), icon: <PersonIcon /> },
      { id: 'account', label: t('tab_account'), icon: <SecurityIcon /> },
      { id: 'notification', label: t('tab_notification'), icon: <NotificationsIcon /> },
      { id: 'connections', label: t('tab_connections'), icon: <PeopleIcon /> },
      { id: 'advisor', label: t('tab_advisor'), icon: <VerifiedUserIcon /> },
    ];
    if (isTrustedVerifier) items.push({ id: 'verification', label: t('tab_verification'), icon: <GroupAddIcon /> });
    return items;
  }, [isTrustedVerifier, t]);

  const [formData, setFormData] = useState({
    fullName: '', gender: '', birthDate: '', phone: '', studentId: '', email: '',
    currentJobTitle: '', currentCompany: '', linksText: '',
    educations: [{ faculty: '', department: '', program: '', startedYear: '', graduatedYear: '', major: '', graduationStatus: '' }],
  });

  const [notificationSettings, setNotificationSettings] = useState({
    forumReplyEnabled: true, eventReminderEnabled: true, newsEnabled: true, emailEnabled: true, pushEnabled: true,
  });

  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loginHistory, setLoginHistory] = useState([]);

  const getErrorMessage = (error, fallbackMessage) => error?.response?.data?.message || error?.response?.data?.error || fallbackMessage;

  const loadPendingRequests = async () => {
    if (!organizationId || !isTrustedVerifier) return;
    setLoadingRequests(true);
    try {
      const requests = await userSettingsApi.getPendingPeerVerifications(organizationId);
      setPendingRequests(requests);
    } catch (error) {
      console.error('Failed to load pending requests', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const navigate = useNavigate();
  const toOrgPath = useOrgPath();
  const { user } = useAuthStore();
  const verificationLevel = useAuthStore((state) => state.verificationLevel);
  const setAuthUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();
  const { uploadBase64 } = useUploadImage();
  const avatarCrop = useAvatarCrop();
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalFormData, setOriginalFormData] = useState(null);

  const [isChangeEmailModalOpen, setIsChangeEmailModalOpen] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [profile, member, settings, history, pendingEdu] = await Promise.all([
          userSettingsApi.getProfile(),
          organizationId ? userSettingsApi.getOrganizationMember(organizationId) : Promise.resolve(null),
          userSettingsApi.getNotificationSettings(),
          userSettingsApi.getLoginHistory({ page: 0, limit: 10 }),
          organizationId ? userSettingsApi.getPendingEducationRequest(organizationId).catch(() => null) : Promise.resolve(null),
        ]);

        setPendingEduRequest(pendingEdu ?? null);

        setIsTrustedVerifier(member?.isTrustedVerifier ?? false);

        const programs = normalizeAcademicList(member?.program);
        const graduationYears = normalizeIntegerList(member?.graduatedYear).map(String);
        const specializations = normalizeAcademicList(member?.major);
        const graduationStatuses = normalizeAcademicList(member?.graduationStatus);
        const startedYears = normalizeAcademicList(member?.startedYear);
        const faculties = normalizeAcademicList(member?.faculty);
        const departments = normalizeAcademicList(member?.department);

        const maxLength = Math.max(
          programs.length, graduationYears.length, specializations.length,
          graduationStatuses.length, startedYears.length, faculties.length, departments.length,
        );

        const educations = [];
        for (let i = 0; i < maxLength; i += 1) {
          educations.push({
            program: programs[i] || '', graduatedYear: graduationYears[i] || '', major: specializations[i] || '',
            graduationStatus: graduationStatuses[i] || '', startedYear: startedYears[i] || '', faculty: faculties[i] || '', department: departments[i] || '',
          });
        }

        if (educations.length === 0) {
          educations.push({ faculty: '', department: '', program: '', startedYear: '', graduatedYear: '', major: '', graduationStatus: '' });
        }

        setFormData((prev) => ({
          ...prev,
          fullName: profile?.fullName ?? '',
          gender: (profile?.gender ?? '').toLowerCase(),
          birthDate: profile?.dob ?? '',
          phone: profile?.phone ?? '',
          studentId: profile?.studentId ?? '',
          email: profile?.email ?? '',
          currentJobTitle: profile?.currentJobTitle ?? '',
          currentCompany: profile?.currentCompany ?? '',
          linksText: (() => {
            let parsedLinks = [];
            try { parsedLinks = profile?.links ? JSON.parse(profile.links) : []; } catch { /* ignore */ }
            return Array.isArray(parsedLinks) ? parsedLinks.join('\n') : '';
          })(),
          role: profile?.role ?? profile?.userRole ?? user?.role ?? '',
          educations,
        }));

        setNotificationSettings((prev) => ({
          ...prev,
          forumReplyEnabled: settings?.forumReplyEnabled ?? true,
          eventReminderEnabled: settings?.eventReminderEnabled ?? true,
          newsEnabled: settings?.newsEnabled ?? true,
          emailEnabled: settings?.emailEnabled ?? true,
          pushEnabled: settings?.pushEnabled ?? true,
        }));

        setLoginHistory(Array.isArray(history) ? history : []);
      } catch (error) {
        console.error('Failed to load setting data', error);
        showError(getErrorMessage(error, t('error_load_settings')));
      }
    };

    loadSettings();
  }, [organizationId, showError, user?.role]);

  useEffect(() => {
    if (activeTab === 'verification') {
      loadPendingRequests();
    }
  }, [activeTab, organizationId, isTrustedVerifier]);

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleNotificationChange = useCallback((e) => {
    const { name, checked } = e.target;
    setNotificationSettings((prev) => ({ ...prev, [name]: checked }));
  }, []);

  const handlePasswordChange = useCallback((e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleEducationChange = useCallback((index, field, value) => {
    setFormData((prev) => {
      const newEducations = [...prev.educations];
      newEducations[index] = { ...newEducations[index], [field]: value };
      return { ...prev, educations: newEducations };
    });
  }, []);

  const addEducation = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      educations: [...prev.educations, { faculty: '', department: '', program: '', startedYear: '', graduatedYear: '', major: '', graduationStatus: '' }],
    }));
  }, []);

  const removeEducation = useCallback((index) => {
    setFormData((prev) => {
      const newEducations = prev.educations.filter((_, i) => i !== index);
      if (newEducations.length === 0) {
        newEducations.push({ faculty: '', department: '', program: '', startedYear: '', graduatedYear: '', major: '', graduationStatus: '' });
      }
      return { ...prev, educations: newEducations };
    });
  }, []);

  const handleSaveProfile = async () => {
    if (!organizationId) {
      showWarning(t('warn_no_org'));
      return;
    }

    try {
      const linksArray = formData.linksText.split('\n').map(l => l.trim()).filter(Boolean);
      const payload = {
        organizationId,
        phone: formData.phone || null,
        gender: formData.gender || null,
        currentJobTitle: formData.currentJobTitle || null,
        currentCompany: formData.currentCompany || null,
        links: linksArray.length > 0 ? linksArray : null,
      };

      await userSettingsApi.updateProfile(payload);

      if (avatarCrop.avatarUrl && avatarCrop.avatarUrl.startsWith('data:')) {
        const avatarImageUrl = await uploadBase64(avatarCrop.avatarUrl);
        if (avatarImageUrl) {
          await userSettingsApi.updateAvatar(avatarImageUrl);
          setAuthUser({
            ...useAuthStore.getState().user,
            avatarUrl: avatarImageUrl,
          });
          queryClient.invalidateQueries({ queryKey: ['user', 'me', 'profile'] });
          queryClient.invalidateQueries({ queryKey: ['publicProfile'] });
        }
      }

      showSuccess(t('success_save_profile'));

      setOriginalFormData(null);
      setIsEditMode(false);
    } catch (error) {
      console.error('Failed to update profile', error);
      showError(getErrorMessage(error, t('error_save_profile')));
    }
  };

  const handleSubmitEduRequest = async () => {
    if (!organizationId) {
      showWarning(t('org_not_found'));
      return;
    }
    setSubmitEduPending(true);
    try {
      const result = await userSettingsApi.submitEducationRequest({
        organizationId,
        program: formData.educations.map((e) => e.program || ''),
        startedYear: formData.educations.map((e) => e.startedYear || ''),
        graduatedYear: formData.educations.map((e) => e.graduatedYear || ''),
        graduationStatus: formData.educations.map((e) => e.graduationStatus || ''),
        major: formData.educations.map((e) => e.major || ''),
        faculty: formData.educations.map((e) => e.faculty || ''),
        department: formData.educations.map((e) => e.department || ''),
      });
      setPendingEduRequest(result);
      setIsEduEditMode(false);
      setOriginalEducations(null);
      showSuccess(t('edu_request_sent'));
    } catch (error) {
      showError(getErrorMessage(error, t('edu_request_failed')));
    } finally {
      setSubmitEduPending(false);
    }
  };

  const handleCancelEduRequest = async () => {
    if (!pendingEduRequest?.id || !organizationId) return;
    try {
      await userSettingsApi.cancelEducationRequest(pendingEduRequest.id, organizationId);
      setPendingEduRequest(null);
      showSuccess(t('edu_request_cancelled'));
    } catch (error) {
      showError(getErrorMessage(error, t('cancel_request_failed')));
    }
  };


  const handleCancelEduEdit = useCallback(() => {
    if (originalEducations) {
      setFormData((prev) => ({ ...prev, educations: originalEducations }));
    }
    setIsEduEditMode(false);
    setOriginalEducations(null);
  }, [originalEducations]);

  const handleSaveNotificationSettings = async () => {
    try {
      await userSettingsApi.updateNotificationSettings(notificationSettings);
      showSuccess(t('success_save_notif'));
    } catch (error) {
      console.error('Failed to update notification settings', error);
      showError(getErrorMessage(error, t('error_save_notif')));
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      showWarning(t('warn_fill_password'));
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showWarning(t('warn_password_mismatch'));
      return;
    }

    try {
      await userSettingsApi.changePassword({ oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword });
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      showSuccess(t('success_change_password'));
    } catch (error) {
      console.error('Failed to change password', error);
      showError(getErrorMessage(error, t('error_change_password')));
    }
  };

  const handleAcceptVerification = async (requestId) => {
    try {
      await userSettingsApi.acceptPeerVerification(requestId);
      showSuccess(t('success_accept_verification'));
      await loadPendingRequests();
    } catch (error) {
      console.error('Failed to accept verification', error);
      showError(getErrorMessage(error, t('error_accept_verification')));
    }
  };

  const openRequesterProfile = useCallback((requesterUserId) => {
    if (!requesterUserId) return;
    window.open(toOrgPath(`/profile/${requesterUserId}`), '_blank', 'noopener,noreferrer');
  }, [toOrgPath]);

  const parseUserAgent = (userAgent = '') => {
    const ua = String(userAgent ?? '').toLowerCase();

    let browser = 'Unknown Browser';
    if (ua.includes('edg/')) browser = 'Edge';
    else if (ua.includes('chrome/') && !ua.includes('edg/')) browser = 'Chrome';
    else if (ua.includes('safari/') && !ua.includes('chrome/')) browser = 'Safari';
    else if (ua.includes('firefox/')) browser = 'Firefox';

    let os = 'Unknown OS';
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('mac os') || ua.includes('macintosh')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) os = 'iOS';

    return `${browser} - ${os}`;
  };

  const renderPersonalSettings = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
      {/* Avatar Row */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ position: 'relative', width: 96, height: 96, borderRadius: '50%', overflow: 'hidden', cursor: isEditMode ? 'pointer' : 'default',
               ...(isEditMode && { '&:hover .avatar-overlay': { opacity: 1, }, }), }}
              onClick={() => { if (isEditMode) avatarCrop.setOpen(true);}}
          >
            <Avatar src={avatarCrop.avatarUrl} sx={{ width: '100%', height: '100%' }} />
            <Box className="avatar-overlay" sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center',
                                                  justifyContent: 'center', opacity: 0, transition: '0.2s', pointerEvents: 'none', }}
            >
              <CameraAltIcon sx={{ color: 'white', fontSize: 32 }} />
            </Box>
          </Box>
          <Box>
            <Typography variant="h3">{formData.fullName || 'User'}</Typography>
            {formData.studentId && (
              <Typography variant="body2" color="text.primary" sx={{ mt: 0.5 }}>
                Student ID: {formData.studentId}
              </Typography>
            )}
            <Typography variant="body2" color="primary.main" sx={{ mt: formData.studentId ? 0.25 : 0.5 }}>
              {resolveProfileRoleLabel({
                profile: {
                  role: formData.role,
                  studentId: formData.studentId,
                },
                academicProfile: formData.educations?.[0],
                t,
              })}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, }}>
          {!isEditMode && (
            <Button variant="contained" color="secondary" startIcon={<EditIcon />}
              onClick={() => { setOriginalFormData(structuredClone(formData)); setIsEditMode(true) }}
            >
              {t('edit_info')}
            </Button>
          )}
          {(verificationLevel ?? 0) === 0 && (
            <Button variant="contained" color="warning" startIcon={<ShieldOutlinedIcon />}
                    onClick={() => navigate('/cs-hcmus/organization-registration')}
            >
              {t('verify_account')}
            </Button>
          )}
        </Box>
      </Box>

      {/* Basic Info */}
      <Box>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 2 }}>{t('basic_info')}</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          <TextField fullWidth label={t('label_fullname')} name="fullName" value={formData.fullName} InputProps={{ readOnly: !isEditMode }} />
          <FormControl fullWidth>
            <InputLabel>{t('label_gender')}</InputLabel>
            <Select name="gender" value={formData.gender} label={t('label_gender')} onChange={handleFormChange} disabled={!isEditMode}>
              {GENDER_OPTIONS.map((g) => (
                <MenuItem key={g} value={g}>{t(GENDER_LABEL_KEYS[g])}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField fullWidth label={t('label_birthdate')} name="birthDate" type="date" value={formData.birthDate} InputProps={{ readOnly: !isEditMode }} InputLabelProps={{ shrink: true }} sx={dateInputSx} />
          <TextField fullWidth label={t('label_phone')} name="phone" value={formData.phone} InputProps={{ readOnly: !isEditMode }} onChange={handleFormChange} />
          <TextField fullWidth label={t('label_student_id')} name="studentId" value={formData.studentId} InputProps={{ readOnly: true }} />
          <TextField fullWidth label={t('label_email')} name="email" type="email" value={formData.email} InputProps={{ readOnly: !isEditMode }} />
          <TextField fullWidth label={t('label_job_title', { defaultValue: 'Chức danh' })} name="currentJobTitle" value={formData.currentJobTitle} InputProps={{ readOnly: !isEditMode }} onChange={handleFormChange} />
          <TextField fullWidth label={t('label_company', { defaultValue: 'Công ty' })} name="currentCompany" value={formData.currentCompany} InputProps={{ readOnly: !isEditMode }} onChange={handleFormChange} />
          <TextField fullWidth multiline minRows={3} label={t('label_social_links', { defaultValue: 'Liên kết mạng xã hội' })} name="linksText" value={formData.linksText} InputProps={{ readOnly: !isEditMode }} onChange={handleFormChange} sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }} placeholder={t('placeholder_links', { defaultValue: 'Mỗi link một dòng (VD: https://facebook.com/...)' })} />
        </Box>
      </Box>

      {/* Education Info */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" fontWeight="bold">{t('education_info')}</Typography>
          {isEditMode && (
            <Button startIcon={<AddIcon />} variant="outlined" onClick={addEducation}>{t('add_education')}</Button>
          )}
        </Box>

        {pendingEduRequest && (
          <Alert
            severity="info"
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={handleCancelEduRequest}>
                {t('cancel_request')}
              </Button>
            }
          >
            {t('edu_request_pending_note')}
          </Alert>
        )}

        <Stack spacing={3}>
          {formData.educations.map((edu, index) => (
            <Card key={index} variant="outlined" sx={{ p: 3, position: 'relative', bgcolor: 'background.default' }}>
              {isEduEditMode && formData.educations.length > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h5">{t('education_label')}</Typography>
                  <IconButton size="small" color="error" onClick={() => removeEducation(index)} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <TextField fullWidth label={t('label_faculty')} value={edu.faculty} disabled={!isEditMode} onChange={(e) => handleEducationChange(index, 'faculty', e.target.value)} />
                <TextField fullWidth label={t('label_department')} value={edu.department} disabled={!isEditMode} onChange={(e) => handleEducationChange(index, 'department', e.target.value)} />
                <Autocomplete freeSolo options={organizationProgramOptions} value={edu.program} disabled={!isEditMode} onInputChange={(_e, value) => handleEducationChange(index, 'program', value)} onChange={(_e, value) => handleEducationChange(index, 'program', value || '')} renderInput={(params) => <TextField {...params} label={t('label_program')} />} />
                <TextField fullWidth label={t('label_cohort')} value={edu.startedYear} disabled={!isEditMode} onChange={(e) => handleEducationChange(index, 'startedYear', e.target.value)} />
                <TextField fullWidth label={t('label_grad_year')} value={edu.graduatedYear} disabled={!isEditMode} onChange={(e) => handleEducationChange(index, 'graduatedYear', e.target.value)} />
                <Autocomplete freeSolo options={organizationMajorOptions} value={edu.major} disabled={!isEditMode} onInputChange={(_e, value) => handleEducationChange(index, 'major', value)} onChange={(_e, value) => handleEducationChange(index, 'major', value || '')} renderInput={(params) => <TextField {...params} label={t('label_major')} />} />
                <Autocomplete freeSolo options={[t('grad_status_graduated'), t('grad_status_studying')]} value={edu.graduationStatus} disabled={!isEditMode} onInputChange={(_e, value) => handleEducationChange(index, 'graduationStatus', value)} onChange={(_e, value) => handleEducationChange(index, 'graduationStatus', value || '')} renderInput={(params) => <TextField {...params} label={t('label_grad_status')} />} />
              </Box>
            </Card>
          ))}
        </Stack>

        {isEduEditMode && (
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
            <Button variant="outlined" color="inherit" onClick={handleCancelEduEdit}>{t('cancel')}</Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SendIcon />}
              onClick={handleSubmitEduRequest}
              disabled={submitEduPending}
            >
              {submitEduPending ? t('submitting') : t('submit_request')}
            </Button>
          </Box>
        )}
      </Box>

      {/* Actions — chỉ lưu thông tin cơ bản */}
      {isEditMode && (
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" color="inherit" sx={{ px: 4 }} onClick={handleCancelEdit}>{t('cancel')}</Button>
          <Button variant="contained" color="primary" onClick={handleSaveProfile} sx={{ px: 4 }}>{t('save_changes')}</Button>
       </Box>
      )}
    </Box>
  );

  const renderAccountSettings = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Email Section */}
      <Box>
        <Typography variant="h4" sx={{ mb: 2 }}>{t('email_section')}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body1" fontWeight={600}>{formData.email || t('email_not_set')}</Typography>
            <Typography variant="caption" color="text.secondary">{t('email_login_desc')}</Typography>
          </Box>
          <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setIsChangeEmailModalOpen(true)}>{t('change_email')}</Button>
        </Box>
      </Box>

      <Divider />

      {/* Change Password Section */}
      <Box>
        <Typography variant="h4" sx={{ mb: 2 }}>{t('password_section')}</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
          <TextField fullWidth name="oldPassword" value={passwordForm.oldPassword} onChange={handlePasswordChange} label={t('label_old_password')} type={showOldPassword ? 'text' : 'password'} placeholder={t('placeholder_old_password')} slotProps={{ input: { endAdornment: (<InputAdornment position="end"><IconButton aria-label={showOldPassword ? t('hide_password') : t('show_password')} onClick={() => setShowOldPassword((v) => !v)} onMouseDown={(e) => e.preventDefault()} edge="end">{showOldPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>) } }} />
          <TextField fullWidth name="newPassword" value={passwordForm.newPassword} onChange={handlePasswordChange} label={t('label_new_password')} type={showNewPassword ? 'text' : 'password'} placeholder={t('placeholder_new_password')} slotProps={{ input: { endAdornment: (<InputAdornment position="end"><IconButton aria-label={showNewPassword ? t('hide_password') : t('show_password')} onClick={() => setShowNewPassword((v) => !v)} onMouseDown={(e) => e.preventDefault()} edge="end">{showNewPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>) } }} />
          <TextField fullWidth name="confirmPassword" value={passwordForm.confirmPassword} onChange={handlePasswordChange} label={t('label_confirm_password')} type={showConfirmPassword ? 'text' : 'password'} placeholder={t('placeholder_confirm_password')} slotProps={{ input: { endAdornment: (<InputAdornment position="end"><IconButton aria-label={showConfirmPassword ? t('hide_password') : t('show_password')} onClick={() => setShowConfirmPassword((v) => !v)} onMouseDown={(e) => e.preventDefault()} edge="end">{showConfirmPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>) } }} />
        </Box>
        <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="contained" color="primary" onClick={handleChangePassword}>{t('update_password')}</Button>
          <Button variant="outlined" color="secondary">{t('cancel')}</Button>
        </Box>
      </Box>

      <Divider />

      {/* Logged In Devices Section */}
      <Box>
        <Typography variant="h4" sx={{ mb: 2 }}>{t('devices_section')}</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {loginHistory.length === 0 && <Typography variant="body2" color="text.secondary">{t('no_login_history')}</Typography>}
          {loginHistory.map((entry, index) => (
            <Box key={entry?.id ?? `${entry?.loginAt ?? 'history'}-${index}`} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: 1, borderColor: 'divider', borderRadius: 1, px: 2, py: 1.5 }}>
              <Box>
                <Typography variant="h5">{parseUserAgent(entry?.userAgent)}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('last_login')}: {formatDateTime(entry?.loginAt, t('unknown_time'))} | {t('login_ip')}: {entry?.loginIp || 'N/A'} | {t('login_method')}: {entry?.loginMethod || 'N/A'}
                </Typography>
              </Box>
              <Button variant="outlined" color="inherit" size="small" disabled>{t('monitor')}</Button>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );

  const renderNotificationSettings = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h4" sx={{ mb: 2 }}>{t('notif_section')}</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <FormControlLabel control={<Switch name="forumReplyEnabled" checked={notificationSettings.forumReplyEnabled} onChange={handleNotificationChange} />} label={t('notif_forum_reply')} />
          <FormControlLabel control={<Switch name="eventReminderEnabled" checked={notificationSettings.eventReminderEnabled} onChange={handleNotificationChange} />} label={t('notif_event_reminder')} />
          <FormControlLabel control={<Switch name="newsEnabled" checked={notificationSettings.newsEnabled} onChange={handleNotificationChange} />} label={t('notif_news')} />
          <FormControlLabel control={<Switch name="emailEnabled" checked={notificationSettings.emailEnabled} onChange={handleNotificationChange} />} label={t('notif_email')} />
          <FormControlLabel control={<Switch name="pushEnabled" checked={notificationSettings.pushEnabled} onChange={handleNotificationChange} />} label={t('notif_push')} />
        </Box>
      </Box>

      <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button variant="contained" color="primary" onClick={handleSaveNotificationSettings}>{t('save_changes')}</Button>
        <Button variant="outlined" color="secondary">{t('cancel')}</Button>
      </Box>
    </Box>
  );

  const renderAdvisorSettings = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h4">{t('advisor_section')}</Typography>
      <Typography variant="body1" color="textSecondary">{t('advisor_no_advisor')}</Typography>
      <Paper variant="outlined" sx={{ p: 3, bgcolor: 'background.default' }}>
        <Typography variant="h5" sx={{ color: 'primary.main' }}>{t('advisor_contact_title')}</Typography>
        <Typography variant="body1" color="text.primary" display="block" sx={{ mt: 2, fontWeight: 600 }}>{organization?.departmentName || 'Khoa Công nghệ Thông tin'}</Typography>
        <Typography variant="body1" color="text.secondary" display="block" sx={{ mt: 0.5 }}>Email: {organization?.contactEmail || 'admin@hcmus.edu.vn'}</Typography>
        <Typography variant="body1" color="text.secondary" display="block">Phone: {organization?.contactPhone || '(028) 6288 4499'}</Typography>
      </Paper>
    </Box>
  );

  const renderVerificationManagement = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h4">{t('verification_section')}</Typography>
      <Typography variant="body1" color="textSecondary">{t('verification_desc')}</Typography>

      {loadingRequests ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : pendingRequests.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', border: '1px dashed', borderColor: 'divider' }}>
          <Typography color="textSecondary">{t('no_pending_verifications')}</Typography>
        </Paper>
      ) : (
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {pendingRequests.map((request) => (
            <Paper key={request.requestId} variant="outlined" sx={{ mb: 2, p: 2, '&:hover': { bgcolor: 'action.hover' } }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                <Stack spacing={0.5}>
                  <Typography variant="h5" fontWeight="bold">{request.requesterName}</Typography>
                  <Typography variant="body2" color="textSecondary">{t('verif_user_id')}: {request.requesterUserId}</Typography>
                  <Typography variant="caption" color="textSecondary">{t('verif_sent_date')}: {formatDateTime(request.createdAt)}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<OpenInNewIcon />}
                    onClick={() => openRequesterProfile(request.requesterUserId)}
                  >
                    {t('view_profile')}
                  </Button>
                  <Button variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={() => handleAcceptVerification(request.requestId)}>{t('confirm_verification')}</Button>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </List>
      )}
    </Box>
  );

  const renderConnectionsSettings = () => (
    <NetworkConnectionsPanel variant="embedded" enableBlock />
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'personal': return renderPersonalSettings();
      case 'account': return renderAccountSettings();
      case 'notification': return renderNotificationSettings();
      case 'connections': return renderConnectionsSettings();
      case 'advisor': return renderAdvisorSettings();
      case 'verification': return renderVerificationManagement();
      default: return null;
    }
  };

  const handleCancelEdit = useCallback(() => {
    if (originalFormData) {
      setFormData(originalFormData);
    }
    setIsEditMode(false);
  }, [originalFormData]);

  return (
      <Page title={t('page_title')} meta={<meta name="description" content={t('page_title')} />}>
        <Container maxWidth="xl" sx={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'stretch', pt: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3, lg: 6 }, pb: { xs: 2, sm: 3, lg: 6 } }}>
          <Box sx={{ display: 'flex', width: '100%', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 3 } }}>
            <Stack spacing={2} sx={{ width: { xs: '100%', md: 260 } }}>
              <Sidebar items={menuItems} value={activeTab} onChange={setActiveTab} useRouting={false} />
            </Stack>

            {/* Right Content Area */}
            <Stack spacing={2} sx={{ flex: 1, minWidth: 0, px: { xs: 1.5, sm: 2, md: 2.75 } }}>
              <Stack gap={2}>
                <Typography variant="h1" fontWeight={800} color="primary.main">{t('page_heading')}</Typography>
              </Stack>
              <Card sx={{ p: 4, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
                {renderContent()}
              </Card>
            </Stack>
          </Box>
        </Container>

        <AvatarUploadDialog
          open={avatarCrop.open}
          onClose={() => avatarCrop.setOpen(false)}
          avatarPreview={avatarCrop.avatarPreview}
          crop={avatarCrop.crop}
          zoom={avatarCrop.zoom}
          setCrop={avatarCrop.setCrop}
          setZoom={avatarCrop.setZoom}
          onCropComplete={(_, croppedPixels) =>
            avatarCrop.setCroppedAreaPixels(croppedPixels)
          }
          onFileChange={avatarCrop.handleFileChange}
          onSave={avatarCrop.handleSave}
        />

        <ChangeEmailModal
          open={isChangeEmailModalOpen}
          onClose={() => setIsChangeEmailModalOpen(false)}
          userId={user?.id}
          currentEmail={formData.email}
          onEmailChanged={(newEmail) => {
            setFormData(prev => ({ ...prev, email: newEmail }));
          }}
        />
      </Page>
  );
}
