import { useTranslation } from 'react-i18next';
import {
  alpha,
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
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import dayjs from 'dayjs';

const JOIN_EARLY_MINUTES = 15;

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

const softChipSx = (colorKey = 'primary') => (theme) => {
  const palette = theme.palette[colorKey]?.main ? theme.palette[colorKey] : theme.palette.primary;
  return {
    bgcolor: alpha(palette.main, theme.palette.mode === 'dark' ? 0.16 : 0.08),
    color: palette.main,
    borderColor: alpha(palette.main, theme.palette.mode === 'dark' ? 0.36 : 0.24),
    fontWeight: 700,
  };
};

const warningPanelSx = (theme) => ({
  bgcolor: alpha(theme.palette.warning.main, theme.palette.mode === 'dark' ? 0.14 : 0.08),
  borderColor: alpha(theme.palette.warning.main, theme.palette.mode === 'dark' ? 0.46 : 0.34),
});

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
  onSetMeetingLink,
  mentorHasDefaultLink = false,
}) => {
  const { t } = useTranslation(['mentorship']);

  const getStatusLabel = (status) => {
    const map = {
      PENDING: t('mentorship:status_pending'),
      CONFIRMED: t('mentorship:status_confirmed'),
      IN_PROGRESS: t('mentorship:status_in_progress'),
      COMPLETED: t('mentorship:status_completed'),
      EXPIRED: t('mentorship:status_expired'),
      CANCELLED: t('mentorship:status_cancelled'),
      CANCELLED_BY_MENTEE: t('mentorship:status_cancelled'),
      CANCELLED_BY_MENTOR: t('mentorship:status_cancelled_by_mentor'),
      RESCHEDULE_PROPOSED: t('mentorship:status_reschedule_proposed'),
      REJECTED: t('mentorship:status_rejected'),
      REPORTED: t('mentorship:status_reported'),
    };
    return map[status] ?? status;
  };

  const getSessionTypeLabel = (sessionType) => {
    const map = {
      CAREER: t('mentorship:session_type_label_career'),
      ACADEMIC: t('mentorship:session_type_label_academic'),
      SOFT_SKILLS: t('mentorship:session_type_label_soft_skills'),
    };
    return map[sessionType] ?? sessionType;
  };

  const range = formatRange(session.startTime, session.endTime);
  const proposedRange = formatRange(session.proposedStartTime, session.proposedEndTime);
  const terminalStatuses = ['CANCELLED', 'CANCELLED_BY_MENTEE', 'CANCELLED_BY_MENTOR', 'COMPLETED', 'EXPIRED', 'REJECTED'];
  const isRescheduleProposed = session.status === 'RESCHEDULE_PROPOSED';
  // Hide cancel while a reschedule proposal is pending — mentee responds via accept/reject instead.
  const canCancel = onCancel && !terminalStatuses.includes(session.status) && !isRescheduleProposed;
  // Report only for sessions that happened (COMPLETED) or no-showed (EXPIRED), and not already reported.
  const canReport = onReport && ['COMPLETED', 'EXPIRED'].includes(session.status) && !session.reported;
  const canFeedback = onFeedback && session.status === 'COMPLETED' && !session.hasFeedback;
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
  const canSetMeetingLink =
    onSetMeetingLink && view === 'mentor' && ['CONFIRMED', 'IN_PROGRESS'].includes(session.status);
  const missingMeetingLink =
    view === 'mentor' &&
    ['CONFIRMED', 'IN_PROGRESS'].includes(session.status) &&
    !session.meetingLink &&
    !mentorHasDefaultLink;

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
              variant="outlined"
              label={getStatusLabel(session.status)}
              sx={softChipSx(STATUS_COLOR[session.status] ?? 'primary')}
            />
            {session.sessionType && (
              <Chip
                size="small"
                variant="outlined"
                label={getSessionTypeLabel(session.sessionType)}
                sx={softChipSx('primary')}
              />
            )}
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {t('mentorship:booked_at')} {dayjs(session.createdAt).format('DD/MM/YYYY HH:mm')}
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
              {t('mentorship:introduction_label')}
            </Typography>
            <Typography variant="body2">{session.introduction}</Typography>
          </Box>
        )}

        {session.description && (
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              {t('mentorship:purpose_label')}
            </Typography>
            <Typography variant="body2">{session.description}</Typography>
          </Box>
        )}

        {session.cancelReason && ['CANCELLED', 'CANCELLED_BY_MENTEE', 'CANCELLED_BY_MENTOR'].includes(session.status) && (
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              {t('mentorship:cancel_reason_label')}
            </Typography>
            <Typography variant="body2" color="error.main">{session.cancelReason}</Typography>
          </Box>
        )}

        {isRescheduleProposed && (
          <Box sx={(theme) => ({ p: 1.5, borderRadius: 1, border: '1px dashed', ...warningPanelSx(theme) })}>
            <Typography variant="caption" color="text.secondary" display="block">
              {view === 'mentee' ? t('mentorship:advisor_proposed_reschedule') : t('mentorship:you_proposed_reschedule')}
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
              {t('mentorship:cv_attached')}
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
              {t('mentorship:meeting_link')}
            </Typography>
          </Stack>
        )}

        {missingMeetingLink && (
          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
            sx={(theme) => ({
              p: 1,
              borderRadius: 1,
              border: '1px dashed',
              ...warningPanelSx(theme),
            })}
          >
            <WarningAmberOutlinedIcon fontSize="small" color="warning" />
            <Typography variant="body2" color="warning.dark">
              {t('mentorship:missing_meeting_link_warning')}
            </Typography>
          </Stack>
        )}

        {(canJoin || canSetMeetingLink || canCancel || canReport || canFeedback || canReschedule || canPostpone || canRespondReschedule) && (
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
                {t('mentorship:join')}
              </Button>
            )}
            {canSetMeetingLink && (
              <Button
                size="small"
                variant="outlined"
                color={session.meetingLink ? 'inherit' : 'warning'}
                startIcon={<LinkOutlinedIcon />}
                onClick={() => onSetMeetingLink(session)}
              >
                {session.meetingLink ? t('mentorship:edit_meeting_link') : t('mentorship:add_meeting_link')}
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
                  {t('mentorship:accept_reschedule')}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  disabled={rescheduleResponsePending}
                  onClick={() => onRescheduleResponse(session, false)}
                >
                  {t('mentorship:reject_reschedule')}
                </Button>
              </>
            )}
            {canReschedule && (
              <Button size="small" variant="outlined" onClick={() => onReschedule(session)}>
                {t('mentorship:propose_reschedule')}
              </Button>
            )}
            {canPostpone && (
              <Button size="small" variant="outlined" onClick={() => onPostpone(session)}>
                {t('mentorship:propose_postpone')}
              </Button>
            )}
            {canFeedback && (
              <Button size="small" variant="contained" onClick={() => onFeedback(session)}>
                {t('mentorship:give_feedback')}
              </Button>
            )}
            {canReport && (
              <Button
                size="small"
                variant="outlined"
                color="warning"
                onClick={() => onReport(session)}
              >
                {t('mentorship:report_incident')}
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
                {t('mentorship:cancel_appointment')}
              </Button>
            )}
          </Stack>
        )}
      </Stack>
    </Card>
  );
};

export default MentorshipBookingItem;
