import { useEffect, useRef, useState } from 'react';
import {
  alpha,
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import { useTranslation } from 'react-i18next';
import AvatarUploadDialog from '../../profile/AvatarUploadDialog';
import useAvatarCrop from '../../../hooks/profile/useAvatarCrop';
import { fileToBase64 } from '../../../utils/imageUtils';
import { extractMentorshipCv } from '../../../utils/api';

const SectionList = ({ title, subtitle, items, onChange, fields, required = false, addLabel }) => {
  const { t } = useTranslation('mentorship');
  const resolvedAddLabel = addLabel ?? t('signup_profile_add_default');

  const handleAdd = () => {
    const empty = Object.fromEntries(fields.map((f) => [f.key, '']));
    onChange([...items, empty]);
  };

  const handleRemove = (idx) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const handleField = (idx, key, value) => {
    onChange(items.map((it, i) => (i === idx ? { ...it, [key]: value } : it)));
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
        <Box>
          <Typography fontWeight={700}>
            {title}
            {required && <Typography component="span" color="error.main">{' *'}</Typography>}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Button size="small" startIcon={<AddIcon />} onClick={handleAdd}>
          {resolvedAddLabel}
        </Button>
      </Stack>

      {items.length === 0 ? (
        <Card sx={{ p: 2, border: '1px dashed', borderColor: 'divider', textAlign: 'center' }} elevation={0}>
          <Typography variant="body2" color="text.secondary">
            {t('signup_profile_no_items', { label: resolvedAddLabel })}
          </Typography>
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {items.map((item, idx) => (
            <Card key={idx} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }} elevation={0}>
              <Stack spacing={1.5}>
                {fields.map((f) => (
                  <TextField
                    key={f.key}
                    label={f.label}
                    placeholder={f.placeholder}
                    value={item[f.key] ?? ''}
                    onChange={(e) => handleField(idx, f.key, e.target.value)}
                    fullWidth
                    size="small"
                    multiline={f.multiline}
                    minRows={f.multiline ? 2 : 1}
                  />
                ))}
                <Stack direction="row" justifyContent="flex-end">
                  <IconButton size="small" color="error" onClick={() => handleRemove(idx)}>
                    <DeleteOutlineIcon />
                  </IconButton>
                </Stack>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
};

const MentorSignupTabProfile = ({ values, onChange }) => {
  const { t } = useTranslation('mentorship');
  const cvInputRef = useRef(null);
  const avatarCrop = useAvatarCrop();
  const [cvExtracting, setCvExtracting] = useState(false);
  const [cvExtractError, setCvExtractError] = useState(null);

  useEffect(() => {
    const url = values.avatarPreview;
    return () => {
      if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
    };
  }, [values.avatarPreview]);

  useEffect(() => {
    if (!avatarCrop.avatarUrl || avatarCrop.avatarUrl === values.avatarPreview) return;
    onChange({
      ...values,
      avatarFile: avatarCrop.avatarUrl,
      avatarPreview: avatarCrop.avatarUrl,
    });
  }, [avatarCrop.avatarUrl, onChange, values]);

  const update = (key, val) => onChange({ ...values, [key]: val });

  const handleCvPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = null;
    if (!file) return;

    update('cvFile', file);
    setCvExtractError(null);

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setCvExtractError(t('signup_profile_cv_pdf_only'));
      return;
    }

    setCvExtracting(true);
    try {
      const base64File = await fileToBase64(file);
      const res = await extractMentorshipCv({ base64File, originalFileName: file.name });
      const profile = res?.data?.data ?? {};

      // Merge CV-detected skill tags into the existing (description-detected /
      // manually-added) list so both sources feed the same priority-ordered
      // tag list reviewed in the "content" tab — case-insensitive de-dup.
      const existingTags = values.expertiseTags ?? [];
      const existingLower = new Set(existingTags.map((tg) => tg.toLowerCase()));
      const newTags = (profile.expertiseTags ?? [])
        .map((tg) => (tg ?? '').trim())
        .filter((tg) => tg && !existingLower.has(tg.toLowerCase()));

      onChange({
        ...values,
        cvFile: file,
        currentJobTitle: profile.currentJobTitle || values.currentJobTitle,
        currentCompany: profile.currentCompany || values.currentCompany,
        educations: (profile.educations?.length ? profile.educations : values.educations) ?? [],
        experiences: (profile.experiences?.length ? profile.experiences : values.experiences) ?? [],
        projects: (profile.projects?.length ? profile.projects : values.projects) ?? [],
        awards: (profile.awards?.length ? profile.awards : values.awards) ?? [],
        skills: (profile.skills?.length ? profile.skills : values.skills) ?? [],
        expertiseTags: [...existingTags, ...newTags],
      });
    } catch (err) {
      setCvExtractError(err?.response?.data?.message ?? t('signup_profile_cv_extract_error'));
    } finally {
      setCvExtracting(false);
    }
  };

  return (
    <Stack spacing={4}>
      {/* Quick fill via CV */}
      <Card
        sx={(theme) => ({
          p: 2.5,
          border: '1px solid',
          borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.34 : 0.2),
          bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.14 : 0.08),
        })}
        elevation={0}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
          <Box>
            <Typography fontWeight={700} color="primary.main">
              {t('signup_profile_cv_title')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('signup_profile_cv_desc')}
            </Typography>
          </Box>
          <Tooltip title={t('signup_profile_cv_tooltip')} placement="top">
            <span>
              <Button
                variant="contained"
                startIcon={cvExtracting ? <CircularProgress size={16} color="inherit" /> : <UploadFileOutlinedIcon />}
                disabled={cvExtracting}
                onClick={() => cvInputRef.current?.click()}
              >
                {cvExtracting ? t('signup_profile_cv_extracting') : t('signup_profile_cv_upload_btn')}
              </Button>
            </span>
          </Tooltip>
          <input ref={cvInputRef} hidden type="file" accept=".pdf" onChange={handleCvPick} />
        </Stack>
        {values.cvFile && !cvExtractError && (
          <Typography variant="caption" mt={1} display="block">
            {t('signup_profile_cv_selected', { name: values.cvFile.name })}
          </Typography>
        )}
        {cvExtractError && (
          <Alert severity="warning" sx={{ mt: 1.5 }}>
            {cvExtractError}
          </Alert>
        )}
      </Card>

      {/* Avatar */}
      <Box>
        <Typography fontWeight={700} mb={1}>
          {t('signup_profile_avatar_title')}
          <Typography component="span" color="error.main">{' *'}</Typography>
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            src={values.avatarPreview}
            sx={{
              width: 88,
              height: 88,
              bgcolor: (theme) => alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.12 : 0.08),
            }}
          />
          <Button
            variant="outlined"
            startIcon={<PhotoCameraIcon />}
            onClick={() => avatarCrop.setOpen(true)}
          >
            {values.avatarFile ? t('signup_profile_change_avatar') : t('signup_profile_pick_avatar')}
          </Button>
        </Stack>
      </Box>

      {/* Core profile (BE-supported) */}
      <Box>
        <Typography fontWeight={700} mb={1.5}>
          {t('signup_profile_current_position')}
        </Typography>
        <Stack spacing={1.5}>
          <TextField
            label={t('signup_profile_job_title_label')}
            placeholder="VD: Senior Software Engineer"
            value={values.currentJobTitle ?? ''}
            onChange={(e) => update('currentJobTitle', e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label={t('signup_profile_company_label')}
            placeholder="VD: Google"
            value={values.currentCompany ?? ''}
            onChange={(e) => update('currentCompany', e.target.value)}
            fullWidth
            size="small"
          />
        </Stack>
      </Box>

      <Divider />

      <SectionList
        title={t('signup_profile_education_title')}
        subtitle={t('signup_profile_education_subtitle')}
        required
        items={values.educations ?? []}
        onChange={(v) => update('educations', v)}
        addLabel={t('signup_profile_add_education')}
        fields={[
          { key: 'school', label: t('signup_profile_edu_school'), placeholder: 'VD: HCMUS' },
          { key: 'degree', label: t('signup_profile_edu_degree'), placeholder: t('signup_profile_edu_degree_placeholder') },
          { key: 'period', label: t('signup_profile_edu_period'), placeholder: t('signup_profile_edu_period_placeholder') },
        ]}
      />

      <SectionList
        title={t('signup_profile_experience_title')}
        subtitle={t('signup_profile_experience_subtitle')}
        required
        items={values.experiences ?? []}
        onChange={(v) => update('experiences', v)}
        addLabel={t('signup_profile_add_experience')}
        fields={[
          { key: 'title', label: t('signup_profile_exp_title'), placeholder: 'VD: Software Engineer' },
          { key: 'company', label: t('signup_profile_exp_company'), placeholder: 'VD: Google' },
          { key: 'period', label: t('signup_profile_exp_period'), placeholder: t('signup_profile_exp_period_placeholder') },
          { key: 'description', label: t('signup_profile_exp_description'), multiline: true },
        ]}
      />

      <SectionList
        title={t('signup_profile_projects_title')}
        items={values.projects ?? []}
        onChange={(v) => update('projects', v)}
        addLabel={t('signup_profile_add_project')}
        fields={[
          { key: 'name', label: t('signup_profile_project_name') },
          { key: 'description', label: t('signup_profile_project_desc'), multiline: true },
          { key: 'link', label: t('signup_profile_project_link') },
        ]}
      />

      <SectionList
        title={t('signup_profile_awards_title')}
        items={values.awards ?? []}
        onChange={(v) => update('awards', v)}
        addLabel={t('signup_profile_add_award')}
        fields={[
          { key: 'name', label: t('signup_profile_award_name') },
          { key: 'year', label: t('signup_profile_award_year') },
          { key: 'description', label: t('signup_profile_award_desc') },
        ]}
      />

      <SectionList
        title={t('signup_profile_skills_title')}
        items={values.skills ?? []}
        onChange={(v) => update('skills', v)}
        addLabel={t('signup_profile_add_skill')}
        fields={[
          { key: 'name', label: t('signup_profile_skill_name') },
          { key: 'issuer', label: t('signup_profile_skill_issuer') },
        ]}
      />

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
    </Stack>
  );
};

export default MentorSignupTabProfile;
