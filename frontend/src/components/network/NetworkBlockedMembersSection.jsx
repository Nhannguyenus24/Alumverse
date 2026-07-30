import LoadingSkeleton from '../LoadingSkeleton';
import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Pagination,
  Stack,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';

import SearchBar from '../SearchBar';
import ConfirmDialog from '../ConfirmDialog';
import usePaginationScrollToTop from '../../hooks/usePaginationScrollToTop';
import { useBlockedMembers } from '../../hooks/network/useBlockedMembers';
import { useBlockUser } from '../../hooks/network/useBlockUser';
import NetworkBlockedMemberCard from './NetworkBlockedMemberCard';
import {
  ScrollReveal,
  ScrollRevealGroup,
  ScrollRevealItem,
} from '../animations/ScrollReveal';

const PAGE_SIZE = 5;

const NetworkBlockedMembersSection = () => {
  const { t } = useTranslation('network');
  const [searchInput, setSearchInput] = useState('');
  const [appliedFullName, setAppliedFullName] = useState('');
  const [page, setPage] = useState(1);
  const [unblockTarget, setUnblockTarget] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

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

  useEffect(() => {
    if (isError) {
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  }, [isError, errorMessage, enqueueSnackbar]);

  const renderContent = () => {
    if (isPending) {
      return (
        <Stack alignItems="center" py={4}>
          <LoadingSkeleton />
        </Stack>
      );
    }

    if (isError) {
      return <Typography color="error">{errorMessage}</Typography>;
    }

    if (showEmptyState) {
      return (
        <Alert severity="info">
          {hasActiveCriteria
            ? t('no_blocked_search_results')
            : t('no_blocked_users')}
        </Alert>
      );
    }

    return (
      <ScrollRevealGroup
        stagger={0.07}
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 2,
          opacity: isFetching ? 0.6 : 1,
          transition: 'opacity 0.2s',
        }}
      >
        {items.map((member) => (
          <ScrollRevealItem key={member.blockedMemberId}><NetworkBlockedMemberCard
            member={member}
            onUnblock={() => setUnblockTarget(member)}
            isUnblockLoading={
              isUnblocking && unblockTarget?.blockedMemberId === member.blockedMemberId
            }
          /></ScrollRevealItem>
        ))}
      </ScrollRevealGroup>
    );
  };

  return (
    <Stack spacing={2}>

      <ScrollReveal><SearchBar
        value={searchInput}
        onChange={setSearchInput}
        onKeyDown={handleSearchKeyDown}
        placeholder={t('search_blocked_placeholder')}
      /></ScrollReveal>

      {renderContent()}

      {pageCount > 0 ? (
        <ScrollReveal><Stack direction="row" justifyContent="center" alignItems="center">
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
        </Stack></ScrollReveal>
      ) : null}

      <ConfirmDialog
        open={Boolean(unblockTarget)}
        title={t('unblock_user_title')}
        message={t('unblock_user_confirm', { name: unblockTarget?.fullName ?? t('member_fallback_name') })}
        confirmText={t('unblock')}
        cancelText={t('cancel')}
        confirmColor="error"
        loading={isUnblocking}
        onConfirm={() => unblockUser()}
        onCancel={() => setUnblockTarget(null)}
      />
    </Stack>
  );
};

export default NetworkBlockedMembersSection;
