import { useState } from 'react';
import { useParams } from 'react-router';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StarIcon from '@mui/icons-material/Star';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';

import Page from '../../components/Page';
import MentorshipReviewCard from '../../components/mentorship/MentorshipReviewCard';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useMentorPublicProfile } from '../../hooks/mentorship/useMentorPublicProfile';
import { useMentorPublicFeedbacks } from '../../hooks/mentorship/useMentorPublicFeedbacks';
import { useMentorshipAccessState } from '../../hooks/mentorship/useMentorshipAccessState';
import { formatRating } from '../../utils/numberFormatter';
import { formatDate } from '../../utils/dateFormatter';

const FEEDBACKS_PER_PAGE = 5;

const MentorshipPublicProfilePage = () => {
  const navigate = useOrgNavigate();
  const { mentorId } = useParams();
  const mentorMemberId = Number(mentorId);
  const access = useMentorshipAccessState();

  const [feedbackPage, setFeedbackPage] = useState(0);

  const profileQuery = useMentorPublicProfile(mentorMemberId);
  const feedbacksQuery = useMentorPublicFeedbacks(mentorMemberId, feedbackPage, FEEDBACKS_PER_PAGE);

  const mentor = profileQuery.data;
  const feedbackPage_ = feedbacksQuery.data;
  const feedbacks = feedbackPage_?.items ?? [];

  const isOwnProfile = access.mentorMemberId != null && mentor?.memberId === access.mentorMemberId;
  const canBook = access.canUseMentorship && !isOwnProfile;
  const bookDisabledReason = access.isGuest
    ? 'Đăng nhập để đặt lịch'
    : !access.canUseMentorship
      ? 'Cần xác minh học vấn để đặt lịch'
      : isOwnProfile
        ? 'Đây là hồ sơ của bạn'
        : '';

  const goToBooking = () => {
    if (access.isGuest) {
      navigate('/auth/login');
      return;
    }
    if (!access.canUseMentorship) {
      return;
    }
    navigate(`/development/mentorship/mentors/${mentorMemberId}/book`);
  };

  const bookButton = (
    <Button
      variant="contained"
      size="large"
      startIcon={<EventAvailableIcon />}
      disabled={!canBook}
      onClick={canBook ? goToBooking : undefined}
    >
      Đặt lịch với cố vấn này
    </Button>
  );

  return (
    <Page title="Hồ sơ cố vấn">
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/development/mentorship')}
          sx={{ mb: 2, textTransform: 'none' }}
          color="inherit"
        >
          Quay lại danh sách
        </Button>

        {profileQuery.isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : profileQuery.isError || !mentor ? (
          <Alert severity="error">Không tải được hồ sơ cố vấn. Vui lòng thử lại.</Alert>
        ) : (
          <>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 4 },
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={3}
                alignItems={{ xs: 'flex-start', md: 'center' }}
              >
                <Avatar src={mentor.avatarUrl} sx={{ width: 120, height: 120 }}>
                  {(mentor.fullName ?? '#').charAt(0).toUpperCase()}
                </Avatar>

                <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h4" fontWeight={800}>
                    {mentor.fullName ?? `Mentor #${mentor.memberId}`}
                  </Typography>

                  {(mentor.currentJobTitle || mentor.currentCompany) && (
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <WorkOutlineIcon fontSize="small" color="action" />
                      <Typography color="text.secondary">
                        {[mentor.currentJobTitle, mentor.currentCompany]
                          .filter(Boolean)
                          .join(' @ ')}
                      </Typography>
                    </Stack>
                  )}

                  {mentor.ratingAvg != null && (
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <StarIcon sx={{ color: 'warning.main', fontSize: 22 }} />
                      <Typography fontWeight={700} color="primary.main" fontSize="1.1rem">
                        {formatRating(mentor.ratingAvg)}
                      </Typography>
                      {mentor.totalSessions != null && (
                        <Typography color="text.secondary">
                          ({mentor.totalSessions} buổi đã hoàn thành)
                        </Typography>
                      )}
                    </Stack>
                  )}
                </Stack>

                <Box>
                  {!canBook && bookDisabledReason ? (
                    <Tooltip title={bookDisabledReason}>
                      <span>{bookButton}</span>
                    </Tooltip>
                  ) : (
                    bookButton
                  )}
                </Box>
              </Stack>

              {mentor.bio && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="subtitle1" fontWeight={700} mb={1}>
                    Giới thiệu
                  </Typography>
                  <Typography color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                    {mentor.bio}
                  </Typography>
                </>
              )}

              {(mentor.expertiseTopics ?? []).length > 0 && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
                    Lĩnh vực chia sẻ
                  </Typography>
                  <Stack direction="row" gap={1} flexWrap="wrap">
                    {mentor.expertiseTopics.map((topic) => (
                      <Chip key={topic} label={topic} color="primary" variant="outlined" />
                    ))}
                  </Stack>
                </>
              )}
            </Paper>

            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" fontWeight={800} mb={2}>
                Đánh giá từ các mentee
              </Typography>

              {feedbacksQuery.isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : feedbacksQuery.isError ? (
                <Alert severity="error">Không tải được đánh giá.</Alert>
              ) : feedbacks.length === 0 ? (
                <Alert severity="info">Chưa có đánh giá nào cho cố vấn này.</Alert>
              ) : (
                <Stack spacing={2}>
                  {feedbacks.map((fb) => (
                    <MentorshipReviewCard
                      key={fb.id}
                      avatar={fb.menteeAvatarUrl}
                      name={fb.menteeName ?? 'Mentee'}
                      date={fb.createdAt ? formatDate(fb.createdAt) : ''}
                      rating={fb.rating}
                      content={fb.comment}
                    />
                  ))}

                  {feedbackPage_ && feedbackPage_.totalPage > 1 && (
                    <Stack direction="row" justifyContent="center" spacing={1} sx={{ mt: 2 }}>
                      <Button
                        variant="outlined"
                        disabled={!feedbackPage_.hasPrevious}
                        onClick={() => setFeedbackPage((p) => Math.max(0, p - 1))}
                      >
                        Trước
                      </Button>
                      <Typography sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
                        {feedbackPage_.currentPage + 1} / {feedbackPage_.totalPage}
                      </Typography>
                      <Button
                        variant="outlined"
                        disabled={!feedbackPage_.hasNext}
                        onClick={() => setFeedbackPage((p) => p + 1)}
                      >
                        Sau
                      </Button>
                    </Stack>
                  )}
                </Stack>
              )}
            </Box>
          </>
        )}
      </Container>
    </Page>
  );
};

export default MentorshipPublicProfilePage;
