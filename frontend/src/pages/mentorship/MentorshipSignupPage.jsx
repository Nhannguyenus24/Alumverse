import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckIcon from '@mui/icons-material/Check';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useTranslation } from 'react-i18next';

import Page from '../../components/Page';
import MentorSignupTabProfile from '../../components/mentorship/signup/MentorSignupTabProfile';
import MentorSignupTabContent from '../../components/mentorship/signup/MentorSignupTabContent';
import MentorSignupTabTerms from '../../components/mentorship/signup/MentorSignupTabTerms';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useMyOrganizationMember } from '../../hooks/useMyOrganizationMember';
import { useOrganization } from '../../hooks/useOrganization';
import { useCreateMentorSignup } from '../../hooks/mentorship/useCreateMentorSignup';
import { useSaveMentorDraft } from '../../hooks/mentorship/useSaveMentorDraft';
import { useMyMentorProfile } from '../../hooks/mentorship/useMyMentorProfile';
import { useMyMenteeProfile } from '../../hooks/mentorship/useMyMenteeProfile';
import { useMyProfile } from '../../hooks/profile/useMyProfile';
import { getMentorSignupTabs } from '../../constants/mentorshipNav';
import { buildAcademicRecords } from '../../utils/academicUtils';
import { resolveMediaUrl } from '../../utils/imageUtils';

const MIN_VERIFICATION_LEVEL = 2;
const STATUS_DRAFT = 'DRAFT';
const STATUS_PENDING = 'PENDING';
const STATUS_APPROVED = 'APPROVED';
const STATUS_REJECTED = 'REJECTED';
const STATUS_NEED_UPDATE = 'NEED_UPDATE';
const TAB_ORDER = ['profile', 'content', 'terms'];

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
  Boolean(v.avatarFile || v.avatarPreview) &&
  v.currentJobTitle.trim() &&
  v.currentCompany.trim() &&
  (v.educations ?? []).length > 0 &&
  (v.experiences ?? []).length > 0;

const validateContent = (v) =>
  Boolean(v.experienceSummary?.trim()) && (v.expertiseTags ?? []).length > 0;

const validateTerms = (v) => Boolean(v.termsAccepted);

const toEducationRows = (member, organizationName) =>
  buildAcademicRecords(member)
    .map((record) => ({
      school: record.faculty || record.department || organizationName || '',
      degree: [
        record.major ? `Cử nhân ${record.major}` : '',
        record.program ? `Chương trình ${record.program}` : '',
      ].filter(Boolean).join(' - '),
      period: [record.startedYear, record.graduatedYear].filter(Boolean).join(' - '),
    }))
    .filter((row) => row.school || row.degree || row.period);

const MentorSignupStepIcon = ({ active, completed, icon }) => (
  <Box
    sx={(theme) => ({
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 32,
      height: 32,
      borderRadius: '50%',
      fontWeight: 800,
      border: '2px solid',
      borderColor: active || completed ? 'primary.main' : 'divider',
      color: active || completed ? 'primary.main' : 'text.secondary',
      bgcolor: completed
        ? (theme.palette.mode === 'dark' ? 'background.paper' : 'primary.lighter')
        : 'background.paper',
    })}
  >
    {icon}
    {completed && (
      <Box
        sx={{
          position: 'absolute',
          right: -8,
          top: -7,
          width: 18,
          height: 18,
          borderRadius: '50%',
          bgcolor: 'success.main',
          color: 'success.contrastText',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid',
          borderColor: 'background.paper',
        }}
      >
        <CheckIcon sx={{ fontSize: 12 }} />
      </Box>
    )}
  </Box>
);

const MentorshipSignupPage = () => {
  const navigate = useOrgNavigate();
  const { t } = useTranslation('mentorship');
  const orgMemberQuery = useMyOrganizationMember();
  const { organization } = useOrganization();
  const baseProfileQuery = useMyProfile();
  const submitMutation = useCreateMentorSignup();
  const draftMutation = useSaveMentorDraft();
  const existingProfileQuery = useMyMentorProfile();
  const menteeProfileQuery = useMyMenteeProfile();

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
      avatarPreview: resolveMediaUrl(profile.avatarUrl ?? ''),
      experienceSummary: extended.experienceSummary ?? '',
      expertiseTags: Array.isArray(extended.expertiseTags) ? extended.expertiseTags : [],
      educations: Array.isArray(extended.educations) ? extended.educations : [],
      experiences: Array.isArray(extended.experiences) ? extended.experiences : [],
      projects: Array.isArray(extended.projects) ? extended.projects : [],
      awards: Array.isArray(extended.awards) ? extended.awards : [],
      skills: Array.isArray(extended.skills) ? extended.skills : [],
    };
  }, [existingProfileQuery.data]);

  const accountValues = useMemo(() => {
    const profile = baseProfileQuery.data;
    const orgMember = orgMemberQuery.data;
    const mentee = menteeProfileQuery.data;
    if (!profile && !orgMember && !mentee) return null;

    const currentJobTitle = profile?.currentJobTitle ?? '';
    const currentCompany = profile?.currentCompany ?? '';
    const menteeInterests = (mentee?.interests ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const workExperience = currentJobTitle || currentCompany
      ? [{
          title: currentJobTitle,
          company: currentCompany,
          period: '',
          description: '',
        }]
      : [];

    return {
      ...initialValues,
      avatarPreview: resolveMediaUrl(profile?.avatarUrl ?? ''),
      currentJobTitle,
      currentCompany,
      educations: toEducationRows(orgMember, orgMember?.organizationName || organization?.name),
      experiences: workExperience,
      experienceSummary: profile?.bio?.trim() || mentee?.mentoringGoal?.trim() || '',
      expertiseTags: menteeInterests,
      skills: menteeInterests,
    };
  }, [baseProfileQuery.data, menteeProfileQuery.data, orgMemberQuery.data, organization?.name]);

  const [tabKey, setTabKey] = useState(TAB_ORDER[0]);
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
  const accountKey = accountValues
    ? [
        'account',
        baseProfileQuery.data?.updatedAt ?? baseProfileQuery.data?.userId ?? '',
        orgMemberQuery.data?.updatedAt ?? orgMemberQuery.data?.userId ?? '',
        menteeProfileQuery.data?.updatedAt ?? menteeProfileQuery.data?.memberId ?? '',
      ].join(':')
    : null;
  const hydrationValues = draftValues ?? accountValues;
  const hydrationKey = draftValues && draftKey ? `mentor:${draftKey}` : accountKey;
  if (hydrationValues && hydrationKey && hydratedKey !== hydrationKey) {
    setValues(hydrationValues);
    setHydratedKey(hydrationKey);
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
  const currentStep = Math.max(0, TAB_ORDER.indexOf(tabKey));
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TAB_ORDER.length - 1;
  const currentStepValid = Boolean(tabValid[tabKey]);

  const goToPreviousStep = () => {
    if (isFirstStep) return;
    setTabKey(TAB_ORDER[currentStep - 1]);
  };

  const goToNextStep = () => {
    if (isLastStep || !currentStepValid) return;
    setTabKey(TAB_ORDER[currentStep + 1]);
  };

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
      setTimeout(() => navigate('/mentorship'), 1200);
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
          <Stepper activeStep={currentStep} alternativeLabel sx={{ px: { xs: 1, md: 3 }, pt: 3, pb: 2 }}>
            {tabs.map((tab) => (
              <Step
                key={tab.key}
                completed={tabValid[tab.key]}
              >
                <StepLabel StepIconComponent={MentorSignupStepIcon}>{tab.label}</StepLabel>
              </Step>
            ))}
          </Stepper>

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
          {!isFirstStep && (
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              disabled={draftMutation.isPending || submitMutation.isPending}
              onClick={goToPreviousStep}
            >
              {t('mentor_signup_previous')}
            </Button>
          )}
          {isLastStep ? (
            <Button
              variant="contained"
              disabled={!allValid || submitMutation.isPending || draftMutation.isPending}
              onClick={handleSubmit}
            >
              {submitMutation.isPending ? t('mentor_signup_sending') : t('mentor_signup_complete')}
            </Button>
          ) : (
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              disabled={!currentStepValid || draftMutation.isPending || submitMutation.isPending}
              onClick={goToNextStep}
            >
              {t('mentor_signup_next')}
            </Button>
          )}
        </Stack>
      </Container>
    </Page>
  );
};

export default MentorshipSignupPage;
