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
import { resolveMediaUrl } from '../../utils/imageUtils';
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
import {
  getMenteeProfileTabs,
  getMentorProfileTabs,
  getMentorshipBookingStatusFilters,
} from '../../constants/mentorshipNav';
import { validateMeetingLink, meetingLinkPasswordWarning } from '../../utils/meetingLink';
import { formatMentorHeadline } from '../../utils/profileRoleUtils';
import { useTranslation } from 'react-i18next';

const DEFAULT_COVER =
  'https://info.cognician.com/hubfs/220201%20mentorship-%20desktop.png';

const PAGE_SIZE = 50;

const MentorshipMyBookingsPage = () => {
  const { t } = useTranslation('mentorship');
  const statusFilters = useMemo(() => getMentorshipBookingStatusFilters(t), [t]);
  const navigate = useOrgNavigate();
  const access = useMentorshipAccessState();

  const isMentorProfile = access.hasMentorProfile;
  const canUseMentorSessions = access.isMentorApproved;

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
    const mentorItems = canUseMentorSessions
      ? (mentorSessionsQuery.data?.items ?? []).map((s) => ({ ...s, _role: 'mentor' }))
      : [];
    return [...menteeItems, ...mentorItems].sort(
      (a, b) => dayjs(b.startTime).valueOf() - dayjs(a.startTime).valueOf(),
    );
  }, [menteeSessionsQuery.data, mentorSessionsQuery.data, canUseMentorSessions]);

  const visibleItems = useMemo(() => {
    const matcher = statusFilters.find((item) => item.key === statusKey)?.match ?? (() => true);
    return items.filter(matcher);
  }, [statusFilters, items, statusKey]);

  const isLoading =
    access.isLoading ||
    (isMentorProfile ? mentorProfileQuery.isLoading : menteeProfileQuery.isLoading) ||
    menteeSessionsQuery.isLoading ||
    (canUseMentorSessions && mentorSessionsQuery.isLoading);
  // Only treat as a hard error when we have nothing to show AND every source we
  // depend on failed. A mentor without a mentee profile (or vice versa) gets a
  // 403/404 on one source — that must not blank out the whole page.
  const menteeFailed = menteeSessionsQuery.isError;
  const mentorFailed = canUseMentorSessions ? mentorSessionsQuery.isError : !isMentorProfile;
  const isError = items.length === 0 && menteeFailed && mentorFailed;

  const refetchActive = () => {
    menteeSessionsQuery.refetch?.();
    if (canUseMentorSessions) mentorSessionsQuery.refetch?.();
  };

  const handleJoin = async (session) => {
    setActionError('');
    try {
      await joinMutation.joinSession({ sessionId: session.id, asMentor: session._role === 'mentor' });
      refetchActive();
    } catch (err) {
      setActionError(err?.response?.data?.message ?? t('dash_join_error'));
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
      setReportSuccess(t('report_success_msg'));
      closeReportDialog();
      refetchActive();
    } catch (err) {
      setActionError(err?.response?.data?.message ?? t('report_error_send'));
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
      setFeedbackSuccess(t('feedback_success_msg'));
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
      setActionError(err?.response?.data?.message ?? t('reschedule_respond_error'));
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
        cancelReason: t('reschedule_cancel_reason'),
      });
      closeRescheduleDialog();
      if (mentorId) {
        navigate(`/mentorship/mentors/${mentorId}/book`);
      } else {
        navigate('/mentorship');
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
      setPostponeError(t('postpone_error_pick_all'));
      return;
    }
    const proposedStart = postponeDate
      .hour(postponeStart.hour()).minute(postponeStart.minute()).second(0).millisecond(0);
    const proposedEnd = postponeDate
      .hour(postponeEnd.hour()).minute(postponeEnd.minute()).second(0).millisecond(0);
    if (!proposedEnd.isAfter(proposedStart)) {
      setPostponeError(t('postpone_error_end_before_start'));
      return;
    }
    if (!proposedStart.isAfter(dayjs())) {
      setPostponeError(t('postpone_error_in_past'));
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
      setPostponeError(err?.response?.data?.message ?? t('postpone_error_send'));
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
      setLinkError(t('link_error_empty'));
      return;
    }
    const linkValidationError = validateMeetingLink(value, { optional: false });
    if (linkValidationError) {
      setLinkError(linkValidationError);
      return;
    }
    setLinkPending(true);
    setLinkError(null);
    try {
      await updateMentorSessionMeetingLink(linkTarget.id, value);
      refetchActive();
      closeLinkDialog();
    } catch (err) {
      setLinkError(err?.response?.data?.message ?? t('link_error_update'));
    } finally {
      setLinkPending(false);
    }
  };

  const profile = isMentorProfile ? mentorProfileQuery.data : menteeProfileQuery.data;
  const user = {
    name: profile?.fullName ?? t('my_account_fallback'),
    role: isMentorProfile
      ? formatMentorHeadline({ jobTitle: profile?.currentJobTitle, company: profile?.currentCompany, t })
      : t('mentee'),
    avatar: resolveMediaUrl(profile?.avatarUrl ?? ''),
    cover: resolveMediaUrl(profile?.coverUrl) || DEFAULT_COVER,
  };

  const tabs = isMentorProfile ? getMentorProfileTabs(t) : getMenteeProfileTabs(t);

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
    <Page title={t('my_bookings')}>
      <ProfileLayout
        user={user}
        cover={user.cover}
        tabs={tabs}
        onNavigate={navigate}
        mode={isMentorProfile ? 'mentor' : 'menteeOwn'}
      >
        <Stack spacing={3}>
          <Box>
            <Typography variant="h2" fontWeight={800} color="primary.main" mb={1}>
              {t('bookings_heading')}
            </Typography>
            <Typography color="text.secondary">
              {isMentorProfile
                ? t('bookings_desc_mentor')
                : t('bookings_desc_mentee')}
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
            {statusFilters.map((item) => (
              <Tab key={item.key} value={item.key} label={item.label} />
            ))}
          </Tabs>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : isError ? (
            <Alert severity="error">{t('bookings_load_error')}</Alert>
          ) : visibleItems.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography color="text.secondary" mb={2}>
                {items.length === 0
                  ? t('bookings_empty_all')
                  : t('bookings_empty_filter')}
              </Typography>
              {items.length === 0 && (
                <Button variant="contained" onClick={() => navigate('/mentorship')}>
                  {t('bookings_find_mentor_btn')}
                </Button>
              )}
            </Box>
          ) : (
            <Stack spacing={2}>{visibleItems.map(renderItem)}</Stack>
          )}
        </Stack>
      </ProfileLayout>

      <Dialog open={Boolean(reportTarget)} onClose={closeReportDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{t('report_dialog_title')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {t('report_dialog_desc_mentee')}
          </Typography>
          <TextField
            select
            label={t('report_label_reason')}
            value={reportCategory}
            onChange={(e) => setReportCategory(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          >
            {reasonsForStatus(reportTarget?.status, t).map((r) => (
              <MenuItem key={r.value} value={r.value}>
                {r.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label={isOtherReason ? t('report_label_desc_required') : t('report_label_desc_optional')}
            value={reportDescription}
            onChange={(e) => setReportDescription(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            required={isOtherReason}
            error={reportDescTooShort}
            helperText={isOtherReason ? t('report_desc_helper') : undefined}
            placeholder={t('report_desc_placeholder')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeReportDialog} color="inherit">
            {t('dialog_cancel')}
          </Button>
          <Button
            onClick={handleConfirmReport}
            color="warning"
            variant="contained"
            disabled={reportPending || reportInvalid}
          >
            {t('report_submit')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback dialog */}
      <Dialog open={Boolean(feedbackTarget)} onClose={closeFeedbackDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{t('feedback_dialog_title')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {t('feedback_dialog_desc')}
          </Typography>
          <Typography variant="subtitle2" mb={1}>
            {t('feedback_star_label')}
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
            label={t('feedback_comment_label')}
            value={feedbackComment}
            onChange={(e) => setFeedbackComment(e.target.value)}
            fullWidth
            multiline
            minRows={3}
            sx={{ mb: 1 }}
            placeholder={t('feedback_comment_placeholder')}
          />
          <FormControlLabel
            control={
              <Switch checked={feedbackPublic} onChange={(e) => setFeedbackPublic(e.target.checked)} />
            }
            label={t('feedback_public_label')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeFeedbackDialog} color="inherit">
            {t('dialog_cancel')}
          </Button>
          <Button onClick={handleConfirmFeedback} variant="contained" disabled={feedbackMutation.isPending}>
            {t('feedback_submit')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(rescheduleTarget)} onClose={closeRescheduleDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{t('reschedule_dialog_title')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {t('reschedule_dialog_desc')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRescheduleDialog} color="inherit">
            {t('dialog_back')}
          </Button>
          <Button onClick={handleConfirmReschedule} variant="contained" disabled={cancelMutation.isPending}>
            {t('reschedule_confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(cancelTarget)} onClose={closeCancelDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{t('cancel_dialog_title')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {t('cancel_dialog_desc_mentee')}
          </Typography>
          <TextField
            label={t('cancel_label_reason')}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            placeholder={t('cancel_reason_placeholder')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCancelDialog} color="inherit">
            {t('dialog_back')}
          </Button>
          <Button onClick={handleConfirmCancel} color="error" variant="contained" disabled={cancelMutation.isPending}>
            {t('cancel_confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(postponeTarget)} onClose={closePostponeDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{t('postpone_dialog_title')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {t('postpone_dialog_desc')}
          </Typography>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack spacing={2} mt={1}>
              <DatePicker
                label={t('postpone_label_date')}
                value={postponeDate}
                onChange={setPostponeDate}
                minDate={dayjs()}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
              <Stack direction="row" spacing={1}>
                <TimePicker
                  label={t('postpone_label_start')}
                  value={postponeStart}
                  onChange={setPostponeStart}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
                <TimePicker
                  label={t('postpone_label_end')}
                  value={postponeEnd}
                  onChange={setPostponeEnd}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Stack>
              <TextField
                label={t('postpone_label_reason')}
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
            {t('dialog_close')}
          </Button>
          <Button onClick={handleConfirmPostpone} variant="contained" disabled={postponePending}>
            {postponePending ? t('dialog_sending') : t('postpone_submit')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(mentorCancelTarget)} onClose={closeMentorCancelDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{t('cancel_dialog_title')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {t('cancel_dialog_desc_mentor')}
          </Typography>
          <TextField
            label={t('cancel_label_reason')}
            value={mentorCancelReason}
            onChange={(e) => setMentorCancelReason(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            placeholder={t('cancel_reason_placeholder')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeMentorCancelDialog} color="inherit">
            {t('dialog_back')}
          </Button>
          <Button onClick={handleConfirmMentorCancel} color="error" variant="contained" disabled={mentorCancelPending}>
            {t('cancel_confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(linkTarget)} onClose={closeLinkDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{linkTarget?.meetingLink ? t('link_dialog_title_edit') : t('link_dialog_title_add')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {t('link_dialog_desc')}
          </Typography>
          <TextField
            label={t('link_label')}
            value={linkValue}
            onChange={(e) => setLinkValue(e.target.value)}
            fullWidth
            placeholder="https://meet.google.com/..."
            helperText={t('link_helper_text')}
            autoFocus
          />
          {meetingLinkPasswordWarning(linkValue) && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {meetingLinkPasswordWarning(linkValue)}
            </Alert>
          )}
          {linkError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {linkError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeLinkDialog} color="inherit">
            {t('dialog_cancel')}
          </Button>
          <Button onClick={handleConfirmLink} variant="contained" disabled={linkPending}>
            {linkPending ? t('dialog_saving') : t('link_save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Page>
  );
};

export default MentorshipMyBookingsPage;
