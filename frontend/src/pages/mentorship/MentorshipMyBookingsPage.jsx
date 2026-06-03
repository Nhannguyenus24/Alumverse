import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import Page from '../../components/Page';
import MentorshipBookingItem from '../../components/mentorship/MentorshipBookingItem';
import { useMyMenteeSessions } from '../../hooks/mentorship/useMyMenteeSessions';
import { useCancelMenteeSession } from '../../hooks/mentorship/useCancelMenteeSession';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';

const ACTIVE_STATUSES = new Set(['PENDING', 'CONFIRMED']);
const CANCELLED_STATUSES = new Set(['CANCELLED', 'CANCELLED_BY_MENTEE', 'CANCELLED_BY_MENTOR', 'REJECTED']);

const TAB_FILTERS = [
  { key: 'all', label: 'Tất cả', match: () => true },
  { key: 'upcoming', label: 'Sắp tới', match: (s) => ACTIVE_STATUSES.has(s.status) },
  { key: 'completed', label: 'Đã hoàn thành', match: (s) => s.status === 'COMPLETED' },
  { key: 'cancelled', label: 'Đã hủy / từ chối', match: (s) => CANCELLED_STATUSES.has(s.status) },
];

const PAGE_SIZE = 10;

const MentorshipMyBookingsPage = () => {
  const navigate = useOrgNavigate();
  const [tabKey, setTabKey] = useState('all');
  const [page, setPage] = useState(0);

  const sessionsQuery = useMyMenteeSessions({ page, limit: PAGE_SIZE });
  const cancelMutation = useCancelMenteeSession();

  const paginated = sessionsQuery.data;
  const items = useMemo(() => paginated?.items ?? [], [paginated?.items]);

  const visibleItems = useMemo(() => {
    const matcher = TAB_FILTERS.find((t) => t.key === tabKey)?.match ?? (() => true);
    return items.filter(matcher);
  }, [items, tabKey]);

  const handleCancel = async (session) => {
     
    const ok = window.confirm('Bạn chắc chắn muốn hủy lịch hẹn này?');
    if (!ok) return;
    try {
      await cancelMutation.cancelSession(session.id);
    } catch {
      /* error surfaced via cancelMutation.errorMessage */
    }
  };

  return (
    <Page title="Lịch hẹn của tôi">
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/development/mentorship')}
          sx={{ mb: 2, textTransform: 'none' }}
          color="inherit"
        >
          Về trang Cố vấn
        </Button>

        <Typography variant="h2" fontWeight={800} color="primary.main" mb={1}>
          LỊCH HẸN CỦA TÔI
        </Typography>
        <Typography color="text.secondary" mb={4}>
          Quản lý các buổi tư vấn bạn đã đặt với mentor.
        </Typography>

        {cancelMutation.errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {cancelMutation.errorMessage}
          </Alert>
        )}

        <Tabs
          value={tabKey}
          onChange={(_, v) => setTabKey(v)}
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
          variant="scrollable"
          scrollButtons="auto"
        >
          {TAB_FILTERS.map((t) => (
            <Tab key={t.key} value={t.key} label={t.label} />
          ))}
        </Tabs>

        {sessionsQuery.isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : sessionsQuery.isError ? (
          <Alert severity="error">Không tải được danh sách lịch hẹn. Vui lòng thử lại.</Alert>
        ) : visibleItems.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography color="text.secondary" mb={2}>
              {items.length === 0
                ? 'Bạn chưa đặt lịch hẹn nào với mentor.'
                : 'Không có lịch hẹn nào trong mục này.'}
            </Typography>
            {items.length === 0 && (
              <Button
                variant="contained"
                onClick={() => navigate('/development/mentorship')}
              >
                Tìm mentor
              </Button>
            )}
          </Box>
        ) : (
          <Stack spacing={2}>
            {visibleItems.map((session) => (
              <MentorshipBookingItem
                key={session.id}
                session={session}
                onCancel={handleCancel}
                cancelDisabled={cancelMutation.isPending}
              />
            ))}
          </Stack>
        )}

        {paginated && paginated.totalPage > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 4 }}>
            <Button
              variant="outlined"
              disabled={!paginated.hasPrevious}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Trước
            </Button>
            <Typography sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
              {paginated.currentPage + 1} / {paginated.totalPage}
            </Typography>
            <Button
              variant="outlined"
              disabled={!paginated.hasNext}
              onClick={() => setPage((p) => p + 1)}
            >
              Sau
            </Button>
          </Box>
        )}
      </Container>
    </Page>
  );
};

export default MentorshipMyBookingsPage;
