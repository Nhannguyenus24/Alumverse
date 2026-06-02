import { useCallback, useEffect, useState } from 'react';
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

const ticketStatusChip = (status) => {
  const key = String(status || '').toUpperCase();
  if (key === 'REGISTERED') return { color: 'primary', label: 'Registered' };
  if (key === 'CHECKED_IN') return { color: 'success', label: 'Checked-in' };
  if (key === 'CANCELLED') return { color: 'default', label: 'Cancelled' };
  return { color: 'default', label: status || '-' };
};

const AdminEventTicketsDialog = ({ open, event, onClose }) => {
  const { enqueueSnackbar } = useSnackbar();
  const eventId = event?.id ?? null;

  const [tab, setTab] = useState('tickets');

  const [tickets, setTickets] = useState(fallbackPage);
  const [ticketsPage, setTicketsPage] = useState(0);
  const [ticketsSize, setTicketsSize] = useState(10);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  const [interests, setInterests] = useState(fallbackPage);
  const [interestsPage, setInterestsPage] = useState(0);
  const [interestsSize, setInterestsSize] = useState(10);
  const [interestsLoading, setInterestsLoading] = useState(false);

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
      setTicketsPage(0);
      setInterestsPage(0);
    }, 0);
    return () => clearTimeout(timer);
  }, [open, eventId]);

  useEffect(() => {
    if (open && tab === 'tickets') {
      const timer = setTimeout(loadTickets, 0);
      return () => clearTimeout(timer);
    }
  }, [open, tab, loadTickets]);

  useEffect(() => {
    if (open && tab === 'interests') {
      const timer = setTimeout(loadInterests, 0);
      return () => clearTimeout(timer);
    }
  }, [open, tab, loadInterests]);

  const handleCancel = async (ticket) => {
    if (!ticket?.ticketCode) {
      enqueueSnackbar('Ticket code missing — cannot cancel.', { variant: 'error' });
      return;
    }
    try {
      await api.cancelTicket(ticket.ticketCode);
      enqueueSnackbar('Ticket cancelled.', { variant: 'success' });
      await loadTickets();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to cancel ticket.';
      enqueueSnackbar(msg, { variant: 'error' });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ color: 'primary.main', fontWeight: 700 }}>
        Event participants {event ? `— ${event.title} (#${event.id})` : ''}
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 1 }}>
          <Tab value="tickets" label={`Tickets (${tickets.totalItem ?? 0})`} />
          <Tab value="interests" label={`Interests (${interests.totalItem ?? 0})`} />
        </Tabs>

        {tab === 'tickets' ? (
          <>
            {ticketsLoading ? (
              <Stack alignItems="center" sx={{ py: 4 }}>
                <CircularProgress size={24} />
              </Stack>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Ticket code</TableCell>
                    <TableCell>Member ID</TableCell>
                    <TableCell>Guest</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Registered at</TableCell>
                    <TableCell>Checked-in at</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(tickets.items?.length ?? 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          No tickets registered.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    tickets.items.map((t) => {
                      const chip = ticketStatusChip(t.status);
                      const cancellable = String(t.status).toUpperCase() === 'REGISTERED';
                      return (
                        <TableRow key={t.id}>
                          <TableCell>{t.id}</TableCell>
                          <TableCell>{t.ticketCode || '-'}</TableCell>
                          <TableCell>{t.memberId ?? '-'}</TableCell>
                          <TableCell>
                            {t.guestName ? `${t.guestName}` : '-'}
                            {t.guestEmail ? ` <${t.guestEmail}>` : ''}
                          </TableCell>
                          <TableCell>
                            <Chip size="small" color={chip.color} label={chip.label} />
                          </TableCell>
                          <TableCell>{formatDateTime(t.registeredAt)}</TableCell>
                          <TableCell>{formatDateTime(t.checkedInAt)}</TableCell>
                          <TableCell align="right">
                            {cancellable ? (
                              <Tooltip title="Cancel ticket">
                                <IconButton size="small" color="warning" onClick={() => handleCancel(t)}>
                                  <CancelOutlinedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            ) : null}
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
              onRowsPerPageChange={(e) => {
                setTicketsSize(Number(e.target.value));
                setTicketsPage(0);
              }}
              rowsPerPageOptions={[10, 20, 50]}
            />
          </>
        ) : (
          <>
            {interestsLoading ? (
              <Stack alignItems="center" sx={{ py: 4 }}>
                <CircularProgress size={24} />
              </Stack>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Member ID</TableCell>
                    <TableCell>Created at</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(interests.items?.length ?? 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          No interests recorded.
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
              onRowsPerPageChange={(e) => {
                setInterestsSize(Number(e.target.value));
                setInterestsPage(0);
              }}
              rowsPerPageOptions={[10, 20, 50]}
            />
          </>
        )}

        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Snapshot at the moment of fetch — re-open the dialog to refresh.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="contained" onClick={onClose} sx={{ textTransform: 'none', fontWeight: 700 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminEventTicketsDialog;
