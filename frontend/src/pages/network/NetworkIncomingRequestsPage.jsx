import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  CircularProgress,
  Pagination,
  Stack,
  Typography,
} from '@mui/material';

import NetworkSectionLayout from '../../components/network/NetworkSectionLayout';
import SearchBar from '../../components/SearchBar';
import DynamicFilterBar from '../../components/DynamicFilterBar';
import NetworkIncomingRequestCard from '../../components/network/NetworkIncomingRequestCard';
import NetworkIncomingRequestDetailDrawer from '../../components/network/NetworkIncomingRequestDetailDrawer';
import ConfirmDialog from '../../components/ConfirmDialog';
import usePaginationScrollToTop from '../../hooks/usePaginationScrollToTop';
import { useNetworkIncomingRequests } from '../../hooks/network/useNetworkIncomingRequests';
import { useRespondConversationRequest } from '../../hooks/network/useRespondConversationRequest';
import { useNotification } from '../../hooks/useNotification';
import {
  DEFAULT_NETWORK_INCOMING_REQUEST_FILTERS,
  getNetworkIncomingRequestFilterConfig,
} from '../../constants/networkConfig';

const PAGE_SIZE = 5;

const NetworkIncomingRequestsPage = () => {
  const { t } = useTranslation('network');

  const [searchInput, setSearchInput] = useState('');
  const [appliedFullName, setAppliedFullName] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(DEFAULT_NETWORK_INCOMING_REQUEST_FILTERS);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [respondingId, setRespondingId] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  const { showSuccess, showError } = useNotification();

  const statusFilters = useMemo(() => getNetworkIncomingRequestFilterConfig(t), [t]);

  const { items, totalPage, isLoading, isError } = useNetworkIncomingRequests({
    appliedFullName,
    status: filters.status || undefined,
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

  const handleViewDetail = useCallback((request) => {
    setSelectedRequest(request);
    setIsDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedRequest(null);
  }, []);

  const respondMutation = useRespondConversationRequest({
    onSuccess: (_, { status }) => {
      setRespondingId(null);
      showSuccess(
        status === 'ACCEPTED'
          ? t('incoming_accept_success')
          : t('incoming_reject_success'),
      );
    },
    onError: () => {
      setRespondingId(null);
      showError(t('incoming_respond_error'));
    },
  });

  const handleAccept = useCallback((requestId) => {
    setPendingAction({ requestId, status: 'ACCEPTED' });
  }, []);

  const handleReject = useCallback((requestId) => {
    setPendingAction({ requestId, status: 'REJECTED' });
  }, []);

  const handleConfirmRespond = useCallback(() => {
    if (!pendingAction) return;
    const { requestId, status } = pendingAction;
    setPendingAction(null);
    setRespondingId(requestId);
    respondMutation.mutate({ requestId, status });
  }, [pendingAction, respondMutation]);

  const handleCancelRespond = useCallback(() => {
    setPendingAction(null);
  }, []);

  const confirmDialogConfig =
    pendingAction?.status === 'ACCEPTED'
      ? {
          title: t('incoming_accept_dialog_title'),
          message: t('incoming_accept_dialog_message'),
          confirmText: t('incoming_accept_dialog_confirm'),
          confirmColor: 'primary',
        }
      : {
          title: t('incoming_reject_dialog_title'),
          message: t('incoming_reject_dialog_message'),
          confirmText: t('incoming_reject_dialog_confirm'),
          confirmColor: 'primary',
        };

  const detailRequest =
    selectedRequest != null
      ? items.find((item) => item.id === selectedRequest.id) ?? selectedRequest
      : null;

  const renderContent = () => {
    if (isLoading) {
      return (
        <Stack alignItems="center" py={4}>
          <CircularProgress />
        </Stack>
      );
    }

    if (isError) {
      return (
        <Alert severity="error">
          {t('incoming_load_error')}
        </Alert>
      );
    }

    if (items.length === 0) {
      return (
        <Alert severity="info">
          {hasActiveCriteria
            ? t('incoming_no_filter_results')
            : t('incoming_no_requests')}
        </Alert>
      );
    }

    return (
      <Stack spacing={2}>
        {items.map((request) => (
          <NetworkIncomingRequestCard
            key={request.id}
            request={request}
            onViewDetail={handleViewDetail}
            onAccept={handleAccept}
            onReject={handleReject}
            isResponding={respondingId === request.id}
          />
        ))}
      </Stack>
    );
  };

  return (
    <NetworkSectionLayout title={t('incoming_layout_title')}>
      <Stack spacing={2}>
        <Typography
          variant="h1"
          fontWeight={800}
          color="primary.main"
          sx={{ fontSize: { xs: '1.8rem', md: '2.3rem' } }}
        >
          {t('incoming_heading')}
        </Typography>

        <Typography color="text.secondary">
          {t('incoming_subheading')}
        </Typography>

        <DynamicFilterBar
          config={statusFilters}
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
          placeholder={t('search_by_name_placeholder')}
        />
      </Stack>

      {renderContent()}

      {pageCount > 0 ? (
        <Stack
          direction="row"
          justifyContent="center"
          alignItems="center"
          sx={{ mt: 1 }}
        >
          <Pagination
            count={pageCount}
            page={safePage}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
            size="large"
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

      <NetworkIncomingRequestDetailDrawer
        open={isDetailOpen}
        onClose={handleCloseDetail}
        request={detailRequest}
      />

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={confirmDialogConfig.title}
        message={confirmDialogConfig.message}
        confirmText={confirmDialogConfig.confirmText}
        confirmColor={confirmDialogConfig.confirmColor}
        cancelText={t('incoming_cancel')}
        onConfirm={handleConfirmRespond}
        onCancel={handleCancelRespond}
      />
    </NetworkSectionLayout>
  );
};

export default NetworkIncomingRequestsPage;
