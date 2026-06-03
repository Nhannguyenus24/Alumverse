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
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import dayjs from 'dayjs';

const SESSION_TYPE_LABEL = {
  CAREER: 'Định hướng nghề nghiệp',
  ACADEMIC: 'Học tập / Học bổng',
  SOFT_SKILLS: 'Kỹ năng mềm',
};

const STATUS_COLOR = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  COMPLETED: 'success',
  CANCELLED: 'default',
  CANCELLED_BY_MENTEE: 'default',
  CANCELLED_BY_MENTOR: 'warning',
  REJECTED: 'error',
};

const STATUS_LABEL = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã hủy',
  CANCELLED_BY_MENTEE: 'Đã hủy',
  CANCELLED_BY_MENTOR: 'Cố vấn đã hủy',
  REJECTED: 'Bị từ chối',
};

const formatRange = (start, end) => {
  const s = dayjs(start);
  const e = dayjs(end);
  if (!s.isValid() || !e.isValid()) return null;
  return `${s.format('dddd, DD/MM/YYYY')} • ${s.format('HH:mm')} – ${e.format('HH:mm')}`;
};

const MentorshipBookingItem = ({ session, onCancel, cancelDisabled = false, view = 'mentee' }) => {
  const range = formatRange(session.startTime, session.endTime);
  const canCancel =
    onCancel &&
    !['CANCELLED', 'CANCELLED_BY_MENTEE', 'CANCELLED_BY_MENTOR', 'COMPLETED', 'REJECTED'].includes(session.status);

  // 'mentee' view → show mentor info; 'mentor' view → show mentee info
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

        {canCancel && (
          <Stack direction="row" justifyContent="flex-end">
            <Button
              size="small"
              variant="outlined"
              color="error"
              disabled={cancelDisabled}
              onClick={() => onCancel(session)}
            >
              Hủy lịch
            </Button>
          </Stack>
        )}
      </Stack>
    </Card>
  );
};

export default MentorshipBookingItem;
