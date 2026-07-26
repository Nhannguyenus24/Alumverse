import LoadingSkeleton from '../../components/LoadingSkeleton';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useOutletContext } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
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
import CloseIcon from '@mui/icons-material/Close';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import SendIcon from '@mui/icons-material/Send';
import UndoIcon from '@mui/icons-material/Undo';
import BlockIcon from '@mui/icons-material/Block';
import { useOrgNavigate, useOrgPath } from '../../hooks/useOrgNavigate';
import { eventApi } from '../../utils/api';
import { formatDateTime } from '../../utils/dateFormatter';
import { useEventQuestions } from '../../hooks/events/useEventQuestions';
import AdminDashboardMetricTile from '../../components/admin/AdminDashboardMetricTile';
import AdminStatusChip from '../../components/admin/AdminStatusChip';
import AdminDataTable from '../../components/admin/AdminDataTable';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import ConfirmDialog from '../../components/ConfirmDialog';
import * as XLSX from 'xlsx';

const fallbackPage = { items: [], totalItem: 0, totalPage: 0, currentPage: 0, pageSize: 10 };

const extractPage = (data) => data ?? fallbackPage;

const getTicketStatusChip = (t, status) => {
  const key = String(status || '').toUpperCase();
  if (key === 'ISSUED') return { color: 'info', label: t('event:ticket_status_issued') };
  if (key === 'USED') return { color: 'success', label: t('event:ticket_status_checked_in') };
  if (key === 'EXPIRED') return { color: 'default', label: t('event:ticket_status_expired') };
  if (key === 'CANCELLED') return { color: 'error', label: t('event:ticket_status_cancelled') };
  if (key === 'BANNED') return { color: 'error', label: t('event:ticket_status_banned') };
  return { color: 'default', label: status || '-' };
};

const formatAnswerValue = (value) => {
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
  if (value == null || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const AdminEventManagePage = () => {
  const { eventId: eventIdParam } = useParams();
  const eventId = Number(eventIdParam);
  const { t } = useTranslation(['event', 'admin', 'common']);
  const { enqueueSnackbar } = useSnackbar();
  const orgNavigate = useOrgNavigate();
  const toOrgPath = useOrgPath();
  const { setBreadcrumbs, adminBase } = useOutletContext();

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
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingAnswers, setIsExportingAnswers] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportStatuses, setExportStatuses] = useState([]);
  const [banTarget, setBanTarget] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [ticketDetail, setTicketDetail] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

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
    enabled: Boolean(eventId) && (tab === 'participants' || tab === 'answers'),
  });

  const { data: eventQuestions = [] } = useEventQuestions(eventId, Boolean(eventId));

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
      { label: t('admin:events'), path: `${adminBase}/events` },
      { label: event.title || `#${eventId}`, active: true },
    ]);
  }, [event, eventId, setBreadcrumbs, t, adminBase]);

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

  const handleCancelTicket = (ticket) => {
    if (!ticket?.ticketCode) return;
    setCancelReason('');
    setCancelTarget(ticket);
  };

  const confirmCancelTicket = async () => {
    if (!cancelTarget?.ticketCode) return;
    if (!cancelReason.trim()) {
      enqueueSnackbar(t('event:ticket_reason_required'), { variant: 'warning' });
      return;
    }
    try {
      await eventApi.adminCancelTicketByCode(cancelTarget.ticketCode, cancelReason.trim());
      enqueueSnackbar(t('event:ticket_cancel_success'), { variant: 'success' });
      refetchTickets();
      refetchStats();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || t('event:ticket_cancel_error'), { variant: 'error' });
    } finally {
      setCancelTarget(null);
      setCancelReason('');
    }
  };

  const handleUndoTicket = async (ticket) => {
    if (!ticket?.ticketCode) return;
    try {
      await eventApi.adminUndoTicketByCode(ticket.ticketCode);
      enqueueSnackbar(t('event:ticket_undo_success', 'Phục hồi trạng thái vé thành công'), { variant: 'success' });
      refetchTickets();
      refetchStats();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || t('event:ticket_undo_error', 'Phục hồi trạng thái vé thất bại'), { variant: 'error' });
    }
  };

  const handleBanTicket = (ticket) => {
    setBanReason('');
    setBanTarget(ticket);
  };

  const confirmBanTicket = async () => {
    if (!banTarget?.ticketCode) return;
    if (!banReason.trim()) {
      enqueueSnackbar(t('event:ticket_reason_required'), { variant: 'warning' });
      return;
    }
    try {
      await eventApi.adminBanTicketByCode(banTarget.ticketCode, banReason.trim());
      enqueueSnackbar(t('event:ticket_ban_success', 'Cấm vé thành công'), { variant: 'success' });
      refetchTickets();
      refetchStats();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || t('event:ticket_ban_error', 'Cấm vé thất bại'), { variant: 'error' });
    } finally {
      setBanTarget(null);
      setBanReason('');
    }
  };

  const handleInvite = async () => {
    const emails = [...new Set(inviteEmails
      .split(/[,;\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean))];
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

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const response = await eventApi.getTicketsByEvent(eventId, { limit: 100000 });
      const data = response?.items || [];
      
      const exportData = data.map((row, index) => ({
        'STT': index + 1,
        [t('admin:event_export_col_ticket_code')]: row.ticketCode || '—',
        [t('admin:event_export_col_user_name')]: row.attendeeName || row.memberName || row.guestName || memberFallback(row.memberId),
        'Email': row.attendeeEmail || row.memberEmail || row.guestEmail || row.email || '—',
        [t('admin:event_export_col_status')]: getTicketStatusChip(t, row.status).label,
        [t('admin:event_export_col_registered_at')]: row.registeredAt ? formatDateTime(row.registeredAt) : '—',
        [t('admin:event_export_col_checked_in_at')]: row.checkedInAt ? formatDateTime(row.checkedInAt) : '—',
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Participants');
      
      XLSX.writeFile(workbook, `Event_${eventId}_Participants.xlsx`);
      enqueueSnackbar(t('admin:export_success', 'Xuất file thành công'), { variant: 'success' });
    } catch (err) {
      console.error(err);
      enqueueSnackbar(t('admin:export_failed', 'Xuất file thất bại'), { variant: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  const buildAnswerRow = (row, index) => {
    const answers = Array.isArray(row.registrationAnswers) ? row.registrationAnswers : [];
    const answerByLabel = answers.reduce((acc, answer, answerIndex) => {
      acc[getAnswerQuestionLabel(answer, answerIndex)] = formatAnswerValue(answer?.value);
      return acc;
    }, {});

    const base = {
      'STT': index + 1,
      'Email': displayMemberEmail(row),
    };

    eventQuestions.forEach((question) => {
      base[question.label] = answerByLabel[question.label] ?? '—';
    });

    return base;
  };

  const handleExportAnswersExcel = async () => {
    if (exportStatuses.length === 0) return;
    setIsExportingAnswers(true);
    try {
      const response = await eventApi.getTicketsByEvent(eventId, { limit: 100000 });
      const data = response?.items || [];

      const workbook = XLSX.utils.book_new();
      const usedSheetNames = new Set();

      exportStatuses.forEach((status) => {
        const rows = data.filter((row) => String(row.status).toUpperCase() === status);
        const exportData = rows.length
          ? rows.map(buildAnswerRow)
          : [{ 'STT': '', 'Email': t('event:tickets_empty') }];

        let sheetName = getTicketStatusChip(t, status).label.slice(0, 31);
        while (usedSheetNames.has(sheetName)) {
          sheetName = `${sheetName.slice(0, 28)}_${usedSheetNames.size}`;
        }
        usedSheetNames.add(sheetName);

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      });

      XLSX.writeFile(workbook, `Event_${eventId}_Answers.xlsx`);
      enqueueSnackbar(t('admin:export_success', 'Xuất file thành công'), { variant: 'success' });
      setExportDialogOpen(false);
    } catch (err) {
      console.error(err);
      enqueueSnackbar(t('admin:export_failed', 'Xuất file thất bại'), { variant: 'error' });
    } finally {
      setIsExportingAnswers(false);
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
  const questionById = useMemo(
    () => new Map(eventQuestions.map((question) => [String(question.id), question])),
    [eventQuestions],
  );
  const hasRegistrationQuestions = eventQuestions.length > 0;

  const getAnswerQuestionLabel = (answer, index) => {
    const questionId = answer?.questionId;
    const matchedQuestion = questionId != null ? questionById.get(String(questionId)) : null;
    return answer?.label
      || answer?.question
      || matchedQuestion?.label
      || (questionId != null
        ? t('admin:event_answer_unknown_question', { id: questionId })
        : t('admin:event_answer_unknown_question_order', { number: index + 1 }));
  };

  const renderAnswerPairs = (ticket) => {
    const answers = Array.isArray(ticket?.registrationAnswers) ? ticket.registrationAnswers : [];
    if (!answers.length) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          {t('admin:event_answers_empty')}
        </Typography>
      );
    }

    return (
      <Stack spacing={1}>
        {answers.map((answer, index) => (
          <Box
            key={`${ticket?.id ?? 'ticket'}-${answer?.questionId ?? index}`}
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'minmax(180px, 0.42fr) minmax(220px, 0.58fr)' },
              gap: { xs: 0.5, md: 1.5 },
              p: 1.25,
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.default',
            }}
          >
            <Typography variant="body2" fontWeight={800} sx={{ overflowWrap: 'anywhere' }}>
              {getAnswerQuestionLabel(answer, index)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
              {formatAnswerValue(answer?.value)}
            </Typography>
          </Box>
        ))}
      </Stack>
    );
  };

  if (eventLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <LoadingSkeleton />
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
  const answerCount = ticketsData.totalItem ?? 0;

  return (
    <Box>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={2} sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconButton onClick={() => orgNavigate(`${adminBase}/events`)} size="small">
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

        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
          sx={{
            ml: { sm: 'auto' },
            justifyContent: { xs: 'flex-start', sm: 'flex-end' },
            width: { xs: '100%', sm: 'auto' },
          }}
        >
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
          <Button color="accent" variant="contained" startIcon={<HowToRegOutlinedIcon />} onClick={() => orgNavigate(`${adminBase}/events/${eventId}/organize`)}>
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
        {hasRegistrationQuestions && (
          <Tab value="answers" label={t('admin:event_answers_tab', { count: answerCount })} />
        )}
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
              label: t('admin:actions'),
              align: 'right',
              width: 120,
              render: (_, ticket) => {
                const status = String(ticket.status).toUpperCase();
                const isLatestForOwner = ticket.latestForOwner !== false;
                const cancellable = !['CANCELLED', 'USED', 'EXPIRED', 'CHECKED_IN', 'BANNED'].includes(status);
                const undoable = ['CANCELLED', 'BANNED'].includes(status) && isLatestForOwner;
                const bannable = !['BANNED'].includes(status) && isLatestForOwner;
                
                return (
                  <Stack direction="row" spacing={0.75} justifyContent="flex-end" alignItems="center" onClick={(e) => e.stopPropagation()}>
                    {undoable && (
                      <Tooltip title={t('event:tooltip_undo_ticket', 'Phục hồi vé')}>
                        <IconButton size="small" color="info" onClick={() => handleUndoTicket(ticket)}>
                          <UndoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {cancellable && (
                      <Tooltip title={t('event:tooltip_cancel_ticket')}>
                        <IconButton size="small" color="warning" onClick={() => handleCancelTicket(ticket)}>
                          <EventBusyOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {bannable && (
                      <Tooltip title={t('event:tooltip_ban_ticket', 'Cấm tham gia (Gian lận)')}>
                        <IconButton size="small" color="error" onClick={() => handleBanTicket(ticket)}>
                          <BlockIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                );
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
          onRowClick={(ticket) => setTicketDetail(ticket)}
          filters={(
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                select
                size="small"
                label={t('admin:col_status')}
                value={ticketStatus}
                onChange={(e) => { setTicketStatus(e.target.value); setTicketsPage(0); }}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="">{t('common:all')}</MenuItem>
                {['ISSUED', 'USED', 'EXPIRED', 'CANCELLED', 'BANNED'].map((status) => (
                  <MenuItem key={status} value={status}>
                    {getTicketStatusChip(t, status).label}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant="outlined"
                startIcon={isExporting ? <CircularProgress size={20} color="inherit" /> : <FileDownloadOutlinedIcon />}
                onClick={handleExportExcel}
                disabled={isExporting}
                sx={{ height: 40 }}
              >
                {t('admin:export_excel', 'Export Excel')}
              </Button>
            </Stack>
          )}
        />
      )}

      {tab === 'answers' && hasRegistrationQuestions && (
        <AdminDataTable
          columns={[
            {
              id: 'memberId',
              label: t('admin:event_col_user_id'),
              width: 120,
              render: (value, row) => value || row.userId || row.id || '—',
            },
            { id: 'member', label: t('admin:event_col_guest'), minWidth: 180, render: (_, row) => displayMemberName(row) },
            { id: 'email', label: 'Email', minWidth: 220, render: (_, row) => displayMemberEmail(row) },
            {
              id: 'registrationAnswers',
              label: t('admin:event_answers_col_responses'),
              minWidth: 420,
              render: (_, row) => renderAnswerPairs(row),
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
          emptyMessage={t('admin:event_answers_table_empty')}
          filters={(
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                select
                size="small"
                label={t('admin:col_status')}
                value={ticketStatus}
                onChange={(e) => { setTicketStatus(e.target.value); setTicketsPage(0); }}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="">{t('common:all')}</MenuItem>
                {['ISSUED', 'USED', 'EXPIRED', 'CANCELLED', 'BANNED'].map((status) => (
                  <MenuItem key={status} value={status}>
                    {getTicketStatusChip(t, status).label}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant="outlined"
                startIcon={isExportingAnswers ? <CircularProgress size={20} color="inherit" /> : <FileDownloadOutlinedIcon />}
                onClick={() => { setExportStatuses([]); setExportDialogOpen(true); }}
                disabled={isExportingAnswers}
                sx={{ height: 40 }}
              >
                {t('admin:export_excel', 'Export Excel')}
              </Button>
            </Stack>
          )}
        />
      )}

      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
        <DialogTitle sx={{ pr: 5, position: 'relative' }}>
          {t('admin:export_select_status_title', 'Chọn trạng thái vé để export')}
          <IconButton
            onClick={() => setExportDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <FormGroup>
            {['ISSUED', 'USED', 'EXPIRED', 'CANCELLED', 'BANNED'].map((status) => (
              <FormControlLabel
                key={status}
                control={
                  <Checkbox
                    checked={exportStatuses.includes(status)}
                    onChange={(e) => setExportStatuses((prev) => (
                      e.target.checked ? [...prev, status] : prev.filter((s) => s !== status)
                    ))}
                  />
                }
                label={getTicketStatusChip(t, status).label}
              />
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>{t('common:cancel')}</Button>
          <Button
            variant="contained"
            disabled={exportStatuses.length === 0 || isExportingAnswers}
            onClick={handleExportAnswersExcel}
            startIcon={isExportingAnswers ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {t('admin:export_excel', 'Export Excel')}
          </Button>
        </DialogActions>
      </Dialog>

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

      <ConfirmDialog
        open={Boolean(banTarget)}
        title={t('event:ticket_ban_title', 'Xác nhận cấm vé')}
        message={t('event:ticket_ban_confirm', 'Bạn có chắc chắn muốn cấm vé này tham gia sự kiện do gian lận không?')}
        confirmText={t('common:confirm', 'Xác nhận')}
        cancelText={t('common:cancel', 'Hủy')}
        onConfirm={confirmBanTicket}
        onCancel={() => setBanTarget(null)}
        confirmColor="error"
        reasonLabel={t('event:ticket_ban_reason_label')}
        reasonValue={banReason}
        onReasonChange={setBanReason}
      />

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title={t('event:ticket_cancel_title')}
        message={t('event:ticket_cancel_confirm')}
        confirmText={t('common:confirm', 'Xác nhận')}
        cancelText={t('common:cancel', 'Hủy')}
        onConfirm={confirmCancelTicket}
        onCancel={() => setCancelTarget(null)}
        confirmColor="warning"
        reasonLabel={t('event:ticket_cancel_reason_label')}
        reasonValue={cancelReason}
        onReasonChange={setCancelReason}
      />

      <Dialog open={Boolean(ticketDetail)} onClose={() => setTicketDetail(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pr: 5, position: 'relative' }}>
          {t('event:ticket_detail_title')}
          <IconButton onClick={() => setTicketDetail(null)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {ticketDetail && (
            <Stack spacing={1.5}>
              {[
                [t('event:ticket_code'), ticketDetail.ticketCode],
                [t('admin:col_status'), <AdminStatusChip key="status" status={ticketDetail.status} category="ticket" />],
                [t('admin:event_col_guest'), displayMemberName(ticketDetail)],
                ['Email', displayMemberEmail(ticketDetail)],
                [t('event:ticket_detail_phone'), ticketDetail.guestPhone || '—'],
                [t('event:ticket_detail_member_id'), ticketDetail.memberId ?? '—'],
                [t('event:col_registered_at'), formatDateTime(ticketDetail.registeredAt) || '—'],
                [t('event:col_checked_in_at'), formatDateTime(ticketDetail.checkedInAt) || '—'],
                [t('event:ticket_detail_cancel_reason'), ticketDetail.cancelReason || '—'],
                [t('event:ticket_detail_reject_reason'), ticketDetail.rejectReason || '—'],
              ].map(([label, value]) => (
                <Stack key={label} direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                  <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>{label}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right', wordBreak: 'break-word' }}>{value}</Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTicketDetail(null)}>{t('common:close', 'Đóng')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminEventManagePage;
