import { useCallback, useEffect, useState } from 'react';
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

const STATUS_FILTERS = [
  {
    type: 'dropdown',
    key: 'status',
    label: 'Trạng thái',
    multiple: false,
    options: [
      { value: 'PENDING', label: 'Đang chờ' },
      { value: 'REJECTED', label: 'Đã từ chối' },
    ],
  },
];

const PAGE_SIZE = 5;

const NetworkIncomingRequestsPage = () => {
  const [searchInput, setSearchInput] = useState('');
  const [appliedFullName, setAppliedFullName] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    all: true,
    status: '',
  });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [respondingId, setRespondingId] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  const { showSuccess, showError } = useNotification();

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
          ? 'Đã chấp nhận yêu cầu kết nối.'
          : 'Đã từ chối yêu cầu kết nối.',
      );
    },
    onError: () => {
      setRespondingId(null);
      showError('Đã xảy ra lỗi. Vui lòng thử lại.');
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
          title: 'Chấp nhận yêu cầu kết nối',
          message: 'Bạn có chắc muốn chấp nhận yêu cầu kết nối này không?',
          confirmText: 'Chấp nhận',
          confirmColor: 'primary',
        }
      : {
          title: 'Từ chối yêu cầu kết nối',
          message: 'Bạn có chắc muốn từ chối yêu cầu kết nối này không?',
          confirmText: 'Từ chối',
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
          Không thể tải danh sách yêu cầu. Vui lòng thử lại.
        </Alert>
      );
    }

    if (items.length === 0) {
      return (
        <Alert severity="info">
          {hasActiveCriteria
            ? 'Không có yêu cầu nào phù hợp với tìm kiếm hoặc bộ lọc hiện tại.'
            : 'Chưa có yêu cầu kết nối nào.'}
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
    <NetworkSectionLayout title="Yêu cầu kết nối">
      <Stack spacing={2}>
        <Typography
          variant="h1"
          fontWeight={800}
          color="primary.main"
          sx={{ fontSize: { xs: '1.8rem', md: '2.3rem' } }}
        >
          YÊU CẦU KẾT NỐI
        </Typography>

        <Typography color="text.secondary">
          Xem và phản hồi các yêu cầu kết nối từ sinh viên và cựu sinh viên khác.
        </Typography>

        <DynamicFilterBar
          config={STATUS_FILTERS}
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
        cancelText="Hủy"
        onConfirm={handleConfirmRespond}
        onCancel={handleCancelRespond}
      />
    </NetworkSectionLayout>
  );
};

export default NetworkIncomingRequestsPage;
