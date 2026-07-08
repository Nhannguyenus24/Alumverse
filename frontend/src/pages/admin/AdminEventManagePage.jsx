import { useEffect, useMemo, useState } from 'react';
import { useParams, useOutletContext } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import SendIcon from '@mui/icons-material/Send';
import DoDisturbAltIcon from '@mui/icons-material/DoDisturbAlt';
import { useOrgNavigate, useOrgPath } from '../../hooks/useOrgNavigate';
import { eventApi } from '../../utils/api';
import { formatDateTime } from '../../utils/dateFormatter';
import AdminDashboardMetricTile from '../../components/admin/AdminDashboardMetricTile';
import AdminStatusChip from '../../components/admin/AdminStatusChip';
import AdminDataTable from '../../components/admin/AdminDataTable';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';

const fallbackPage = { items: [], totalItem: 0, totalPage: 0, currentPage: 0, pageSize: 10 };

const extractPage = (data) => data ?? fallbackPage;

const getTicketStatusChip = (t, status) => {
  const key = String(status || '').toUpperCase();
  if (key === 'REGISTERED') return { color: 'primary', label: t('event:ticket_status_registered') };
  if (key === 'PENDING') return { color: 'warning', label: t('event:ticket_status_pending') };
  if (key === 'ISSUED') return { color: 'info', label: t('event:ticket_status_issued') };
  if (key === 'CHECKED_IN') return { color: 'success', label: t('event:ticket_status_checked_in') };
  if (key === 'CANCELLED') return { color: 'error', label: t('event:ticket_status_cancelled') };
  return { color: 'default', label: status || '-' };
};

const AdminEventManagePage = () => {
  const { eventId: eventIdParam } = useParams();
  const eventId = Number(eventIdParam);
  const { t } = useTranslation(['event', 'admin', 'common']);
  const { enqueueSnackbar } = useSnackbar();
  const orgNavigate = useOrgNavigate();
  const toOrgPath = useOrgPath();
  const { setBreadcrumbs } = useOutletContext();

  const [tab, setTab] = useState('participants');
  const [ticketKeyword, setTicketKeyword] = useState('');
  const [ticketStatus, setTicketStatus] = useState('');
  const [ticketsPage, setTicketsPage] = useState(0);
  const [ticketsSize, setTicketsSize] = useState(10);
  const [interestsPage, setInterestsPage] = useState(0);
  const [interestsSize, setInterestsSize] = useState(10);
  const [invitationsPage, setInvitationsPage] = useState(0);
  const [invitationsSize, setInvitationsSize] = useState(10);
  const [emailLogsPage, setEmailLogsPage] = useState(0);
  const [emailLogsSize, setEmailLogsSize] = useState(10);
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviting, setInviting] = useState(false);

  const { data: event, isLoading: eventLoading, refetch: refetchEvent } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventApi.getEventById(eventId),
    enabled: Boolean(eventId) && !Number.isNaN(eventId),
  });

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['event', eventId, 'statistics'],
    queryFn: () => eventApi.getEventStatisticsById(eventId),
    enabled: Boolean(eventId) && !Number.isNaN(eventId),
  });

  const { data: tickets = fallbackPage, isLoading: ticketsLoading, refetch: refetchTickets } = useQuery({
    queryKey: ['event', eventId, 'tickets', ticketsPage, ticketsSize, ticketKeyword, ticketStatus],
    queryFn: () => eventApi.getTicketsByEvent(eventId, {
      page: ticketsPage,
      limit: ticketsSize,
      keyword: ticketKeyword || undefined,
      status: ticketStatus || undefined,
    }),
    enabled: Boolean(eventId) && tab === 'participants',
  });

  const { data: interests = fallbackPage, isLoading: interestsLoading } = useQuery({
    queryKey: ['event', eventId, 'interests', interestsPage, interestsSize],
    queryFn: () => eventApi.getInterestsByEvent(eventId, { page: interestsPage, limit: interestsSize }),
    enabled: Boolean(eventId) && tab === 'interests',
  });

  const { data: invitations = fallbackPage, isLoading: invitationsLoading, refetch: refetchInvitations } = useQuery({
    queryKey: ['event', eventId, 'invitations', invitationsPage, invitationsSize],
    queryFn: () => eventApi.getInvitations(eventId, { page: invitationsPage, limit: invitationsSize }),
    enabled: Boolean(eventId) && tab === 'invitations',
  });

  const { data: emailLogs = fallbackPage, isLoading: emailLogsLoading, refetch: refetchEmailLogs } = useQuery({
    queryKey: ['event', eventId, 'email-logs', emailLogsPage, emailLogsSize],
    queryFn: () => eventApi.getEmailLogs(eventId, { page: emailLogsPage, limit: emailLogsSize }),
    enabled: Boolean(eventId) && tab === 'emails',
  });

  useEffect(() => {
    if (!event) return;
    setBreadcrumbs?.([
      { label: t('admin:events'), path: '/admin/events' },
      { label: event.title || `#${eventId}`, active: true },
    ]);
  }, [event, eventId, setBreadcrumbs, t]);

  const publishChip = useMemo(() => (
    event?.isPublished
      ? { color: 'success', label: t('admin:published_chip') }
      : { color: 'default', label: t('admin:draft_chip') }
  ), [event?.isPublished, t]);

  const handlePublishToggle = async () => {
    try {
      if (event?.isPublished) {
        await eventApi.unpublishAdminEvent(eventId);
        enqueueSnackbar(t('admin:event_unpublished'), { variant: 'success' });
      } else {
        await eventApi.publishAdminEvent(eventId);
        enqueueSnackbar(t('admin:event_published'), { variant: 'success' });
      }
      refetchEvent();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || t('admin:event_publish_failed'), { variant: 'error' });
    }
  };

  const handlePreview = () => {
    window.open(toOrgPath(`/article/event/${eventId}`), '_blank', 'noopener,noreferrer');
  };

  const handleSendTicketEmails = async () => {
    try {
      const count = await eventApi.sendIssuedTicketEmails(eventId);
      enqueueSnackbar(t('event:ticket_send_email_success', { count: count ?? 0 }), { variant: 'success' });
      refetchEmailLogs();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || t('event:ticket_send_email_error'), { variant: 'error' });
    }
  };

  const handleSendReminders = async () => {
    try {
      const count = await eventApi.sendReminders(eventId, {});
      enqueueSnackbar(t('event:reminder_send_success', { count: count ?? 0 }), { variant: 'success' });
      refetchEmailLogs();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || t('event:reminder_send_error'), { variant: 'error' });
    }
  };

  const handleCancelTicket = async (ticket) => {
    if (!ticket?.ticketCode) return;
    try {
      await eventApi.cancelTicketByCode(ticket.ticketCode);
      enqueueSnackbar(t('event:ticket_cancel_success'), { variant: 'success' });
      refetchTickets();
      refetchStats();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || t('event:ticket_cancel_error'), { variant: 'error' });
    }
  };

  const handleInvite = async () => {
    const emails = inviteEmails
      .split(/[,;\s]+/)
      .map((e) => e.trim())
      .filter(Boolean);
    if (!emails.length) {
      enqueueSnackbar(t('event:invite_email_required'), { variant: 'warning' });
      return;
    }
    setInviting(true);
    try {
      await eventApi.inviteUsers(eventId, {
        invitees: emails.map((email) => ({ email })),
      });
      enqueueSnackbar(t('event:invite_success', { count: emails.length }), { variant: 'success' });
      setInviteEmails('');
      refetchInvitations();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || t('event:invite_error'), { variant: 'error' });
    } finally {
      setInviting(false);
    }
  };

  const statTiles = stats ? [
    { label: t('event:stat_registered'), value: stats.registeredCount ?? 0, icon: <ConfirmationNumberOutlinedIcon /> },
    { label: t('event:stat_checked_in'), value: stats.checkedInCount ?? 0, icon: <HowToRegOutlinedIcon /> },
    { label: t('event:stat_interested'), value: stats.interestedCount ?? 0, icon: <FavoriteBorderOutlinedIcon /> },
    { label: t('event:stat_capacity'), value: stats.maxCapacity ?? '-', icon: <GroupsOutlinedIcon /> },
    { label: t('event:stat_available'), value: stats.availableSlots ?? '-', icon: <EventAvailableOutlinedIcon /> },
  ] : [];

  const memberFallback = (memberId) => (memberId ? t('admin:event_member_fallback', { id: memberId }) : '—');
  const displayMemberName = (row) => row.attendeeName || row.memberName || row.guestName || memberFallback(row.memberId);
  const displayMemberEmail = (row) => row.attendeeEmail || row.memberEmail || row.guestEmail || row.email || '—';

  if (eventLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!event) {
    return (
      <Typography color="text.secondary" sx={{ py: 4 }}>
        {t('event:event_not_found')}
      </Typography>
    );
  }

  const ticketsData = extractPage(tickets);
  const interestsData = extractPage(interests);
  const invitationsData = extractPage(invitations);
  const emailLogsData = extractPage(emailLogs);

  return (
    <Box>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={2} sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconButton onClick={() => orgNavigate('/admin/events')} size="small">
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
              <Typography variant="h4" fontWeight={800} color="primary.main">
                {event.title}
              </Typography>
              <Chip size="small" color={publishChip.color} label={publishChip.label} />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              #{event.id} · {formatDateTime(event.startTime)} – {formatDateTime(event.endTime)}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button color="secondary" variant="outlined" startIcon={<EditOutlinedIcon />} onClick={() => orgNavigate(`/post/event/${eventId}`)}>
            {t('common:edit')}
          </Button>
          <Button
            variant="contained"
            color={event.isPublished ? 'warning' : 'success'}
            startIcon={event.isPublished ? <CancelOutlinedIcon /> : <CheckCircleOutlineIcon />}
            onClick={handlePublishToggle}
          >
            {event.isPublished ? t('admin:tooltip_unpublish') : t('admin:tooltip_publish')}
          </Button>
          <Button color="primary" variant="contained" startIcon={<OpenInNewIcon />} onClick={handlePreview}>
            {t('event:preview_public')}
          </Button>
          <Button color="accent" variant="contained" startIcon={<HowToRegOutlinedIcon />} onClick={() => orgNavigate(`/admin/events/${eventId}/organize`)}>
            {t('event:check_in')}
          </Button>
        </Stack>
      </Stack>

      {statTiles.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          {statTiles.map((tile) => (
            <Box key={tile.label} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(20% - 16px)' } }}>
              <AdminDashboardMetricTile label={tile.label} value={tile.value} icon={tile.icon} />
            </Box>
          ))}
        </Box>
      )}

      <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>{t('event:overview_section')}</Typography>
        <Stack spacing={0.5}>
          <Typography variant="body2"><strong>{t('event:location')}:</strong> {event.location || '—'}</Typography>
          <Typography variant="body2">
            <strong>{t('event:registration_window')}:</strong>{' '}
            {formatDateTime(event.registrationStartAt)} – {formatDateTime(event.registrationEndAt)}
          </Typography>
          <Typography variant="body2"><strong>{t('admin:event_detail_creator')}:</strong> {event.creatorMemberId ?? '—'}</Typography>
        </Stack>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab value="participants" label={t('event:tab_participants', { count: ticketsData.totalItem ?? 0 })} />
        <Tab value="interests" label={t('event:tab_interests', { count: interestsData.totalItem ?? 0 })} />
        <Tab value="invitations" label={t('event:tab_invitations', { count: invitationsData.totalItem ?? 0 })} />
        <Tab value="emails" label={t('event:tab_emails')} />
      </Tabs>

      {tab === 'participants' && (
        <AdminDataTable
          columns={[
            { id: 'id', label: 'ID' },
            { id: 'ticketCode', label: t('event:ticket_code'), render: (value) => value || '—' },
            { id: 'member', label: t('admin:event_col_guest'), render: (_, row) => displayMemberName(row) },
            { id: 'email', label: 'Email', render: (_, row) => displayMemberEmail(row) },
            { id: 'status', label: t('admin:col_status'), render: (value) => <AdminStatusChip status={value} category="ticket" /> },
            { id: 'registeredAt', label: t('event:col_registered_at'), render: (value) => formatDateTime(value) },
            { id: 'checkedInAt', label: t('event:col_checked_in_at'), render: (value) => formatDateTime(value) },
            {
              id: 'actions',
              label: '',
              align: 'right',
              render: (_, ticket) => {
                const cancellable = !['CANCELLED', 'USED', 'EXPIRED', 'CHECKED_IN'].includes(String(ticket.status).toUpperCase());
                return cancellable ? (
                  <Tooltip title={t('event:tooltip_cancel_ticket')}>
                    <IconButton size="small" color="warning" onClick={() => handleCancelTicket(ticket)}>
                      <DoDisturbAltIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : null;
              },
            },
          ]}
          rows={ticketsData.items ?? []}
          totalCount={ticketsData.totalItem ?? 0}
          page={ticketsPage}
          rowsPerPage={ticketsSize}
          onPageChange={(_, p) => setTicketsPage(p)}
          onRowsPerPageChange={(e) => { setTicketsSize(Number(e.target.value)); setTicketsPage(0); }}
          onSearchChange={(value) => { setTicketKeyword(value); setTicketsPage(0); }}
          searchValue={ticketKeyword}
          searchPlaceholder={t('common:search')}
          loading={ticketsLoading}
          emptyMessage={t('event:tickets_empty')}
          filters={(
            <TextField
              select
              size="small"
              label={t('admin:col_status')}
              value={ticketStatus}
              onChange={(e) => { setTicketStatus(e.target.value); setTicketsPage(0); }}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">{t('common:all')}</MenuItem>
              {['PENDING', 'ISSUED', 'REGISTERED', 'CHECKED_IN', 'CANCELLED'].map((status) => (
                <MenuItem key={status} value={status}>
                  {getTicketStatusChip(t, status).label}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      )}

      {tab === 'interests' && (
        <AdminDataTable
          columns={[
            { id: 'id', label: 'ID' },
            { id: 'member', label: t('admin:event_col_guest'), render: (_, row) => displayMemberName(row) },
            { id: 'email', label: 'Email', render: (_, row) => displayMemberEmail(row) },
            { id: 'createdAt', label: t('common:col_time'), render: (value) => formatDateTime(value) },
          ]}
          rows={interestsData.items ?? []}
          totalCount={interestsData.totalItem ?? 0}
          page={interestsPage}
          rowsPerPage={interestsSize}
          onPageChange={(_, p) => setInterestsPage(p)}
          onRowsPerPageChange={(e) => { setInterestsSize(Number(e.target.value)); setInterestsPage(0); }}
          loading={interestsLoading}
          emptyMessage={t('event:interests_empty')}
        />
      )}

      {tab === 'invitations' && (
        <Box>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }} alignItems={{ xs: 'stretch', md: 'flex-start' }}>
            <TextField
              fullWidth
              multiline
              minRows={2}
              label={t('event:invite_emails_label')}
              placeholder={t('event:invite_emails_placeholder')}
              value={inviteEmails}
              onChange={(e) => setInviteEmails(e.target.value)}
              helperText={t('event:invite_auto_email_hint')}
              sx={{ flex: 1 }}
            />
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={handleInvite}
              disabled={inviting}
              sx={{ minWidth: 180, whiteSpace: 'nowrap', mt: { md: 1 } }}
            >
              {t('event:btn_invite')}
            </Button>
          </Stack>
          <AdminDataTable
            columns={[
              { id: 'id', label: 'ID' },
              { id: 'email', label: 'Email', render: (value, row) => value || displayMemberEmail(row) },
              { id: 'member', label: t('admin:event_col_guest'), render: (_, row) => displayMemberName(row) },
              { id: 'status', label: t('admin:col_status'), render: (value) => <AdminStatusChip status={value} category="ticket" /> },
              { id: 'invitedAt', label: t('event:col_invited_at'), render: (value) => formatDateTime(value) },
              { id: 'confirmedAt', label: t('event:col_confirmed_at'), render: (value) => formatDateTime(value) },
            ]}
            rows={invitationsData.items ?? []}
            totalCount={invitationsData.totalItem ?? 0}
            page={invitationsPage}
            rowsPerPage={invitationsSize}
            onPageChange={(_, p) => setInvitationsPage(p)}
            onRowsPerPageChange={(e) => { setInvitationsSize(Number(e.target.value)); setInvitationsPage(0); }}
            loading={invitationsLoading}
            emptyMessage={t('event:invitations_empty')}
          />
        </Box>
      )}

      {tab === 'emails' && (
        <Box>
          <Stack direction="row" spacing={1} sx={{ mb: 2, justifyContent: 'flex-end' }} flexWrap="wrap" useFlexGap>
            <Button variant="contained" startIcon={<MarkEmailReadIcon />} onClick={handleSendTicketEmails}>
              {t('event:btn_send_ticket_emails')}
            </Button>
            <Button variant="outlined" startIcon={<NotificationsActiveIcon />} onClick={handleSendReminders}>
              {t('event:btn_send_reminders')}
            </Button>
          </Stack>
          <AdminDataTable
            columns={[
              { id: 'id', label: 'ID' },
              { id: 'templateName', label: t('event:col_template'), render: (value) => value || '—' },
              { id: 'subject', label: t('event:col_subject'), render: (value) => value || '—' },
              { id: 'recipientCount', label: t('event:col_recipients'), render: (value) => value ?? '—' },
              { id: 'sentAt', label: t('event:col_sent_at'), render: (value) => formatDateTime(value) },
            ]}
            rows={emailLogsData.items ?? []}
            totalCount={emailLogsData.totalItem ?? 0}
            page={emailLogsPage}
            rowsPerPage={emailLogsSize}
            onPageChange={(_, p) => setEmailLogsPage(p)}
            onRowsPerPageChange={(e) => { setEmailLogsSize(Number(e.target.value)); setEmailLogsPage(0); }}
            loading={emailLogsLoading}
            emptyMessage={t('event:email_logs_empty')}
          />
        </Box>
      )}
    </Box>
  );
};

export default AdminEventManagePage;
