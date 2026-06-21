import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Pagination,
  Stack,
  Typography,
} from '@mui/material';

import SearchBar from '../SearchBar';
import ConfirmDialog from '../ConfirmDialog';
import usePaginationScrollToTop from '../../hooks/usePaginationScrollToTop';
import { useNetworkConnections } from '../../hooks/network/useNetworkConnections';
import { useBlockUser } from '../../hooks/network/useBlockUser';
import NetworkConnectionCard from './NetworkConnectionCard';

const PAGE_SIZE = 5;

const NetworkConnectionsSection = ({ enableBlock = true }) => {
  const [searchInput, setSearchInput] = useState('');
  const [appliedFullName, setAppliedFullName] = useState('');
  const [page, setPage] = useState(1);
  const [blockTarget, setBlockTarget] = useState(null);

  const { items, totalPage, isPending, isFetching, isError, errorMessage } = useNetworkConnections({
    appliedFullName,
    page,
    pageSize: PAGE_SIZE,
  });

  const { blockUser, isBlocking } = useBlockUser({
    targetMemberId: blockTarget?.peerMemberId ?? null,
    onSuccess: () => setBlockTarget(null),
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

  const hasActiveCriteria = Boolean(appliedFullName);
  const showEmptyState = !isPending && !isFetching && items.length === 0;

  const renderContent = () => {
    if (isPending) {
      return (
        <Stack alignItems="center" py={4}>
          <CircularProgress />
        </Stack>
      );
    }

    if (isError) {
      return <Alert severity="error">{errorMessage}</Alert>;
    }

    if (showEmptyState) {
      return (
        <Alert severity="info">
          {hasActiveCriteria
            ? 'Không có kết quả phù hợp với tìm kiếm hiện tại.'
            : 'Chưa có kết nối nào.'}
        </Alert>
      );
    }

    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 2,
          opacity: isFetching ? 0.6 : 1,
          transition: 'opacity 0.2s',
        }}
      >
        {items.map((connection) => (
          <NetworkConnectionCard
            key={connection.connectionId}
            connection={connection}
            enableBlock={enableBlock}
            onBlock={() => setBlockTarget(connection)}
            isBlockLoading={isBlocking && blockTarget?.peerMemberId === connection.peerMemberId}
          />
        ))}
      </Box>
    );
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h4" fontWeight={700}>
        Kết nối hiện tại
      </Typography>

      <SearchBar
        value={searchInput}
        onChange={setSearchInput}
        onKeyDown={handleSearchKeyDown}
        placeholder="Tìm theo họ tên… (Enter để tìm)"
      />

      {renderContent()}

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

      <ConfirmDialog
        open={Boolean(blockTarget)}
        title="Chặn người dùng"
        message={(
          <>
            {`Bạn có chắc muốn chặn ${blockTarget?.fullName ?? 'người dùng này'}? `}
            <strong style={{ color: 'rgba(0, 0, 0, 0.87)' }}>
              Lưu ý: việc chặn chỉ áp dụng trong Kết nối và Nhắn tin.
            </strong>
            {' Bạn sẽ không thể gửi tin nhắn cho họ.'}
          </>
        )}
        confirmText="Chặn"
        cancelText="Hủy"
        confirmColor="primary"
        loading={isBlocking}
        onConfirm={() => blockUser()}
        onCancel={() => setBlockTarget(null)}
      />
    </Stack>
  );
};

export default NetworkConnectionsSection;
