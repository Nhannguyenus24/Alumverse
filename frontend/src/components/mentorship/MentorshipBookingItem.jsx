import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import dayjs from 'dayjs';

const JOIN_EARLY_MINUTES = 15;

const SESSION_TYPE_LABEL = {
  CAREER: 'Định hướng nghề nghiệp',
  ACADEMIC: 'Học tập / Học bổng',
  SOFT_SKILLS: 'Kỹ năng mềm',
};

const STATUS_COLOR = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  IN_PROGRESS: 'primary',
  COMPLETED: 'success',
  EXPIRED: 'default',
  CANCELLED: 'default',
  CANCELLED_BY_MENTEE: 'default',
  CANCELLED_BY_MENTOR: 'warning',
  RESCHEDULE_PROPOSED: 'warning',
  REJECTED: 'error',
  REPORTED: 'warning',
};

const STATUS_LABEL = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang diễn ra',
  COMPLETED: 'Đã hoàn thành',
  EXPIRED: 'Không diễn ra',
  CANCELLED: 'Đã hủy',
  CANCELLED_BY_MENTEE: 'Đã hủy',
  CANCELLED_BY_MENTOR: 'Cố vấn đã hủy',
  RESCHEDULE_PROPOSED: 'Đề nghị dời lịch',
  REJECTED: 'Bị từ chối',
  REPORTED: 'Đang xử lý',
};

const formatRange = (start, end) => {
  const s = dayjs(start);
  const e = dayjs(end);
  if (!s.isValid() || !e.isValid()) return null;
  return `${s.format('dddd, DD/MM/YYYY')} • ${s.format('HH:mm')} – ${e.format('HH:mm')}`;
};

const MentorshipBookingItem = ({
  session,
  onCancel,
  cancelDisabled = false,
  view = 'mentee',
  onReport,
  onFeedback,
  onReschedule,
  onPostpone,
  onRescheduleResponse,
  rescheduleResponsePending = false,
  onJoin,
  joinPending = false,
}) => {
  const range = formatRange(session.startTime, session.endTime);
  const proposedRange = formatRange(session.proposedStartTime, session.proposedEndTime);
  const terminalStatuses = ['CANCELLED', 'CANCELLED_BY_MENTEE', 'CANCELLED_BY_MENTOR', 'COMPLETED', 'EXPIRED', 'REJECTED'];
  const isRescheduleProposed = session.status === 'RESCHEDULE_PROPOSED';
  // Hide cancel while a reschedule proposal is pending — mentee responds via accept/reject instead.
  const canCancel = onCancel && !terminalStatuses.includes(session.status) && !isRescheduleProposed;
  // Report only for sessions that happened (COMPLETED) or no-showed (EXPIRED), and not already reported.
  const canReport = onReport && ['COMPLETED', 'EXPIRED'].includes(session.status) && !session.reported;
  const canFeedback = onFeedback && session.status === 'COMPLETED';
  const canReschedule = onReschedule && session.status === 'CONFIRMED';
  const canPostpone = onPostpone && session.status === 'CONFIRMED';
  const canRespondReschedule = onRescheduleResponse && view === 'mentee' && isRescheduleProposed;

  const now = dayjs();
  const start = session.startTime ? dayjs(session.startTime) : null;
  const end = session.endTime ? dayjs(session.endTime) : null;
  const inJoinWindow =
    start?.isValid() &&
    end?.isValid() &&
    !now.isBefore(start.subtract(JOIN_EARLY_MINUTES, 'minute')) &&
    !now.isAfter(end);
  const canJoin =
    onJoin && ['CONFIRMED', 'IN_PROGRESS'].includes(session.status) && inJoinWindow;

  const counterpartName =
    view === 'mentor'
      ? session.menteeName ?? (session.menteeMemberId ? `Mentee #${session.menteeMemberId}` : `Booking #${session.id}`)
      : session.mentorName ?? (session.mentorMemberId ? `Mentor #${session.mentorMemberId}` : `Booking #${session.id}`);
  const counterpartAvatar =
    view === 'mentor' ? session.menteeAvatarUrl : session.mentorAvatarUrl;

  return (
    <Card sx={{ p: 2.5, border: '1px solid', borderColor: 'divider' }} elevation={0}>
      <Stack spacing={1.5}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <Avatar src={counterpartAvatar} sx={{ width: 36, height: 36 }}>
              {counterpartName?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Typography fontWeight={700}>{counterpartName}</Typography>
            <Chip
              size="small"
              color={STATUS_COLOR[session.status] ?? 'default'}
              label={STATUS_LABEL[session.status] ?? session.status}
            />
            {session.sessionType && (
              <Chip
                size="small"
                variant="outlined"
                label={SESSION_TYPE_LABEL[session.sessionType] ?? session.sessionType}
              />
            )}
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Đặt lúc {dayjs(session.createdAt).format('DD/MM/YYYY HH:mm')}
          </Typography>
        </Stack>

        {range && (
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Stack direction="row" spacing={0.5} alignItems="center">
              <EventOutlinedIcon fontSize="small" color="action" />
              <Typography variant="body2">{range}</Typography>
            </Stack>
          </Stack>
        )}

        {session.introduction && (
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Giới thiệu
            </Typography>
            <Typography variant="body2">{session.introduction}</Typography>
          </Box>
        )}

        {session.description && (
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Mục đích
            </Typography>
            <Typography variant="body2">{session.description}</Typography>
          </Box>
        )}

        {session.cancelReason && ['CANCELLED', 'CANCELLED_BY_MENTEE', 'CANCELLED_BY_MENTOR'].includes(session.status) && (
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Lý do hủy
            </Typography>
            <Typography variant="body2" color="error.main">{session.cancelReason}</Typography>
          </Box>
        )}

        {isRescheduleProposed && (
          <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: 'warning.lighter', border: '1px dashed', borderColor: 'warning.main' }}>
            <Typography variant="caption" color="text.secondary" display="block">
              {view === 'mentee' ? 'Cố vấn đề xuất dời sang' : 'Bạn đã đề xuất dời sang'}
            </Typography>
            {proposedRange && (
              <Typography variant="body2" fontWeight={600} color="warning.dark">
                {proposedRange}
              </Typography>
            )}
            {session.cancelReason && (
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                {session.cancelReason}
              </Typography>
            )}
          </Box>
        )}

        {session.cvUrl && (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <DescriptionOutlinedIcon fontSize="small" color="action" />
            <Typography
              variant="body2"
              component="a"
              href={session.cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              CV đính kèm
            </Typography>
          </Stack>
        )}

        {session.meetingLink && (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <LinkOutlinedIcon fontSize="small" color="action" />
            <Typography
              variant="body2"
              component="a"
              href={session.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              Link cuộc họp
            </Typography>
          </Stack>
        )}

        {(canJoin || canCancel || canReport || canFeedback || canReschedule || canPostpone || canRespondReschedule) && (
          <Stack direction="row" justifyContent="flex-end" spacing={1} flexWrap="wrap" useFlexGap>
            {canJoin && (
              <Button
                size="small"
                variant="contained"
                color="primary"
                startIcon={<VideocamOutlinedIcon />}
                disabled={joinPending}
                onClick={() => onJoin(session)}
              >
                Tham gia
              </Button>
            )}
            {canRespondReschedule && (
              <>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  disabled={rescheduleResponsePending}
                  onClick={() => onRescheduleResponse(session, true)}
                >
                  Đồng ý dời lịch
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  disabled={rescheduleResponsePending}
                  onClick={() => onRescheduleResponse(session, false)}
                >
                  Từ chối
                </Button>
              </>
            )}
            {canReschedule && (
              <Button size="small" variant="outlined" onClick={() => onReschedule(session)}>
                Đề xuất đổi lịch
              </Button>
            )}
            {canPostpone && (
              <Button size="small" variant="outlined" onClick={() => onPostpone(session)}>
                Đề nghị dời lịch
              </Button>
            )}
            {canFeedback && (
              <Button size="small" variant="contained" onClick={() => onFeedback(session)}>
                Đánh giá buổi cố vấn
              </Button>
            )}
            {canReport && (
              <Button
                size="small"
                variant="outlined"
                color="warning"
                onClick={() => onReport(session)}
              >
                Báo cáo sự cố
              </Button>
            )}
            {canCancel && (
              <Button
                size="small"
                variant="outlined"
                color="error"
                disabled={cancelDisabled}
                onClick={() => onCancel(session)}
              >
                Hủy lịch
              </Button>
            )}
          </Stack>
        )}
      </Stack>
    </Card>
  );
};

export default MentorshipBookingItem;
