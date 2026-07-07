import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import WorkIcon from '@mui/icons-material/Work';
import LinkIcon from '@mui/icons-material/Link';
import Avatar from '@mui/material/Avatar';

import Page from '../../components/Page';
import ProfileLayout from '../../layouts/ProfileLayout';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';

import { useMyProfile } from '../../hooks/profile/useMyProfile';
import { useUpdateProfile } from '../../hooks/profile/useUpdateProfile';
import { useMyOrganizationMember } from '../../hooks/useMyOrganizationMember';
import useOrganizationStore from '../../stores/organizationStore';
import useAuthStore from '../../stores/authStore';

import useAvatarCrop from '../../hooks/profile/useAvatarCrop';
import AvatarUploadDialog from '../../components/profile/AvatarUploadDialog';

import { useMyMentorProfile } from '../../hooks/mentorship/useMyMentorProfile';
import { useMyExpertise } from '../../hooks/mentorship/useMyExpertise';
import { useUpdateMentorProfile } from '../../hooks/mentorship/useUpdateMentorProfile';
import {
  useAddExpertise,
  useUpdateExpertise,
  useDeleteExpertise,
} from '../../hooks/mentorship/useExpertiseMutations';
import { useMentorshipAccessState } from '../../hooks/mentorship/useMentorshipAccessState';

import {
  fileToCroppedCoverBase64,
  getJsonPayloadByteSize,
  MAX_JSON_PAYLOAD_BYTES,
  useUploadImage,
  validateImageFile,
} from '../../utils/imageUtils';
import { userSettingsApi } from '../../utils/api';
import { validateVietnamPhone } from '../../utils/regexUtils';
import { getBaseProfileTabs, getMentorProfileTabs, getMenteeProfileTabs } from '../../constants/mentorshipNav';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { formatMentorHeadline, resolveProfileRoleLabel } from '../../utils/profileRoleUtils';
import { buildAcademicRecords } from '../../utils/academicUtils';

const DEFAULT_COVER =
  'https://ethnasia.com/cdn/shop/articles/sean-o-KMn4VEeEPR8-unsplash_edited.jpg?v=1621585619';
const MENTORSHIP_COVER =
  'https://info.cognician.com/hubfs/220201%20mentorship-%20desktop.png';

const STATUS_APPROVED = 'APPROVED';

const getExpertiseCategories = (t) => [
  { value: 'CAREER', label: t('profile:expertise_cat_career') },
  { value: 'ACADEMIC', label: t('profile:expertise_cat_academic') },
  { value: 'SOFT_SKILLS', label: t('profile:expertise_cat_soft_skills') },
  { value: 'GENERAL', label: t('profile:expertise_cat_general') },
];

const SectionTitle = ({ children, hint }) => (
  <Box>
    <Typography variant="h4" fontWeight={700} color="primary.main">
      {children}
    </Typography>
    {hint && (
      <Typography variant="caption" color="text.secondary">
        {hint}
      </Typography>
    )}
  </Box>
);

const parseExtended = (raw) => {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const emptyExperience = () => ({ company: '', title: '', from: '', to: '', description: '' });
const emptyEducation = () => ({ school: '', degree: '', from: '', to: '' });

const getCoverUploadErrorMessage = (error, t) => {
  const status = error?.response?.status;

  if (status === 413) {
    return t('profile:cover_upload_too_large', {
      defaultValue: 'Ảnh bìa quá lớn. Vui lòng chọn ảnh nhỏ hơn rồi thử lại.',
    });
  }

  if (status === 429) {
    return t('profile:cover_upload_rate_limited', {
      defaultValue: 'Backend đang giới hạn quá nhiều yêu cầu. Vui lòng chờ một lát rồi thử lại.',
    });
  }

  if (error?.code === 'ERR_NETWORK' || !error?.response) {
    return t('profile:cover_upload_network_error', {
      defaultValue: 'Không upload được ảnh bìa. Có thể backend đang chặn CORS, mất kết nối hoặc từ chối ảnh quá lớn.',
    });
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    t('profile:cover_upload_failed', {
      defaultValue: 'Không upload được ảnh bìa. Vui lòng thử lại.',
    })
  );
};

const buildPreservedAcademicPayload = (academicProfile) => {
  const records = buildAcademicRecords(academicProfile).filter((record) =>
    ['faculty', 'department', 'program', 'major', 'startedYear', 'graduatedYear', 'graduationStatus']
      .some((key) => record[key] != null && record[key] !== ''),
  );

  if (records.length === 0) return {};

  return {
    faculty: records.map((record) => record.faculty ?? ''),
    department: records.map((record) => record.department ?? ''),
    program: records.map((record) => record.program ?? ''),
    major: records.map((record) => record.major ?? ''),
    startedYear: records.map((record) => record.startedYear ?? ''),
    graduatedYear: records.map((record) => {
      const numericYear = Number(record.graduatedYear);
      return Number.isFinite(numericYear) ? numericYear : null;
    }),
    graduationStatus: records.map((record) => record.graduationStatus ?? ''),
  };
};

const ProfileItem = ({ label, value, notUpdatedLabel = '—' }) => (
  <Box
    sx={{
      p: 2,
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1.5,
      backgroundColor: 'action.hover',
    }}
  >
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography fontWeight={600}>
      {value?.trim?.() || value || notUpdatedLabel}
    </Typography>
  </Box>
);

const UnifiedProfileEditPage = () => {
  const { t } = useTranslation(['mentorship', 'profile']);
  const { enqueueSnackbar } = useSnackbar();
  const topTabs = getBaseProfileTabs(t);
  const navigate = useOrgNavigate();
  const location = useLocation();
  const isMentorshipEdit =
    location.pathname.includes('/mentorship') ||
    location.state?.profileEditContext === 'mentorship';

  const profileQuery = useMyProfile();
  const queryClient = useQueryClient();
  const orgMemberQuery = useMyOrganizationMember();
  
  const mentorQuery = useMyMentorProfile();
  const access = useMentorshipAccessState();
  const expertiseQuery = useMyExpertise({ enabled: access.hasMentorProfile });

  const { updateProfile: updateBaseProfile, isPending: savingBase, errorMessage: baseError } = useUpdateProfile();
  const { updateProfile: updateMentorProfile, isPending: savingMentor, errorMessage: mentorError } = useUpdateMentorProfile();

  const addExpertise = useAddExpertise();
  const updateExpertise = useUpdateExpertise();
  const deleteExpertise = useDeleteExpertise();
  const { uploadBase64, isPending: uploadingImage } = useUploadImage();

  const [coverPreview, setCoverPreview] = useState(DEFAULT_COVER);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPositionY, setCoverPositionY] = useState(50);
  const [currentJobTitle, setCurrentJobTitle] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [bio, setBio] = useState('');
  const [mentorBio, setMentorBio] = useState('');
  const [defaultMeetingLink, setDefaultMeetingLink] = useState('');
  const [experiences, setExperiences] = useState([]);
  const [educations, setEducations] = useState([]);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linksText, setLinksText] = useState('');

  const [editingExpertiseId, setEditingExpertiseId] = useState(null);
  const [draftExpertise, setDraftExpertise] = useState({
    topic: '',
    category: 'GENERAL',
    description: '',
    tag: '',
  });

  const avatarCrop = useAvatarCrop();
  const organizationId = useOrganizationStore((state) => state.organization?.id ?? null);
  const setAuthUser = useAuthStore((state) => state.setUser);

  // Optional phone — if filled it must be a valid VN mobile number.
  const phoneError = phone.trim() ? validateVietnamPhone(phone) : null;

  useEffect(() => {
    const p = profileQuery.data;
    const m = mentorQuery.data;
    
    if (p || m) {
       
      setCurrentJobTitle(m?.currentJobTitle ?? p?.currentJobTitle ?? '');
      setCurrentCompany(m?.currentCompany ?? p?.currentCompany ?? '');
      setBio(p?.bio ?? '');
      setMentorBio(m?.bio ?? '');
      setDefaultMeetingLink(m?.defaultMeetingLink ?? '');
      setEmail(p?.email ?? '');
      setPhone(p?.phone ?? '');

      setCoverPreview(m?.coverUrl || (isMentorshipEdit ? MENTORSHIP_COVER : DEFAULT_COVER));
      setCoverFile(null);
      let parsedLinks = [];
      try { parsedLinks = p?.links ? JSON.parse(p.links) : []; } catch (e) {}
      setLinksText(Array.isArray(parsedLinks) ? parsedLinks.join('\n') : '');
      
      const extStr = m?.extendedProfile ?? p?.extendedProfile;
      const ext = parseExtended(extStr);
      setExperiences(Array.isArray(ext.experiences) ? ext.experiences : []);
      setEducations(Array.isArray(ext.educations) ? ext.educations : []);
    }
  }, [isMentorshipEdit, profileQuery.data, mentorQuery.data]);

  useEffect(() => {
    const url = coverPreview;
    return () => {
      if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
    };
  }, [coverPreview]);

  const handleCoverUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      enqueueSnackbar(validation.message, { variant: 'warning' });
      event.target.value = '';
      return;
    }

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setCoverPositionY(50);
  };

  const handleSave = async () => {
    setSuccess(false);
    if (phoneError) return; // invalid phone — error already shown under field
    try {
      // Persist a newly-cropped avatar: upload the base64 data URL, then point
      // the user's profile at the returned image URL.
      if (avatarCrop.avatarUrl && avatarCrop.avatarUrl.startsWith('data:')) {
        const avatarImageUrl = await uploadBase64(avatarCrop.avatarUrl);
        if (avatarImageUrl) {
          await userSettingsApi.updateAvatar(avatarImageUrl);
          setAuthUser({
            ...useAuthStore.getState().user,
            avatarUrl: avatarImageUrl,
          });
        }
      }
      
      const previousExt = parseExtended(mentorQuery.data?.extendedProfile ?? profileQuery.data?.extendedProfile);
      const nextExt = { ...previousExt, experiences, educations };
      let uploadedCoverUrl = null;

      if (coverFile) {
        if (!access.hasMentorProfile) {
          enqueueSnackbar(
            t('profile:cover_requires_mentor_profile', {
              defaultValue: 'Hiện backend chỉ lưu ảnh bìa qua hồ sơ cố vấn. Vui lòng tạo hồ sơ cố vấn trước.',
            }),
            { variant: 'warning' },
          );
          return;
        }

        try {
          const coverBase64 = await fileToCroppedCoverBase64(coverFile, coverPositionY);
          if (getJsonPayloadByteSize({ base64String: coverBase64 }) > MAX_JSON_PAYLOAD_BYTES) {
            enqueueSnackbar(
              t('profile:cover_upload_too_large', {
                defaultValue: 'Ảnh bìa quá lớn. Vui lòng chọn ảnh nhỏ hơn rồi thử lại.',
              }),
              { variant: 'error' },
            );
            return;
          }

          uploadedCoverUrl = await uploadBase64(coverBase64);
          if (!uploadedCoverUrl) throw new Error('empty_upload_response');
        } catch (error) {
          enqueueSnackbar(getCoverUploadErrorMessage(error, t), { variant: 'error' });
          return;
        }
      }
      
      // The mentor profile owns the reusable cover/job data. Updating the cover
      // from /profile/edit keeps MyProfile and Mentorship Profile in sync.
      if (access.hasMentorProfile && (isMentorshipEdit || uploadedCoverUrl)) {
        await updateMentorProfile({
          currentJobTitle: isMentorshipEdit
            ? currentJobTitle.trim()
            : mentorQuery.data?.currentJobTitle,
          currentCompany: isMentorshipEdit
            ? currentCompany.trim()
            : mentorQuery.data?.currentCompany,
          bio: isMentorshipEdit
            ? mentorBio.trim()
            : mentorQuery.data?.bio,
          coverUrl: uploadedCoverUrl ?? undefined,
          defaultMeetingLink: isMentorshipEdit
            ? (defaultMeetingLink.trim() || undefined)
            : mentorQuery.data?.defaultMeetingLink,
          extendedProfile: isMentorshipEdit
            ? JSON.stringify(nextExt)
            : mentorQuery.data?.extendedProfile,
        });
      }
      
      // Also update base profile (even if it ignores some fields, we send what we can)
      const linksArray = linksText.split('\n').map(l => l.trim()).filter(Boolean);
      await updateBaseProfile({
        ...(organizationId ? { organizationId } : {}),
        bio: bio.trim(),
        phone: phone.trim() || undefined,
        currentJobTitle: currentJobTitle.trim() || undefined,
        currentCompany: currentCompany.trim() || undefined,
        links: linksArray.length > 0 ? linksArray : null,
        ...buildPreservedAcademicPayload(orgMemberQuery.data),
      });

      queryClient.invalidateQueries({ queryKey: ['user', 'me', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'me', 'organization-member'] });
      queryClient.invalidateQueries({ queryKey: ['mentorship', 'mentor', 'me', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['publicProfile'] });

      setSuccess(true);
      setTimeout(() => navigate(isMentorshipEdit ? '/mentorship/profile' : '/profile'), 800);
    } catch (error) {
      enqueueSnackbar(
        error?.response?.data?.message ||
          error?.message ||
          t('profile:save_error', { defaultValue: 'Không thể lưu hồ sơ. Vui lòng thử lại.' }),
        { variant: 'error' },
      );
    }
  };

  const addExperienceRow = useCallback(() => setExperiences((list) => [...list, emptyExperience()]), []);
  const updateExperienceRow = useCallback((idx, field, value) =>
    setExperiences((list) => list.map((row, i) => (i === idx ? { ...row, [field]: value } : row))), []);
  const removeExperienceRow = useCallback((idx) =>
    setExperiences((list) => list.filter((_, i) => i !== idx)), []);

  const addEducationRow = useCallback(() => setEducations((list) => [...list, emptyEducation()]), []);
  const updateEducationRow = useCallback((idx, field, value) =>
    setEducations((list) => list.map((row, i) => (i === idx ? { ...row, [field]: value } : row))), []);
  const removeEducationRow = useCallback((idx) => setEducations((list) => list.filter((_, i) => i !== idx)), []);

  const startEditExpertise = (item) => {
    setEditingExpertiseId(item.id);
    setDraftExpertise({
      topic: item.topic ?? '',
      category: item.category ?? 'GENERAL',
      description: item.description ?? '',
      tag: item.tag ?? '',
    });
  };

  const cancelEditExpertise = () => {
    setEditingExpertiseId(null);
    setDraftExpertise({ topic: '', category: 'GENERAL', description: '', tag: '' });
  };

  const saveExpertiseEdit = async () => {
    if (!editingExpertiseId || !draftExpertise.topic.trim()) return;
    await updateExpertise.submit({
      id: editingExpertiseId,
      payload: {
        topic: draftExpertise.topic.trim(),
        category: draftExpertise.category,
        description: draftExpertise.description.trim() || undefined,
        tag: draftExpertise.tag.trim() || undefined,
      },
    });
    cancelEditExpertise();
  };

  const addExpertiseNew = async () => {
    if (!draftExpertise.topic.trim()) return;
    await addExpertise.submit({
      topic: draftExpertise.topic.trim(),
      category: draftExpertise.category,
      description: draftExpertise.description.trim() || undefined,
      tag: draftExpertise.tag.trim() || undefined,
      yearsExperience: 0,
    });
    setDraftExpertise({ topic: '', category: 'GENERAL', description: '', tag: '' });
  };

  if (profileQuery.isLoading || orgMemberQuery.isLoading) {
    return (
      <Page title={t('profile:page_title_edit')}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Page>
    );
  }

  const profile = profileQuery.data;
  
  const mentor = mentorQuery.data;
  const expertise = expertiseQuery.data ?? [];

  const saving = savingBase || savingMentor;
  const errorMessage = mentorError || baseError;

  const EXPERTISE_CATEGORIES = getExpertiseCategories(t);

  const user = {
    name: profile?.fullName ?? t('profile:my_account'),
    role: isMentorshipEdit
      ? formatMentorHeadline({ jobTitle: currentJobTitle, company: currentCompany, t })
      : resolveProfileRoleLabel({ profile, academicProfile: orgMemberQuery.data, t }),
    avatar: profile?.avatarUrl ?? '',
    cover: coverPreview,
  };
  
  const avatarEditor = (
    <Box
      onClick={() => avatarCrop.setOpen(true)}
      sx={{
        position: 'relative',
        width: 140,
        height: 140,
        borderRadius: '50%',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
    >
      <Avatar
        src={avatarCrop.avatarUrl || user.avatar}
        sx={{
          width: 140,
          height: 140,
          border: (theme) => `5px solid ${theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.background.paper}`,
        }}
      />

      {/* overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.35)',
          opacity: 0,
          transition: '0.2s',
          borderRadius: '50%',
          '&:hover': { opacity: 1 },
        }}
      >
        <CameraAltIcon sx={{ color: 'white' }} />
      </Box>
    </Box>
  );

  const tabs = isMentorshipEdit
    ? (access.hasMentorProfile ? getMentorProfileTabs(t) : (access.hasMenteeProfile ? getMenteeProfileTabs(t) : topTabs))
    : topTabs;

  const renderPersonalSection = () => (
    <Stack spacing={3}>
      <Typography variant="h5" fontWeight={800} color="primary.main" mb={2} display="flex" alignItems="center" gap={1}>
        <PersonIcon />
        {t('profile:intro_section')}
      </Typography>

      <TextField
        fullWidth
        multiline
        minRows={6}
        value={bio}
        onChange={(e) => setBio(e.target.value.slice(0, 500))}
        placeholder={t('profile:bio_placeholder')}
        inputProps={{ maxLength: 500 }}
        helperText={`${bio.length}/500`}
        FormHelperTextProps={{ sx: { textAlign: 'right', mr: 0 } }}
      />
      
      <Typography variant="h5" fontWeight={800} color="primary.main" mb={2} mt={4} display="flex" alignItems="center" gap={1}>
        <WorkIcon />
        {t('profile:job_info', { defaultValue: 'Thông tin công việc' })}
      </Typography>
      
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <TextField
          label={t('profile:label_title')}
          value={currentJobTitle}
          onChange={(e) => setCurrentJobTitle(e.target.value)}
          fullWidth
        />
        <TextField
          label={t('profile:label_company')}
          value={currentCompany}
          onChange={(e) => setCurrentCompany(e.target.value)}
          fullWidth
        />
      </Stack>

      <Typography variant="h5" fontWeight={800} color="primary.main" mb={2} mt={4} display="flex" alignItems="center" gap={1}>
        <LinkIcon />
        {t('profile:social_links', { defaultValue: 'Liên kết mạng xã hội' })}
      </Typography>
      <TextField
        fullWidth
        multiline
        minRows={3}
        value={linksText}
        onChange={(e) => setLinksText(e.target.value)}
        placeholder={t('profile:links_placeholder', { defaultValue: 'Mỗi link một dòng (VD: https://facebook.com/...)' })}
      />

      <Typography variant="h5" fontWeight={800} color="primary.main" mb={2} mt={4} display="flex" alignItems="center" gap={1}>
        <EmailIcon />
        {t('profile:email')}
      </Typography>

      <TextField
        fullWidth
        value={email}
        disabled
        helperText={t('profile:email_change_hint', { defaultValue: 'Email được quản lý ở phần cài đặt tài khoản.' })}
      />

      <Typography variant="h5" fontWeight={800} color="primary.main" mb={2} mt={4} display="flex" alignItems="center" gap={1}>
        <PhoneIcon />
        {t('profile:phone')}
      </Typography>

      <TextField
        fullWidth
        value={phone}
        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
        placeholder={t('profile:phone_placeholder')}
        inputProps={{ inputMode: 'numeric', maxLength: 10 }}
        error={Boolean(phoneError)}
        helperText={phoneError || ''}
      />
    </Stack>
  );

  const renderMentorshipSection = () => {
    if (!access.hasMentorProfile) {
      if (isMentorshipEdit) {
        return (
          <Box sx={{ maxWidth: 720, mx: 'auto', py: 6, px: 2 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography fontWeight={700} mb={0.5}>
                {t('profile:mentor_only_edit_warning')}
              </Typography>
            </Alert>
            <Stack direction="row" spacing={1.5}>
              <Button variant="outlined" onClick={() => navigate('/mentorship/profile')}>
                {t('profile:back_to_profile_btn')}
              </Button>
              <Button variant="contained" onClick={() => navigate('/mentorship/signup')}>
                {t('profile:reopen_signup_btn')}
              </Button>
            </Stack>
          </Box>
        );
      }
      return null;
    }

    return (
      <Stack spacing={4} sx={{ pt: isMentorshipEdit ? 0 : 4, borderTop: isMentorshipEdit ? 'none' : '1px solid', borderColor: 'divider' }}>
        {!isMentorshipEdit && (
          <Typography variant="h3" fontWeight={800} color="primary.main">
            {t('profile:edit_mentor_heading')}
          </Typography>
        )}

        {mentor.status !== STATUS_APPROVED && isMentorshipEdit && (
          <Alert severity="warning">
            {t('profile:mentor_pending_edit_warning')}
          </Alert>
        )}

        <SectionTitle hint={t('profile:section_public_profile_hint')}>
          {t('profile:section_public_profile')}
        </SectionTitle>
        <Stack spacing={2}>
          <TextField
            label={t('profile:mentor_public_bio_label', { defaultValue: 'Giới thiệu cố vấn' })}
            value={mentorBio}
            onChange={(e) => setMentorBio(e.target.value.slice(0, 5000))}
            fullWidth
            multiline
            minRows={4}
            placeholder={t('profile:mentor_public_bio_placeholder', { defaultValue: 'Giới thiệu kinh nghiệm, định hướng chia sẻ và phong cách cố vấn của bạn...' })}
          />
        </Stack>

        <SectionTitle hint={t('profile:section_exp_edu_hint')}>
          {t('profile:section_exp_edu')}
        </SectionTitle>
        <Stack spacing={2}>
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography fontWeight={700}>{t('profile:exp_section')}</Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={addExperienceRow}>
                {t('profile:add_btn')}
              </Button>
            </Stack>
            {experiences.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {t('profile:no_experiences')}
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {experiences.map((exp, idx) => (
                  <Box
                    key={idx}
                    sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                  >
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mb={1}>
                      <TextField
                        label={t('profile:label_title')}
                        value={exp.title ?? ''}
                        onChange={(e) => updateExperienceRow(idx, 'title', e.target.value)}
                        size="small"
                        fullWidth
                      />
                      <TextField
                        label={t('profile:label_company')}
                        value={exp.company ?? ''}
                        onChange={(e) => updateExperienceRow(idx, 'company', e.target.value)}
                        size="small"
                        fullWidth
                      />
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mb={1}>
                      <TextField
                        label={t('profile:label_from')}
                        value={exp.from ?? ''}
                        onChange={(e) => updateExperienceRow(idx, 'from', e.target.value)}
                        size="small"
                        fullWidth
                        placeholder="2022"
                      />
                      <TextField
                        label={t('profile:label_to')}
                        value={exp.to ?? ''}
                        onChange={(e) => updateExperienceRow(idx, 'to', e.target.value)}
                        size="small"
                        fullWidth
                        placeholder={t('profile:placeholder_current')}
                      />
                      <IconButton color="error" onClick={() => removeExperienceRow(idx)} aria-label="remove experience">
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Stack>
                    <TextField
                      label={t('profile:label_description')}
                      value={exp.description ?? ''}
                      onChange={(e) => updateExperienceRow(idx, 'description', e.target.value)}
                      size="small"
                      fullWidth
                      multiline
                      minRows={2}
                    />
                  </Box>
                ))}
              </Stack>
            )}
          </Box>

          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography fontWeight={700}>{t('profile:edu_section')}</Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={addEducationRow}>
                {t('profile:add_btn')}
              </Button>
            </Stack>
            {educations.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {t('profile:no_educations')}
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {educations.map((edu, idx) => (
                  <Box
                    key={idx}
                    sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                  >
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mb={1}>
                      <TextField
                        label={t('profile:label_school')}
                        value={edu.school ?? ''}
                        onChange={(e) => updateEducationRow(idx, 'school', e.target.value)}
                        size="small"
                        fullWidth
                      />
                      <TextField
                        label={t('profile:label_degree')}
                        value={edu.degree ?? ''}
                        onChange={(e) => updateEducationRow(idx, 'degree', e.target.value)}
                        size="small"
                        fullWidth
                      />
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
                      <TextField
                        label={t('profile:label_from')}
                        value={edu.from ?? ''}
                        onChange={(e) => updateEducationRow(idx, 'from', e.target.value)}
                        size="small"
                        fullWidth
                        placeholder="2018"
                      />
                      <TextField
                        label={t('profile:label_to')}
                        value={edu.to ?? ''}
                        onChange={(e) => updateEducationRow(idx, 'to', e.target.value)}
                        size="small"
                        fullWidth
                        placeholder="2022"
                      />
                      <IconButton color="error" onClick={() => removeEducationRow(idx)} aria-label="remove education">
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>

        <SectionTitle hint={t('profile:section_expertise_hint')}>
          {t('profile:section_skills_expertise', { defaultValue: 'Kỹ năng / Nội dung chia sẻ' })}
        </SectionTitle>
        {(addExpertise.errorMessage || updateExpertise.errorMessage || deleteExpertise.errorMessage) && (
          <Alert severity="error">
            {addExpertise.errorMessage || updateExpertise.errorMessage || deleteExpertise.errorMessage}
          </Alert>
        )}
        <Stack spacing={1.5}>
          {expertise.map((item) => {
            const isEditing = editingExpertiseId === item.id;
            if (isEditing) {
              return (
                <Box key={item.id} sx={{ p: 2, border: '1px solid', borderColor: 'primary.main', borderRadius: 1 }}>
                  <Stack spacing={1.2}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                      <TextField
                        label={t('profile:expertise_topic')}
                        value={draftExpertise.topic}
                        onChange={(e) => setDraftExpertise((d) => ({ ...d, topic: e.target.value }))}
                        size="small"
                        fullWidth
                      />
                      <TextField
                        label={t('profile:expertise_category')}
                        value={draftExpertise.category}
                        onChange={(e) => setDraftExpertise((d) => ({ ...d, category: e.target.value }))}
                        select
                        size="small"
                        fullWidth
                      >
                        {EXPERTISE_CATEGORIES.map((c) => (
                          <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                        ))}
                      </TextField>
                    </Stack>
                    <TextField
                      label={t('profile:label_description')}
                      value={draftExpertise.description}
                      onChange={(e) => setDraftExpertise((d) => ({ ...d, description: e.target.value }))}
                      size="small"
                      fullWidth
                      multiline
                      minRows={2}
                    />
                    <TextField
                      label={t('profile:expertise_tag')}
                      value={draftExpertise.tag}
                      onChange={(e) => setDraftExpertise((d) => ({ ...d, tag: e.target.value }))}
                      size="small"
                      fullWidth
                    />
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" startIcon={<CloseIcon />} onClick={cancelEditExpertise}>
                        {t('profile:cancel_btn')}
                      </Button>
                      <Button size="small" variant="contained" startIcon={<CheckIcon />} disabled={updateExpertise.isPending || !draftExpertise.topic.trim()} onClick={saveExpertiseEdit}>
                        {t('profile:save_expertise_btn')}
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              );
            }
            return (
              <Box key={item.id} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                      <Typography fontWeight={700}>{item.topic}</Typography>
                      <Chip
                        label={EXPERTISE_CATEGORIES.find((c) => c.value === item.category)?.label ?? item.category ?? t('profile:expertise_cat_general')}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Stack>
                    {item.description && (
                      <Typography variant="body2" color="text.secondary">{item.description}</Typography>
                    )}
                  </Box>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" onClick={() => startEditExpertise(item)} aria-label="edit expertise">
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" disabled={deleteExpertise.isPending} onClick={() => deleteExpertise.submit(item.id)} aria-label="delete expertise">
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>
              </Box>
            );
          })}

          {editingExpertiseId === null && (
            <Box sx={{ p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.default' }}>
              <Typography fontWeight={700} mb={1}>
                {t('profile:add_expertise_heading')}
              </Typography>
              <Stack spacing={1.2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <TextField
                    label={t('profile:expertise_topic')}
                    value={draftExpertise.topic}
                    onChange={(e) => setDraftExpertise((d) => ({ ...d, topic: e.target.value }))}
                    size="small"
                    fullWidth
                  />
                  <TextField
                    label={t('profile:expertise_category')}
                    value={draftExpertise.category}
                    onChange={(e) => setDraftExpertise((d) => ({ ...d, category: e.target.value }))}
                    select
                    size="small"
                    fullWidth
                  >
                    {EXPERTISE_CATEGORIES.map((c) => (
                      <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                    ))}
                  </TextField>
                </Stack>
                <TextField
                  label={t('profile:label_description')}
                  value={draftExpertise.description}
                  onChange={(e) => setDraftExpertise((d) => ({ ...d, description: e.target.value }))}
                  size="small"
                  fullWidth
                  multiline
                  minRows={2}
                />
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button size="small" variant="contained" startIcon={<AddIcon />} disabled={addExpertise.isPending || !draftExpertise.topic.trim()} onClick={addExpertiseNew}>
                    {t('profile:add_btn')}
                  </Button>
                </Stack>
              </Stack>
            </Box>
          )}
        </Stack>

        <SectionTitle hint={t('profile:section_private_hint')}>
          {t('profile:section_private')}
        </SectionTitle>
        <Stack spacing={2}>
          <TextField
            label={t('profile:meeting_link_label')}
            value={defaultMeetingLink}
            onChange={(e) => setDefaultMeetingLink(e.target.value)}
            size="small"
            fullWidth
            placeholder={t('profile:meeting_link_placeholder')}
            helperText={t('profile:meeting_link_hint')}
          />
        </Stack>
      </Stack>
    );
  };

  return (
    <Page title={t('profile:page_title_edit')}>
      <ProfileLayout
        user={user}
        cover={coverPreview}
        onCoverChange={handleCoverUpload}
        coverPositionY={coverPositionY}
        onCoverPositionYChange={setCoverPositionY}
        tabs={tabs}
        onNavigate={navigate}
        mode={isMentorshipEdit ? 'mentorEdit' : 'userEdit'}
        avatarSlot={avatarEditor}
      >
        <Stack spacing={4}>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Typography variant="h2" fontWeight={800} color="primary.main">
              {isMentorshipEdit
                ? (access.hasMentorProfile ? t('profile:edit_mentor_heading') : t('profile:edit_page_heading'))
                : t('profile:edit_page_heading')}
            </Typography>

            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => navigate(isMentorshipEdit ? '/mentorship/profile' : '/profile')}
                disabled={saving}
              >
                {t('profile:cancel_btn')}
              </Button>

              <Button variant="contained" onClick={handleSave} disabled={saving || uploadingImage}>
                {saving || uploadingImage ? t('profile:saving_btn') : t('profile:save_btn')}
              </Button>
            </Stack>
          </Box>

          {success && (
            <Alert severity="success">
              {t('profile:success_save')}
            </Alert>
          )}

          {errorMessage && !success && (
            <Alert severity="error">{errorMessage}</Alert>
          )}

          {isMentorshipEdit ? (
            <>
              {renderMentorshipSection()}
              <Box sx={{ pt: 4, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h3" fontWeight={800} color="primary.main" mb={4}>
                  {t('profile:edit_general_heading')}
                </Typography>
                {renderPersonalSection()}
              </Box>
            </>
          ) : (
            <>
              {renderPersonalSection()}
            </>
          )}
        </Stack>
      </ProfileLayout>

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
    </Page>
  );
};

export default UnifiedProfileEditPage;
