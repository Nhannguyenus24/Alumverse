import { useMemo, useState, useCallback } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';

import StarIcon from '@mui/icons-material/Star';

import Page from '../../components/Page';
import MentorshipProfileLayout from '../../layouts/ProfileLayout';
import MentorshipBookingItem from '../../components/mentorship/MentorshipBookingItem';
import MentorshipReviewCard from '../../components/mentorship/MentorshipReviewCard';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useMyMentorSessions } from '../../hooks/mentorship/useMyMentorSessions';
import { useUpdateSessionStatus } from '../../hooks/mentorship/useUpdateSessionStatus';
import { useMyMentorProfile } from '../../hooks/mentorship/useMyMentorProfile';
import { useMyMentorFeedbacks } from '../../hooks/mentorship/useMyMentorFeedbacks';
import { useJoinSession } from '../../hooks/mentorship/useJoinSession';
import { formatDate } from '../../utils/dateFormatter';
import { formatRating } from '../../utils/numberFormatter';
import {
  cancelMentorSession,
  postponeMentorSession,
  reportSession,
  updateMentorSessionMeetingLink,
} from '../../utils/api';
import { reasonsForStatus } from '../../components/mentorship/reportReasons';
import { MENTOR_PROFILE_TABS } from '../../constants/mentorshipNav';
import StatsBanner from '../../components/StatsBanner'

const TOP_TABS = MENTOR_PROFILE_TABS;

const DEFAULT_COVER =
  'https://ethnasia.com/cdn/shop/articles/sean-o-KMn4VEeEPR8-unsplash_edited.jpg?v=1621585619';

const PAGE_SIZE = 50;

const MentorshipDashboardPage = () => {
  const navigate = useOrgNavigate();
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelPending, setCancelPending] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [reportCategory, setReportCategory] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportPending, setReportPending] = useState(false);
  const [postponeTarget, setPostponeTarget] = useState(null);
  const [postponeReason, setPostponeReason] = useState('');
  const [postponeDate, setPostponeDate] = useState(null);
  const [postponeStart, setPostponeStart] = useState(null);
  const [postponeEnd, setPostponeEnd] = useState(null);
  const [postponeError, setPostponeError] = useState(null);
  const [postponePending, setPostponePending] = useState(false);
  const [linkTarget, setLinkTarget] = useState(null);
  const [linkValue, setLinkValue] = useState('');
  const [linkError, setLinkError] = useState(null);
  const [linkPending, setLinkPending] = useState(false);

  const profileQuery = useMyMentorProfile();
  const sessionsQuery = useMyMentorSessions({ page: 0, limit: PAGE_SIZE });
  const feedbacksQuery = useMyMentorFeedbacks(0, 50);
  const updateMutation = useUpdateSessionStatus();
  const joinMutation = useJoinSession();
  const [actionError, setActionError] = useState('');

  const items = useMemo(() => sessionsQuery.data?.items ?? [], [sessionsQuery.data]);
  const feedbacks = useMemo(
    () => feedbacksQuery.data?.items ?? [],
    [feedbacksQuery.data],
  );

  const UPCOMING_PREVIEW_COUNT = 3;

  const upcomingItems = useMemo(() => {
    const now = dayjs();
    return items
      .filter(
        (s) => s.status === 'CONFIRMED' || s.status === 'IN_PROGRESS' || s.status === 'RESCHEDULE_PROPOSED',
      )
      .filter((s) => !s.endTime || dayjs(s.endTime).isAfter(now))
      .sort((a, b) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf());
  }, [items]);

  const previewUpcoming = useMemo(
    () => upcomingItems.slice(0, UPCOMING_PREVIEW_COUNT),
    [upcomingItems],
  );

  const stats = useMemo(() => {
    const completed = items.filter((s) => s.status === 'COMPLETED').length;
    return [
      { value: items.length, label: 'lượt đặt' },
      { value: upcomingItems.length, label: 'sắp tới' },
      { value: completed, label: 'đã hoàn thành' },
    ];
  }, [items, upcomingItems]);

  const callUpdate = useCallback(async (sessionId, status) => {
    try {
      await updateMutation.updateStatus({ sessionId, status });
    } catch {
      /* surfaced via errorMessage */
    }
  }, [updateMutation]);

  const handleJoin = useCallback(async (session) => {
    setActionError('');
    try {
      await joinMutation.joinSession({ sessionId: session.id, asMentor: true });
    } catch (err) {
      setActionError(err?.response?.data?.message ?? 'Không thể tham gia buổi mentoring.');
    }
  }, [joinMutation, setActionError]);

  const openCancelDialog = useCallback((session) => {
    setCancelTarget(session);
    setCancelReason('');
  }, []);

  const closeCancelDialog = useCallback(() => {
    setCancelTarget(null);
    setCancelReason('');
  }, []);

  const handleConfirmCancel = useCallback(async () => {
    if (!cancelTarget) return;
    setCancelPending(true);
    try {
      await cancelMentorSession(cancelTarget.id, cancelReason.trim() || undefined);
      sessionsQuery.refetch?.();
      closeCancelDialog();
    } catch {
      /* silent */
    } finally {
      setCancelPending(false);
    }
  }, [cancelTarget, cancelReason, sessionsQuery, closeCancelDialog]);

  const openPostponeDialog = useCallback((session) => {
    setPostponeTarget(session);
    setPostponeReason('');
    // Seed pickers from the current session time so the mentor only tweaks it.
    const base = session.startTime ? dayjs(session.startTime) : null;
    setPostponeDate(base);
    setPostponeStart(base);
    setPostponeEnd(session.endTime ? dayjs(session.endTime) : null);
    setPostponeError(null);
  }, []);

  const closePostponeDialog = useCallback(() => {
    setPostponeTarget(null);
    setPostponeReason('');
    setPostponeDate(null);
    setPostponeStart(null);
    setPostponeEnd(null);
    setPostponeError(null);
  }, []);

  const handleConfirmPostpone = useCallback(async () => {
    if (!postponeTarget) return;
    setPostponeError(null);
    if (!postponeDate || !postponeStart || !postponeEnd) {
      setPostponeError('Hãy chọn ngày, giờ bắt đầu và giờ kết thúc đề xuất.');
      return;
    }
    // Combine the chosen date with the chosen start/end times.
    const proposedStart = postponeDate
      .hour(postponeStart.hour())
      .minute(postponeStart.minute())
      .second(0)
      .millisecond(0);
    const proposedEnd = postponeDate
      .hour(postponeEnd.hour())
      .minute(postponeEnd.minute())
      .second(0)
      .millisecond(0);
    if (!proposedEnd.isAfter(proposedStart)) {
      setPostponeError('Giờ kết thúc phải sau giờ bắt đầu.');
      return;
    }
    if (!proposedStart.isAfter(dayjs())) {
      setPostponeError('Giờ đề xuất phải nằm trong tương lai.');
      return;
    }
    setPostponePending(true);
    try {
      await postponeMentorSession(postponeTarget.id, {
        reason: postponeReason.trim() || undefined,
        proposedStartTime: proposedStart.format('YYYY-MM-DDTHH:mm:ss'),
        proposedEndTime: proposedEnd.format('YYYY-MM-DDTHH:mm:ss'),
      });
      sessionsQuery.refetch?.();
      closePostponeDialog();
    } catch (err) {
      setPostponeError(err?.response?.data?.message ?? 'Không gửi được đề nghị dời lịch.');
    } finally {
      setPostponePending(false);
    }
  }, [postponeTarget, postponeDate, postponeStart, postponeEnd, postponeReason, sessionsQuery, closePostponeDialog]);

  const openLinkDialog = useCallback((session) => {
    setLinkTarget(session);
    setLinkValue(session.meetingLink ?? '');
    setLinkError(null);
  }, []);
  const closeLinkDialog = useCallback(() => {
    setLinkTarget(null);
    setLinkValue('');
    setLinkError(null);
  }, []);
  const handleConfirmLink = useCallback(async () => {
    if (!linkTarget) return;
    const value = linkValue.trim();
    if (!value) {
      setLinkError('Vui lòng nhập link tham gia.');
      return;
    }
    setLinkPending(true);
    setLinkError(null);
    try {
      await updateMentorSessionMeetingLink(linkTarget.id, value);
      sessionsQuery.refetch?.();
      closeLinkDialog();
    } catch (err) {
      setLinkError(err?.response?.data?.message ?? 'Không cập nhật được link tham gia.');
    } finally {
      setLinkPending(false);
    }
  }, [linkTarget, linkValue, sessionsQuery, closeLinkDialog]);

  const closeReportDialog = useCallback(() => {
    setReportTarget(null);
    setReportCategory('');
    setReportDescription('');
  }, []);

  const isOtherReason = reportCategory === 'OTHER';
  const reportDescTooShort = isOtherReason && reportDescription.trim().length < 10;
  const reportInvalid = !reportCategory || reportDescTooShort;

  const handleConfirmReport = useCallback(async () => {
    if (!reportTarget || reportInvalid) return;
    setActionError('');
    setReportPending(true);
    try {
      await reportSession(reportTarget.id, {
        reasonCategory: reportCategory,
        description: reportDescription.trim() || undefined,
      });
      closeReportDialog();
      sessionsQuery.refetch?.();
    } catch (err) {
      setActionError(err?.response?.data?.message ?? 'Không gửi được báo cáo.');
    } finally {
      setReportPending(false);
    }
  }, [reportTarget, reportInvalid, reportCategory, reportDescription, sessionsQuery, closeReportDialog]);

  const profile = profileQuery.data;
  const mentorUser = useMemo(() => ({
    name: profile?.fullName ?? 'Tài khoản của tôi',
    role:
      profile && (profile.currentJobTitle || profile.currentCompany)
        ? [profile.currentJobTitle, profile.currentCompany].filter(Boolean).join(' @ ')
        : 'Mentor',
    avatar: profile?.avatarUrl ?? '',
    cover: profile?.coverUrl ?? DEFAULT_COVER,
  }), [profile]);

  const ratingAvg = formatRating(profile?.ratingAvg);

  return (
    <Page title="Cố vấn - Tổng quan">
      <MentorshipProfileLayout
        user={mentorUser}
        cover={mentorUser.cover}
        tabs={TOP_TABS}
        onNavigate={navigate}
        mode="mentor"
      >
        <Stack spacing={4}>
          <Typography variant="h2" fontWeight={800} color="primary.main">
            TỔNG QUAN
          </Typography>

          {/* STATS */}
          <StatsBanner items={stats} />

          {updateMutation.errorMessage && (
            <Alert severity="error">{updateMutation.errorMessage}</Alert>
          )}

          {actionError && (
            <Alert severity="error" onClose={() => setActionError('')}>
              {actionError}
            </Alert>
          )}

          {sessionsQuery.isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : sessionsQuery.isError ? (
            <Alert severity="error">Không tải được danh sách buổi tư vấn.</Alert>
          ) : (
            <>
              {/* LỊCH SẮP TỚI */}
              <Section
                title={`Lịch sắp tới (${upcomingItems.length})`}
                right={
                  upcomingItems.length > 0 && (
                    <Button
                      size="small"
                      onClick={() => navigate('/development/mentorship/my-bookings')}
                    >
                      Xem tất cả
                    </Button>
                  )
                }
              >
                {previewUpcoming.length === 0 ? (
                  <EmptyState message="Bạn chưa có buổi tư vấn nào sắp tới." />
                ) : (
                  <Stack spacing={2}>
                    {previewUpcoming.map((session) => (
                      <Box key={session.id}>
                        <MentorshipBookingItem
                          session={session}
                          view="mentor"
                          onCancel={openCancelDialog}
                          cancelDisabled={cancelPending}
                          onPostpone={openPostponeDialog}
                          onJoin={handleJoin}
                          joinPending={joinMutation.isPending}
                          onSetMeetingLink={openLinkDialog}
                          mentorHasDefaultLink={Boolean(profile?.defaultMeetingLink)}
                        />
                        {(session.status === 'CONFIRMED' || session.status === 'IN_PROGRESS') && (
                          <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 0.5 }}>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => callUpdate(session.id, 'COMPLETED')}
                            >
                              Đánh dấu hoàn tất
                            </Button>
                          </Stack>
                        )}
                      </Box>
                    ))}
                    {upcomingItems.length > previewUpcoming.length && (
                      <Button
                        variant="outlined"
                        onClick={() => navigate('/development/mentorship/my-bookings')}
                      >
                        Xem thêm {upcomingItems.length - previewUpcoming.length} buổi sắp tới
                      </Button>
                    )}
                  </Stack>
                )}
              </Section>
            </>
          )}

          {/* ĐÁNH GIÁ */}
          <Section
            title="Đánh giá"
            right={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <StarIcon sx={{ color: 'warning.main' }} />
                <Typography fontWeight={700}>{ratingAvg}</Typography>
                <Typography color="text.secondary">({feedbacks.length} đánh giá)</Typography>
              </Box>
            }
          >
            {feedbacksQuery.isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={20} />
              </Box>
            ) : feedbacks.length === 0 ? (
              <EmptyState message="Chưa có đánh giá nào từ mentee." />
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                {feedbacks.map((review) => (
                  <MentorshipReviewCard
                    key={review.id}
                    name={review.menteeName ?? `Mentee #${review.menteeMemberId}`}
                    date={formatDate(review.createdAt, '')}
                    avatar={review.menteeAvatarUrl ?? ''}
                    rating={review.rating}
                    content={review.comment ?? ''}
                  />
                ))}
              </Box>
            )}
          </Section>
        </Stack>
      </MentorshipProfileLayout>

      <Dialog open={Boolean(postponeTarget)} onClose={closePostponeDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Đề nghị dời lịch</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Đề xuất một khung giờ mới cho buổi hẹn. Người được cố vấn sẽ nhận thông báo để
            đồng ý dời lịch hoặc từ chối. Buổi hẹn vẫn được giữ cho tới khi họ phản hồi.
          </Typography>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack spacing={2} mt={1}>
              <DatePicker
                label="Ngày đề xuất"
                value={postponeDate}
                onChange={setPostponeDate}
                minDate={dayjs()}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
              <Stack direction="row" spacing={1}>
                <TimePicker
                  label="Bắt đầu"
                  value={postponeStart}
                  onChange={setPostponeStart}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
                <TimePicker
                  label="Kết thúc"
                  value={postponeEnd}
                  onChange={setPostponeEnd}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Stack>
              <TextField
                label="Lý do dời lịch (tùy chọn)"
                value={postponeReason}
                onChange={(e) => setPostponeReason(e.target.value)}
                fullWidth
                multiline
                minRows={2}
              />
              {postponeError && <Alert severity="error">{postponeError}</Alert>}
            </Stack>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={closePostponeDialog} color="inherit">
            Đóng
          </Button>
          <Button onClick={handleConfirmPostpone} variant="contained" disabled={postponePending}>
            {postponePending ? 'Đang gửi...' : 'Gửi đề nghị'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(reportTarget)} onClose={closeReportDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Báo cáo sự cố</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Mô tả vấn đề trong buổi mentoring. Đội quản trị sẽ xem xét và xử lý.
          </Typography>
          <TextField
            select
            label="Lý do báo cáo *"
            value={reportCategory}
            onChange={(e) => setReportCategory(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          >
            {reasonsForStatus(reportTarget?.status).map((r) => (
              <MenuItem key={r.value} value={r.value}>
                {r.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label={isOtherReason ? 'Mô tả chi tiết *' : 'Mô tả thêm (tùy chọn)'}
            value={reportDescription}
            onChange={(e) => setReportDescription(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            required={isOtherReason}
            error={reportDescTooShort}
            helperText={
              isOtherReason ? 'Bắt buộc nhập tối thiểu 10 ký tự khi chọn "Khác".' : undefined
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeReportDialog} color="inherit">
            Hủy
          </Button>
          <Button
            onClick={handleConfirmReport}
            color="warning"
            variant="contained"
            disabled={reportPending || reportInvalid}
          >
            Gửi báo cáo
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel dialog */}
      <Dialog open={Boolean(cancelTarget)} onClose={closeCancelDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Hủy lịch hẹn</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Lý do hủy sẽ được thông báo đến mentee.
          </Typography>
          <TextField
            label="Lý do hủy (tùy chọn)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            placeholder="Ví dụ: Bận công việc đột xuất..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCancelDialog} color="inherit">
            Quay lại
          </Button>
          <Button
            onClick={handleConfirmCancel}
            color="error"
            variant="contained"
            disabled={cancelPending}
          >
            Xác nhận hủy
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(linkTarget)} onClose={closeLinkDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{linkTarget?.meetingLink ? 'Sửa link tham gia' : 'Thêm link tham gia'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Dán link phòng họp (Google Meet, Zoom...) cho buổi hẹn này. Người được cố vấn sẽ thấy link
            và nhận thông báo.
          </Typography>
          <TextField
            label="Link tham gia"
            value={linkValue}
            onChange={(e) => setLinkValue(e.target.value)}
            fullWidth
            placeholder="https://meet.google.com/..."
            autoFocus
          />
          {linkError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {linkError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeLinkDialog} color="inherit">
            Hủy
          </Button>
          <Button onClick={handleConfirmLink} variant="contained" disabled={linkPending}>
            {linkPending ? 'Đang lưu...' : 'Lưu link'}
          </Button>
        </DialogActions>
      </Dialog>
    </Page>
  );
};

const Section = ({ title, children, right }) => (
  <Box>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="h4" fontWeight={700} color="primary.main">
        {title}
      </Typography>
      {right}
    </Box>
    {children}
  </Box>
);

const EmptyState = ({ message }) => (
  <Card sx={{ p: 3, border: '1px dashed', borderColor: 'divider', textAlign: 'center' }} elevation={0}>
    <Typography variant="body2" color="text.secondary">
      {message}
    </Typography>
  </Card>
);

export default MentorshipDashboardPage;
