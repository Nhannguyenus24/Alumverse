import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';


import { useParams } from 'react-router';
import { useDebounce } from '../../hooks/useDebounce';
import { useEventParticipants } from '../../hooks/events/useEventParticipants';
import { useCheckInTicket } from '../../hooks/events/useCheckInTicket';
import { useEventQuestions } from '../../hooks/events/useEventQuestions';
import { eventApi } from '../../utils/api';
import { formatDateTime } from '../../utils/dateFormatter';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';

const formatAnswerValue = (value) => {
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
  if (value == null || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const AdminEventOrganizePage = () => {
  const { t } = useTranslation(['admin', 'event', 'common']);
  const { eventId } = useParams();
  const orgNavigate = useOrgNavigate();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [ticketCode, setTicketCode] = useState('');
  const [checkResult, setCheckResult] = useState(null);
  const [checkedTicket, setCheckedTicket] = useState(null);
  const [eventTitle, setEventTitle] = useState('');

  const numericEventId = Number(eventId);

  const { data, isPending, refetch } = useEventParticipants(numericEventId, {
    keyword: debouncedSearch,
    page,
    size,
  });
  const { data: eventQuestions = [] } = useEventQuestions(numericEventId, Boolean(numericEventId));

  const checkInMutation = useCheckInTicket(numericEventId);

  const participants = data?.items ?? [];
  const total = data?.totalItem ?? 0;
  const displayMemberName = (ticket) =>
    ticket.attendeeName || ticket.guestName || (ticket.memberId ? t('admin:event_member_fallback', { id: ticket.memberId }) : '—');
  const displayMemberEmail = (ticket) =>
    ticket.attendeeEmail || ticket.guestEmail || '—';
  const questionById = useMemo(
    () => new Map(eventQuestions.map((question) => [String(question.id), question])),
    [eventQuestions],
  );
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

  useEffect(() => {
    if (!eventId) return;
    eventApi.getEventById(eventId)
      .then((res) => { if (res?.title) setEventTitle(res.title); })
      .catch(() => {});
  }, [eventId]);

  // Accept either a raw ticket code, the encrypted QR token, or a legacy
  // `ALUMVERSE-TICKET-`-prefixed code. The backend decrypts/verifies and enforces
  // the event scope + status, so the client just routes the value correctly.
  const QR_PREFIX_V2 = 'ALUMVERSE-TKT2-';
  const QR_PREFIX_LEGACY = 'ALUMVERSE-TICKET-';
  const buildCheckInPayload = (raw) => {
    const value = raw.trim();
    const upper = value.toUpperCase();
    if (upper.startsWith(QR_PREFIX_V2)) return { qrToken: value };
    if (upper.startsWith(QR_PREFIX_LEGACY)) return { code: value.slice(QR_PREFIX_LEGACY.length).toUpperCase() };
    return { code: upper };
  };

  const handleCheckIn = async () => {
    const raw = ticketCode.trim();
    if (!raw) return;
    setCheckResult(null);
    setCheckedTicket(null);
    try {
      const ticket = await checkInMutation.mutateAsync(buildCheckInPayload(raw));
      setCheckedTicket(ticket);
      setCheckResult({ type: 'success', message: t('admin:event_checkin_success', { code: ticket?.ticketCode || '' }) });
      setTicketCode('');
      refetch();
    } catch (err) {
      const msg = err?.response?.data?.message || t('admin:event_ticket_not_found');
      setCheckResult({ type: 'error', message: msg });
    }
  };

  return (
    <Page title={t('admin:organize_event_title')}>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={() => orgNavigate('/admin/events')} color="primary">
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h4" fontWeight={800} color="primary.main">
                {t('admin:organize_event_title')}
              </Typography>
              {eventTitle && (
                <Typography variant="body2" color="text.secondary">{eventTitle}</Typography>
              )}
            </Box>
          </Box>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
              {t('admin:event_checkin_title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('admin:event_checkin_help')}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField
                fullWidth
                label={t('admin:event_ticket_code')}
                value={ticketCode}
                onChange={(e) => setTicketCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCheckIn()}
              />
              <Button
                variant="contained"
                color="accent"
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
            {checkedTicket && checkResult?.type === 'success' && (
              <Paper variant="outlined" sx={{ mt: 2, p: 2, borderColor: 'success.main' }}>
                <Typography variant="overline" color="success.main">
                  {t('admin:event_checkin_verify_title')}
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                  <Avatar
                    src={checkedTicket.attendeeAvatarUrl || undefined}
                    sx={{ width: 56, height: 56 }}
                  >
                    {(checkedTicket.attendeeName || checkedTicket.guestName || '?').charAt(0)}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle1" fontWeight={700} noWrap>
                      {checkedTicket.attendeeName || checkedTicket.guestName || (checkedTicket.memberId ? t('admin:event_member_fallback', { id: checkedTicket.memberId }) : '—')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {checkedTicket.attendeeEmail || checkedTicket.guestEmail || '-'}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 0.75 }} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Chip size="small" label={checkedTicket.ticketCode} />
                      <Chip
                        size="small"
                        color="success"
                        label={t('admin:event_checked_in_at', { time: formatDateTime(checkedTicket.checkedInAt) })}
                      />
                    </Stack>
                  </Box>
                </Stack>
              </Paper>
            )}
          </Paper>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6" fontWeight={700}>
              {t('admin:event_participants_list', { count: total })}
            </Typography>
          </Box>

          <SearchBar value={search} onChange={setSearch} placeholder={t('admin:event_search_placeholder')} />

          <AdminDataTable
            columns={[
              { id: 'ticketCode', label: t('admin:event_col_ticket_code'), render: (value) => value || '—' },
              { id: 'guest', label: t('admin:event_col_guest'), render: (_, row) => displayMemberName(row) },
              { id: 'email', label: 'Email', render: (_, row) => displayMemberEmail(row) },
              { id: 'status', label: t('admin:col_status'), render: (value) => <AdminStatusChip status={value} category="ticket" /> },
              { id: 'registeredAt', label: t('admin:event_col_registered_at'), render: (value) => formatDateTime(value) },
            ]}
            rows={participants}
            totalCount={total}
            page={page}
            rowsPerPage={size}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={(e) => { setSize(parseInt(e.target.value, 10)); setPage(0); }}
            loading={isPending}
            emptyMessage={t('admin:event_no_attendees')}
            renderExpandableRow={(ticket) => {
              const answers = ticket.registrationAnswers;
              if (!answers?.length) {
                return <Typography variant="body2" color="text.secondary">—</Typography>;
              }
              return (
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                    {t('admin:ticket_answers', { code: ticket.ticketCode })}
                  </Typography>
                  {answers.map((a, idx) => (
                    <Box
                      key={`${a?.questionId ?? idx}-${idx}`}
                      sx={{
                        p: 1.5,
                        mb: 1,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.default',
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>
                        {getAnswerQuestionLabel(a, idx)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
                        {t('admin:event_answer_response_label')}
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                        {formatAnswerValue(a.value)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              );
            }}
          />
        </Stack>
      </Container>
    </Page>
  );
};

export default AdminEventOrganizePage;
