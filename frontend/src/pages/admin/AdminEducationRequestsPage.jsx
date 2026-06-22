import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router';
import { useSnackbar } from 'notistack';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  MenuItem, Stack, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import AdminDataTable from '../../components/admin/AdminDataTable';
import { useAdminSystemContext } from '../../stores/AdminStore';
import { formatDateTime } from '../../utils/dateFormatter';
import { adminEducationApi } from '../../utils/api';

const STATUS_COLOR = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'error' };
const STATUS_LABEL = { PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Đã từ chối' };

const EDU_FIELD_LABEL = {
  program: 'Chương trình đào tạo',
  major: 'Chuyên ngành',
  faculty: 'Khoa',
  department: 'Bộ môn',
  startedYear: 'Khóa',
  graduatedYear: 'Năm tốt nghiệp',
  graduationStatus: 'Trạng thái tốt nghiệp',
};

const EduDataSection = ({ title, data }) => {
  if (!data) return <Typography variant="body2" color="text.secondary">—</Typography>;
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight={600}>{title}</Typography>
      {Object.entries(EDU_FIELD_LABEL).map(([key, label]) => {
        const values = Array.isArray(data[key]) ? data[key] : [];
        return (
          <Box key={key} sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 160, flexShrink: 0 }}>
              {label}:
            </Typography>
            <Typography variant="body2">
              {values.length > 0 ? values.join(', ') : '—'}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

const AdminEducationRequestsPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { stableOrgId } = useAdminSystemContext();
  const { setBreadcrumbs } = useOutletContext();

  const [activeTab, setActiveTab] = useState(0);
  const TAB_STATUSES = [null, 'PENDING', 'APPROVED', 'REJECTED'];

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const [reviewDialog, setReviewDialog] = useState({ open: false, request: null });
  const [reviewForm, setReviewForm] = useState({ decision: 'APPROVED', adminNote: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setBreadcrumbs?.([{ label: 'Yêu cầu thay đổi học vấn', active: true }]);
  }, [setBreadcrumbs]);

  const fetchRequests = async () => {
    if (!stableOrgId) return;
    setLoading(true);
    try {
      const data = await adminEducationApi.getRequests({
        organizationId: stableOrgId,
        status: TAB_STATUSES[activeTab] ?? undefined,
        page,
        size: pageSize,
      });
      setRows(data?.items ?? data?.content ?? []);
      setTotal(data?.totalItem ?? data?.totalElements ?? 0);
    } catch {
      enqueueSnackbar('Không thể tải danh sách yêu cầu.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableOrgId, activeTab, page]);

  const handleOpenReview = (request) => {
    setReviewForm({ decision: 'APPROVED', adminNote: '' });
    setReviewDialog({ open: true, request });
  };

  const handleCloseReview = () => {
    if (submitting) return;
    setReviewDialog({ open: false, request: null });
  };

  const handleSubmitReview = async () => {
    if (!reviewDialog.request) return;
    setSubmitting(true);
    try {
      await adminEducationApi.reviewRequest(reviewDialog.request.id, reviewForm);
      enqueueSnackbar(
        reviewForm.decision === 'APPROVED' ? 'Đã duyệt yêu cầu.' : 'Đã từ chối yêu cầu.',
        { variant: 'success' }
      );
      setReviewDialog({ open: false, request: null });
      fetchRequests();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message ?? 'Không thể xử lý yêu cầu.', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      field: 'memberStudentId',
      headerName: 'MSSV',
      width: 130,
      render: (row) => row.memberStudentId ?? `Member #${row.memberId}`,
    },
    {
      field: 'createdAt',
      headerName: 'Ngày gửi',
      width: 160,
      render: (row) => formatDateTime(row.createdAt, '—'),
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 130,
      render: (row) => (
        <Chip
          label={STATUS_LABEL[row.status] ?? row.status}
          color={STATUS_COLOR[row.status] ?? 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Hành động',
      width: 140,
      render: (row) => (
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={row.status === 'PENDING' ? <CheckCircleOutlineIcon /> : <VisibilityOutlinedIcon />}
            onClick={() => handleOpenReview(row)}
          >
            {row.status === 'PENDING' ? 'Duyệt' : 'Xem'}
          </Button>
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={2}>Yêu cầu thay đổi học vấn</Typography>

      <Tabs value={activeTab} onChange={(_, v) => { setActiveTab(v); setPage(0); }} sx={{ mb: 2 }}>
        <Tab label="Tất cả" />
        <Tab label="Chờ duyệt" />
        <Tab label="Đã duyệt" />
        <Tab label="Đã từ chối" />
      </Tabs>

      <AdminDataTable
        columns={columns}
        rows={rows}
        total={total}
        page={page}
        pageSize={pageSize}
        loading={loading}
        onPageChange={setPage}
        emptyMessage="Không có yêu cầu nào."
      />

      <Dialog open={reviewDialog.open} onClose={handleCloseReview} fullWidth maxWidth="md">
        <DialogTitle>
          {reviewDialog.request?.status === 'PENDING' ? 'Duyệt yêu cầu thay đổi học vấn' : 'Chi tiết yêu cầu học vấn'}
        </DialogTitle>
        <DialogContent>
          {reviewDialog.request && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">MSSV:</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {reviewDialog.request.memberStudentId ?? `Member #${reviewDialog.request.memberId}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">Ngày gửi:</Typography>
                <Typography variant="body2">{formatDateTime(reviewDialog.request.createdAt, '—')}</Typography>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
                  <EduDataSection title="Dữ liệu cũ" data={reviewDialog.request.oldData} />
                </Box>
                <Box sx={{ border: 1, borderColor: 'primary.main', borderRadius: 1, p: 2, bgcolor: 'primary.lighter' }}>
                  <EduDataSection title="Dữ liệu mới đề xuất" data={reviewDialog.request.newData} />
                </Box>
              </Box>

              {reviewDialog.request.status === 'PENDING' && (
                <>
                  <TextField
                    select
                    label="Quyết định"
                    value={reviewForm.decision}
                    onChange={(e) => setReviewForm((prev) => ({ ...prev, decision: e.target.value }))}
                    fullWidth
                    size="small"
                  >
                    <MenuItem value="APPROVED">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleOutlineIcon color="success" fontSize="small" />
                        Duyệt
                      </Box>
                    </MenuItem>
                    <MenuItem value="REJECTED">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CancelOutlinedIcon color="error" fontSize="small" />
                        Từ chối
                      </Box>
                    </MenuItem>
                  </TextField>
                  <TextField
                    label="Ghi chú (hiển thị cho người dùng nếu từ chối)"
                    value={reviewForm.adminNote}
                    onChange={(e) => setReviewForm((prev) => ({ ...prev, adminNote: e.target.value }))}
                    fullWidth
                    multiline
                    rows={3}
                    size="small"
                  />
                </>
              )}

              {reviewDialog.request.status !== 'PENDING' && reviewDialog.request.adminNote && (
                <Box sx={{ bgcolor: 'grey.50', border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
                  <Typography variant="caption" color="text.secondary">Ghi chú admin:</Typography>
                  <Typography variant="body2">{reviewDialog.request.adminNote}</Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReview} disabled={submitting}>Đóng</Button>
          {reviewDialog.request?.status === 'PENDING' && (
            <Button
              variant="contained"
              color={reviewForm.decision === 'APPROVED' ? 'success' : 'error'}
              onClick={handleSubmitReview}
              disabled={submitting}
            >
              {submitting ? 'Đang xử lý...' : reviewForm.decision === 'APPROVED' ? 'Duyệt' : 'Từ chối'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminEducationRequestsPage;
