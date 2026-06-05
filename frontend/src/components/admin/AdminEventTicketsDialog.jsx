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

const ticketStatusChip = (status) => {
  const key = String(status || '').toUpperCase();
  if (key === 'PENDING')    return { color: 'warning',  label: 'Chờ duyệt' };
  if (key === 'ISSUED')     return { color: 'info',     label: 'Đã phát hành' };
  if (key === 'ACTIVE')     return { color: 'success',  label: 'Active' };
  if (key === 'CHECKED_IN') return { color: 'success',  label: 'Checked-in' };
  if (key === 'USED')       return { color: 'default',  label: 'Đã dùng' };
  if (key === 'EXPIRED')    return { color: 'default',  label: 'Hết hạn' };
  if (key === 'CANCELLED')  return { color: 'error',    label: 'Đã huỷ' };
  return { color: 'default', label: status || '-' };
};

const AdminEventTicketsDialog = ({ open, event, onClose }) => {
  const { enqueueSnackbar } = useSnackbar();
  const eventId = event?.id ?? null;

  const [tab, setTab] = useState('pending');

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
      setTab('pending');
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
      enqueueSnackbar('Đã duyệt vé.', { variant: 'success' });
      await loadPending();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Duyệt thất bại.', { variant: 'error' });
    }
  };

  const handleReject = async (ticket) => {
    try {
      await api.rejectTicket(ticket.id, {});
      enqueueSnackbar('Đã từ chối.', { variant: 'success' });
      await loadPending();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Từ chối thất bại.', { variant: 'error' });
    }
  };

  const handleApproveAll = async () => {
    try {
      const count = extractData(await api.approveAllPending(eventId));
      enqueueSnackbar(`Đã duyệt ${count ?? 0} vé.`, { variant: 'success' });
      await loadPending();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Duyệt hàng loạt thất bại.', { variant: 'error' });
    }
  };

  const handleSendTicketEmails = async () => {
    try {
      const count = extractData(await api.sendIssuedTicketEmails(eventId));
      enqueueSnackbar(`Đã gửi mail vé cho ${count ?? 0} người.`, { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Gửi mail thất bại.', { variant: 'error' });
    }
  };

  const handleCancel = async (ticket) => {
    if (!ticket?.ticketCode) {
      enqueueSnackbar('Không có ticket code.', { variant: 'error' });
      return;
    }
    try {
      await api.cancelTicket(ticket.ticketCode);
      enqueueSnackbar('Đã huỷ vé.', { variant: 'success' });
      await loadTickets();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Huỷ thất bại.', { variant: 'error' });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ color: 'primary.main', fontWeight: 700 }}>
        Quản lý tham dự {event ? `— ${event.title} (#${event.id})` : ''}
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 1 }}>
          <Tab value="pending"    label={`Chờ duyệt (${pending.totalItem ?? 0})`} />
          <Tab value="tickets"   label={`Tất cả vé (${tickets.totalItem ?? 0})`} />
          <Tab value="interests" label={`Quan tâm (${interests.totalItem ?? 0})`} />
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
                Duyệt tất cả
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<MarkEmailReadIcon />}
                onClick={handleSendTicketEmails}
              >
                Gửi mail vé (ISSUED)
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
                    <TableCell>Đăng ký lúc</TableCell>
                    <TableCell align="right">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(pending.items?.length ?? 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          Không có yêu cầu chờ duyệt.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pending.items.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{t.id}</TableCell>
                        <TableCell>{t.ticketCode || '-'}</TableCell>
                        <TableCell>{t.memberId ?? '-'}</TableCell>
                        <TableCell>
                          {t.guestName || '-'}
                          {t.guestEmail ? ` <${t.guestEmail}>` : ''}
                        </TableCell>
                        <TableCell>{formatDateTime(t.registeredAt)}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Duyệt">
                            <IconButton size="small" color="success" onClick={() => handleApprove(t)}>
                              <CheckCircleOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Từ chối">
                            <IconButton size="small" color="error" onClick={() => handleReject(t)}>
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
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Đăng ký lúc</TableCell>
                    <TableCell>Check-in lúc</TableCell>
                    <TableCell align="right">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(tickets.items?.length ?? 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          Chưa có vé nào.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    tickets.items.map((t) => {
                      const chip = ticketStatusChip(t.status);
                      const cancellable = !['CANCELLED', 'USED', 'EXPIRED', 'CHECKED_IN'].includes(
                        String(t.status).toUpperCase(),
                      );
                      return (
                        <TableRow key={t.id}>
                          <TableCell>{t.id}</TableCell>
                          <TableCell>{t.ticketCode || '-'}</TableCell>
                          <TableCell>{t.memberId ?? '-'}</TableCell>
                          <TableCell>
                            {t.guestName || '-'}
                            {t.guestEmail ? ` <${t.guestEmail}>` : ''}
                          </TableCell>
                          <TableCell>
                            <Chip size="small" color={chip.color} label={chip.label} />
                          </TableCell>
                          <TableCell>{formatDateTime(t.registeredAt)}</TableCell>
                          <TableCell>{formatDateTime(t.checkedInAt)}</TableCell>
                          <TableCell align="right">
                            {cancellable && (
                              <Tooltip title="Huỷ vé">
                                <IconButton size="small" color="warning" onClick={() => handleCancel(t)}>
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
                    <TableCell>Thời gian</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(interests.items?.length ?? 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          Chưa có ai quan tâm.
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
            Dữ liệu tại thời điểm mở dialog — mở lại để refresh.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="contained" onClick={onClose} sx={{ textTransform: 'none', fontWeight: 700 }}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminEventTicketsDialog;
