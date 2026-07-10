import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTranslation } from 'react-i18next';

import Page from '../../components/Page';
import {
  ScrollReveal,
  ScrollRevealGroup,
  ScrollRevealItem,
} from '../../components/animations/ScrollReveal';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useMyOrganizationMember } from '../../hooks/useMyOrganizationMember';
import { useMyMenteeProfile, useSaveMenteeProfile } from '../../hooks/mentorship/useMyMenteeProfile';

const MIN_VERIFICATION_LEVEL = 2;

const initialValues = {
  mentoringGoal: '',
  major: '',
  academicYear: '',
  interests: '',
  termsAccepted: false,
};

const MenteeSignupPage = () => {
  const navigate = useOrgNavigate();
  const { t } = useTranslation('mentorship');
  const orgMemberQuery = useMyOrganizationMember();
  const existingQuery = useMyMenteeProfile();
  const saveMutation = useSaveMenteeProfile();

  const [values, setValues] = useState(initialValues);
  const [hydratedKey, setHydratedKey] = useState(null);
  const [success, setSuccess] = useState(false);

  const ACADEMIC_YEAR_OPTIONS = [
    t('mentee_signup_academic_year_1'),
    t('mentee_signup_academic_year_2'),
    t('mentee_signup_academic_year_3'),
    t('mentee_signup_academic_year_4'),
    t('mentee_signup_academic_year_5plus'),
    t('mentee_signup_academic_year_graduated'),
  ];

  const COMMITMENTS = [
    t('mentee_signup_commitment_1'),
    t('mentee_signup_commitment_2'),
    t('mentee_signup_commitment_3'),
    t('mentee_signup_commitment_4'),
    t('mentee_signup_commitment_5'),
  ];

  const hydratedValues = useMemo(() => {
    const p = existingQuery.data;
    if (!p) return null;
    return {
      mentoringGoal: p.mentoringGoal ?? '',
      major: p.major ?? '',
      academicYear: p.academicYear ?? '',
      interests: p.interests ?? '',
      termsAccepted: true,
    };
  }, [existingQuery.data]);

  const hydrationKey = existingQuery.data?.updatedAt
    ?? existingQuery.data?.createdAt
    ?? null;
  if (hydratedValues && hydrationKey && hydratedKey !== hydrationKey) {
    setValues(hydratedValues);
    setHydratedKey(hydrationKey);
  }

  const isValid =
    values.mentoringGoal.trim().length > 0 &&
    values.major.trim().length > 0 &&
    values.academicYear.trim().length > 0 &&
    Boolean(values.termsAccepted);

  const setField = (field) => (event) =>
    setValues((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = async () => {
    if (!isValid) return;
    try {
      await saveMutation.submit({
        mentoringGoal: values.mentoringGoal.trim(),
        major: values.major.trim(),
        academicYear: values.academicYear.trim(),
        interests: values.interests.trim() || undefined,
        termsAccepted: true,
      });
      setSuccess(true);
      setTimeout(() => navigate('/mentorship'), 1200);
    } catch {
      /* surfaced via errorMessage */
    }
  };

  if (orgMemberQuery.isFetching) {
    return (
      <Page title={t('mentee_signup_page_title')}>
        <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
          <CircularProgress />
        </Container>
      </Page>
    );
  }

  const verificationLevel = orgMemberQuery.data?.verificationLevel ?? 0;
  const isVerified = verificationLevel >= MIN_VERIFICATION_LEVEL;

  if (!isVerified) {
    const needsEmail = verificationLevel < 1;
    return (
      <Page title={t('mentee_signup_page_title')}>
        <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/mentorship')}
            sx={{ mb: 2, textTransform: 'none' }}
            color="inherit"
          >
            {t('mentee_signup_go_back')}
          </Button>
          <Alert severity="warning">
            <Typography fontWeight={700} mb={0.5}>
              {t('mentee_signup_not_eligible_title')}
            </Typography>
            <Typography variant="body2">
              {needsEmail
                ? t('mentee_signup_not_eligible_email')
                : t('mentee_signup_not_eligible_academic')}
            </Typography>
          </Alert>
        </Container>
      </Page>
    );
  }

  const hasExisting = Boolean(existingQuery.data);

  return (
    <Page title={t('mentee_signup_page_title')}>
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
        <ScrollReveal><Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/mentorship')}
          sx={{ mb: 2, textTransform: 'none' }}
          color="inherit"
        >
          {t('mentee_signup_go_back')}
        </Button></ScrollReveal>

        <ScrollReveal><Typography variant="h2" fontWeight={800} color="primary.main" mb={1}>
          {hasExisting ? t('mentee_signup_update_heading') : t('mentee_signup_create_heading')}
        </Typography></ScrollReveal>
        <ScrollReveal delay={0.06}><Typography color="text.secondary" mb={3}>
          {t('mentee_signup_subtitle')}
        </Typography></ScrollReveal>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {t('mentee_signup_saved_alert')}
          </Alert>
        )}

        {saveMutation.errorMessage && !success && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {saveMutation.errorMessage}
          </Alert>
        )}

        <ScrollReveal><Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
          <ScrollRevealGroup stagger={0.08} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <ScrollRevealItem><TextField
              label={t('mentee_signup_goal_label')}
              placeholder={t('mentee_signup_goal_placeholder')}
              value={values.mentoringGoal}
              onChange={setField('mentoringGoal')}
              multiline
              minRows={3}
              required
              fullWidth
            /></ScrollRevealItem>

            <ScrollRevealItem><Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label={t('mentee_signup_major_label')}
                value={values.major}
                onChange={setField('major')}
                required
                fullWidth
              />
              <TextField
                label={t('mentee_signup_year_label')}
                value={values.academicYear}
                onChange={setField('academicYear')}
                select
                required
                fullWidth
              >
                {ACADEMIC_YEAR_OPTIONS.map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </TextField>
            </Stack></ScrollRevealItem>

            <ScrollRevealItem><TextField
              label={t('mentee_signup_interests_label')}
              placeholder={t('mentee_signup_interests_placeholder')}
              value={values.interests}
              onChange={setField('interests')}
              multiline
              minRows={2}
              fullWidth
              helperText={t('mentee_signup_interests_helper')}
            /></ScrollRevealItem>

            <ScrollRevealItem>
              <Typography fontWeight={700} mb={1}>
                {t('mentee_signup_terms_title')}
              </Typography>
              <Paper
                variant="outlined"
                sx={{ p: 2, maxHeight: 220, overflowY: 'auto', bgcolor: 'background.default' }}
              >
                <Typography variant="body2" color="text.secondary" mb={1}>
                  {t('mentee_signup_terms_agree_header')}
                </Typography>
                <Box component="ol" sx={{ pl: 3, m: 0 }}>
                  {COMMITMENTS.map((c, i) => (
                    <Typography key={i} component="li" variant="body2" sx={{ mb: 0.5 }}>
                      {c}
                    </Typography>
                  ))}
                </Box>
              </Paper>
              <FormControlLabel
                sx={{ mt: 1 }}
                control={
                  <Checkbox
                    checked={values.termsAccepted}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, termsAccepted: e.target.checked }))
                    }
                  />
                }
                label={t('mentee_signup_terms_accept_label')}
              />
            </ScrollRevealItem>
          </ScrollRevealGroup>
        </Paper></ScrollReveal>

        <ScrollReveal><Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="flex-end"
          spacing={1.5}
          mt={3}
        >
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => navigate('/mentorship')}
          >
            {t('mentee_signup_cancel')}
          </Button>
          <Button
            variant="contained"
            disabled={!isValid || saveMutation.isPending}
            onClick={handleSubmit}
          >
            {saveMutation.isPending
              ? t('mentee_signup_saving')
              : hasExisting
                ? t('mentee_signup_update_btn')
                : t('mentee_signup_complete_btn')}
          </Button>
        </Stack></ScrollReveal>
      </Container>
    </Page>
  );
};

export default MenteeSignupPage;
