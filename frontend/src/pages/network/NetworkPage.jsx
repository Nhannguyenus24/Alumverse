import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Pagination,
  Stack,
  Typography,
} from '@mui/material';

import NetworkSectionLayout from '../../components/network/NetworkSectionLayout';
import SearchBar from '../../components/SearchBar';
import NetworkSearchMemberCard from '../../components/network/NetworkSearchMemberCard';
import NetworkMessageDrawer from '../../components/network/NetworkMessageDrawer';
import usePaginationScrollToTop from '../../hooks/usePaginationScrollToTop';
import DynamicFilterBar from '../../components/DynamicFilterBar';
import { useNetworkMembers } from '../../hooks/network/useNetworkMembers';
import { useCheckConversationRequestStatus } from '../../hooks/network/useCheckConversationRequestStatus';
import { useNotification } from '../../hooks/useNotification';

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
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [isMessageDrawerOpen, setIsMessageDrawerOpen] = useState(false);
  const [checkingMemberId, setCheckingMemberId] = useState(null);

  const { showError } = useNotification();
  const { checkStatus } = useCheckConversationRequestStatus();

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
  const showEmptyState = !isPending && !isFetching && items.length === 0;

  const handleOpenMessage = useCallback(
    async (member) => {
      setCheckingMemberId(member.memberId);

      try {
        const result = await checkStatus(member.memberId);

        setMessagePeer({
          memberId: member.memberId,
          fullName: member.fullName,
          avatarUrl: member.avatarUrl,
          startYear: member.startYear,
          program: member.program,
          major: member.major,
        });
        setConnectionStatus(result);
        setIsMessageDrawerOpen(true);
      } catch {
        showError('Không thể kiểm tra trạng thái kết nối. Vui lòng thử lại.');
      } finally {
        setCheckingMemberId(null);
      }
    },
    [checkStatus, showError],
  );

  const handleCloseMessage = useCallback(() => {
    setIsMessageDrawerOpen(false);
    setConnectionStatus(null);
  }, []);

  return (
    <NetworkSectionLayout title="Network">
      <Stack spacing={2}>
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

      {isError ? <Alert severity="error">{errorMessage}</Alert> : null}

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
              isMessageLoading={checkingMemberId === member.memberId}
            />
          ))}
        </Box>
      ) : null}

      {pageCount > 0 ? (
        <Stack direction="row" justifyContent="center" alignItems="center">
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

      <NetworkMessageDrawer
        open={isMessageDrawerOpen}
        onClose={handleCloseMessage}
        peer={messagePeer}
        connectionStatus={connectionStatus}
      />
    </NetworkSectionLayout>
  );
};

export default NetworkPage;
