import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useParams } from 'react-router';
import Page from '../../components/Page';
import SearchBar from '../../components/SearchBar';
import { useDebounce } from '../../hooks/useDebounce';
import { useEventParticipants } from '../../hooks/events/useEventParticipants';
import { useCheckInTicket } from '../../hooks/events/useCheckInTicket';
import { eventApi } from '../../utils/api';
import { formatDateTime } from '../../utils/dateFormatter';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';

const statusChip = (status) => {
  const key = String(status || '').toUpperCase();
  if (key === 'ISSUED') return { color: 'info', label: 'Đã cấp vé' };
  if (key === 'USED' || key === 'CHECKED_IN') return { color: 'success', label: 'Đã check-in' };
  if (key === 'CANCELLED') return { color: 'error', label: 'Đã huỷ' };
  return { color: 'default', label: status || '-' };
};

const AdminEventOrganizePage = () => {
  const { eventId } = useParams();
  const orgNavigate = useOrgNavigate();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [ticketCode, setTicketCode] = useState('');
  const [checkResult, setCheckResult] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [eventTitle, setEventTitle] = useState('');

  const numericEventId = Number(eventId);

  const { data, isPending, refetch } = useEventParticipants(numericEventId, {
    keyword: debouncedSearch,
    page,
    size,
  });

  const checkInMutation = useCheckInTicket(numericEventId);

  const participants = data?.items ?? [];
  const total = data?.totalItem ?? 0;

  useEffect(() => {
    if (!eventId) return;
    eventApi.getEventById(eventId)
      .then((res) => { if (res?.title) setEventTitle(res.title); })
      .catch(() => {});
  }, [eventId]);

  const handleCheckIn = async () => {
    const code = ticketCode.trim().toUpperCase();
    if (!code) return;
    setCheckResult(null);
    try {
      const ticket = await eventApi.getTicketByCode(code);
      if (Number(ticket.eventId) !== numericEventId) {
        setCheckResult({ type: 'error', message: 'Vé không thuộc sự kiện này.' });
        return;
      }
      if (['USED', 'CHECKED_IN'].includes(String(ticket.status).toUpperCase())) {
        setCheckResult({ type: 'warning', message: 'Vé đã được check-in trước đó.' });
        return;
      }
      if (String(ticket.status).toUpperCase() === 'CANCELLED') {
        setCheckResult({ type: 'error', message: 'Vé đã bị huỷ.' });
        return;
      }
      await checkInMutation.mutateAsync(code);
      setCheckResult({ type: 'success', message: `Check-in thành công: ${code}` });
      setTicketCode('');
      refetch();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Không tìm thấy vé hoặc check-in thất bại.';
      setCheckResult({ type: 'error', message: msg });
    }
  };

  return (
    <Page title="Tổ chức sự kiện">
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={() => orgNavigate('/admin/events')} color="primary">
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h4" fontWeight={800} color="primary.main">
                Tổ chức sự kiện
              </Typography>
              {eventTitle && (
                <Typography variant="body2" color="text.secondary">{eventTitle}</Typography>
              )}
            </Box>
          </Box>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Check-in tham dự
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField
                fullWidth
                label="Mã vé"
                value={ticketCode}
                onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleCheckIn()}
              />
              <Button
                variant="contained"
                onClick={handleCheckIn}
                disabled={checkInMutation.isPending || !ticketCode.trim()}
                sx={{ minWidth: 140 }}
              >
                {checkInMutation.isPending ? <CircularProgress size={22} color="inherit" /> : 'Check-in'}
              </Button>
            </Stack>
            {checkResult && (
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                {checkResult.type === 'success' ? (
                  <CheckCircleOutlineIcon color="success" />
                ) : (
                  <ErrorOutlineIcon color={checkResult.type === 'warning' ? 'warning' : 'error'} />
                )}
                <Typography variant="body2">{checkResult.message}</Typography>
              </Box>
            )}
          </Paper>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6" fontWeight={700}>
              Danh sách người tham gia ({total})
            </Typography>
          </Box>

          <SearchBar value={search} onChange={setSearch} placeholder="Tìm theo tên, email, mã vé..." />

          <Paper variant="outlined">
            {isPending ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Mã vé</TableCell>
                      <TableCell>Khách / Thành viên</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Trạng thái</TableCell>
                      <TableCell>Đăng ký lúc</TableCell>
                      <TableCell align="right">Chi tiết</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {participants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography color="text.secondary" sx={{ py: 2 }}>Không có người tham gia.</Typography>
                        </TableCell>
                      </TableRow>
                    ) : participants.map((ticket) => {
                      const chip = statusChip(ticket.status);
                      const displayName = ticket.guestName || `Member #${ticket.memberId}`;
                      const displayEmail = ticket.guestEmail || '-';
                      const answers = ticket.registrationAnswers;
                      return (
                        <TableRow key={ticket.id} hover>
                          <TableCell>{ticket.ticketCode}</TableCell>
                          <TableCell>{displayName}</TableCell>
                          <TableCell>{displayEmail}</TableCell>
                          <TableCell><Chip size="small" color={chip.color} label={chip.label} /></TableCell>
                          <TableCell>{formatDateTime(ticket.registeredAt)}</TableCell>
                          <TableCell align="right">
                            {answers?.length > 0 ? (
                              <Button size="small" onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}>
                                {expandedId === ticket.id ? 'Ẩn' : 'Câu trả lời'}
                              </Button>
                            ) : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {participants.map((ticket) => {
                  const answers = ticket.registrationAnswers;
                  if (!answers?.length) return null;
                  return (
                    <Collapse key={`answers-${ticket.id}`} in={expandedId === ticket.id}>
                      <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                          Câu trả lời — {ticket.ticketCode}
                        </Typography>
                        {answers.map((a, idx) => (
                          <Typography key={idx} variant="body2" sx={{ mb: 0.5 }}>
                            <strong>#{a.questionId}:</strong>{' '}
                            {Array.isArray(a.value) ? a.value.join(', ') : String(a.value)}
                          </Typography>
                        ))}
                      </Box>
                    </Collapse>
                  );
                })}
                <TablePagination
                  component="div"
                  count={total}
                  page={page}
                  onPageChange={(_, p) => setPage(p)}
                  rowsPerPage={size}
                  onRowsPerPageChange={(e) => { setSize(parseInt(e.target.value, 10)); setPage(0); }}
                  rowsPerPageOptions={[5, 10, 25]}
                />
              </>
            )}
          </Paper>
        </Stack>
      </Container>
    </Page>
  );
};

export default AdminEventOrganizePage;
