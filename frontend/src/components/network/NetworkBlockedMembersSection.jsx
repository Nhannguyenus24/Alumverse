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
import { useBlockedMembers } from '../../hooks/network/useBlockedMembers';
import { useBlockUser } from '../../hooks/network/useBlockUser';
import NetworkBlockedMemberCard from './NetworkBlockedMemberCard';

const PAGE_SIZE = 5;

const NetworkBlockedMembersSection = () => {
  const [searchInput, setSearchInput] = useState('');
  const [appliedFullName, setAppliedFullName] = useState('');
  const [page, setPage] = useState(1);
  const [unblockTarget, setUnblockTarget] = useState(null);

  const { items, totalPage, isPending, isFetching, isError, errorMessage } = useBlockedMembers({
    appliedFullName,
    page,
    pageSize: PAGE_SIZE,
  });

  const { unblockUser, isUnblocking } = useBlockUser({
    targetMemberId: unblockTarget?.blockedMemberId ?? null,
    onSuccess: () => setUnblockTarget(null),
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
            ? 'Không có kết quả phù hợp với tìm kiếm hoặc bộ lọc hiện tại.'
            : 'Bạn chưa chặn ai.'}
        </Alert>
      );
    }

    return (
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
          <NetworkBlockedMemberCard
            key={member.blockedMemberId}
            member={member}
            onUnblock={() => setUnblockTarget(member)}
            isUnblockLoading={
              isUnblocking && unblockTarget?.blockedMemberId === member.blockedMemberId
            }
          />
        ))}
      </Box>
    );
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h4" fontWeight={700}>
        Người đã chặn
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
        open={Boolean(unblockTarget)}
        title="Bỏ chặn người dùng"
        message={`Bạn có chắc muốn bỏ chặn ${unblockTarget?.fullName ?? 'người dùng này'}?`}
        confirmText="Bỏ chặn"
        cancelText="Hủy"
        confirmColor="primary"
        loading={isUnblocking}
        onConfirm={() => unblockUser()}
        onCancel={() => setUnblockTarget(null)}
      />
    </Stack>
  );
};

export default NetworkBlockedMembersSection;
