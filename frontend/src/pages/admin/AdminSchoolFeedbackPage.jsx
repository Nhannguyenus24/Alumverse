import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router';
import { useSnackbar } from 'notistack';
import {
  Box,
  IconButton,
  Tooltip,
  Typography,
  Stack,
  useTheme,
  Grid,
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import FeedbackOutlinedIcon from '@mui/icons-material/FeedbackOutlined';
import MarkEmailUnreadOutlinedIcon from '@mui/icons-material/MarkEmailUnreadOutlined';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';

import AdminDataTable from '../../components/admin/AdminDataTable';
import AdminDashboardMetricTile from '../../components/admin/AdminDashboardMetricTile';
import AdminStatusChip from '../../components/admin/AdminStatusChip';
import AdminSchoolFeedbackDetailDialog from '../../components/admin/AdminSchoolFeedbackDetailDialog';
import { adminOrganizationApi } from '../../api/adminOrganizationApi';
import { formatDateTime } from '../../utils/dateFormatter';

const AdminSchoolFeedbackPage = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { setBreadcrumbs } = useOutletContext();

  useEffect(() => {
    setBreadcrumbs?.([{ label: 'Phản hồi', active: true }]);
  }, [setBreadcrumbs]);
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminOrganizationApi.getSchoolFeedbacks({
        page,
        size: rowsPerPage,
      });
      if (response && response.items) {
        setFeedbacks(response.items);
        setTotal(response.totalItem || response.items.length);
      } else if (Array.isArray(response)) {
        setFeedbacks(response);
        setTotal(response.length);
      }
    } catch (error) {
      enqueueSnackbar(
        error?.response?.data?.message || 'Lỗi tải phản hồi',
        { variant: 'error' },
      );
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, enqueueSnackbar]);

  useEffect(() => {
    loadFeedbacks();
  }, [loadFeedbacks]);

  const handleMarkAsRead = async (id) => {
    try {
      await adminOrganizationApi.markSchoolFeedbackAsRead(id);
      setFeedbacks((prev) =>
        prev.map((f) => (f.id === id ? { ...f, isRead: true } : f))
      );
      if (selectedFeedback?.id === id) {
        setSelectedFeedback((prev) => ({ ...prev, isRead: true }));
      }
      enqueueSnackbar('Đã đánh dấu là đã đọc', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(
        error?.response?.data?.message || 'Lỗi cập nhật phản hồi',
        { variant: 'error' },
      );
    }
  };

  const handleViewDetails = (feedback) => {
    setSelectedFeedback(feedback);
    setDetailOpen(true);
  };

  const columns = [
    { id: 'id', label: 'ID', width: 60 },
    { 
      id: 'fullName', 
      label: 'Người gửi',
      render: (val, row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: row.isRead ? 400 : 700 }}>{val}</Typography>
          <Typography variant="caption" color="text.secondary">{row.email}</Typography>
        </Box>
      )
    },
    { id: 'subject', label: 'Tiêu đề', render: (val, row) => <Typography variant="body2" sx={{ fontWeight: row.isRead ? 400 : 600 }}>{val}</Typography> },
    { 
      id: 'isRead', 
      label: 'Trạng thái', 
      render: (val) => (
        <AdminStatusChip
          status={val ? 'READ' : 'NEW'}
          category="feedback"
          label={val ? 'Đã đọc' : 'Mới'}
        />
      )
    },
    { id: 'createdAt', label: 'Ngày gửi', render: (val) => formatDateTime(val) },
    {
      id: 'actions',
      label: '',
      align: 'right',
      render: (_, row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end" onClick={(e) => e.stopPropagation()}>
          <Tooltip title="Xem chi tiết">
            <IconButton size="small" onClick={() => handleViewDetails(row)}>
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {!row.isRead && (
            <Tooltip title="Đánh dấu đã đọc">
              <IconButton
                size="small"
                color="success"
                onClick={() => handleMarkAsRead(row.id)}
              >
                <MarkEmailReadOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      )
    }
  ];

  const stats = {
    total: total,
    new: feedbacks.filter(f => !f.isRead).length,
    read: feedbacks.filter(f => f.isRead).length,
    lastFeedback: feedbacks.length > 0 ? formatDateTime(feedbacks[0].createdAt) : 'N/A'
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -1 }}>
          Phản hồi từ người dùng
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
          Quản lý và phản hồi các ý kiến đóng góp từ sinh viên và cựu sinh viên.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 3,
          mb: 4,
          '& > *': {
            flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 0' },
          },
        }}
      >
        <AdminDashboardMetricTile
          label="Tổng phản hồi"
          value={stats.total}
          icon={<FeedbackOutlinedIcon />}
        />
        <AdminDashboardMetricTile
          label="Phản hồi mới"
          value={stats.new}
          icon={<MarkEmailUnreadOutlinedIcon />}
          valueColor="info.main"
        />
        <AdminDashboardMetricTile
          label="Đã xử lý"
          value={stats.read}
          icon={<MarkEmailReadIcon />}
          valueColor="success.main"
        />
        <AdminDashboardMetricTile
          label="Gửi gần nhất"
          value={stats.lastFeedback}
          icon={<HistoryOutlinedIcon />}
          valueColor="warning.main"
        />
      </Box>

      <AdminDataTable
        columns={columns}
        rows={feedbacks}
        totalCount={total}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(_, next) => setPage(next)}
        onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
        loading={loading}
        onRowClick={(row) => handleViewDetails(row)}
      />

      <AdminSchoolFeedbackDetailDialog
        open={detailOpen}
        feedback={selectedFeedback}
        onClose={() => setDetailOpen(false)}
        onMarkAsRead={handleMarkAsRead}
      />
    </Box>
  );
};

export default AdminSchoolFeedbackPage;
