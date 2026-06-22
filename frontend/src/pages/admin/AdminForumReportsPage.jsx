import { useEffect, useState } from "react";
import { useSnackbar } from "notistack";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  Stack,
} from "@mui/material";
import { useOutletContext } from "react-router";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import AdminDataTable from "../../components/admin/AdminDataTable";
import { useAdminSystemContext } from "../../stores/AdminStore";
import { formatDate, formatDateTime } from "../../utils/dateFormatter";
import { truncateText, toPlainText } from "../../utils/stringUtils";
import apiClient from "../../utils/axios";

const REPORT_STATUS_COLOR = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "default",
};
const REPORT_STATUS_LABEL = {
  PENDING: "Chờ xử lý",
  APPROVED: "Đã chấp nhận",
  REJECTED: "Đã từ chối",
};

const AdminForumReportsPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { stableOrgId } = useAdminSystemContext();
  const { setBreadcrumbs } = useOutletContext();

  const [activeTab, setActiveTab] = useState(0);

  // ── Tab 0: Pending reports ──
  const [reports, setReports] = useState([]);
  const [reportTotal, setReportTotal] = useState(0);
  const [reportPage, setReportPage] = useState(0);
  const [reportSize, setReportSize] = useState(10);
  const [reportLoading, setReportLoading] = useState(false);

  // ── Tab 1: Banned posts ──
  const [bannedPosts, setBannedPosts] = useState([]);
  const [bannedTotal, setBannedTotal] = useState(0);
  const [bannedPage, setBannedPage] = useState(0);
  const [bannedLoading, setBannedLoading] = useState(false);

  // ── Tab 2: Hidden posts ──
  const [hiddenPosts, setHiddenPosts] = useState([]);
  const [hiddenTotal, setHiddenTotal] = useState(0);
  const [hiddenPage, setHiddenPage] = useState(0);
  const [hiddenLoading, setHiddenLoading] = useState(false);

  // ── Review dialog ──
  const [reviewDialog, setReviewDialog] = useState({ open: false, report: null });
  const [reviewForm, setReviewForm] = useState({ decision: "APPROVED", action: "BAN_POST", reviewNote: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setBreadcrumbs?.([{ label: "Báo cáo bài viết", active: true }]);
  }, [setBreadcrumbs]);

  // ── Fetch reports ──
  const fetchReports = async () => {
    setReportLoading(true);
    try {
      const res = await apiClient.get("/admin/forum/reports", {
        params: { organizationId: stableOrgId, page: reportPage, size: reportSize },
      });
      const data = res.data?.data;
      if (data) {
        setReports(data.items ?? data.content ?? []);
        setReportTotal(data.totalItem ?? data.totalElements ?? 0);
      }
    } catch (_) {
      enqueueSnackbar("Không thể tải danh sách báo cáo.", { variant: "error" });
    } finally {
      setReportLoading(false);
    }
  };

  // ── Fetch banned posts ──
  const fetchBannedPosts = async () => {
    setBannedLoading(true);
    try {
      const res = await apiClient.get("/admin/forum/admin/posts/banned/list", {
        params: { organizationId: stableOrgId, page: bannedPage, size: 10 },
      });
      const data = res.data?.data;
      if (data) {
        setBannedPosts(data.items ?? data.content ?? []);
        setBannedTotal(data.totalItem ?? data.totalElements ?? 0);
      }
    } catch (_) {
      enqueueSnackbar("Không thể tải danh sách bài bị cấm.", { variant: "error" });
    } finally {
      setBannedLoading(false);
    }
  };

  // ── Fetch hidden posts ──
  const fetchHiddenPosts = async () => {
    setHiddenLoading(true);
    try {
      const res = await apiClient.get("/admin/forum/admin/posts/hidden/list", {
        params: { organizationId: stableOrgId, page: hiddenPage, size: 10 },
      });
      const data = res.data?.data;
      if (data) {
        setHiddenPosts(data.items ?? data.content ?? []);
        setHiddenTotal(data.totalItem ?? data.totalElements ?? 0);
      }
    } catch (_) {
      enqueueSnackbar("Không thể tải danh sách bài bị ẩn.", { variant: "error" });
    } finally {
      setHiddenLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableOrgId, reportPage, reportSize]);

  useEffect(() => {
    fetchBannedPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableOrgId, bannedPage]);

  useEffect(() => {
    fetchHiddenPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableOrgId, hiddenPage]);

  // ── Review report ──
  const openReview = (report) => {
    setReviewForm({ decision: "APPROVED", action: "BAN_POST", reviewNote: "" });
    setReviewDialog({ open: true, report });
  };

  const handleReviewSubmit = async () => {
    if (!reviewForm.decision) {
      enqueueSnackbar("Vui lòng chọn Quyết định.", { variant: "warning" });
      return;
    }
    if (reviewForm.decision === "APPROVED" && !reviewForm.action) {
      enqueueSnackbar("Vui lòng chọn Hành động xử lý.", { variant: "warning" });
      return;
    }
    setSubmitting(true);
    try {
      const payload = { decision: reviewForm.decision, reviewNote: reviewForm.reviewNote };
      if (reviewForm.decision === "APPROVED") payload.action = reviewForm.action;
      await apiClient.put(`/admin/forum/reports/${reviewDialog.report.id}`, payload);
      enqueueSnackbar("Đã xử lý báo cáo thành công.", { variant: "success" });
      setReviewDialog({ open: false, report: null });
      fetchReports();
      fetchBannedPosts();
      fetchHiddenPosts();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || "Không thể xử lý báo cáo.", { variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Unban post ──
  const handleUnban = async (postId) => {
    try {
      await apiClient.post(`/admin/forum/admin/posts/${postId}/unban`);
      enqueueSnackbar("Đã khôi phục bài viết.", { variant: "success" });
      fetchBannedPosts();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || "Không thể khôi phục.", { variant: "error" });
    }
  };

  // ── Unhide post ──
  const handleUnhide = async (postId) => {
    try {
      await apiClient.put(`/admin/forum/posts/${postId}/visibility`, { hidden: false });
      enqueueSnackbar("Đã hiển thị lại bài viết.", { variant: "success" });
      fetchHiddenPosts();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || "Không thể khôi phục.", { variant: "error" });
    }
  };

  // ── Columns ──
  const reportColumns = [
    { id: "id", label: "ID", width: 60 },
    {
      id: "postId",
      label: "Bài viết ID",
      render: (val) => <Typography variant="body2" sx={{ fontWeight: 600 }}>#{val}</Typography>,
    },
    { id: "reporterMemberId", label: "Người báo cáo" },
    { id: "reason", label: "Lý do", render: (val) => <Typography variant="body2" color="error">{val}</Typography> },
    { id: "createdAt", label: "Ngày tạo", render: (val) => formatDate(val) },
    {
      id: "status",
      label: "Trạng thái",
      render: (val) => {
        const s = val ?? "PENDING";
        return <Chip size="small" label={REPORT_STATUS_LABEL[s] ?? s} color={REPORT_STATUS_COLOR[s] ?? "default"} />;
      },
    },
    {
      id: "actions",
      label: "",
      align: "right",
      render: (_, row) => {
        const isPending = !row.status || row.status === "PENDING";
        return (
          <Tooltip title={isPending ? "Xử lý báo cáo" : "Đã xử lý"}>
            <span>
              <IconButton size="small" color="primary" onClick={() => openReview(row)} disabled={!isPending}>
                <CheckCircleOutlineIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        );
      },
    },
  ];

  const bannedColumns = [
    { id: "id", label: "ID", width: 60 },
    { id: "topicTitle", label: "Chủ đề", render: (val) => truncateText(val, 35) },
    { id: "content", label: "Nội dung", render: (val) => truncateText(toPlainText(val), 50) },
    { id: "authorMemberId", label: "Tác giả (ID)" },
    { id: "updatedAt", label: "Ngày cấm", render: (val) => formatDateTime(val) },
    {
      id: "actions",
      label: "",
      align: "right",
      render: (_, row) => (
        <Tooltip title="Bỏ cấm — khôi phục bài viết">
          <IconButton size="small" color="success" onClick={() => handleUnban(row.id)}>
            <LockOpenOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const hiddenColumns = [
    { id: "id", label: "ID", width: 60 },
    { id: "topicTitle", label: "Chủ đề", render: (val) => truncateText(val, 35) },
    { id: "content", label: "Nội dung", render: (val) => truncateText(toPlainText(val), 50) },
    { id: "authorMemberId", label: "Tác giả (ID)" },
    { id: "updatedAt", label: "Ngày ẩn", render: (val) => formatDateTime(val) },
    {
      id: "actions",
      label: "",
      align: "right",
      render: (_, row) => (
        <Tooltip title="Hiển thị lại bài viết">
          <IconButton size="small" color="success" onClick={() => handleUnhide(row.id)}>
            <VisibilityOutlinedIcon fontSize="small" />
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

      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{
          mb: 3,
          borderBottom: 1,
          borderColor: "divider",
          "& .MuiTab-root": { textTransform: "none", fontWeight: 700, fontSize: 15, minWidth: 120, py: 1.5 },
        }}
      >
        <Tab label={`Chờ xử lý (${reportTotal})`} />
        <Tab label={`Bài bị cấm (${bannedTotal})`} />
        <Tab label={`Bài bị ẩn (${hiddenTotal})`} />
      </Tabs>

      {activeTab === 0 && (
        <AdminDataTable
          columns={reportColumns}
          rows={reports}
          totalCount={reportTotal}
          page={reportPage}
          rowsPerPage={reportSize}
          onPageChange={(_, p) => setReportPage(p)}
          onRowsPerPageChange={(e) => { setReportSize(Number(e.target.value)); setReportPage(0); }}
          loading={reportLoading}
        />
      )}

      {activeTab === 1 && (
        <AdminDataTable
          columns={bannedColumns}
          rows={bannedPosts}
          totalCount={bannedTotal}
          page={bannedPage}
          rowsPerPage={10}
          onPageChange={(_, p) => setBannedPage(p)}
          loading={bannedLoading}
          emptyMessage="Không có bài viết nào đang bị cấm."
        />
      )}

      {activeTab === 2 && (
        <AdminDataTable
          columns={hiddenColumns}
          rows={hiddenPosts}
          totalCount={hiddenTotal}
          page={hiddenPage}
          rowsPerPage={10}
          onPageChange={(_, p) => setHiddenPage(p)}
          loading={hiddenLoading}
          emptyMessage="Không có bài viết nào đang bị ẩn."
        />
      )}

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
              <MenuItem value="WARN">Cảnh cáo — Gửi thông báo nhắc nhở, bài vẫn hiển thị</MenuItem>
              <MenuItem value="HIDE_POST">Ẩn bài — Bài không hiển thị, có thể khôi phục</MenuItem>
              <MenuItem value="BAN_POST">Cấm vĩnh viễn — Bài bị khóa, không thể khôi phục</MenuItem>
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
