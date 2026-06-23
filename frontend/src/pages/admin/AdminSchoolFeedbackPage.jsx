import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router';
import { useSnackbar } from 'notistack';
import {
  Box,
  IconButton,
  Tooltip,
  Typography,
  Stack,
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
import { adminOrganizationApi } from '../../utils/api';
import { formatDateTime } from '../../utils/dateFormatter';

const AdminSchoolFeedbackPage = () => {
  const { t } = useTranslation('admin');
  const { enqueueSnackbar } = useSnackbar();
  const { setBreadcrumbs } = useOutletContext();

  useEffect(() => {
    setBreadcrumbs?.([{ label: t('nav_feedbacks'), active: true }]);
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
        error?.response?.data?.message || t('feedback_load_error'),
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
      enqueueSnackbar(t('feedback_marked_read'), { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(
        error?.response?.data?.message || t('feedback_update_error'),
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
      label: t('feedback_col_sender'),
      render: (val, row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: row.isRead ? 400 : 700 }}>{val}</Typography>
          <Typography variant="caption" color="text.secondary">{row.email}</Typography>
        </Box>
      )
    },
    { id: 'subject', label: t('col_title'), render: (val, row) => <Typography variant="body2" sx={{ fontWeight: row.isRead ? 400 : 600 }}>{val}</Typography> },
    { 
      id: 'isRead', 
      label: t('col_status'),
      render: (val) => (
        <AdminStatusChip
          status={val ? 'READ' : 'NEW'}
          category="feedback"
        />
      )
    },
    { id: 'createdAt', label: t('feedback_col_sent_date'), render: (val) => formatDateTime(val) },
    {
      id: 'actions',
      label: '',
      align: 'right',
      render: (_, row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end" onClick={(e) => e.stopPropagation()}>
          <Tooltip title={t('tooltip_view_detail')}>
            <IconButton size="small" onClick={() => handleViewDetails(row)}>
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {!row.isRead && (
            <Tooltip title={t('feedback_mark_as_read')}>
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
        <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main' }}>
          {t('feedback_page_title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
          {t('feedback_page_subtitle')}
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
          label={t('feedback_total')}
          value={stats.total}
          icon={<FeedbackOutlinedIcon />}
        />
        <AdminDashboardMetricTile
          label={t('feedback_new')}
          value={stats.new}
          icon={<MarkEmailUnreadOutlinedIcon />}
          valueColor="info.main"
        />
        <AdminDashboardMetricTile
          label={t('feedback_processed')}
          value={stats.read}
          icon={<MarkEmailReadIcon />}
          valueColor="success.main"
        />
        <AdminDashboardMetricTile
          label={t('feedback_latest_sent')}
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
