import { useState } from 'react';
import { useParams } from 'react-router';
import {
  Alert,
  Avatar,
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
import StarIcon from '@mui/icons-material/Star';

import Page from '../../components/Page';
import MentorshipSlotPicker from '../../components/mentorship/MentorshipSlotPicker';
import MentorshipBookingForm from '../../components/mentorship/MentorshipBookingForm';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useMentorPublicProfile } from '../../hooks/mentorship/useMentorPublicProfile';
import { useMentorAvailability } from '../../hooks/mentorship/useMentorAvailability';
import { useBookSession } from '../../hooks/mentorship/useBookSession';

const STEPS = ['Chọn khung giờ', 'Điền thông tin'];

const MentorshipBookingPage = () => {
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
      setTimeout(() => navigate('/development/mentorship'), 1500);
    } catch (_err) {
      // errorMessage from hook will surface in the alert below
    }
  };

  const isLoading = profileQuery.isLoading || availabilityQuery.isLoading;

  return (
    <Page title="Đặt lịch hẹn cố vấn">
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2, textTransform: 'none' }}
          color="inherit"
        >
          Quay lại
        </Button>

        <Typography variant="h2" fontWeight={800} color="primary.main" mb={1}>
          ĐẶT LỊCH HẸN
        </Typography>
        <Typography color="text.secondary" mb={4}>
          Chọn khung giờ phù hợp và cung cấp thông tin để mentor chuẩn bị tốt hơn cho buổi gặp.
        </Typography>

        {profileQuery.isError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Không thể tải thông tin mentor. Vui lòng thử lại.
          </Alert>
        )}

        {submitSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Đã gửi yêu cầu đặt lịch thành công. Đang chuyển về trang Cố vấn...
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
          <Stack spacing={3}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {STEPS.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {activeStep === 0 && (
              <Stack spacing={2}>
                {availabilityQuery.isLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                  </Box>
                ) : availabilityQuery.isError ? (
                  <Alert severity="error">
                    Không tải được lịch trống của mentor. Vui lòng thử lại.
                  </Alert>
                ) : Object.keys(availabilityQuery.availabilityMap).length === 0 ? (
                  <Alert severity="info">
                    Mentor này hiện chưa có lịch trống. Vui lòng quay lại sau.
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
                    Tiếp tục
                  </Button>
                </Stack>
              </Stack>
            )}

            {activeStep === 1 && selectedSlot && (
              <Paper
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
              </Paper>
            )}
          </Stack>

          {/* MENTOR SIDEBAR */}
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
                <CircularProgress size={24} />
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
                        {Number(mentor.ratingAvg).toFixed(1)}
                      </Typography>
                      {mentor.totalSessions != null && (
                        <Typography variant="body2" color="text.secondary">
                          ({mentor.totalSessions} buổi)
                        </Typography>
                      )}
                    </Stack>
                  )}
                </Stack>

                <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    Thời lượng
                  </Typography>
                  <Typography fontWeight={600}>60 phút / buổi</Typography>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    Hình thức
                  </Typography>
                  <Typography fontWeight={600}>Online (Google Meet)</Typography>
                </Box>
              </>
            )}
          </Paper>
        </Box>
      </Container>
    </Page>
  );
};

export default MentorshipBookingPage;
