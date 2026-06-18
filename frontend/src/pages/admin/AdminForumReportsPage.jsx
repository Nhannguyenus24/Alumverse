import { useEffect, useState, useMemo } from "react";
import { useSnackbar } from "notistack";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
  Stack,
} from "@mui/material";
import { useOutletContext, useParams } from "react-router";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AdminDataTable from "../../components/admin/AdminDataTable";
import { useAdminSystemContext } from "../../stores/AdminStore";
import { formatDate } from "../../utils/dateFormatter";
import apiClient from "../../utils/axios";

const AdminForumReportsPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { stableOrgId, activeOrganization } = useAdminSystemContext();
  const { setBreadcrumbs } = useOutletContext();

  const [reports, setReports] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const [reviewDialog, setReviewDialog] = useState({
    open: false,
    report: null,
  });
  const [reviewForm, setReviewForm] = useState({
    decision: "APPROVED",
    action: "BAN_POST",
    reviewNote: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setBreadcrumbs?.([{ label: "Báo cáo bài viết", active: true }]);
  }, [setBreadcrumbs]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/admin/forum/reports", {
        params: {
          organizationId: stableOrgId,
          page,
          size,
        },
      });
      const data = res.data?.data;
      if (data) {
        setReports(data.content || []);
        setTotalElements(data.totalElements || 0);
      }
    } catch (err) {
      enqueueSnackbar("Không thể tải danh sách báo cáo.", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableOrgId, page, size]);

  const openReview = (report) => {
    setReviewForm({ decision: "APPROVED", action: "BAN_POST", reviewNote: "" });
    setReviewDialog({ open: true, report });
  };

  const handleReviewSubmit = async () => {
    if (!reviewForm.decision || !reviewForm.action) {
      enqueueSnackbar("Vui lòng chọn Quyết định và Hành động.", { variant: "warning" });
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.put(`/admin/forum/reports/${reviewDialog.report.id}`, {
        decision: reviewForm.decision,
        action: reviewForm.action,
        reviewNote: reviewForm.reviewNote,
      });
      enqueueSnackbar("Đã xử lý báo cáo thành công.", { variant: "success" });
      setReviewDialog({ open: false, report: null });
      fetchReports();
    } catch (err) {
      const msg = err.response?.data?.message || "Không thể xử lý báo cáo.";
      enqueueSnackbar(msg, { variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { id: "id", label: "ID", width: 60 },
    {
      id: "postId",
      label: "Bài viết ID",
      render: (val) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          #{val}
        </Typography>
      ),
    },
    { id: "reporterMemberId", label: "Người báo cáo" },
    { id: "reason", label: "Lý do", render: (val) => <Typography variant="body2" color="error">{val}</Typography> },
    { id: "description", label: "Chi tiết" },
    { id: "createdAt", label: "Ngày tạo", render: (val) => formatDate(val) },
    {
      id: "actions",
      label: "Hành động",
      align: "right",
      render: (_, row) => (
        <Tooltip title="Xử lý báo cáo">
          <IconButton size="small" color="primary" onClick={() => openReview(row)}>
            <CheckCircleOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, color: "primary.main" }}>
          Quản lý báo cáo
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
          Xem và xử lý các báo cáo vi phạm nội dung từ người dùng diễn đàn.
        </Typography>
      </Box>

      <AdminDataTable
        columns={columns}
        rows={reports}
        totalCount={totalElements}
        page={page}
        rowsPerPage={size}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => {
          setSize(Number(e.target.value));
          setPage(0);
        }}
        loading={loading}
      />

      {/* Review Dialog */}
      <Dialog
        open={reviewDialog.open}
        onClose={() => setReviewDialog({ open: false, report: null })}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Xử lý báo cáo #{reviewDialog.report?.id}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            select
            label="Quyết định"
            fullWidth
            value={reviewForm.decision}
            onChange={(e) => setReviewForm((f) => ({ ...f, decision: e.target.value }))}
          >
            <MenuItem value="APPROVED">Duyệt (Chấp nhận báo cáo)</MenuItem>
            <MenuItem value="REJECTED">Từ chối (Bỏ qua báo cáo)</MenuItem>
          </TextField>

          {reviewForm.decision === "APPROVED" && (
            <TextField
              select
              label="Hành động xử lý"
              fullWidth
              value={reviewForm.action}
              onChange={(e) => setReviewForm((f) => ({ ...f, action: e.target.value }))}
            >
              <MenuItem value="WARN">Cảnh cáo người đăng</MenuItem>
              <MenuItem value="HIDE_POST">Ẩn bài viết</MenuItem>
              <MenuItem value="BAN_POST">Cấm (Ban) bài viết</MenuItem>
            </TextField>
          )}

          <TextField
            label="Ghi chú xử lý"
            fullWidth
            multiline
            rows={3}
            value={reviewForm.reviewNote}
            onChange={(e) => setReviewForm((f) => ({ ...f, reviewNote: e.target.value }))}
            placeholder="Nhập ghi chú cho quyết định này..."
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setReviewDialog({ open: false, report: null })} color="secondary">
            Hủy
          </Button>
          <Button onClick={handleReviewSubmit} variant="contained" disabled={submitting}>
            {submitting ? "Đang xử lý..." : "Xác nhận"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminForumReportsPage;
