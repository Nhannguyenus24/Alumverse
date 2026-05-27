import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Pagination,
  Stack,
  Typography,
} from '@mui/material';

import Page from '../../components/Page';
import SearchBar from '../../components/SearchBar';
import NetworkSearchMemberCard from '../../components/network/NetworkSearchMemberCard';
import NetworkMessageDrawer from '../../components/network/NetworkMessageDrawer';
import usePaginationScrollToTop from '../../hooks/usePaginationScrollToTop';
import DynamicFilterBar from '../../components/DynamicFilterBar';
import { useNetworkMembers } from '../../hooks/network/useNetworkMembers';
import { MOCK_NETWORK_DEMO_MEMBERS } from '../../mocks/networkConversationMock';

const FILTERS = [
  {
    type: 'input',
    key: 'program',
    label: 'Program',
    inputMode: 'text',
    placeholder: 'VD: Regular, Advanced Program…',
  },
  {
    type: 'input',
    key: 'major',
    label: 'Major',
    inputMode: 'text',
    placeholder: 'VD: Computer Science…',
  },
  {
    type: 'input',
    key: 'startYear',
    label: 'Khóa',
    inputMode: 'number',
    placeholder: 'VD: 2019',
    min: 1990,
    max: 2035,
  },
];

const PAGE_SIZE = 5;

const NetworkPage = () => {
  const [searchInput, setSearchInput] = useState('');
  const [appliedFullName, setAppliedFullName] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    all: true,
    program: '',
    major: '',
    startYear: '',
  });
  const [messagePeer, setMessagePeer] = useState(null);
  const [isMessageDrawerOpen, setIsMessageDrawerOpen] = useState(false);

  const { items, totalPage, isPending, isFetching, isError, errorMessage } = useNetworkMembers({
    appliedFullName,
    filters,
    page,
    pageSize: PAGE_SIZE,
  });

  const pageCount = totalPage > 0 ? totalPage : 0;
  const safePage = pageCount === 0 ? 1 : Math.min(page, pageCount);

  useEffect(() => {
    if (pageCount === 0) return;
    if (page > pageCount) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPage(pageCount);
    }
  }, [pageCount, page]);

  const handlePageChange = usePaginationScrollToTop({ currentPage: safePage, setPage });

  const handleSearchKeyDown = (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    setAppliedFullName(searchInput.trim());
    setPage(1);
  };

  const hasActiveCriteria = Boolean(appliedFullName) || !filters.all;
  const showDemoSection = safePage === 1 && MOCK_NETWORK_DEMO_MEMBERS.length > 0;
  const showEmptyState =
    !isPending && !isFetching && items.length === 0 && !showDemoSection;

  const handleOpenMessage = useCallback((member) => {
    setMessagePeer({
      memberId: member.memberId,
      fullName: member.fullName,
      avatarUrl: member.avatarUrl,
      startYear: member.startYear,
      program: member.program,
      major: member.major,
    });
    setIsMessageDrawerOpen(true);
  }, []);

  const handleCloseMessage = useCallback(() => {
    setIsMessageDrawerOpen(false);
  }, []);

  return (
    <Page title="Network">
      <Container maxWidth={false} disableGutters sx={{ pb: 6 }}>
        <Container
          maxWidth="lg"
          sx={{
            pt: { xs: 2, sm: 3, md: 4 },
            px: { xs: 2, sm: 3, lg: 6 },
          }}
        >
          <Stack
            spacing={5}
            sx={{
              width: '100%',
              mx: 'auto',
              px: { xs: 1.5, sm: 2, md: 2.75 },
            }}
          >
            <Stack gap={2}>
              <Typography
                variant="h1"
                fontWeight={800}
                color="primary.main"
                sx={{ fontSize: { xs: '1.8rem', md: '2.3rem' } }}
              >
                KẾT NỐI
              </Typography>

                <Typography color="text.secondary">
                  Tìm và kết nối với các sinh viên và các cựu sinh viên trên nền tảng.
                </Typography>
                <DynamicFilterBar
                  config={FILTERS}
                  value={filters}
                  onChange={(next) => {
                    setFilters(next);
                    setPage(1);
                  }}
                />

                <SearchBar
                  value={searchInput}
                  onChange={setSearchInput}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Tìm theo họ tên… (Enter để tìm)"
                />
              </Stack>

              {isError ? (
                <Alert severity="error">{errorMessage}</Alert>
              ) : null}

              {showDemoSection ? (
                <Stack spacing={2}>
                  <Alert severity="info" sx={{ borderRadius: 1.5 }}>
                    <Typography variant="body2" component="span">
                      <strong>Demo mock (không tính phân trang):</strong> 5 card bên dưới (ID
                      9001–9005) để test nhắn tin. Danh sách phân trang phía dưới lấy từ API, mỗi
                      trang tối đa {PAGE_SIZE} người.
                    </Typography>
                  </Alert>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: '1fr 1fr',
                        md: '1fr 1fr 1fr',
                      },
                      gap: 3,
                    }}
                  >
                    {MOCK_NETWORK_DEMO_MEMBERS.map((member) => (
                      <NetworkSearchMemberCard
                        key={member.memberId}
                        avatar={member.avatarUrl}
                        fullName={member.fullName}
                        startYear={member.startYear}
                        program={member.program}
                        major={member.major}
                        isDemo
                        onMessage={() => handleOpenMessage(member)}
                      />
                    ))}
                  </Box>
                </Stack>
              ) : null}

              {isPending ? (
                <Stack alignItems="center" py={6}>
                  <CircularProgress color="primary" />
                </Stack>
              ) : showEmptyState ? (
                <Alert severity="info">
                  {hasActiveCriteria
                    ? 'Không có kết quả phù hợp với tìm kiếm hoặc bộ lọc hiện tại.'
                    : 'Chưa có người để hiển thị.'}
                </Alert>
              ) : items.length > 0 ? (
                <Stack spacing={2}>
                  {showDemoSection ? (
                    <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                      Kết quả tìm kiếm
                    </Typography>
                  ) : null}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: '1fr 1fr',
                        md: '1fr 1fr 1fr',
                      },
                      gap: 3,
                      opacity: isFetching ? 0.6 : 1,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    {items.map((member) => (
                      <NetworkSearchMemberCard
                        key={member.memberId}
                        avatar={member.avatarUrl}
                        fullName={member.fullName}
                        startYear={member.startYear}
                        program={member.program}
                        major={member.major}
                        onMessage={() => handleOpenMessage(member)}
                      />
                    ))}
                  </Box>
                </Stack>
              ) : null}

              {pageCount > 0 ? (
                <Stack
                  direction="row"
                  justifyContent="center"
                  alignItems="center"
                  sx={{ mt: 3.5 }}
                >
                  <Pagination
                    count={pageCount}
                    page={safePage}
                    onChange={handlePageChange}
                    color="primary"
                    shape="rounded"
                    size="large"
                    disabled={isFetching}
                    sx={{
                      '& .MuiPaginationItem-root': {
                        fontWeight: 700,
                        minWidth: 38,
                        height: 38,
                      },
                    }}
                  />
                </Stack>
              ) : null}
          </Stack>
        </Container>
      </Container>

      <NetworkMessageDrawer
        open={isMessageDrawerOpen}
        onClose={handleCloseMessage}
        peer={messagePeer}
      />
    </Page>
  );
};

export default NetworkPage;
