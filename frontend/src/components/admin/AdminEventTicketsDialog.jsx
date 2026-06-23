import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DoDisturbAltIcon from '@mui/icons-material/DoDisturbAlt';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { adminEventApi as api } from '../../utils/api';
import { formatDateTime } from '../../utils/dateFormatter';

const fallbackPage = { items: [], totalItem: 0, totalPage: 0, currentPage: 0, pageSize: 10 };

const extractData = (response) => response?.data?.data ?? response?.data ?? null;

const safeFetch = async (request, fallback) => {
  try {
    const data = extractData(await request());
    return data ?? fallback;
  } catch {
    return fallback;
  }
};

const getTicketStatusChip = (t, status) => {
  const key = String(status || '').toUpperCase();
  if (key === 'PENDING')    return { color: 'warning',  label: t('event:ticket_status_pending') };
  if (key === 'ISSUED')     return { color: 'info',     label: t('event:ticket_status_issued') };
  if (key === 'ACTIVE')     return { color: 'success',  label: 'Active' };
  if (key === 'CHECKED_IN') return { color: 'success',  label: 'Checked-in' };
  if (key === 'USED')       return { color: 'default',  label: t('event:ticket_status_used') };
  if (key === 'EXPIRED')    return { color: 'default',  label: t('event:ticket_status_expired') };
  if (key === 'CANCELLED')  return { color: 'error',    label: t('event:ticket_status_cancelled') };
  return { color: 'default', label: status || '-' };
};

const AdminEventTicketsDialog = ({ open, event, onClose }) => {
  const { t } = useTranslation(['event', 'common']);
  const { enqueueSnackbar } = useSnackbar();
  const eventId = event?.id ?? null;

  const [tab, setTab] = useState('tickets');

  const [pending, setPending]           = useState(fallbackPage);
  const [pendingPage, setPendingPage]   = useState(0);
  const [pendingSize, setPendingSize]   = useState(10);
  const [pendingLoading, setPendingLoading] = useState(false);

  const [tickets, setTickets]           = useState(fallbackPage);
  const [ticketsPage, setTicketsPage]   = useState(0);
  const [ticketsSize, setTicketsSize]   = useState(10);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  const [interests, setInterests]           = useState(fallbackPage);
  const [interestsPage, setInterestsPage]   = useState(0);
  const [interestsSize, setInterestsSize]   = useState(10);
  const [interestsLoading, setInterestsLoading] = useState(false);

  const loadPending = useCallback(async () => {
    if (!eventId) return;
    setPendingLoading(true);
    const data = await safeFetch(
      () => api.getTicketsByEventAndStatus(eventId, 'PENDING', pendingPage, pendingSize),
      fallbackPage,
    );
    setPending(data || fallbackPage);
    setPendingLoading(false);
  }, [eventId, pendingPage, pendingSize]);

  const loadTickets = useCallback(async () => {
    if (!eventId) return;
    setTicketsLoading(true);
    const data = await safeFetch(
      () => api.getTicketsByEvent(eventId, ticketsPage, ticketsSize),
      fallbackPage,
    );
    setTickets(data || fallbackPage);
    setTicketsLoading(false);
  }, [eventId, ticketsPage, ticketsSize]);

  const loadInterests = useCallback(async () => {
    if (!eventId) return;
    setInterestsLoading(true);
    const data = await safeFetch(
      () => api.getInterestsByEvent(eventId, interestsPage, interestsSize),
      fallbackPage,
    );
    setInterests(data || fallbackPage);
    setInterestsLoading(false);
  }, [eventId, interestsPage, interestsSize]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      setTab('tickets');
      setPendingPage(0);
      setTicketsPage(0);
      setInterestsPage(0);
    }, 0);
    return () => clearTimeout(timer);
  }, [open, eventId]);

  useEffect(() => {
    if (open && tab === 'pending') {
      const t = setTimeout(loadPending, 0);
      return () => clearTimeout(t);
    }
  }, [open, tab, loadPending]);

  useEffect(() => {
    if (open && tab === 'tickets') {
      const t = setTimeout(loadTickets, 0);
      return () => clearTimeout(t);
    }
  }, [open, tab, loadTickets]);

  useEffect(() => {
    if (open && tab === 'interests') {
      const t = setTimeout(loadInterests, 0);
      return () => clearTimeout(t);
    }
  }, [open, tab, loadInterests]);

  const handleApprove = async (ticket) => {
    try {
      await api.approveTicket(ticket.id);
      enqueueSnackbar(t('event:ticket_approve_success'), { variant: 'success' });
      await loadPending();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || t('event:ticket_approve_error'), { variant: 'error' });
    }
  };

  const handleReject = async (ticket) => {
    try {
      await api.rejectTicket(ticket.id, {});
      enqueueSnackbar(t('event:ticket_reject_success'), { variant: 'success' });
      await loadPending();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || t('event:ticket_reject_error'), { variant: 'error' });
    }
  };

  const handleApproveAll = async () => {
    try {
      const count = extractData(await api.approveAllPending(eventId));
      enqueueSnackbar(t('event:ticket_approve_all_success', { count: count ?? 0 }), { variant: 'success' });
      await loadPending();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || t('event:ticket_approve_all_error'), { variant: 'error' });
    }
  };

  const handleSendTicketEmails = async () => {
    try {
      const count = extractData(await api.sendIssuedTicketEmails(eventId));
      enqueueSnackbar(t('event:ticket_send_email_success', { count: count ?? 0 }), { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || t('event:ticket_send_email_error'), { variant: 'error' });
    }
  };

  const handleCancel = async (ticket) => {
    if (!ticket?.ticketCode) {
      enqueueSnackbar(t('event:ticket_no_code_error'), { variant: 'error' });
      return;
    }
    try {
      await api.cancelTicket(ticket.ticketCode);
      enqueueSnackbar(t('event:ticket_cancel_success'), { variant: 'success' });
      await loadTickets();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || t('event:ticket_cancel_error'), { variant: 'error' });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ color: 'primary.main', fontWeight: 700 }}>
        {t('event:manage_attendance_title')} {event ? `— ${event.title} (#${event.id})` : ''}
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 1 }}>
          <Tab value="tickets"   label={t('event:tab_all_tickets', { count: tickets.totalItem ?? 0 })} />
          <Tab value="interests" label={t('event:tab_interests', { count: interests.totalItem ?? 0 })} />
        </Tabs>

        {/* ── PENDING TAB ── */}
        {tab === 'pending' && (
          <>
            <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<DoneAllIcon />}
                onClick={handleApproveAll}
                disabled={!pending.totalItem}
              >
                {t('event:btn_approve_all')}
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<MarkEmailReadIcon />}
                onClick={handleSendTicketEmails}
              >
                {t('event:btn_send_ticket_emails')}
              </Button>
            </Stack>

            {pendingLoading ? (
              <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress size={24} /></Stack>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Ticket code</TableCell>
                    <TableCell>Member ID</TableCell>
                    <TableCell>Guest</TableCell>
                    <TableCell>{t('event:col_registered_at')}</TableCell>
                    <TableCell align="right">{t('common:col_actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(pending.items?.length ?? 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          {t('event:pending_empty')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pending.items.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell>{ticket.id}</TableCell>
                        <TableCell>{ticket.ticketCode || '-'}</TableCell>
                        <TableCell>{ticket.memberId ?? '-'}</TableCell>
                        <TableCell>
                          {ticket.guestName || '-'}
                          {ticket.guestEmail ? ` <${ticket.guestEmail}>` : ''}
                        </TableCell>
                        <TableCell>{formatDateTime(ticket.registeredAt)}</TableCell>
                        <TableCell align="right">
                          <Tooltip title={t('event:tooltip_approve')}>
                            <IconButton size="small" color="success" onClick={() => handleApprove(ticket)}>
                              <CheckCircleOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('event:tooltip_reject')}>
                            <IconButton size="small" color="error" onClick={() => handleReject(ticket)}>
                              <DoDisturbAltIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
            <TablePagination
              component="div"
              count={pending.totalItem ?? 0}
              page={pendingPage}
              rowsPerPage={pendingSize}
              onPageChange={(_, p) => setPendingPage(p)}
              onRowsPerPageChange={(e) => { setPendingSize(Number(e.target.value)); setPendingPage(0); }}
              rowsPerPageOptions={[10, 20, 50]}
            />
          </>
        )}

        {/* ── ALL TICKETS TAB ── */}
        {tab === 'tickets' && (
          <>
            {ticketsLoading ? (
              <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress size={24} /></Stack>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Ticket code</TableCell>
                    <TableCell>Member ID</TableCell>
                    <TableCell>Guest</TableCell>
                    <TableCell>{t('common:col_status')}</TableCell>
                    <TableCell>{t('event:col_registered_at')}</TableCell>
                    <TableCell>{t('event:col_checked_in_at')}</TableCell>
                    <TableCell align="right">{t('common:col_actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(tickets.items?.length ?? 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          {t('event:tickets_empty')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    tickets.items.map((ticket) => {
                      const chip = getTicketStatusChip(t, ticket.status);
                      const cancellable = !['CANCELLED', 'USED', 'EXPIRED', 'CHECKED_IN'].includes(
                        String(ticket.status).toUpperCase(),
                      );
                      return (
                        <TableRow key={ticket.id}>
                          <TableCell>{ticket.id}</TableCell>
                          <TableCell>{ticket.ticketCode || '-'}</TableCell>
                          <TableCell>{ticket.memberId ?? '-'}</TableCell>
                          <TableCell>
                            {ticket.guestName || '-'}
                            {ticket.guestEmail ? ` <${ticket.guestEmail}>` : ''}
                          </TableCell>
                          <TableCell>
                            <Chip size="small" color={chip.color} label={chip.label} />
                          </TableCell>
                          <TableCell>{formatDateTime(ticket.registeredAt)}</TableCell>
                          <TableCell>{formatDateTime(ticket.checkedInAt)}</TableCell>
                          <TableCell align="right">
                            {cancellable && (
                              <Tooltip title={t('event:tooltip_cancel_ticket')}>
                                <IconButton size="small" color="warning" onClick={() => handleCancel(ticket)}>
                                  <CancelOutlinedIcon fontSize="small" />
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
              count={tickets.totalItem ?? 0}
              page={ticketsPage}
              rowsPerPage={ticketsSize}
              onPageChange={(_, p) => setTicketsPage(p)}
              onRowsPerPageChange={(e) => { setTicketsSize(Number(e.target.value)); setTicketsPage(0); }}
              rowsPerPageOptions={[10, 20, 50]}
            />
          </>
        )}

        {/* ── INTERESTS TAB ── */}
        {tab === 'interests' && (
          <>
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
                  {(interests.items?.length ?? 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          {t('event:interests_empty')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    interests.items.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell>{i.id}</TableCell>
                        <TableCell>{i.memberId ?? '-'}</TableCell>
                        <TableCell>{formatDateTime(i.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
            <TablePagination
              component="div"
              count={interests.totalItem ?? 0}
              page={interestsPage}
              rowsPerPage={interestsSize}
              onPageChange={(_, p) => setInterestsPage(p)}
              onRowsPerPageChange={(e) => { setInterestsSize(Number(e.target.value)); setInterestsPage(0); }}
              rowsPerPageOptions={[10, 20, 50]}
            />
          </>
        )}

        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {t('common:data_stale_hint')}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="contained" onClick={onClose} sx={{ textTransform: 'none', fontWeight: 700 }}>
          {t('common:btn_close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminEventTicketsDialog;
