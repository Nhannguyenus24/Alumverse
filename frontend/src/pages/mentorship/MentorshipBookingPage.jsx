import LoadingSkeleton from '../../components/LoadingSkeleton';
import { useState } from 'react';
import { useParams } from 'react-router';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StarIcon from '@mui/icons-material/Star';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

import Page from '../../components/Page';
import MentorshipSlotPicker from '../../components/mentorship/MentorshipSlotPicker';
import MentorshipBookingForm from '../../components/mentorship/MentorshipBookingForm';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useMentorPublicProfile } from '../../hooks/mentorship/useMentorPublicProfile';
import { useMentorAvailability } from '../../hooks/mentorship/useMentorAvailability';
import { useBookSession } from '../../hooks/mentorship/useBookSession';
import { formatRating } from '../../utils/numberFormatter';
import {
  ScrollReveal,
  ScrollRevealGroup,
  ScrollRevealItem,
} from '../../components/animations/ScrollReveal';

const MentorshipBookingPage = () => {
  const { t } = useTranslation(['mentorship', 'common']);
  const navigate = useOrgNavigate();
  const { mentorId } = useParams();
  const mentorMemberId = Number(mentorId);

  const profileQuery = useMentorPublicProfile(mentorMemberId);
  const availabilityQuery = useMentorAvailability(mentorMemberId);
  const { bookSession, isPending: submitting, errorMessage } = useBookSession();

  const [activeStep, setActiveStep] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formValues, setFormValues] = useState({
    sessionType: '',
    introduction: '',
    description: '',
    cv: null,
  });

  const mentor = profileQuery.data;

  const STEPS = [t('mentorship:booking_step_pick_slot'), t('mentorship:booking_step_fill_info')];

  const handleSelectSlot = (slot) => setSelectedSlot(slot);
  const handleNext = () => selectedSlot && setActiveStep(1);
  const handleBack = () => setActiveStep(0);

  const handleSubmit = async () => {
    if (!selectedSlot?.availabilityId) return;
    try {
      await bookSession({
        availabilityId: selectedSlot.availabilityId,
        sessionType: formValues.sessionType,
        introduction: formValues.introduction,
        description: formValues.description,
        bookingNote: formValues.description,
        cvFile: formValues.cv,
      });
      setSubmitSuccess(true);
      setTimeout(() => navigate('/mentorship'), 1500);
    } catch {
      // errorMessage from hook will surface in the alert below
    }
  };

  const isLoading = profileQuery.isLoading || availabilityQuery.isLoading;

  return (
    <Page title={t('mentorship:booking_page_title')}>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <ScrollRevealGroup stagger={0.08}>
          <ScrollRevealItem><Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2, textTransform: 'none' }} color="inherit">{t('common:back')}</Button></ScrollRevealItem>
          <ScrollRevealItem><Typography variant="h2" fontWeight={800} color="primary.main" mb={1}>{t('mentorship:booking_heading')}</Typography></ScrollRevealItem>
          <ScrollRevealItem><Typography color="text.secondary" mb={4}>{t('mentorship:booking_desc')}</Typography></ScrollRevealItem>
        </ScrollRevealGroup>

        {profileQuery.isError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {t('mentorship:booking_error_load_mentor')}
          </Alert>
        )}

        {submitSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {t('mentorship:booking_success')}
          </Alert>
        )}

        {errorMessage && !submitSuccess && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errorMessage}
          </Alert>
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 320px' },
            gap: 3,
            alignItems: 'flex-start',
          }}
        >
          {/* MAIN COLUMN */}
          <ScrollRevealGroup stagger={0.09} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <ScrollRevealItem><Stepper activeStep={activeStep} alternativeLabel>
              {STEPS.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper></ScrollRevealItem>

            {activeStep === 0 && (
              <ScrollRevealItem><Stack spacing={2}>
                {availabilityQuery.isLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <LoadingSkeleton />
                  </Box>
                ) : availabilityQuery.isError ? (
                  <Alert severity="error">
                    {t('mentorship:booking_error_load_slots')}
                  </Alert>
                ) : Object.keys(availabilityQuery.availabilityMap).length === 0 ? (
                  <Alert severity="info">
                    {t('mentorship:booking_no_slots')}
                  </Alert>
                ) : (
                  <MentorshipSlotPicker
                    availabilityMap={availabilityQuery.availabilityMap}
                    selectedSlot={selectedSlot}
                    onSelectSlot={handleSelectSlot}
                  />
                )}

                <Stack direction="row" justifyContent="flex-end">
                  <Button
                    variant="contained"
                    disabled={!selectedSlot}
                    onClick={handleNext}
                  >
                    {t('mentorship:booking_continue')}
                  </Button>
                </Stack>
              </Stack></ScrollRevealItem>
            )}

            {activeStep === 1 && selectedSlot && (
              <ScrollRevealItem><Paper
                elevation={0}
                sx={{ p: { xs: 2, md: 3 }, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
              >
                <MentorshipBookingForm
                  slot={selectedSlot}
                  values={formValues}
                  onChange={setFormValues}
                  onBack={handleBack}
                  onSubmit={handleSubmit}
                  submitting={submitting}
                />
              </Paper></ScrollRevealItem>
            )}
          </ScrollRevealGroup>

          {/* MENTOR SIDEBAR */}
          <ScrollReveal direction="left">
            <Paper
              elevation={0}
              sx={{
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                position: { md: 'sticky' },
                top: { md: 24 },
              }}
            >
            {isLoading || !mentor ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <LoadingSkeleton />
              </Box>
            ) : (
              <>
                <Stack alignItems="center" spacing={1.5} textAlign="center">
                  <Avatar src={mentor.avatarUrl} sx={{ width: 96, height: 96 }}>
                    {(mentor.fullName ?? '#').charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography fontWeight={700}>
                      {mentor.fullName ?? `Mentor #${mentor.memberId}`}
                    </Typography>
                    {(mentor.currentJobTitle || mentor.currentCompany) && (
                      <Typography variant="body2" color="text.secondary">
                        {[mentor.currentJobTitle, mentor.currentCompany]
                          .filter(Boolean)
                          .join(' @ ')}
                      </Typography>
                    )}
                  </Box>

                  {mentor.ratingAvg != null && (
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <StarIcon sx={{ color: 'warning.main', fontSize: 18 }} />
                      <Typography fontWeight={700} color="primary.main">
                        {formatRating(mentor.ratingAvg)}
                      </Typography>
                      {mentor.totalSessions != null && (
                        <Typography variant="body2" color="text.secondary">
                          {t('mentorship:sidebar_sessions_count', { count: mentor.totalSessions })}
                        </Typography>
                      )}
                    </Stack>
                  )}
                </Stack>

                <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    {t('mentorship:sidebar_duration')}
                  </Typography>
                  <Typography fontWeight={600}>
                    {selectedSlot
                      ? t('mentorship:sidebar_duration_minutes', {
                          minutes: dayjs(selectedSlot.endTime).diff(dayjs(selectedSlot.startTime), 'minute'),
                        })
                      : t('mentorship:sidebar_duration_flexible')}
                  </Typography>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    {t('mentorship:sidebar_format')}
                  </Typography>
                  <Typography fontWeight={600}>{t('mentorship:sidebar_format_value')}</Typography>
                </Box>
              </>
            )}
            </Paper>
          </ScrollReveal>
        </Box>
      </Container>
    </Page>
  );
};

export default MentorshipBookingPage;
