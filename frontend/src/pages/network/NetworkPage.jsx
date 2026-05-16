import { useEffect, useState } from 'react';
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
import usePaginationScrollToTop from '../../hooks/usePaginationScrollToTop';
import DynamicFilterBar from '../../components/DynamicFilterBar';
import { useNetworkMembers } from '../../hooks/network/useNetworkMembers';

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

const PAGE_SIZE = 9;

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
  const showEmptyState = !isPending && !isFetching && items.length === 0;

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

              <Stack spacing={3}>
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
              ) : (
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
                    />
                  ))}
                </Box>
              )}

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
          </Stack>
        </Container>
      </Container>
    </Page>
  );
};

export default NetworkPage;
