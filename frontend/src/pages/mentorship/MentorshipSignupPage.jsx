import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useTranslation } from 'react-i18next';

import Page from '../../components/Page';
import MentorSignupTabProfile from '../../components/mentorship/signup/MentorSignupTabProfile';
import MentorSignupTabContent from '../../components/mentorship/signup/MentorSignupTabContent';
import MentorSignupTabTerms from '../../components/mentorship/signup/MentorSignupTabTerms';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useMyOrganizationMember } from '../../hooks/useMyOrganizationMember';
import { useCreateMentorSignup } from '../../hooks/mentorship/useCreateMentorSignup';
import { useSaveMentorDraft } from '../../hooks/mentorship/useSaveMentorDraft';
import { useMyMentorProfile } from '../../hooks/mentorship/useMyMentorProfile';
import { getMentorSignupTabs } from '../../constants/mentorshipNav';

const MIN_VERIFICATION_LEVEL = 2;
const STATUS_DRAFT = 'DRAFT';
const STATUS_PENDING = 'PENDING';
const STATUS_APPROVED = 'APPROVED';
const STATUS_REJECTED = 'REJECTED';
const STATUS_NEED_UPDATE = 'NEED_UPDATE';

const initialValues = {
  // Tab 1
  avatarFile: null,
  avatarPreview: '',
  cvFile: null,
  currentJobTitle: '',
  currentCompany: '',
  educations: [],
  experiences: [],
  projects: [],
  awards: [],
  skills: [],
  // Tab 2
  experienceSummary: '',
  expertiseTags: [],
  defaultMeetingLink: '',
  // Tab 3
  termsAccepted: false,
};

const validateProfile = (v) =>
  Boolean(v.avatarFile) &&
  v.currentJobTitle.trim() &&
  v.currentCompany.trim() &&
  (v.educations ?? []).length > 0 &&
  (v.experiences ?? []).length > 0;

const validateContent = (v) =>
  Boolean(v.experienceSummary?.trim()) && (v.expertiseTags ?? []).length > 0;

const validateTerms = (v) => Boolean(v.termsAccepted);

const MentorshipSignupPage = () => {
  const navigate = useOrgNavigate();
  const { t } = useTranslation('mentorship');
  const orgMemberQuery = useMyOrganizationMember();
  const submitMutation = useCreateMentorSignup();
  const draftMutation = useSaveMentorDraft();
  const existingProfileQuery = useMyMentorProfile();

  const tabs = useMemo(() => getMentorSignupTabs(t), [t]);

  const draftValues = useMemo(() => {
    const profile = existingProfileQuery.data;
    if (!profile) return null;
    const allowedStatuses = [STATUS_DRAFT, STATUS_REJECTED, STATUS_NEED_UPDATE];
    if (!allowedStatuses.includes(profile.status)) return null;
    let extended = {};
    try {
      extended = profile.extendedProfile ? JSON.parse(profile.extendedProfile) : {};
    } catch {
      extended = {};
    }
    return {
      ...initialValues,
      currentJobTitle: profile.currentJobTitle ?? '',
      currentCompany: profile.currentCompany ?? '',
      defaultMeetingLink: profile.defaultMeetingLink ?? '',
      avatarPreview: profile.avatarUrl ?? '',
      experienceSummary: extended.experienceSummary ?? '',
      expertiseTags: Array.isArray(extended.expertiseTags) ? extended.expertiseTags : [],
      educations: Array.isArray(extended.educations) ? extended.educations : [],
      experiences: Array.isArray(extended.experiences) ? extended.experiences : [],
      projects: Array.isArray(extended.projects) ? extended.projects : [],
      awards: Array.isArray(extended.awards) ? extended.awards : [],
      skills: Array.isArray(extended.skills) ? extended.skills : [],
    };
  }, [existingProfileQuery.data]);

  const [tabKey, setTabKey] = useState('profile');
  const [values, setValues] = useState(initialValues);
  const [hydratedKey, setHydratedKey] = useState(null);
  const [success, setSuccess] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  // Hydrate the form once when the draft profile arrives from the server. Using
  // a "key" guard during render (instead of useEffect) keeps us inside React's
  // recommended pattern for deriving state from props.
  const draftKey = existingProfileQuery.data?.updatedAt
    ?? existingProfileQuery.data?.createdAt
    ?? null;
  if (draftValues && draftKey && hydratedKey !== draftKey) {
    setValues(draftValues);
    setHydratedKey(draftKey);
  }

  const handleChange = (next) => setValues(next);

  const tabValid = useMemo(
    () => ({
      profile: validateProfile(values),
      content: validateContent(values),
      terms: validateTerms(values),
    }),
    [values],
  );

  const allValid = tabValid.profile && tabValid.content && tabValid.terms;

  const handleSubmit = async () => {
    if (!allValid) return;
    try {
      await submitMutation.submit({
        profile: {
          currentJobTitle: values.currentJobTitle.trim(),
          currentCompany: values.currentCompany.trim(),
        },
        expertiseTags: values.expertiseTags ?? [],
        avatarFile: values.avatarFile,
        coverFile: null,
        defaultMeetingLink: values.defaultMeetingLink?.trim() || null,
        extended: {
          experienceSummary: values.experienceSummary?.trim() || '',
          expertiseTags: values.expertiseTags ?? [],
          educations: values.educations ?? [],
          experiences: values.experiences ?? [],
          projects: values.projects ?? [],
          awards: values.awards ?? [],
          skills: values.skills ?? [],
        },
      });
      setSuccess(true);
      setTimeout(() => navigate('/mentorship/profile'), 1200);
    } catch {
      /* surfaced via submitMutation.errorMessage */
    }
  };

  const handleSaveDraft = async () => {
    setDraftSaved(false);
    try {
      await draftMutation.submit({
        profile: {
          currentJobTitle: values.currentJobTitle?.trim() || null,
          currentCompany: values.currentCompany?.trim() || null,
        },
        expertiseTags: values.expertiseTags ?? [],
        avatarFile: values.avatarFile,
        coverFile: null,
        defaultMeetingLink: values.defaultMeetingLink?.trim() || null,
        extended: {
          experienceSummary: values.experienceSummary?.trim() || '',
          expertiseTags: values.expertiseTags ?? [],
          educations: values.educations ?? [],
          experiences: values.experiences ?? [],
          projects: values.projects ?? [],
          awards: values.awards ?? [],
          skills: values.skills ?? [],
        },
      });
      setDraftSaved(true);
    } catch {
      /* surfaced via draftMutation.errorMessage */
    }
  };

  // ===== Verification gating =====

  if (orgMemberQuery.isFetching) {
    return (
      <Page title={t('mentor_signup_page_title')}>
        <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
          <CircularProgress />
        </Container>
      </Page>
    );
  }

  const verificationLevel = orgMemberQuery.data?.verificationLevel ?? 0;
  const isVerified = verificationLevel >= MIN_VERIFICATION_LEVEL;

  if (!isVerified) {
    return (
      <Page title={t('mentor_signup_page_title')}>
        <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/mentorship')}
            sx={{ mb: 2, textTransform: 'none' }}
            color="inherit"
          >
            {t('mentor_signup_go_back')}
          </Button>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography fontWeight={700} mb={0.5}>
              {t('mentor_signup_not_eligible_title')}
            </Typography>
            <Typography variant="body2">
              {t('mentor_signup_not_eligible_desc', { required: MIN_VERIFICATION_LEVEL, current: verificationLevel })}
            </Typography>
          </Alert>
        </Container>
      </Page>
    );
  }

  // ===== Already submitted / approved gating =====

  const existingStatus = existingProfileQuery.data?.status;
  if (existingStatus === STATUS_PENDING || existingStatus === STATUS_APPROVED) {
    const isApproved = existingStatus === STATUS_APPROVED;
    return (
      <Page title={t('mentor_signup_page_title')}>
        <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/mentorship')}
            sx={{ mb: 2, textTransform: 'none' }}
            color="inherit"
          >
            {t('mentor_signup_go_back')}
          </Button>
          <Alert severity={isApproved ? 'success' : 'info'} sx={{ mb: 2 }}>
            <Typography fontWeight={700} mb={0.5}>
              {isApproved
                ? t('mentor_signup_approved_title')
                : t('mentor_signup_pending_title')}
            </Typography>
            <Typography variant="body2">
              {isApproved
                ? t('mentor_signup_approved_desc')
                : t('mentor_signup_pending_desc')}
            </Typography>
          </Alert>
        </Container>
      </Page>
    );
  }

  // ===== Form =====

  return (
    <Page title={t('mentor_signup_page_title')}>
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/mentorship')}
          sx={{ mb: 2, textTransform: 'none' }}
          color="inherit"
        >
          {t('mentor_signup_go_back')}
        </Button>

        <Typography variant="h2" fontWeight={800} color="primary.main" mb={1}>
          {t('mentor_signup_heading')}
        </Typography>
        <Typography color="text.secondary" mb={3}>
          {t('mentor_signup_subtitle')}
        </Typography>

        {existingStatus === STATUS_DRAFT && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {t('mentor_signup_draft_loaded')}
          </Alert>
        )}

        {(existingStatus === STATUS_REJECTED || existingStatus === STATUS_NEED_UPDATE) && (
          <Alert
            severity={existingStatus === STATUS_REJECTED ? 'error' : 'warning'}
            sx={{ mb: 2, whiteSpace: 'pre-line' }}
          >
            <Typography fontWeight={700} mb={0.5}>
              {existingStatus === STATUS_REJECTED
                ? t('mentor_signup_rejected_title')
                : t('mentor_signup_need_update_title')}
            </Typography>
            {existingProfileQuery.data?.reviewNote && (
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                <strong>{t('mentor_signup_review_note_label')}</strong> {existingProfileQuery.data.reviewNote}
              </Typography>
            )}
            <Typography variant="body2" sx={{ mt: 1 }}>
              {t('mentor_signup_resubmit_hint')}
            </Typography>
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {t('mentor_signup_success')}
          </Alert>
        )}

        {draftSaved && !success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {t('mentor_signup_draft_saved')}
          </Alert>
        )}

        {submitMutation.errorMessage && !success && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitMutation.errorMessage}
          </Alert>
        )}

        {draftMutation.errorMessage && !draftSaved && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {draftMutation.errorMessage}
          </Alert>
        )}

        <Paper variant="outlined" sx={{ borderRadius: 2 }}>
          <Tabs
            value={tabKey}
            onChange={(_, v) => setTabKey(v)}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            {tabs.map((tab) => (
              <Tab
                key={tab.key}
                value={tab.key}
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <span>{tab.label}</span>
                    {tabValid[tab.key] && (
                      <Box
                        component="span"
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: 'success.main',
                          display: 'inline-block',
                        }}
                      />
                    )}
                  </Stack>
                }
              />
            ))}
          </Tabs>

          <Box sx={{ p: { xs: 2, md: 3 } }}>
            {tabKey === 'profile' && (
              <MentorSignupTabProfile values={values} onChange={handleChange} />
            )}
            {tabKey === 'content' && (
              <MentorSignupTabContent values={values} onChange={handleChange} />
            )}
            {tabKey === 'terms' && (
              <MentorSignupTabTerms values={values} onChange={handleChange} />
            )}
          </Box>
        </Paper>

        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" spacing={1.5} mt={3}>
          <Button variant="outlined" color="inherit" onClick={() => navigate('/mentorship')}>
            {t('mentor_signup_cancel')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<SaveOutlinedIcon />}
            disabled={draftMutation.isPending || submitMutation.isPending}
            onClick={handleSaveDraft}
          >
            {draftMutation.isPending ? t('mentor_signup_saving') : t('mentor_signup_save_draft')}
          </Button>
          <Button
            variant="contained"
            disabled={!allValid || submitMutation.isPending || draftMutation.isPending}
            onClick={handleSubmit}
          >
            {submitMutation.isPending ? t('mentor_signup_sending') : t('mentor_signup_complete')}
          </Button>
        </Stack>
      </Container>
    </Page>
  );
};

export default MentorshipSignupPage;
