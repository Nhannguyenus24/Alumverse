import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import ConfirmDialog from '../../components/ConfirmDialog';
import usePaginationScrollToTop from '../../hooks/usePaginationScrollToTop';
import DynamicFilterBar from '../../components/DynamicFilterBar';
import { useNetworkMembers } from '../../hooks/network/useNetworkMembers';
import { useCheckConversationRequestStatus } from '../../hooks/network/useCheckConversationRequestStatus';
import { useNetworkCurrentMemberId } from '../../hooks/network/useNetworkCurrentMemberId';
import { useBlockUser } from '../../hooks/network/useBlockUser';
import { useNotification } from '../../hooks/useNotification';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import useOrganizationStore from '../../stores/organizationStore';
import { CONVERSATION_REQUEST_STATUS } from '../../constants/conversationRequestStatus';

const PAGE_SIZE = 9;

const NetworkPage = () => {
  const { t } = useTranslation(['network', 'common']);
  const [searchInput, setSearchInput] = useState('');
  const [appliedFullName, setAppliedFullName] = useState('');
  const [page, setPage] = useState(1);
  // Default to the current member's own organization (guaranteed loaded by
  // RequireSlugRoute before this page mounts). Users broaden via the filter
  // bar — pick more orgs, or "Tất cả" to see every organization.
  const [filters, setFilters] = useState(() => {
    const currentOrgId = useOrganizationStore.getState().organization?.id;
    return currentOrgId
      ? { all: false, program: '', major: '', organizationIds: [currentOrgId] }
      : { all: true, program: '', major: '', organizationIds: [] };
  });
  const [messagePeer, setMessagePeer] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [isMessageDrawerOpen, setIsMessageDrawerOpen] = useState(false);
  const [checkingUserId, setCheckingUserId] = useState(null);
  const [blockTarget, setBlockTarget] = useState(null);

  const filters_config = useMemo(() => [
    {
      type: 'input',
      key: 'program',
      label: t('network:filter_program_label'),
      inputMode: 'text',
      placeholder: t('network:filter_program_placeholder'),
    },
    {
      type: 'input',
      key: 'major',
      label: t('network:filter_major_label'),
      inputMode: 'text',
      placeholder: t('network:filter_major_placeholder'),
    },
  ], [t]);

  const navigate = useOrgNavigate();
  const currentMemberId = useNetworkCurrentMemberId();

  const { showError, showInfo } = useNotification();
  const { checkStatus } = useCheckConversationRequestStatus();
  const { blockUser, isBlocking } = useBlockUser({
    targetMemberId: blockTarget?.userId ?? null,
    onSuccess: () => setBlockTarget(null),
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

  const handleSearchKeyDown = useCallback((event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    setAppliedFullName(searchInput.trim());
    setPage(1);
  }, [searchInput]);

  const handleFilterChange = useCallback((next) => {
    setFilters(next);
    setPage(1);
  }, []);

  const hasActiveCriteria = Boolean(appliedFullName) || !filters.all;
  const showEmptyState = !isPending && !isFetching && items.length === 0;

  const handleOpenMessage = useCallback(
    async (member) => {
      if (String(member.userId) === String(currentMemberId)) {
        showInfo(t('network:self_profile_message'));
        return;
      }

      setCheckingUserId(member.userId);

      try {
        const result = await checkStatus(member.userId);
        if (result?.status === CONVERSATION_REQUEST_STATUS.ACCEPTED) {
          navigate(`/chat?memberId=${member.userId}`);
          return;
        }

        setMessagePeer({
          userId: member.userId,
          fullName: member.fullName,
          avatarUrl: member.avatarUrl,
          program: member.program,
          major: member.major,
        });
        setConnectionStatus(result);
        setIsMessageDrawerOpen(true);
      } catch {
        showError(t('network:check_connection_error'));
      } finally {
        setCheckingUserId(null);
      }
    },
    [checkStatus, currentMemberId, navigate, showError, showInfo, t],
  );

  const handleCloseMessage = useCallback(() => {
    setIsMessageDrawerOpen(false);
    setConnectionStatus(null);
  }, []);

  return (
    <NetworkSectionLayout title={t('network:title')}>
      <Stack spacing={2}>
        <Typography
          variant="h1"
          fontWeight={800}
          color="primary.main"
          sx={{ fontSize: { xs: '1.8rem', md: '2.3rem' } }}
        >
          {t('network:page_heading')}
        </Typography>

        <Typography color="text.secondary">
          {t('network:page_subtitle')}
        </Typography>

        <DynamicFilterBar
          config={filters_config}
          value={filters}
          onChange={handleFilterChange}
        />

        <SearchBar
          value={searchInput}
          onChange={setSearchInput}
          onKeyDown={handleSearchKeyDown}
          placeholder={t('network:search_by_name_placeholder')}
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
            ? t('network:no_filter_results')
            : t('network:no_members_to_show')}
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
          {items.map((member) => {
            const isSelf = String(member.userId) === String(currentMemberId);

            return (
              <NetworkSearchMemberCard
                key={member.userId}
                userId={member.userId}
                avatar={member.avatarUrl}
                fullName={member.fullName}
                program={member.program}
                major={member.major}
                onMessage={isSelf ? null : () => handleOpenMessage(member)}
                onBlock={isSelf ? null : () => setBlockTarget(member)}
                isMessageLoading={checkingUserId === member.userId}
                isBlockLoading={isBlocking && blockTarget?.userId === member.userId}
                messageButtonLabel={isSelf ? t('network:this_is_you') : t('network:message')}
              />
            );
          })}
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
    </NetworkSectionLayout>
  );
};

export default NetworkPage;
