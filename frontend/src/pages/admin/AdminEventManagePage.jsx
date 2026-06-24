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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
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
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';

const fallbackPage = { items: [], totalItem: 0, totalPage: 0, currentPage: 0, pageSize: 10 };

const extractPage = (data) => data ?? fallbackPage;

const getTicketStatusChip = (t, status) => {
  const key = String(status || '').toUpperCase();
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
          <Button variant="outlined" startIcon={<EditOutlinedIcon />} onClick={() => orgNavigate(`/post/event/${eventId}`)}>
            {t('common:edit')}
          </Button>
          <Button variant="outlined" startIcon={<OpenInNewIcon />} onClick={handlePreview}>
            {t('event:preview_public')}
          </Button>
          <Button variant="outlined" startIcon={<HowToRegOutlinedIcon />} onClick={() => orgNavigate(`/admin/events/${eventId}/organize`)}>
            {t('event:check_in')}
          </Button>
          <Button
            variant="contained"
            color={event.isPublished ? 'warning' : 'success'}
            startIcon={event.isPublished ? <CancelOutlinedIcon /> : <CheckCircleOutlineIcon />}
            onClick={handlePublishToggle}
          >
            {event.isPublished ? t('admin:tooltip_unpublish') : t('admin:tooltip_publish')}
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
        <Box>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
            <TextField
              size="small"
              label={t('common:search')}
              value={ticketKeyword}
              onChange={(e) => { setTicketKeyword(e.target.value); setTicketsPage(0); }}
              sx={{ minWidth: 200 }}
            />
            <TextField
              select
              size="small"
              label={t('common:col_status')}
              value={ticketStatus}
              onChange={(e) => { setTicketStatus(e.target.value); setTicketsPage(0); }}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="">{t('common:all')}</MenuItem>
              <MenuItem value="PENDING">PENDING</MenuItem>
              <MenuItem value="ISSUED">ISSUED</MenuItem>
              <MenuItem value="CHECKED_IN">CHECKED_IN</MenuItem>
              <MenuItem value="CANCELLED">CANCELLED</MenuItem>
            </TextField>
          </Stack>
          {ticketsLoading ? (
            <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress size={24} /></Stack>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>{t('event:ticket_code')}</TableCell>
                  <TableCell>Member</TableCell>
                  <TableCell>Guest</TableCell>
                  <TableCell>{t('common:col_status')}</TableCell>
                  <TableCell>{t('event:col_registered_at')}</TableCell>
                  <TableCell>{t('event:col_checked_in_at')}</TableCell>
                  <TableCell align="right">{t('common:col_actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(ticketsData.items?.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>{t('event:tickets_empty')}</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  ticketsData.items.map((ticket) => {
                    const chip = getTicketStatusChip(t, ticket.status);
                    const cancellable = !['CANCELLED', 'USED', 'EXPIRED', 'CHECKED_IN'].includes(String(ticket.status).toUpperCase());
                    return (
                      <TableRow key={ticket.id}>
                        <TableCell>{ticket.id}</TableCell>
                        <TableCell>{ticket.ticketCode || '—'}</TableCell>
                        <TableCell>{ticket.memberId ?? '—'}</TableCell>
                        <TableCell>{ticket.guestEmail || ticket.guestName || '—'}</TableCell>
                        <TableCell><Chip size="small" color={chip.color} label={chip.label} /></TableCell>
                        <TableCell>{formatDateTime(ticket.registeredAt)}</TableCell>
                        <TableCell>{formatDateTime(ticket.checkedInAt)}</TableCell>
                        <TableCell align="right">
                          {cancellable && (
                            <Tooltip title={t('event:tooltip_cancel_ticket')}>
                              <IconButton size="small" color="warning" onClick={() => handleCancelTicket(ticket)}>
                                <DoDisturbAltIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
          <TablePagination
            component="div"
            count={ticketsData.totalItem ?? 0}
            page={ticketsPage}
            rowsPerPage={ticketsSize}
            onPageChange={(_, p) => setTicketsPage(p)}
            onRowsPerPageChange={(e) => { setTicketsSize(Number(e.target.value)); setTicketsPage(0); }}
            rowsPerPageOptions={[10, 20, 50]}
          />
        </Box>
      )}

      {tab === 'interests' && (
        <Box>
          {interestsLoading ? (
            <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress size={24} /></Stack>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Member ID</TableCell>
                  <TableCell>{t('common:col_time')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(interestsData.items?.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>{t('event:interests_empty')}</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  interestsData.items.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell>{i.id}</TableCell>
                      <TableCell>{i.memberId ?? '—'}</TableCell>
                      <TableCell>{formatDateTime(i.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          <TablePagination
            component="div"
            count={interestsData.totalItem ?? 0}
            page={interestsPage}
            rowsPerPage={interestsSize}
            onPageChange={(_, p) => setInterestsPage(p)}
            onRowsPerPageChange={(e) => { setInterestsSize(Number(e.target.value)); setInterestsPage(0); }}
            rowsPerPageOptions={[10, 20, 50]}
          />
        </Box>
      )}

      {tab === 'invitations' && (
        <Box>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }} alignItems="flex-start">
            <TextField
              fullWidth
              multiline
              minRows={2}
              label={t('event:invite_emails_label')}
              placeholder={t('event:invite_emails_placeholder')}
              value={inviteEmails}
              onChange={(e) => setInviteEmails(e.target.value)}
              helperText={t('event:invite_auto_email_hint')}
            />
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={handleInvite}
              disabled={inviting}
              sx={{ minWidth: 120, mt: 1 }}
            >
              {t('event:btn_invite')}
            </Button>
          </Stack>
          {invitationsLoading ? (
            <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress size={24} /></Stack>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Member</TableCell>
                  <TableCell>{t('common:col_status')}</TableCell>
                  <TableCell>{t('event:col_invited_at')}</TableCell>
                  <TableCell>{t('event:col_confirmed_at')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(invitationsData.items?.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>{t('event:invitations_empty')}</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  invitationsData.items.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>{inv.id}</TableCell>
                      <TableCell>{inv.email || '—'}</TableCell>
                      <TableCell>{inv.memberId ?? '—'}</TableCell>
                      <TableCell><Chip size="small" label={inv.status || '—'} /></TableCell>
                      <TableCell>{formatDateTime(inv.invitedAt)}</TableCell>
                      <TableCell>{formatDateTime(inv.confirmedAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          <TablePagination
            component="div"
            count={invitationsData.totalItem ?? 0}
            page={invitationsPage}
            rowsPerPage={invitationsSize}
            onPageChange={(_, p) => setInvitationsPage(p)}
            onRowsPerPageChange={(e) => { setInvitationsSize(Number(e.target.value)); setInvitationsPage(0); }}
            rowsPerPageOptions={[10, 20, 50]}
          />
        </Box>
      )}

      {tab === 'emails' && (
        <Box>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
            <Button variant="contained" startIcon={<MarkEmailReadIcon />} onClick={handleSendTicketEmails}>
              {t('event:btn_send_ticket_emails')}
            </Button>
            <Button variant="outlined" startIcon={<NotificationsActiveIcon />} onClick={handleSendReminders}>
              {t('event:btn_send_reminders')}
            </Button>
          </Stack>
          {emailLogsLoading ? (
            <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress size={24} /></Stack>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>{t('event:col_template')}</TableCell>
                  <TableCell>{t('event:col_subject')}</TableCell>
                  <TableCell>{t('event:col_recipients')}</TableCell>
                  <TableCell>{t('event:col_sent_at')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(emailLogsData.items?.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>{t('event:email_logs_empty')}</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  emailLogsData.items.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.id}</TableCell>
                      <TableCell>{log.templateName || '—'}</TableCell>
                      <TableCell>{log.subject || '—'}</TableCell>
                      <TableCell>{log.recipientCount ?? '—'}</TableCell>
                      <TableCell>{formatDateTime(log.sentAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          <TablePagination
            component="div"
            count={emailLogsData.totalItem ?? 0}
            page={emailLogsPage}
            rowsPerPage={emailLogsSize}
            onPageChange={(_, p) => setEmailLogsPage(p)}
            onRowsPerPageChange={(e) => { setEmailLogsSize(Number(e.target.value)); setEmailLogsPage(0); }}
            rowsPerPageOptions={[10, 20, 50]}
          />
        </Box>
      )}
    </Box>
  );
};

export default AdminEventManagePage;
