import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StarIcon from '@mui/icons-material/Star';

import Page from '../../components/Page';
import MentorshipBookingItem from '../../components/mentorship/MentorshipBookingItem';
import { useMyMenteeSessions } from '../../hooks/mentorship/useMyMenteeSessions';
import { useCancelMenteeSession } from '../../hooks/mentorship/useCancelMenteeSession';
import { useSubmitSessionFeedback } from '../../hooks/mentorship/useSubmitSessionFeedback';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { reportSession, respondReschedule } from '../../utils/api';

const ACTIVE_STATUSES = new Set(['PENDING', 'CONFIRMED', 'RESCHEDULE_PROPOSED']);
const CANCELLED_STATUSES = new Set(['CANCELLED', 'CANCELLED_BY_MENTEE', 'CANCELLED_BY_MENTOR', 'REJECTED']);

const TAB_FILTERS = [
  { key: 'all', label: 'Tất cả', match: () => true },
  { key: 'upcoming', label: 'Sắp tới', match: (s) => ACTIVE_STATUSES.has(s.status) },
  { key: 'completed', label: 'Đã hoàn thành', match: (s) => s.status === 'COMPLETED' },
  { key: 'cancelled', label: 'Đã hủy / từ chối', match: (s) => CANCELLED_STATUSES.has(s.status) },
];

const PAGE_SIZE = 10;

const MentorshipMyBookingsPage = () => {
  const navigate = useOrgNavigate();
  const [tabKey, setTabKey] = useState('all');
  const [page, setPage] = useState(0);
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

  const sessionsQuery = useMyMenteeSessions({ page, limit: PAGE_SIZE });
  const cancelMutation = useCancelMenteeSession();
  const feedbackMutation = useSubmitSessionFeedback();

  const paginated = sessionsQuery.data;
  const items = useMemo(() => paginated?.items ?? [], [paginated?.items]);

  const visibleItems = useMemo(() => {
    const matcher = TAB_FILTERS.find((t) => t.key === tabKey)?.match ?? (() => true);
    return items.filter(matcher);
  }, [items, tabKey]);

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
      /* error surfaced via cancelMutation.errorMessage */
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

  const handleConfirmReport = async () => {
    if (!reportTarget || !reportCategory.trim()) return;
    setReportPending(true);
    try {
      await reportSession(reportTarget.id, {
        reasonCategory: reportCategory.trim(),
        description: reportDescription.trim() || undefined,
      });
      setReportSuccess('Đã gửi báo cáo. Đội quản trị sẽ xem xét và phản hồi.');
      closeReportDialog();
    } catch {
      /* silent fail — improve later */
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
      sessionsQuery.refetch?.();
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
      sessionsQuery.refetch?.();
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

  return (
    <Page title="Lịch hẹn của tôi">
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/development/mentorship')}
          sx={{ mb: 2, textTransform: 'none' }}
          color="inherit"
        >
          Về trang Cố vấn
        </Button>

        <Typography variant="h2" fontWeight={800} color="primary.main" mb={1}>
          LỊCH HẸN CỦA TÔI
        </Typography>
        <Typography color="text.secondary" mb={4}>
          Quản lý các buổi tư vấn bạn đã đặt với mentor.
        </Typography>

        {cancelMutation.errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {cancelMutation.errorMessage}
          </Alert>
        )}

        {actionError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError('')}>
            {actionError}
          </Alert>
        )}

        {feedbackMutation.errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {feedbackMutation.errorMessage}
          </Alert>
        )}

        {reportSuccess && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setReportSuccess('')}>
            {reportSuccess}
          </Alert>
        )}

        {feedbackSuccess && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setFeedbackSuccess('')}>
            {feedbackSuccess}
          </Alert>
        )}

        <Tabs
          value={tabKey}
          onChange={(_, v) => setTabKey(v)}
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
          variant="scrollable"
          scrollButtons="auto"
        >
          {TAB_FILTERS.map((t) => (
            <Tab key={t.key} value={t.key} label={t.label} />
          ))}
        </Tabs>

        {sessionsQuery.isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : sessionsQuery.isError ? (
          <Alert severity="error">Không tải được danh sách lịch hẹn. Vui lòng thử lại.</Alert>
        ) : visibleItems.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography color="text.secondary" mb={2}>
              {items.length === 0
                ? 'Bạn chưa đặt lịch hẹn nào với mentor.'
                : 'Không có lịch hẹn nào trong mục này.'}
            </Typography>
            {items.length === 0 && (
              <Button
                variant="contained"
                onClick={() => navigate('/development/mentorship')}
              >
                Tìm mentor
              </Button>
            )}
          </Box>
        ) : (
          <Stack spacing={2}>
            {visibleItems.map((session) => (
              <MentorshipBookingItem
                key={session.id}
                session={session}
                onCancel={openCancelDialog}
                cancelDisabled={cancelMutation.isPending}
                onReport={openReportDialog}
                onFeedback={openFeedbackDialog}
                onReschedule={openRescheduleDialog}
                onRescheduleResponse={handleRescheduleResponse}
                rescheduleResponsePending={rescheduleResponsePending}
              />
            ))}
          </Stack>
        )}

        {paginated && paginated.totalPage > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 4 }}>
            <Button
              variant="outlined"
              disabled={!paginated.hasPrevious}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Trước
            </Button>
            <Typography sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
              {paginated.currentPage + 1} / {paginated.totalPage}
            </Typography>
            <Button
              variant="outlined"
              disabled={!paginated.hasNext}
              onClick={() => setPage((p) => p + 1)}
            >
              Sau
            </Button>
          </Box>
        )}
      </Container>

      {/* Report dialog */}
      <Dialog open={Boolean(reportTarget)} onClose={closeReportDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Báo cáo sự cố</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Mô tả vấn đề bạn gặp phải trong buổi mentoring này. Đội quản trị sẽ xem xét và xử lý.
          </Typography>
          <TextField
            label="Lý do báo cáo *"
            value={reportCategory}
            onChange={(e) => setReportCategory(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
            placeholder="Ví dụ: Không đến đúng giờ, Nội dung không phù hợp..."
          />
          <TextField
            label="Mô tả thêm (tùy chọn)"
            value={reportDescription}
            onChange={(e) => setReportDescription(e.target.value)}
            fullWidth
            multiline
            minRows={2}
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
            disabled={reportPending || !reportCategory.trim()}
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
              <Button
                key={star}
                onClick={() => setFeedbackRating(star)}
                sx={{ minWidth: 0, p: 0.5 }}
              >
                <StarIcon
                  sx={{
                    color: star <= feedbackRating ? 'warning.main' : 'action.disabled',
                    fontSize: 32,
                  }}
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
              <Switch
                checked={feedbackPublic}
                onChange={(e) => setFeedbackPublic(e.target.checked)}
              />
            }
            label="Hiển thị công khai trên hồ sơ cố vấn"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeFeedbackDialog} color="inherit">
            Hủy
          </Button>
          <Button
            onClick={handleConfirmFeedback}
            variant="contained"
            disabled={feedbackMutation.isPending}
          >
            Gửi đánh giá
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reschedule dialog */}
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
          <Button
            onClick={handleConfirmReschedule}
            variant="contained"
            disabled={cancelMutation.isPending}
          >
            Hủy và đặt lại
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel dialog */}
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
          <Button
            onClick={handleConfirmCancel}
            color="error"
            variant="contained"
            disabled={cancelMutation.isPending}
          >
            Xác nhận hủy
          </Button>
        </DialogActions>
      </Dialog>
    </Page>
  );
};

export default MentorshipMyBookingsPage;
