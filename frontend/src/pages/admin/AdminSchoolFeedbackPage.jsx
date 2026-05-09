import { useCallback, useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
  Chip,
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import AdminSectionPanel from '../../components/admin/AdminSectionPanel';
import AdminSchoolFeedbackDetailDialog from '../../components/admin/AdminSchoolFeedbackDetailDialog';
import { adminOrganizationApi } from '../../api/adminOrganizationApi';
import { formatDateTime } from '../../utils/dateFormatter';

const AdminSchoolFeedbackPage = () => {
  const { enqueueSnackbar } = useSnackbar();
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
        error?.response?.data?.message || 'Failed to load feedbacks',
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
      enqueueSnackbar('Feedback marked as read', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(
        error?.response?.data?.message || 'Failed to update feedback',
        { variant: 'error' },
      );
    }
  };

  const handleViewDetails = (feedback) => {
    setSelectedFeedback(feedback);
    setDetailOpen(true);
  };

  return (
    <AdminSectionPanel
      title="School Feedbacks"
      subtitle="Manage and respond to feedback submitted by students and alumni for organizations."
    >
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Full Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {feedbacks.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" sx={{ py: 3, color: 'text.secondary' }}>
                    No feedbacks found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              feedbacks.map((f) => (
                <TableRow key={f.id} hover sx={{ opacity: f.isRead ? 0.7 : 1 }}>
                  <TableCell>{f.id}</TableCell>
                  <TableCell sx={{ fontWeight: f.isRead ? 400 : 600 }}>{f.fullName}</TableCell>
                  <TableCell>{f.email}</TableCell>
                  <TableCell>{f.subject}</TableCell>
                  <TableCell>
                    {f.isRead ? (
                      <Chip label="Read" size="small" variant="outlined" color="default" />
                    ) : (
                      <Chip label="New" size="small" color="primary" />
                    )}
                  </TableCell>
                  <TableCell>{formatDateTime(f.createdAt)}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleViewDetails(f)}>
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {!f.isRead && (
                        <Tooltip title="Mark as Read">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleMarkAsRead(f.id)}
                          >
                            <MarkEmailReadOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Box>

      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={(_, next) => setPage(next)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[10, 20, 50]}
      />

      <AdminSchoolFeedbackDetailDialog
        open={detailOpen}
        feedback={selectedFeedback}
        onClose={() => setDetailOpen(false)}
        onMarkAsRead={handleMarkAsRead}
      />
    </AdminSectionPanel>
  );
};

export default AdminSchoolFeedbackPage;
