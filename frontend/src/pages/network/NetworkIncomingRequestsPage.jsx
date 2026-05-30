import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pagination,
  Stack,
  Typography,
} from '@mui/material';

import NetworkSectionLayout from '../../components/network/NetworkSectionLayout';
import SearchBar from '../../components/SearchBar';
import DynamicFilterBar from '../../components/DynamicFilterBar';
import NetworkIncomingRequestCard from '../../components/network/NetworkIncomingRequestCard';
import NetworkIncomingRequestDetailDrawer from '../../components/network/NetworkIncomingRequestDetailDrawer';
import usePaginationScrollToTop from '../../hooks/usePaginationScrollToTop';
import { useNetworkIncomingRequests } from '../../hooks/network/useNetworkIncomingRequests';
import { useNetworkCurrentMemberId } from '../../hooks/network/useNetworkCurrentMemberId';
import { useNotification } from '../../hooks/useNotification';

const STATUS_FILTERS = [
  {
    type: 'dropdown',
    key: 'status',
    label: 'Trạng thái',
    multiple: true,
    options: [
      { value: 'PENDING', label: 'Đang chờ' },
      { value: 'ACCEPTED', label: 'Đã chấp nhận' },
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
    status: [],
  });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { showSuccess } = useNotification();
  const currentMemberId = useNetworkCurrentMemberId();

  const { items, totalPage, acceptRequest, rejectRequest } = useNetworkIncomingRequests({
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
  const showEmptyState = items.length === 0;

  const handleViewDetail = useCallback((request) => {
    setSelectedRequest(request);
    setIsDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedRequest(null);
  }, []);

  const handleAccept = useCallback(
    (requestId) => {
      acceptRequest(requestId);
      showSuccess('Đã chấp nhận yêu cầu kết nối.');
    },
    [acceptRequest, showSuccess],
  );

  const handleReject = useCallback(
    (requestId) => {
      rejectRequest(requestId);
      showSuccess('Đã từ chối yêu cầu kết nối.');
    },
    [rejectRequest, showSuccess],
  );

  const detailRequest =
    selectedRequest != null
      ? items.find((item) => item.id === selectedRequest.id) ?? selectedRequest
      : null;

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

      {showEmptyState ? (
        <Alert severity="info">
          {hasActiveCriteria
            ? 'Không có yêu cầu nào phù hợp với tìm kiếm hoặc bộ lọc hiện tại.'
            : 'Chưa có yêu cầu kết nối nào.'}
        </Alert>
      ) : (
        <Stack spacing={2}>
          {items.map((request) => (
            <NetworkIncomingRequestCard
              key={request.id}
              request={request}
              onViewDetail={handleViewDetail}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          ))}
        </Stack>
      )}

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
        currentMemberId={currentMemberId}
      />
    </NetworkSectionLayout>
  );
};

export default NetworkIncomingRequestsPage;
