import { useEffect, useState, useMemo } from 'react';
import { useOutletContext } from 'react-router';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  IconButton,
  Typography,
  Stack,
  alpha,
  useTheme,
  Avatar,
  Tooltip,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import Page from "../../components/Page";
import AdminStatusChip from '../../components/admin/AdminStatusChip';
import AdminDataTable from '../../components/admin/AdminDataTable';
import AdminSectionPanel from '../../components/admin/AdminSectionPanel';
import Iconify from '../../components/Iconify';
import { getVerificationRequests, reviewVerificationRequest } from '../../utils/api';
import { formatDateTime } from '../../utils/dateFormatter';
import { useDebounce } from '../../hooks/useDebounce';
import { useAdminSystemContext } from '../../stores/AdminStore';

const AdminVerificationsPage = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { setBreadcrumbs } = useOutletContext();
  const { stableOrgId } = useAdminSystemContext();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [pendingOnly, setPendingOnly] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearch === searchQuery) return;
    setSearchQuery(debouncedSearch);
    setPage(0);
  }, [debouncedSearch, searchQuery]);

  // Review Dialog State
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [submitting, setSubLoading] = useState(false);

  useEffect(() => {
    setBreadcrumbs?.([{ label: 'Xác thực người dùng', active: true }]);
  }, [setBreadcrumbs]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await getVerificationRequests(pendingOnly, page, rowsPerPage, searchQuery, stableOrgId || null);
      const data = res?.data?.data || {};
      setRequests(data.items || []);
      setTotalCount(data.totalElements || 0);
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || 'Lỗi khi tải danh sách yêu cầu.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRequests();
  }, [page, rowsPerPage, pendingOnly, searchQuery, stableOrgId]);

  const handleReview = (request) => {
    setSelectedRequest(request);
    setAdminNote(request.adminNote || '');
    setReviewDialogOpen(true);
  };

  const submitReview = async (request, status, note = '') => {
    if (!request) return;
    setSubLoading(true);
    try {
      // Send uppercase status to match backend @Pattern validation
      const finalStatus = status.toUpperCase();
      await reviewVerificationRequest(request.id, finalStatus, note);
      enqueueSnackbar(`Đã ${finalStatus === 'APPROVED' ? 'duyệt' : 'từ chối'} yêu cầu thành công.`, { variant: 'success' });
      setReviewDialogOpen(false);
      void fetchRequests();
    } catch (error) {
      console.error('Review submission error:', error);
      enqueueSnackbar(error?.response?.data?.message || 'Lỗi khi xử lý yêu cầu.', { variant: 'error' });
    } finally {
      setSubLoading(false);
    }
  };

  const columns = useMemo(() => [
    {
      id: 'user',
      label: 'Người dùng',
      render: (_, r) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar 
            src={r.avatarUrl} 
            sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontSize: 13, fontWeight: 700 }}
          >
            {(r.fullName || r.studentId || '?')[0].toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {r.fullName || r.studentId}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {r.email}
            </Typography>
          </Box>
        </Stack>
      )
    },
    {
      id: 'documentType',
      label: 'Loại minh chứng',
      render: (val) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <DescriptionOutlinedIcon fontSize="small" color="action" />
          <Typography variant="body2" sx={{ textTransform: 'uppercase' }}>{val}</Typography>
        </Stack>
      )
    },
    {
      id: 'documentUrl',
      label: 'Minh chứng',
      render: (val) => (
        <Link 
          href={val} 
          target="_blank" 
          rel="noopener" 
          sx={{ fontSize: 13, fontWeight: 600 }}
          onClick={(e) => e.stopPropagation()}
        >
          Xem tài liệu
        </Link>
      )
    },
    {
      id: 'status',
      label: 'Trạng thái',
      render: (val) => (
        <AdminStatusChip status={val} category="account" />
      )
    },
    { id: 'createdAt', label: 'Ngày gửi', render: (val) => formatDateTime(val) },
    {
      id: 'actions',
      label: '',
      align: 'right',
      render: (_, r) => {
        const isPending = r.status?.toLowerCase() === 'pending';
        return (
          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
            <Tooltip title="Xem chi tiết">
              <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleReview(r); }}>
                <VisibilityOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            {isPending && (
              <Tooltip title="Duyệt nhanh">
                <IconButton 
                  size="small" 
                  color="success" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    submitReview(r, 'APPROVED'); 
                  }}
                >
                  <CheckCircleOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        );
      }
    }
  ], [theme, handleReview, submitReview]);

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main' }}>
          Xác thực minh chứng
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
          Xem và phê duyệt các yêu cầu xác thực tài khoản từ người dùng.
        </Typography>
      </Box>

      <AdminDataTable
        columns={columns}
        rows={requests}
        totalCount={totalCount}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(_, next) => setPage(next)}
        onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
        onSearchChange={setSearchTerm} 
        searchValue={searchTerm}
        searchPlaceholder="Tìm theo tên, email..."
        onRowClick={handleReview}
        filters={
          <TextField
            select
            size="small"
            label="Bộ lọc"
            value={pendingOnly ? 'pending' : 'all'}
            onChange={(e) => { setPendingOnly(e.target.value === 'pending'); setPage(0); }}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="pending">Chờ xử lý</MenuItem>
            <MenuItem value="all">Tất cả</MenuItem>
          </TextField>
        }
        loading={loading}
      />

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onClose={() => !submitting && setReviewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Xử lý yêu cầu xác thực</DialogTitle>
        <DialogContent dividers>
          {selectedRequest && (
            <Stack spacing={2.5} sx={{ py: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                  NGƯỜI GỬI
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  {selectedRequest.fullName || selectedRequest.studentId} ({selectedRequest.email})
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                  TÀI LIỆU MINH CHỨNG
                </Typography>
                <Button 
                  variant="outlined" 
                  href={selectedRequest.documentUrl} 
                  target="_blank" 
                  startIcon={<DescriptionOutlinedIcon />}
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  Mở tài liệu trong tab mới
                </Button>
              </Box>

              {selectedRequest.aiSummary && (
                <Box sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.08), borderRadius: 2, border: `1px dashed ${theme.palette.info.main}` }}>
                  <Typography variant="caption" sx={{ color: 'info.main', fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Iconify icon="fluent:bot-24-filled" /> TÓM TẮT TỪ AI
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.primary', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                    {selectedRequest.aiSummary}
                  </Typography>
                </Box>
              )}

              <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                  GHI CHÚ CỦA QUẢN TRỊ VIÊN
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Nhập lý do từ chối hoặc lời nhắn (tùy chọn)..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button 
            disabled={submitting} 
            onClick={() => setReviewDialogOpen(false)} 
            color="inherit"
            sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
          >
            Đóng
          </Button>
          {selectedRequest?.status === 'PENDING' && (
            <>
              <Button 
                variant="contained" 
                color="error" 
                disabled={submitting} 
                startIcon={<HighlightOffIcon />}
                onClick={() => submitReview(selectedRequest, 'REJECTED', adminNote)}
                sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
              >
                Từ chối
              </Button>
              <Button 
                variant="contained" 
                color="success" 
                disabled={submitting} 
                startIcon={<CheckCircleOutlineIcon />}
                onClick={() => submitReview(selectedRequest, 'APPROVED', adminNote)}
                sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
              >
                Phê duyệt
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminVerificationsPage;
Page;
