import { useMemo, useState, useCallback, useEffect } from 'react';


import { useSnackbar } from 'notistack';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';


import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useMyMentorSessions } from '../../hooks/mentorship/useMyMentorSessions';
import { useUpdateSessionStatus } from '../../hooks/mentorship/useUpdateSessionStatus';
import { useMyMentorProfile } from '../../hooks/mentorship/useMyMentorProfile';
import { useMyMentorFeedbacks } from '../../hooks/mentorship/useMyMentorFeedbacks';
import { useJoinSession } from '../../hooks/mentorship/useJoinSession';
import { formatDate } from '../../utils/dateFormatter';
import { resolveMediaUrl } from '../../utils/imageUtils';
import { formatRating } from '../../utils/numberFormatter';
import {
  getStaggerDelay,
} from '../../components/animations/ScrollReveal';
import {
  cancelMentorSession,
  postponeMentorSession,
  reportSession,
  updateMentorSessionMeetingLink,
} from '../../utils/api';
import { reasonsForStatus } from '../../components/mentorship/reportReasons';
import { getMentorProfileTabs } from '../../constants/mentorshipNav';
import { useTranslation } from 'react-i18next';

const DEFAULT_COVER =
  'https://info.cognician.com/hubfs/220201%20mentorship-%20desktop.png';

const PAGE_SIZE = 50;

const MentorshipDashboardPage = () => {
  const { t } = useTranslation('mentorship');
  const TOP_TABS = getMentorProfileTabs(t);
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
  const [postponePending, setPostponePending] = useState(false);
  const [linkTarget, setLinkTarget] = useState(null);
  const [linkValue, setLinkValue] = useState('');
  const [linkPending, setLinkPending] = useState(false);

  const { enqueueSnackbar } = useSnackbar();

  const profileQuery = useMyMentorProfile();
  const sessionsQuery = useMyMentorSessions({ page: 0, limit: PAGE_SIZE });
  const feedbacksQuery = useMyMentorFeedbacks(0, 50);
  const updateMutation = useUpdateSessionStatus();
  const joinMutation = useJoinSession();

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

  useEffect(() => {
    if (sessionsQuery.isError) {
      enqueueSnackbar(t('dash_sessions_load_error'), { variant: 'error' });
    }
  }, [sessionsQuery.isError, enqueueSnackbar, t]);

  const stats = useMemo(() => {
    const completed = items.filter((s) => s.status === 'COMPLETED').length;
    return [
      { value: items.length, label: t('dash_stat_bookings') },
      { value: upcomingItems.length, label: t('dash_stat_upcoming') },
      { value: completed, label: t('dash_stat_completed') },
    ];
  }, [items, upcomingItems, t]);

  const callUpdate = useCallback(async (sessionId, status) => {
    try {
      await updateMutation.updateStatus({ sessionId, status });
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || err?.message || t('dash_update_error', 'Update failed'), { variant: 'error' });
    }
  }, [updateMutation, enqueueSnackbar, t]);

  const handleJoin = useCallback(async (session) => {
    try {
      await joinMutation.joinSession({ sessionId: session.id, asMentor: true });
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message ?? t('dash_join_error'), { variant: 'error' });
    }
  }, [joinMutation, enqueueSnackbar, t]);

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
    setPostponeEnd(session.endTime ? dayjs(session.endTime) : null);
  }, []);

  const closePostponeDialog = useCallback(() => {
    setPostponeTarget(null);
    setPostponeReason('');
    setPostponeDate(null);
    setPostponeStart(null);
    setPostponeEnd(null);
    setPostponeEnd(null);
  }, []);

  const handleConfirmPostpone = useCallback(async () => {
    if (!postponeTarget) return;
    if (!postponeDate || !postponeStart || !postponeEnd) {
      enqueueSnackbar(t('postpone_error_pick_all'), { variant: 'error' });
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
      enqueueSnackbar(t('postpone_error_end_before_start'), { variant: 'error' });
      return;
    }
    if (!proposedStart.isAfter(dayjs())) {
      enqueueSnackbar(t('postpone_error_in_past'), { variant: 'error' });
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
      enqueueSnackbar(err?.response?.data?.message ?? t('postpone_error_send'), { variant: 'error' });
    } finally {
      setPostponePending(false);
    }
  }, [postponeTarget, postponeDate, postponeStart, postponeEnd, postponeReason, sessionsQuery, closePostponeDialog, enqueueSnackbar, t]);

  const openLinkDialog = useCallback((session) => {
    setLinkTarget(session);
    setLinkValue(session.meetingLink ?? '');
    setLinkValue(session.meetingLink ?? '');
  }, []);
  const closeLinkDialog = useCallback(() => {
    setLinkTarget(null);
    setLinkValue('');
    setLinkValue('');
  }, []);
  const handleConfirmLink = useCallback(async () => {
    if (!linkTarget) return;
    const value = linkValue.trim();
    if (!value) {
      enqueueSnackbar(t('link_error_empty'), { variant: 'error' });
      return;
    }
    setLinkPending(true);
    try {
      await updateMentorSessionMeetingLink(linkTarget.id, value);
      sessionsQuery.refetch?.();
      closeLinkDialog();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message ?? t('link_error_update'), { variant: 'error' });
    } finally {
      setLinkPending(false);
    }
  }, [linkTarget, linkValue, sessionsQuery, closeLinkDialog, enqueueSnackbar, t]);

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
    setReportPending(true);
    try {
      await reportSession(reportTarget.id, {
        reasonCategory: reportCategory,
        description: reportDescription.trim() || undefined,
      });
      closeReportDialog();
      sessionsQuery.refetch?.();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message ?? t('report_error_send'), { variant: 'error' });
    } finally {
      setReportPending(false);
    }
  }, [reportTarget, reportInvalid, reportCategory, reportDescription, sessionsQuery, closeReportDialog, enqueueSnackbar, t]);

  const profile = profileQuery.data;
  const mentorUser = useMemo(() => ({
    name: profile?.fullName ?? t('my_account_fallback'),
    role:
      profile && (profile.currentJobTitle || profile.currentCompany)
        ? [profile.currentJobTitle, profile.currentCompany].filter(Boolean).join(' @ ')
        : t('mentor'),
    avatar: resolveMediaUrl(profile?.avatarUrl ?? ''),
    cover: resolveMediaUrl(profile?.coverUrl) || DEFAULT_COVER,
  }), [profile, t]);

  const ratingAvg = formatRating(profile?.ratingAvg);

  return (
    <Page title={t('page_title_dashboard')}>
      <MentorshipProfileLayout
        user={mentorUser}
        cover={mentorUser.cover}
        tabs={TOP_TABS}
        onNavigate={navigate}
        mode="mentor"
      >
        <ScrollRevealGroup stagger={0.08} sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <ScrollRevealItem><Typography variant="h2" fontWeight={800} color="primary.main">
            {t('dash_heading')}
          </Typography></ScrollRevealItem>

          {/* STATS */}
          <ScrollRevealItem><StatsBanner items={stats} /></ScrollRevealItem>

          {sessionsQuery.isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <LoadingSkeleton />
            </Box>
          ) : sessionsQuery.isError ? (
            <Typography color="error">{t('dash_sessions_load_error')}</Typography>
          ) : (
            <>
              {/* LỊCH SẮP TỚI */}
              <Section
                title={t('dash_upcoming_title', { count: upcomingItems.length })}
                right={
                  upcomingItems.length > 0 && (
                    <Button
                      size="small"
                      onClick={() => navigate('/mentorship/my-bookings')}
                    >
                      {t('dash_view_all')}
                    </Button>
                  )
                }
              >
                {previewUpcoming.length === 0 ? (
                  <EmptyState message={t('dash_no_upcoming')} />
                ) : (
                  <Stack spacing={2}>
                    {previewUpcoming.map((session, index) => (
                      <ScrollReveal key={session.id} delay={getStaggerDelay(index, 0.06)}>
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
                              {t('dash_mark_completed')}
                            </Button>
                          </Stack>
                        )}
                      </ScrollReveal>
                    ))}
                    {upcomingItems.length > previewUpcoming.length && (
                      <Button
                        variant="outlined"
                        onClick={() => navigate('/mentorship/my-bookings')}
                      >
                        {t('dash_view_more_upcoming', { count: upcomingItems.length - previewUpcoming.length })}
                      </Button>
                    )}
                  </Stack>
                )}
              </Section>
            </>
          )}

          {/* ĐÁNH GIÁ */}
          <Section
            title={t('dash_reviews_title')}
            right={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <StarIcon sx={{ color: 'warning.main' }} />
                <Typography fontWeight={700}>{ratingAvg}</Typography>
                <Typography color="text.secondary">{t('dash_reviews_count', { count: feedbacks.length })}</Typography>
              </Box>
            }
          >
            {feedbacksQuery.isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <LoadingSkeleton />
              </Box>
            ) : feedbacks.length === 0 ? (
              <EmptyState message={t('dash_no_reviews')} />
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                {feedbacks.map((review, index) => (
                  <ScrollReveal key={review.id} delay={getStaggerDelay(index, 0.06)}><MentorshipReviewCard
                    name={review.menteeName ?? `Mentee #${review.menteeMemberId}`}
                    date={formatDate(review.createdAt, '')}
                    avatar={review.menteeAvatarUrl ?? ''}
                    rating={review.rating}
                    content={review.comment ?? ''}
                  /></ScrollReveal>
                ))}
              </Box>
            )}
          </Section>
        </ScrollRevealGroup>
      </MentorshipProfileLayout>

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

      <Dialog open={Boolean(reportTarget)} onClose={closeReportDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{t('report_dialog_title')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {t('report_dialog_desc')}
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
            helperText={
              isOtherReason ? t('report_desc_helper') : undefined
            }
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

      {/* Cancel dialog */}
      <Dialog open={Boolean(cancelTarget)} onClose={closeCancelDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{t('cancel_dialog_title')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {t('cancel_dialog_desc_mentor')}
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
          <Button
            onClick={handleConfirmCancel}
            color="error"
            variant="contained"
            disabled={cancelPending}
          >
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
            autoFocus
          />
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

const Section = ({ title, children, right }) => (
  <ScrollRevealGroup stagger={0.08}>
    <ScrollRevealItem sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="h4" fontWeight={700} color="primary.main">
        {title}
      </Typography>
      {right}
    </ScrollRevealItem>
    <ScrollRevealItem>{children}</ScrollRevealItem>
  </ScrollRevealGroup>
);

const EmptyState = ({ message }) => (
  <Card sx={{ p: 3, border: '1px dashed', borderColor: 'divider', textAlign: 'center' }} elevation={0}>
    <Typography variant="body2" color="text.secondary">
      {message}
    </Typography>
  </Card>
);

export default MentorshipDashboardPage;
