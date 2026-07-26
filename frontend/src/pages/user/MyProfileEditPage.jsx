import LoadingSkeleton from '../../components/LoadingSkeleton';
import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone';
import WcIcon from '@mui/icons-material/Wc';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import WorkIcon from '@mui/icons-material/Work';
import LinkIcon from '@mui/icons-material/Link';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SchoolIcon from '@mui/icons-material/School';
import ArticleIcon from '@mui/icons-material/Article';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PsychologyIcon from '@mui/icons-material/Psychology';
import SaveIcon from '@mui/icons-material/Save';
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
import { useUpdateMentorProfile } from '../../hooks/mentorship/useUpdateMentorProfile';
import { useMentorshipAccessState } from '../../hooks/mentorship/useMentorshipAccessState';

import {
  fileToCroppedCoverBase64,
  getJsonPayloadByteSize,
  MAX_JSON_PAYLOAD_BYTES,
  resolveMediaUrl,
  validateImageFile,
} from '../../utils/imageUtils';
import { extractMentorshipSkills, userSettingsApi } from '../../utils/api';
import { validateVietnamPhone } from '../../utils/regexUtils';
import { GENDER_OPTIONS, GENDER_LABEL_KEYS, normalizeGender } from '../../constants/gender';
import {
  PROFILE_CONTACT_FIELDS,
  buildProfileContactLinksPayload,
  isValidContactEmail,
  normalizeProfileContactLinksPayload,
  parseProfileContactLinks,
} from '../../utils/profileContactLinks';
import TagPriorityList from '../../components/mentorship/signup/TagPriorityList';
import {
  getBaseProfileTabs,
  getMenteeProfileTabs,
  getMentorProfileTabs,
  getMentorshipProfileOnlyTabs,
} from '../../constants/mentorshipNav';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { resolveProfileRoleLabel } from '../../utils/profileRoleUtils';
import { buildAcademicRecords } from '../../utils/academicUtils';
import {
  ScrollReveal,
  ScrollRevealGroup,
  ScrollRevealItem,
  getStaggerDelay,
} from '../../components/animations/ScrollReveal';

const DEFAULT_COVER =
  'https://ethnasia.com/cdn/shop/articles/sean-o-KMn4VEeEPR8-unsplash_edited.jpg?v=1621585619';
const MENTORSHIP_COVER =
  'https://info.cognician.com/hubfs/220201%20mentorship-%20desktop.png';

const STATUS_APPROVED = 'APPROVED';

const SectionTitle = ({ children, hint }) => (
  <ScrollReveal>
    <Typography variant="h4" fontWeight={700} color="primary.main">
      {children}
    </Typography>
    {hint && (
      <Typography variant="caption" color="text.secondary">
        {hint}
      </Typography>
    )}
  </ScrollReveal>
);

const EditableTimelineList = ({
  title,
  icon: Icon,
  items,
  emptyMessage,
  addLabel,
  onAdd,
  onUpdate,
  onRemove,
  fields,
}) => (
  <ScrollReveal>
    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
      <Typography fontWeight={800} color="primary.main" display="flex" alignItems="center" gap={1}>
        {Icon ? <Icon fontSize="small" /> : null}
        {title}
      </Typography>
      <Button size="small" startIcon={<AddIcon />} onClick={onAdd}>
        {addLabel}
      </Button>
    </Stack>
    {items.length === 0 ? (
      <Typography variant="body2" color="text.secondary">
        {emptyMessage}
      </Typography>
    ) : (
      <Stack spacing={1.5}>
        {items.map((item, idx) => (
          <ScrollReveal key={idx} delay={getStaggerDelay(idx, 0.06)} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Stack spacing={1.2}>
              {fields.map((row, rowIndex) => (
                <Stack key={rowIndex} direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  {row.map((field) => (
                    <TextField
                      key={field.key}
                      label={field.label}
                      value={item[field.key] ?? ''}
                      onChange={(e) => onUpdate(idx, field.key, e.target.value)}
                      size="small"
                      fullWidth
                      multiline={field.multiline}
                      minRows={field.multiline ? 2 : 1}
                      placeholder={field.placeholder}
                    />
                  ))}
                </Stack>
              ))}
              <Stack direction="row" justifyContent="flex-end">
                <IconButton color="error" onClick={() => onRemove(idx)} aria-label="remove item">
                  <DeleteOutlineIcon />
                </IconButton>
              </Stack>
            </Stack>
          </ScrollReveal>
        ))}
      </Stack>
    )}
  </ScrollReveal>
);

const parseExtended = (raw) => {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const emptyExperience = () => ({ company: '', title: '', period: '', description: '' });
const emptyEducation = () => ({ school: '', degree: '', period: '' });
const emptyProject = () => ({ name: '', description: '', link: '' });
const emptyAward = () => ({ name: '', year: '', description: '' });
const emptySkill = () => ({ name: '', issuer: '' });

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
  const { t } = useTranslation(['mentorship', 'profile', 'settings']);
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

  const { updateProfile: updateBaseProfile, isPending: savingBase } = useUpdateProfile();
  const { updateProfile: updateMentorProfile, isPending: savingMentor } = useUpdateMentorProfile();

  const [savingMedia, setSavingMedia] = useState(false);

  const [coverPreview, setCoverPreview] = useState(DEFAULT_COVER);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPositionY, setCoverPositionY] = useState(50);
  const [currentJobTitle, setCurrentJobTitle] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [bio, setBio] = useState('');
  const [defaultMeetingLink, setDefaultMeetingLink] = useState('');
  const [experienceSummary, setExperienceSummary] = useState('');
  const [expertiseTags, setExpertiseTags] = useState([]);
  const [manualTag, setManualTag] = useState('');
  const [extractingTags, setExtractingTags] = useState(false);
  const [experiences, setExperiences] = useState([]);
  const [educations, setEducations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [awards, setAwards] = useState([]);
  const [skills, setSkills] = useState([]);
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [contactLinks, setContactLinks] = useState(() =>
    Object.fromEntries(PROFILE_CONTACT_FIELDS.map((field) => [field.key, ''])),
  );
  const [contactLinkExtras, setContactLinkExtras] = useState([]);
  const [showContactEmail, setShowContactEmail] = useState(false);

  const avatarCrop = useAvatarCrop();
  const organizationId = useOrganizationStore((state) => state.organization?.id ?? null);
  const setAuthUser = useAuthStore((state) => state.setUser);

  // Optional phone — if filled it must be a valid VN mobile number.
  const phoneError = phone.trim() ? validateVietnamPhone(phone) : null;

  useEffect(() => {
    const p = profileQuery.data;
    const m = mentorQuery.data;
    
    if (p || m) {
       
      setCurrentJobTitle(p?.currentJobTitle ?? m?.currentJobTitle ?? '');
      setCurrentCompany(p?.currentCompany ?? m?.currentCompany ?? '');
      setBio(p?.bio ?? '');
      setDefaultMeetingLink(m?.defaultMeetingLink ?? '');
      setPhone(p?.phone ?? '');
      setGender(p?.gender ? normalizeGender(p.gender) : '');

      setCoverPreview(resolveMediaUrl(p?.coverUrl) || (isMentorshipEdit ? MENTORSHIP_COVER : DEFAULT_COVER));
      setCoverFile(null);
      const parsedContactLinks = parseProfileContactLinks(p?.links);
      setContactLinks(parsedContactLinks.values);
      setContactLinkExtras(parsedContactLinks.extras);
      setShowContactEmail(parsedContactLinks.showContactEmail);
      
      const extStr = m?.extendedProfile ?? p?.extendedProfile;
      const ext = parseExtended(extStr);
      setExperienceSummary(ext.experienceSummary ?? '');
      setExpertiseTags(Array.isArray(ext.expertiseTags) ? ext.expertiseTags : (Array.isArray(m?.expertiseTags) ? m.expertiseTags : []));
      setExperiences(Array.isArray(ext.experiences) ? ext.experiences : []);
      setEducations(Array.isArray(ext.educations) ? ext.educations : []);
      setProjects(Array.isArray(ext.projects) ? ext.projects : []);
      setAwards(Array.isArray(ext.awards) ? ext.awards : []);
      setSkills(Array.isArray(ext.skills) ? ext.skills : []);
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
    if (isMentorshipEdit && access.isMentorPending) {
      enqueueSnackbar(t('profile:mentor_pending_edit_warning'), { variant: 'warning' });
      return;
    }
    if (phoneError) return; // invalid phone — error already shown under field
    try {
      setSavingMedia(true);
      let didUpdateMedia = false;

      // Persist a newly-cropped avatar: send the base64 data URL straight to the backend,
      // which converts it to WebP, stores it, and returns the final image URL.
      if (avatarCrop.avatarUrl && avatarCrop.avatarUrl.startsWith('data:')) {
        const avatarImageUrl = await userSettingsApi.updateAvatar({ avatarBase64: avatarCrop.avatarUrl });
        if (avatarImageUrl) {
          setAuthUser({
            ...useAuthStore.getState().user,
            avatarUrl: avatarImageUrl,
          });
          didUpdateMedia = true;
        }
      }
      
      const previousExt = parseExtended(mentorQuery.data?.extendedProfile ?? profileQuery.data?.extendedProfile);
      const nextExt = {
        ...previousExt,
        experienceSummary: experienceSummary.trim(),
        expertiseTags,
        experiences,
        educations,
        projects,
        awards,
        skills,
      };

      if (coverFile) {
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

          await userSettingsApi.updateCover({ coverBase64 });
          setCoverFile(null);
          didUpdateMedia = true;
        } catch (error) {
          enqueueSnackbar(getCoverUploadErrorMessage(error, t), { variant: 'error' });
          return;
        }
      }
      
      if (access.hasMentorProfile && isMentorshipEdit) {
        await updateMentorProfile({
          defaultMeetingLink: isMentorshipEdit
            ? (defaultMeetingLink.trim() || undefined)
            : mentorQuery.data?.defaultMeetingLink,
          extendedProfile: isMentorshipEdit
            ? JSON.stringify(nextExt)
            : mentorQuery.data?.extendedProfile,
          expertiseTags,
        });
      }
      
      if (showContactEmail && contactLinks.contactEmail.trim() && !isValidContactEmail(contactLinks.contactEmail)) {
        enqueueSnackbar(
          t('profile:contact_email_invalid', { defaultValue: 'Email liên hệ không đúng định dạng.' }),
          { variant: 'warning' },
        );
        return;
      }

      const linksPayload = buildProfileContactLinksPayload(contactLinks, {
        showContactEmail,
        extras: contactLinkExtras,
      });
      const existingLinksPayload = normalizeProfileContactLinksPayload(profileQuery.data?.links);
      const currentGender = profileQuery.data?.gender ? normalizeGender(profileQuery.data.gender) : '';
      const hasBaseProfileChanges = !isMentorshipEdit && (
        bio.trim() !== (profileQuery.data?.bio ?? '').trim() ||
        phone.trim() !== (profileQuery.data?.phone ?? '').trim() ||
        gender !== currentGender ||
        currentJobTitle.trim() !== (profileQuery.data?.currentJobTitle ?? '').trim() ||
        currentCompany.trim() !== (profileQuery.data?.currentCompany ?? '').trim() ||
        JSON.stringify(linksPayload) !== JSON.stringify(existingLinksPayload)
      );

      if (hasBaseProfileChanges) {
        await updateBaseProfile({
          ...(organizationId ? { organizationId } : {}),
          bio: bio.trim(),
          phone: phone.trim() || undefined,
          gender: gender || null,
          currentJobTitle: currentJobTitle.trim(),
          currentCompany: currentCompany.trim(),
          links: linksPayload,
          ...buildPreservedAcademicPayload(orgMemberQuery.data),
        });
      } else if (!didUpdateMedia && !isMentorshipEdit) {
        enqueueSnackbar(t('profile:no_changes', { defaultValue: 'Không có thay đổi để lưu.' }), { variant: 'info' });
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['user', 'me', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'me', 'organization-member'] });
      queryClient.invalidateQueries({ queryKey: ['mentorship', 'mentor', 'me', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['publicProfile'] });

      enqueueSnackbar(t('profile:success_save'), { variant: 'success' });
      setTimeout(() => navigate(isMentorshipEdit ? '/mentorship/profile' : '/profile'), 800);
    } catch (error) {
      enqueueSnackbar(
        error?.response?.data?.message ||
          error?.message ||
          t('profile:save_error', { defaultValue: 'Không thể lưu hồ sơ. Vui lòng thử lại.' }),
        { variant: 'error' },
      );
    } finally {
      setSavingMedia(false);
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

  const addProjectRow = useCallback(() => setProjects((list) => [...list, emptyProject()]), []);
  const updateProjectRow = useCallback((idx, field, value) =>
    setProjects((list) => list.map((row, i) => (i === idx ? { ...row, [field]: value } : row))), []);
  const removeProjectRow = useCallback((idx) => setProjects((list) => list.filter((_, i) => i !== idx)), []);

  const addAwardRow = useCallback(() => setAwards((list) => [...list, emptyAward()]), []);
  const updateAwardRow = useCallback((idx, field, value) =>
    setAwards((list) => list.map((row, i) => (i === idx ? { ...row, [field]: value } : row))), []);
  const removeAwardRow = useCallback((idx) => setAwards((list) => list.filter((_, i) => i !== idx)), []);

  const addSkillRow = useCallback(() => setSkills((list) => [...list, emptySkill()]), []);
  const updateSkillRow = useCallback((idx, field, value) =>
    setSkills((list) => list.map((row, i) => (i === idx ? { ...row, [field]: value } : row))), []);
  const removeSkillRow = useCallback((idx) => setSkills((list) => list.filter((_, i) => i !== idx)), []);

  const addTags = useCallback((incoming) => {
    setExpertiseTags((current) => {
      const seen = new Set(current.map((tag) => tag.toLowerCase()));
      const next = [...current];
      incoming.forEach((raw) => {
        const value = String(raw ?? '').trim().replace(/^#+/, '').replace(/\s+/g, '_');
        if (value && !seen.has(value.toLowerCase())) {
          seen.add(value.toLowerCase());
          next.push(value);
        }
      });
      return next;
    });
  }, []);

  const handleExtractTags = useCallback(async () => {
    const text = experienceSummary.trim();
    if (!text) return;
    setExtractingTags(true);
    try {
      const res = await extractMentorshipSkills(text);
      const tags = res?.data?.data?.tags ?? [];
      if (tags.length === 0) {
        enqueueSnackbar(t('mentorship:signup_tab_extract_empty'), { variant: 'info' });
      } else {
        addTags(tags);
      }
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message ?? t('mentorship:signup_tab_extract_error'), { variant: 'error' });
    } finally {
      setExtractingTags(false);
    }
  }, [addTags, experienceSummary, enqueueSnackbar, t]);

  const handleManualTagAdd = useCallback(() => {
    if (!manualTag.trim()) return;
    addTags([manualTag]);
    setManualTag('');
  }, [addTags, manualTag]);

  if (profileQuery.isLoading || orgMemberQuery.isLoading) {
    return (
      <Page title={t('profile:page_title_edit')}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <LoadingSkeleton />
        </Box>
      </Page>
    );
  }

  const profile = profileQuery.data;
  
  const saving = savingBase || savingMentor;
  const isPendingMentorEdit = isMentorshipEdit && access.isMentorPending;

  const user = {
    name: profile?.fullName ?? t('profile:my_account'),
    role: isMentorshipEdit
      ? (access.hasMentorProfile ? 'Mentor' : access.hasMenteeProfile ? 'Mentee' : resolveProfileRoleLabel({ profile, academicProfile: orgMemberQuery.data, t }))
      : resolveProfileRoleLabel({ profile, academicProfile: orgMemberQuery.data, t }),
    avatar: resolveMediaUrl(profile?.avatarUrl ?? ''),
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
        <CameraAltIcon sx={{ color: 'common.white' }} />
      </Box>
    </Box>
  );

  const tabs = isMentorshipEdit
    ? (access.isMentorApproved
      ? getMentorProfileTabs(t)
      : access.hasMenteeProfile
        ? getMenteeProfileTabs(t)
        : access.hasMentorProfile
          ? getMentorshipProfileOnlyTabs(t)
          : topTabs)
    : topTabs;

  const handleContactLinkChange = (key) => (event) => {
    setContactLinks((current) => ({
      ...current,
      [key]: event.target.value,
    }));
  };

  const renderPersonalSection = () => (
    <ScrollRevealGroup stagger={0.07} sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <ScrollRevealItem>
        <Stack spacing={1.25}>
          <Typography variant="h5" fontWeight={800} color="primary.main" display="flex" alignItems="center" gap={1}>
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
        </Stack>
      </ScrollRevealItem>

      <ScrollRevealItem>
        <Stack spacing={1.75}>
          <Typography variant="h5" fontWeight={800} color="primary.main" display="flex" alignItems="center" gap={1}>
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
        </Stack>
      </ScrollRevealItem>

      <ScrollRevealItem>
        <Stack spacing={1.25}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            gap={1}
          >
            <Typography variant="h5" fontWeight={800} color="primary.main" display="flex" alignItems="center" gap={1}>
              <EmailIcon />
              {t('profile:public_contact_email', { defaultValue: 'Email liên hệ công khai' })}
            </Typography>
            <FormControlLabel
              sx={{ mr: 0 }}
              control={(
                <Checkbox
                  checked={showContactEmail}
                  onChange={(event) => setShowContactEmail(event.target.checked)}
                />
              )}
              label={t('profile:show_on_profile', { defaultValue: 'Hiển thị trên hồ sơ' })}
            />
          </Stack>
          <TextField
            fullWidth
            type="email"
            value={contactLinks.contactEmail}
            onChange={handleContactLinkChange('contactEmail')}
            placeholder={t('profile:public_contact_email_placeholder', { defaultValue: 'email-lien-he@example.com' })}
            error={Boolean(contactLinks.contactEmail.trim()) && !isValidContactEmail(contactLinks.contactEmail)}
            helperText={
              contactLinks.contactEmail.trim() && !isValidContactEmail(contactLinks.contactEmail)
                ? t('profile:contact_email_invalid', { defaultValue: 'Email liên hệ không đúng định dạng.' })
                : t('profile:public_contact_email_hint', { defaultValue: 'Email này chỉ dùng để hiển thị trên trang cá nhân, không thay đổi email đăng nhập.' })
            }
          />
        </Stack>
      </ScrollRevealItem>

      <ScrollRevealItem>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
          }}
        >
          <Stack spacing={1.25}>
            <Typography variant="h5" fontWeight={800} color="primary.main" display="flex" alignItems="center" gap={1}>
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
              helperText={phoneError || t('profile:phone_private_hint', { defaultValue: 'Số điện thoại được lưu trong hệ thống và không hiển thị công khai trên hồ sơ.' })}
            />
          </Stack>
          <Stack spacing={1.25}>
            <Typography variant="h5" fontWeight={800} color="primary.main" display="flex" alignItems="center" gap={1}>
              <WcIcon />
              {t('settings:label_gender')}
            </Typography>
            <FormControl fullWidth>
              <InputLabel>{t('settings:label_gender')}</InputLabel>
              <Select
                value={gender}
                label={t('settings:label_gender')}
                onChange={(event) => setGender(event.target.value)}
                autoComplete="sex"
              >
                {GENDER_OPTIONS.map((g) => (
                  <MenuItem key={g} value={g}>{t(`settings:${GENDER_LABEL_KEYS[g]}`)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Box>
      </ScrollRevealItem>

      <ScrollRevealItem>
        <Stack spacing={1.75}>
          <Typography variant="h5" fontWeight={800} color="primary.main" display="flex" alignItems="center" gap={1}>
            <LinkIcon />
            {t('profile:social_links', { defaultValue: 'Liên kết mạng xã hội' })}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 1.5,
            }}
          >
            {PROFILE_CONTACT_FIELDS.filter((field) => field.key !== 'contactEmail').map((field) => (
              <TextField
                key={field.key}
                label={field.labelKey
                  ? t(`profile:${field.labelKey}`, { defaultValue: field.defaultLabel })
                  : field.label}
                value={contactLinks[field.key]}
                onChange={handleContactLinkChange(field.key)}
                placeholder={field.placeholder}
                fullWidth
              />
            ))}
          </Box>
          {contactLinkExtras.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              {t('profile:legacy_links_preserved', {
                count: contactLinkExtras.length,
                defaultValue: 'Đang giữ {{count}} liên kết cũ chưa nhận diện được.',
              })}
            </Typography>
          )}
        </Stack>
      </ScrollRevealItem>
    </ScrollRevealGroup>
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
              <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/mentorship/profile')}>
                {t('profile:back_to_profile_btn')}
              </Button>
              <Button variant="contained" startIcon={<SchoolIcon />} onClick={() => navigate('/mentorship/signup')}>
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

        {isPendingMentorEdit && (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <Typography fontWeight={800} mb={0.5}>
              {t('mentorship:mentor_pending_hub_title')}
            </Typography>
            <Typography variant="body2">
              {t('mentorship:mentor_pending_hub_desc')}
            </Typography>
          </Alert>
        )}

        {isPendingMentorEdit ? (
          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={() => navigate('/mentorship')}>
              {t('mentorship:mentor_signup_go_back')}
            </Button>
          </Stack>
        ) : (
          <>

        <SectionTitle hint={t('profile:section_expertise_hint')}>
          {t('profile:shareable_content_section', { defaultValue: 'Nội dung có thể chia sẻ' })}
        </SectionTitle>
        <Stack spacing={2}>
          <TextField
            value={experienceSummary}
            onChange={(e) => setExperienceSummary(e.target.value)}
            fullWidth
            multiline
            minRows={4}
            placeholder={t('mentorship:signup_tab_content_placeholder')}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              {t('mentorship:signup_tab_tags_hint')}
            </Typography>
            <Button
              variant="contained"
              startIcon={extractingTags ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
              onClick={handleExtractTags}
              disabled={extractingTags || !experienceSummary.trim()}
            >
              {extractingTags ? t('mentorship:signup_tab_extract_analyzing') : t('mentorship:signup_tab_extract_btn')}
            </Button>
          </Stack>
          {expertiseTags.length > 0 ? (
            <TagPriorityList
              tags={expertiseTags}
              onReorder={setExpertiseTags}
              onRemove={(tag) => setExpertiseTags((list) => list.filter((item) => item !== tag))}
            />
          ) : (
            <Typography variant="body2" color="text.disabled">
              {t('mentorship:signup_tab_no_tags')}
            </Typography>
          )}
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              placeholder={t('mentorship:signup_tab_manual_tag_placeholder')}
              value={manualTag}
              onChange={(e) => setManualTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleManualTagAdd();
                }
              }}
            />
            <Button onClick={handleManualTagAdd} startIcon={<AddIcon />} disabled={!manualTag.trim()}>
              {t('mentorship:signup_tab_add_btn')}
            </Button>
          </Stack>
        </Stack>

        <SectionTitle hint={t('profile:section_exp_edu_hint')}>
          {t('profile:section_exp_edu')}
        </SectionTitle>
        <Stack spacing={3}>
          <EditableTimelineList
            title={t('profile:edu_section')}
            icon={SchoolIcon}
            items={educations}
            emptyMessage={t('profile:no_educations')}
            addLabel={t('profile:add_btn')}
            onAdd={addEducationRow}
            onUpdate={updateEducationRow}
            onRemove={removeEducationRow}
            fields={[
              [
                { key: 'school', label: t('profile:label_school') },
                { key: 'degree', label: t('profile:label_degree') },
              ],
              [{ key: 'period', label: t('profile:label_period', { defaultValue: 'Thời gian' }), placeholder: '2022 - 2026' }],
            ]}
          />
          <EditableTimelineList
            title={t('profile:exp_section')}
            icon={WorkIcon}
            items={experiences}
            emptyMessage={t('profile:no_experiences')}
            addLabel={t('profile:add_btn')}
            onAdd={addExperienceRow}
            onUpdate={updateExperienceRow}
            onRemove={removeExperienceRow}
            fields={[
              [
                { key: 'title', label: t('profile:label_title') },
                { key: 'company', label: t('profile:label_company') },
              ],
              [{ key: 'period', label: t('profile:label_period', { defaultValue: 'Thời gian' }), placeholder: '2024 - Nay' }],
              [{ key: 'description', label: t('profile:label_description'), multiline: true }],
            ]}
          />
          <EditableTimelineList
            title={t('profile:projects_section', { defaultValue: 'Dự án' })}
            icon={ArticleIcon}
            items={projects}
            emptyMessage={t('profile:no_projects', { defaultValue: 'Chưa có dự án.' })}
            addLabel={t('profile:add_btn')}
            onAdd={addProjectRow}
            onUpdate={updateProjectRow}
            onRemove={removeProjectRow}
            fields={[
              [{ key: 'name', label: t('profile:project_name', { defaultValue: 'Tên dự án' }) }],
              [{ key: 'description', label: t('profile:label_description'), multiline: true }],
              [{ key: 'link', label: t('profile:project_link', { defaultValue: 'Liên kết' }) }],
            ]}
          />
          <EditableTimelineList
            title={t('profile:awards_section', { defaultValue: 'Thành tựu' })}
            icon={EmojiEventsIcon}
            items={awards}
            emptyMessage={t('profile:no_awards', { defaultValue: 'Chưa có thành tựu.' })}
            addLabel={t('profile:add_btn')}
            onAdd={addAwardRow}
            onUpdate={updateAwardRow}
            onRemove={removeAwardRow}
            fields={[
              [
                { key: 'name', label: t('profile:award_name', { defaultValue: 'Tên thành tựu' }) },
                { key: 'year', label: t('profile:award_year', { defaultValue: 'Năm' }) },
              ],
              [{ key: 'description', label: t('profile:label_description'), multiline: true }],
            ]}
          />
          <EditableTimelineList
            title={t('profile:skills_section')}
            icon={PsychologyIcon}
            items={skills}
            emptyMessage={t('profile:no_skills', { defaultValue: 'Chưa có kỹ năng/chứng chỉ.' })}
            addLabel={t('profile:add_btn')}
            onAdd={addSkillRow}
            onUpdate={updateSkillRow}
            onRemove={removeSkillRow}
            fields={[
              [
                { key: 'name', label: t('profile:skill_name', { defaultValue: 'Tên kỹ năng/chứng chỉ' }) },
                { key: 'issuer', label: t('profile:skill_issuer', { defaultValue: 'Đơn vị cấp' }) },
              ],
            ]}
          />
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
          </>
        )}
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
        avatarSlot={isPendingMentorEdit ? undefined : avatarEditor}
        disableMediaEditing={isPendingMentorEdit}
      >
        <ScrollRevealGroup stagger={0.08} sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <ScrollRevealItem sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h2" fontWeight={800} color="primary.main">
              {isMentorshipEdit
                ? (access.hasMentorProfile ? t('profile:edit_mentor_heading') : t('profile:edit_page_heading'))
                : t('profile:edit_page_heading')}
            </Typography>

            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<CloseIcon />}
                onClick={() => navigate(isPendingMentorEdit ? '/mentorship' : (isMentorshipEdit ? '/mentorship/profile' : '/profile'))}
                disabled={saving}
              >
                {t('profile:cancel_btn')}
              </Button>

              {!isPendingMentorEdit && (
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={saving || savingMedia}
                >
                  {saving || savingMedia ? t('profile:saving_btn') : t('profile:save_btn')}
                </Button>
              )}
            </Stack>
          </ScrollRevealItem>

          {isMentorshipEdit ? (
            renderMentorshipSection()
          ) : (
            <>
              {renderPersonalSection()}
            </>
          )}
        </ScrollRevealGroup>
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
