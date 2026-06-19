import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import StarIcon from '@mui/icons-material/Star';
import dayjs from 'dayjs';

import Page from '../../components/Page';
import ProfileLayout from '../../layouts/ProfileLayout';
import MentorshipBookingItem from '../../components/mentorship/MentorshipBookingItem';
import { useMyMenteeSessions } from '../../hooks/mentorship/useMyMenteeSessions';
import { useMyMentorSessions } from '../../hooks/mentorship/useMyMentorSessions';
import { useMyMentorProfile } from '../../hooks/mentorship/useMyMentorProfile';
import { useMyMenteeProfile } from '../../hooks/mentorship/useMyMenteeProfile';
import { useCancelMenteeSession } from '../../hooks/mentorship/useCancelMenteeSession';
import { useSubmitSessionFeedback } from '../../hooks/mentorship/useSubmitSessionFeedback';
import { useJoinSession } from '../../hooks/mentorship/useJoinSession';
import { useMentorshipAccessState } from '../../hooks/mentorship/useMentorshipAccessState';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import {
  reportSession,
  respondReschedule,
  cancelMentorSession,
  postponeMentorSession,
  updateMentorSessionMeetingLink,
} from '../../utils/api';
import { reasonsForStatus } from '../../components/mentorship/reportReasons';
import { MENTOR_PROFILE_TABS, MENTEE_PROFILE_TABS } from '../../constants/mentorshipNav';

const DEFAULT_COVER =
  'https://ethnasia.com/cdn/shop/articles/sean-o-KMn4VEeEPR8-unsplash_edited.jpg?v=1621585619';

const ACTIVE_STATUSES = new Set(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'RESCHEDULE_PROPOSED']);
const PAST_STATUSES = new Set(['COMPLETED', 'EXPIRED']);
const CANCELLED_STATUSES = new Set(['CANCELLED', 'CANCELLED_BY_MENTEE', 'CANCELLED_BY_MENTOR', 'REJECTED']);

const STATUS_FILTERS = [
  { key: 'all', label: 'Tất cả', match: () => true },
  { key: 'upcoming', label: 'Sắp tới', match: (s) => ACTIVE_STATUSES.has(s.status) },
  { key: 'past', label: 'Đã qua', match: (s) => PAST_STATUSES.has(s.status) },
  { key: 'cancelled', label: 'Đã hủy / từ chối', match: (s) => CANCELLED_STATUSES.has(s.status) },
];

const PAGE_SIZE = 50;

const MentorshipMyBookingsPage = () => {
  const navigate = useOrgNavigate();
  const access = useMentorshipAccessState();

  const isMentor = access.isMentorApproved;

  const mentorProfileQuery = useMyMentorProfile();
  const menteeProfileQuery = useMyMenteeProfile();

  const [statusKey, setStatusKey] = useState('all');

  const menteeSessionsQuery = useMyMenteeSessions({ page: 0, limit: PAGE_SIZE });
  const mentorSessionsQuery = useMyMentorSessions({ page: 0, limit: PAGE_SIZE });

  const cancelMutation = useCancelMenteeSession();
  const feedbackMutation = useSubmitSessionFeedback();
  const joinMutation = useJoinSession();

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [reportTarget, setReportTarget] = useState(null);
  const [reportCategory, setReportCategory] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportPending, setReportPending] = useState(false);
  const [feedbackTarget, setFeedbackTarget] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackPublic, setFeedbackPublic] = useState(true);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleResponsePending, setRescheduleResponsePending] = useState(false);
  const [reportSuccess, setReportSuccess] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const [mentorCancelTarget, setMentorCancelTarget] = useState(null);
  const [mentorCancelReason, setMentorCancelReason] = useState('');
  const [mentorCancelPending, setMentorCancelPending] = useState(false);
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

  // Merge both roles into a single list, tagging each session with the role
  // the current user plays in it. Mentor sessions get the full action set,
  // mentee sessions a limited one. List is grouped only by status.
  const items = useMemo(() => {
    const menteeItems = (menteeSessionsQuery.data?.items ?? []).map((s) => ({
      ...s,
      _role: 'mentee',
    }));
    const mentorItems = isMentor
      ? (mentorSessionsQuery.data?.items ?? []).map((s) => ({ ...s, _role: 'mentor' }))
      : [];
    return [...menteeItems, ...mentorItems].sort(
      (a, b) => dayjs(b.startTime).valueOf() - dayjs(a.startTime).valueOf(),
    );
  }, [menteeSessionsQuery.data, mentorSessionsQuery.data, isMentor]);

  const visibleItems = useMemo(() => {
    const matcher = STATUS_FILTERS.find((t) => t.key === statusKey)?.match ?? (() => true);
    return items.filter(matcher);
  }, [items, statusKey]);

  const isLoading =
    menteeSessionsQuery.isLoading || (isMentor && mentorSessionsQuery.isLoading);
  // Only treat as a hard error when we have nothing to show AND every source we
  // depend on failed. A mentor without a mentee profile (or vice versa) gets a
  // 403/404 on one source — that must not blank out the whole page.
  const menteeFailed = menteeSessionsQuery.isError;
  const mentorFailed = !isMentor || mentorSessionsQuery.isError;
  const isError = items.length === 0 && menteeFailed && mentorFailed;

  const refetchActive = () => {
    menteeSessionsQuery.refetch?.();
    if (isMentor) mentorSessionsQuery.refetch?.();
  };

  const handleJoin = async (session) => {
    setActionError('');
    try {
      await joinMutation.joinSession({ sessionId: session.id, asMentor: session._role === 'mentor' });
      refetchActive();
    } catch (err) {
      setActionError(err?.response?.data?.message ?? 'Không thể tham gia buổi mentoring.');
    }
  };

  const openCancelDialog = (session) => {
    setCancelTarget(session);
    setCancelReason('');
  };
  const closeCancelDialog = () => {
    setCancelTarget(null);
    setCancelReason('');
  };
  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      await cancelMutation.cancelSession({ sessionId: cancelTarget.id, cancelReason: cancelReason.trim() || undefined });
      closeCancelDialog();
    } catch {
      // noop
    }
  };

  const openReportDialog = (session) => {
    setReportTarget(session);
    setReportCategory('');
    setReportDescription('');
  };
  const closeReportDialog = () => {
    setReportTarget(null);
    setReportCategory('');
    setReportDescription('');
  };
  const isOtherReason = reportCategory === 'OTHER';
  const reportDescTooShort = isOtherReason && reportDescription.trim().length < 10;
  const reportInvalid = !reportCategory || reportDescTooShort;
  const handleConfirmReport = async () => {
    if (!reportTarget || reportInvalid) return;
    setActionError('');
    setReportPending(true);
    try {
      await reportSession(reportTarget.id, {
        reasonCategory: reportCategory,
        description: reportDescription.trim() || undefined,
      });
      setReportSuccess('Đã gửi báo cáo. Đội quản trị sẽ xem xét và phản hồi.');
      closeReportDialog();
      refetchActive();
    } catch (err) {
      setActionError(err?.response?.data?.message ?? 'Không gửi được báo cáo.');
    } finally {
      setReportPending(false);
    }
  };

  const openFeedbackDialog = (session) => {
    setFeedbackTarget(session);
    setFeedbackRating(5);
    setFeedbackComment('');
    setFeedbackPublic(true);
  };
  const closeFeedbackDialog = () => {
    setFeedbackTarget(null);
    setFeedbackRating(5);
    setFeedbackComment('');
    setFeedbackPublic(true);
  };
  const handleConfirmFeedback = async () => {
    if (!feedbackTarget) return;
    try {
      await feedbackMutation.submitFeedback({
        sessionId: feedbackTarget.id,
        rating: feedbackRating,
        comment: feedbackComment.trim() || undefined,
        isPublic: feedbackPublic,
      });
      setFeedbackSuccess('Cảm ơn bạn đã đánh giá buổi cố vấn!');
      closeFeedbackDialog();
      refetchActive();
    } catch {
      /* errorMessage from hook */
    }
  };

  const openRescheduleDialog = (session) => setRescheduleTarget(session);
  const closeRescheduleDialog = () => setRescheduleTarget(null);
  const handleRescheduleResponse = async (session, accept) => {
    setActionError('');
    setRescheduleResponsePending(true);
    try {
      await respondReschedule(session.id, accept);
      refetchActive();
    } catch (err) {
      setActionError(err?.response?.data?.message ?? 'Không phản hồi được đề nghị dời lịch.');
    } finally {
      setRescheduleResponsePending(false);
    }
  };
  const handleConfirmReschedule = async () => {
    if (!rescheduleTarget) return;
    const mentorId = rescheduleTarget.mentorMemberId;
    try {
      await cancelMutation.cancelSession({
        sessionId: rescheduleTarget.id,
        cancelReason: 'Mentee đề xuất đổi lịch — hủy để đặt khung giờ mới',
      });
      closeRescheduleDialog();
      if (mentorId) {
        navigate(`/development/mentorship/mentors/${mentorId}/book`);
      } else {
        navigate('/development/mentorship');
      }
    } catch {
      /* cancelMutation.errorMessage */
    }
  };

  const openMentorCancelDialog = (session) => {
    setMentorCancelTarget(session);
    setMentorCancelReason('');
  };
  const closeMentorCancelDialog = () => {
    setMentorCancelTarget(null);
    setMentorCancelReason('');
  };
  const handleConfirmMentorCancel = async () => {
    if (!mentorCancelTarget) return;
    setMentorCancelPending(true);
    try {
      await cancelMentorSession(mentorCancelTarget.id, mentorCancelReason.trim() || undefined);
      refetchActive();
      closeMentorCancelDialog();
    } catch {
      // noop
    } finally {
      setMentorCancelPending(false);
    }
  };

  const openPostponeDialog = (session) => {
    setPostponeTarget(session);
    setPostponeReason('');
    const base = session.startTime ? dayjs(session.startTime) : null;
    setPostponeDate(base);
    setPostponeStart(base);
    setPostponeEnd(session.endTime ? dayjs(session.endTime) : null);
    setPostponeError(null);
  };
  const closePostponeDialog = () => {
    setPostponeTarget(null);
    setPostponeReason('');
    setPostponeDate(null);
    setPostponeStart(null);
    setPostponeEnd(null);
    setPostponeError(null);
  };
  const handleConfirmPostpone = async () => {
    if (!postponeTarget) return;
    setPostponeError(null);
    if (!postponeDate || !postponeStart || !postponeEnd) {
      setPostponeError('Hãy chọn ngày, giờ bắt đầu và giờ kết thúc đề xuất.');
      return;
    }
    const proposedStart = postponeDate
      .hour(postponeStart.hour()).minute(postponeStart.minute()).second(0).millisecond(0);
    const proposedEnd = postponeDate
      .hour(postponeEnd.hour()).minute(postponeEnd.minute()).second(0).millisecond(0);
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
      refetchActive();
      closePostponeDialog();
    } catch (err) {
      setPostponeError(err?.response?.data?.message ?? 'Không gửi được đề nghị dời lịch.');
    } finally {
      setPostponePending(false);
    }
  };

  const openLinkDialog = (session) => {
    setLinkTarget(session);
    setLinkValue(session.meetingLink ?? '');
    setLinkError(null);
  };
  const closeLinkDialog = () => {
    setLinkTarget(null);
    setLinkValue('');
    setLinkError(null);
  };
  const handleConfirmLink = async () => {
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
      refetchActive();
      closeLinkDialog();
    } catch (err) {
      setLinkError(err?.response?.data?.message ?? 'Không cập nhật được link tham gia.');
    } finally {
      setLinkPending(false);
    }
  };

  const profile = isMentor ? mentorProfileQuery.data : menteeProfileQuery.data;
  const user = {
    name: profile?.fullName ?? 'Tài khoản của tôi',
    role:
      profile && (profile.currentJobTitle || profile.currentCompany)
        ? [profile.currentJobTitle, profile.currentCompany].filter(Boolean).join(' @ ')
        : isMentor
          ? 'Mentor'
          : 'Mentee',
    avatar: profile?.avatarUrl ?? '',
    cover: profile?.coverUrl ?? DEFAULT_COVER,
  };

  const tabs = isMentor ? MENTOR_PROFILE_TABS : MENTEE_PROFILE_TABS;

  const renderItem = (session) => {
    if (session._role === 'mentor') {
      return (
        <MentorshipBookingItem
          key={`mentor-${session.id}`}
          session={session}
          view="mentor"
          onCancel={openMentorCancelDialog}
          cancelDisabled={mentorCancelPending}
          onPostpone={openPostponeDialog}
          onReport={openReportDialog}
          onJoin={handleJoin}
          joinPending={joinMutation.isPending}
          onSetMeetingLink={openLinkDialog}
          mentorHasDefaultLink={Boolean(mentorProfileQuery.data?.defaultMeetingLink)}
        />
      );
    }
    return (
      <MentorshipBookingItem
        key={`mentee-${session.id}`}
        session={session}
        view="mentee"
        onCancel={openCancelDialog}
        cancelDisabled={cancelMutation.isPending}
        onReport={openReportDialog}
        onFeedback={openFeedbackDialog}
        onReschedule={openRescheduleDialog}
        onRescheduleResponse={handleRescheduleResponse}
        rescheduleResponsePending={rescheduleResponsePending}
        onJoin={handleJoin}
        joinPending={joinMutation.isPending}
      />
    );
  };

  return (
    <Page title="Lịch hẹn của tôi">
      <ProfileLayout
        user={user}
        cover={user.cover}
        tabs={tabs}
        onNavigate={navigate}
        mode={isMentor ? 'mentor' : 'menteeOwn'}
      >
        <Stack spacing={3}>
          <Box>
            <Typography variant="h2" fontWeight={800} color="primary.main" mb={1}>
              LỊCH HẸN CỦA TÔI
            </Typography>
            <Typography color="text.secondary">
              {isMentor
                ? 'Quản lý buổi tư vấn bạn là cố vấn và buổi bạn đặt với cố vấn khác.'
                : 'Quản lý các buổi tư vấn bạn đã đặt với cố vấn.'}
            </Typography>
          </Box>

          {cancelMutation.errorMessage && (
            <Alert severity="error">{cancelMutation.errorMessage}</Alert>
          )}
          {actionError && (
            <Alert severity="error" onClose={() => setActionError('')}>
              {actionError}
            </Alert>
          )}
          {feedbackMutation.errorMessage && (
            <Alert severity="error">{feedbackMutation.errorMessage}</Alert>
          )}
          {reportSuccess && (
            <Alert severity="success" onClose={() => setReportSuccess('')}>
              {reportSuccess}
            </Alert>
          )}
          {feedbackSuccess && (
            <Alert severity="success" onClose={() => setFeedbackSuccess('')}>
              {feedbackSuccess}
            </Alert>
          )}

          <Tabs
            value={statusKey}
            onChange={(_, v) => setStatusKey(v)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
            variant="scrollable"
            scrollButtons="auto"
          >
            {STATUS_FILTERS.map((t) => (
              <Tab key={t.key} value={t.key} label={t.label} />
            ))}
          </Tabs>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : isError ? (
            <Alert severity="error">Không tải được danh sách lịch hẹn. Vui lòng thử lại.</Alert>
          ) : visibleItems.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography color="text.secondary" mb={2}>
                {items.length === 0
                  ? 'Bạn chưa có lịch hẹn nào.'
                  : 'Không có lịch hẹn nào trong mục này.'}
              </Typography>
              {items.length === 0 && (
                <Button variant="contained" onClick={() => navigate('/development/mentorship')}>
                  Tìm cố vấn
                </Button>
              )}
            </Box>
          ) : (
            <Stack spacing={2}>{visibleItems.map(renderItem)}</Stack>
          )}
        </Stack>
      </ProfileLayout>

      <Dialog open={Boolean(reportTarget)} onClose={closeReportDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Báo cáo sự cố</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Mô tả vấn đề bạn gặp phải trong buổi mentoring này. Đội quản trị sẽ xem xét và xử lý.
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
            helperText={isOtherReason ? 'Bắt buộc nhập tối thiểu 10 ký tự khi chọn "Khác".' : undefined}
            placeholder="Mô tả chi tiết sự việc..."
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

      {/* Feedback dialog */}
      <Dialog open={Boolean(feedbackTarget)} onClose={closeFeedbackDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Đánh giá buổi cố vấn</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Chia sẻ trải nghiệm của bạn để giúp các mentee khác lựa chọn cố vấn phù hợp.
          </Typography>
          <Typography variant="subtitle2" mb={1}>
            Đánh giá sao
          </Typography>
          <Stack direction="row" spacing={0.5} mb={2}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Button key={star} onClick={() => setFeedbackRating(star)} sx={{ minWidth: 0, p: 0.5 }}>
                <StarIcon
                  sx={{ color: star <= feedbackRating ? 'warning.main' : 'action.disabled', fontSize: 32 }}
                />
              </Button>
            ))}
          </Stack>
          <TextField
            label="Nhận xét (tùy chọn)"
            value={feedbackComment}
            onChange={(e) => setFeedbackComment(e.target.value)}
            fullWidth
            multiline
            minRows={3}
            sx={{ mb: 1 }}
            placeholder="Chia sẻ cảm nhận về buổi cố vấn..."
          />
          <FormControlLabel
            control={
              <Switch checked={feedbackPublic} onChange={(e) => setFeedbackPublic(e.target.checked)} />
            }
            label="Hiển thị công khai trên hồ sơ cố vấn"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeFeedbackDialog} color="inherit">
            Hủy
          </Button>
          <Button onClick={handleConfirmFeedback} variant="contained" disabled={feedbackMutation.isPending}>
            Gửi đánh giá
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(rescheduleTarget)} onClose={closeRescheduleDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Đề xuất đổi lịch</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Để đổi sang khung giờ khác, hệ thống sẽ hủy buổi hiện tại và chuyển bạn đến trang đặt lịch
            mới với cùng cố vấn.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRescheduleDialog} color="inherit">
            Quay lại
          </Button>
          <Button onClick={handleConfirmReschedule} variant="contained" disabled={cancelMutation.isPending}>
            Hủy và đặt lại
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(cancelTarget)} onClose={closeCancelDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Hủy lịch hẹn</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Bạn có chắc chắn muốn hủy lịch hẹn này không? Lý do hủy sẽ được gửi đến cố vấn.
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
          <Button onClick={handleConfirmCancel} color="error" variant="contained" disabled={cancelMutation.isPending}>
            Xác nhận hủy
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(postponeTarget)} onClose={closePostponeDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Đề nghị dời lịch</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Đề xuất một khung giờ mới cho buổi hẹn. Người được cố vấn sẽ nhận thông báo để đồng ý dời
            lịch hoặc từ chối. Buổi hẹn vẫn được giữ cho tới khi họ phản hồi.
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

      <Dialog open={Boolean(mentorCancelTarget)} onClose={closeMentorCancelDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Hủy lịch hẹn</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Lý do hủy sẽ được thông báo đến mentee.
          </Typography>
          <TextField
            label="Lý do hủy (tùy chọn)"
            value={mentorCancelReason}
            onChange={(e) => setMentorCancelReason(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            placeholder="Ví dụ: Bận công việc đột xuất..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeMentorCancelDialog} color="inherit">
            Quay lại
          </Button>
          <Button onClick={handleConfirmMentorCancel} color="error" variant="contained" disabled={mentorCancelPending}>
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

export default MentorshipMyBookingsPage;
