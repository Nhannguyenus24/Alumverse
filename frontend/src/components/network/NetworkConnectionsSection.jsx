import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';


import { useSnackbar } from 'notistack';

import usePaginationScrollToTop from '../../hooks/usePaginationScrollToTop';
import { useNetworkConnections } from '../../hooks/network/useNetworkConnections';
import { useBlockUser } from '../../hooks/network/useBlockUser';



const PAGE_SIZE = 5;

const NetworkConnectionsSection = ({ enableBlock = true }) => {
  const { t } = useTranslation(['network', 'common']);
  const [searchInput, setSearchInput] = useState('');
  const [appliedFullName, setAppliedFullName] = useState('');
  const [page, setPage] = useState(1);
  const [blockTarget, setBlockTarget] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

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
            ? t('network:no_search_results')
            : t('network:no_connections_yet')}
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
        {items.map((connection) => (
          <ScrollRevealItem key={connection.connectionId}><NetworkConnectionCard
            connection={connection}
            enableBlock={enableBlock}
            onBlock={() => setBlockTarget(connection)}
            isBlockLoading={isBlocking && blockTarget?.peerMemberId === connection.peerMemberId}
          /></ScrollRevealItem>
        ))}
      </ScrollRevealGroup>
    );
  };

  return (
    <Stack spacing={2}>
      <ScrollReveal><Typography variant="h4" fontWeight={700}>{t('network:current_connections')}</Typography></ScrollReveal>

      <ScrollReveal><SearchBar
        value={searchInput}
        onChange={setSearchInput}
        onKeyDown={handleSearchKeyDown}
        placeholder={t('network:search_by_name_placeholder')}
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
        open={Boolean(blockTarget)}
        title={t('network:block_user_title')}
        message={(
          <>
            {`${t('network:block_user_confirm_message', { name: blockTarget?.fullName ?? t('network:this_user') })} `}
            <Typography component="strong" variant="inherit" sx={{ color: 'text.primary', fontWeight: 700 }}>
              {t('network:block_user_note')}
            </Typography>
            {` ${t('network:block_user_consequence')}`}
          </>
        )}
        confirmText={t('network:block')}
        cancelText={t('common:cancel')}
        confirmColor="primary"
        loading={isBlocking}
        onConfirm={() => blockUser()}
        onCancel={() => setBlockTarget(null)}
      />
    </Stack>
  );
};

export default NetworkConnectionsSection;
