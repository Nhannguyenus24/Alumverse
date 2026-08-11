import { useEffect, useState } from "react";
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
import { useTranslation } from "react-i18next";
import AdminDataTable from "../../components/admin/AdminDataTable";
import AdminStatusChip from "../../components/admin/AdminStatusChip";
import { useAdminSystemContext } from "../../stores/AdminStore";
import { formatDate, formatDateTime } from "../../utils/dateFormatter";
import { truncateText, toPlainText } from "../../utils/stringUtils";
import apiClient from "../../utils/axios";

const AdminForumReportsPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation("admin");
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
    setBreadcrumbs?.([{ label: t('forum_reports_breadcrumb'), active: true }]);
  }, [setBreadcrumbs, t]);

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
      enqueueSnackbar(t('forum_report_load_error'), { variant: "error" });
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
      enqueueSnackbar(t('forum_report_banned_load_error'), { variant: "error" });
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
      enqueueSnackbar(t('forum_report_hidden_load_error'), { variant: "error" });
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
      enqueueSnackbar(t('forum_report_select_decision'), { variant: "warning" });
      return;
    }
    if (reviewForm.decision === "APPROVED" && !reviewForm.action) {
      enqueueSnackbar(t('forum_report_select_action'), { variant: "warning" });
      return;
    }
    setSubmitting(true);
    try {
      const payload = { decision: reviewForm.decision, reviewNote: reviewForm.reviewNote };
      if (reviewForm.decision === "APPROVED") payload.action = reviewForm.action;
      await apiClient.put(`/admin/forum/reports/${reviewDialog.report.id}`, payload);
      enqueueSnackbar(t('forum_report_reviewed_success'), { variant: "success" });
      setReviewDialog({ open: false, report: null });
      fetchReports();
      fetchBannedPosts();
      fetchHiddenPosts();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || t('forum_report_review_failed'), { variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Unban post ──
  const handleUnban = async (postId) => {
    try {
      await apiClient.post(`/admin/forum/admin/posts/${postId}/unban`);
      enqueueSnackbar(t('forum_post_restored'), { variant: "success" });
      fetchBannedPosts();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || t('forum_post_restore_failed'), { variant: "error" });
    }
  };

  // ── Unhide post ──
  const handleUnhide = async (postId) => {
    try {
      await apiClient.put(`/admin/forum/posts/${postId}/visibility`, { hidden: false });
      enqueueSnackbar(t('forum_post_unhidden'), { variant: "success" });
      fetchHiddenPosts();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || t('forum_post_restore_failed'), { variant: "error" });
    }
  };

  // ── Columns ──
  const reportColumns = [
    { id: "id", label: "ID", width: 60 },
    {
      id: "postId",
      label: t('forum_col_post_id'),
      render: (val) => <Typography variant="body2" sx={{ fontWeight: 600 }}>#{val}</Typography>,
    },
    { id: "reporterMemberId", label: t('forum_col_reporter') },
    { id: "reason", label: t('forum_col_reason'), render: (val) => <Typography variant="body2" color="error">{val}</Typography> },
    { id: "createdAt", label: t('forum_col_created_at'), render: (val) => formatDate(val) },
    {
      id: "status",
      label: t('forum_col_status'),
      render: (val) => {
        const s = val ?? "PENDING";
        return <AdminStatusChip status={s} category="report" />;
      },
    },
    {
      id: "actions",
      label: t('actions'),
      align: "right",
      width: 96,
      render: (_, row) => {
        const isPending = !row.status || row.status === "PENDING";
        return (
          <Tooltip title={isPending ? t('forum_action_review') : t('forum_action_reviewed')}>
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
    { id: "topicTitle", label: t('forum_col_topic'), render: (val) => truncateText(val, 35) },
    { id: "content", label: t('forum_col_content'), render: (val) => truncateText(toPlainText(val), 50) },
    { id: "authorMemberId", label: t('forum_col_author_id') },
    { id: "updatedAt", label: t('forum_col_banned_at'), render: (val) => formatDateTime(val) },
    {
      id: "actions",
      label: t('actions'),
      align: "right",
      width: 96,
      render: (_, row) => (
        <Tooltip title={t('forum_action_restore')}>
          <IconButton size="small" color="success" onClick={() => handleUnban(row.id)}>
            <LockOpenOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const hiddenColumns = [
    { id: "id", label: "ID", width: 60 },
    { id: "topicTitle", label: t('forum_col_topic'), render: (val) => truncateText(val, 35) },
    { id: "content", label: t('forum_col_content'), render: (val) => truncateText(toPlainText(val), 50) },
    { id: "authorMemberId", label: t('forum_col_author_id') },
    { id: "updatedAt", label: t('forum_col_hidden_at'), render: (val) => formatDateTime(val) },
    {
      id: "actions",
      label: t('actions'),
      align: "right",
      width: 96,
      render: (_, row) => (
        <Tooltip title={t('forum_action_unhide')}>
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
          {t('forum_reports_title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
          {t('forum_reports_subtitle')}
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
        <Tab label={t('forum_tab_pending', { count: reportTotal })} />
        <Tab label={t('forum_tab_banned_posts', { count: bannedTotal })} />
        <Tab label={t('forum_tab_hidden_posts', { count: hiddenTotal })} />
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
          emptyMessage={t('forum_empty_banned')}
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
          emptyMessage={t('forum_empty_hidden')}
        />
      )}

      {/* Review Dialog */}
      <Dialog
        open={reviewDialog.open}
        onClose={() => setReviewDialog({ open: false, report: null })}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>{t('forum_review_dialog_title', { id: reviewDialog.report?.id })}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2.5 }}>
          <TextField
            select
            label={t('forum_review_decision_label')}
            InputLabelProps={{ shrink: true }}
            fullWidth
            sx={{ mt: 1 }}
            value={reviewForm.decision}
            onChange={(e) => setReviewForm((f) => ({ ...f, decision: e.target.value }))}
          >
            <MenuItem value="APPROVED">{t('forum_review_decision_approved')}</MenuItem>
            <MenuItem value="REJECTED">{t('forum_review_decision_rejected')}</MenuItem>
          </TextField>

          {reviewForm.decision === "APPROVED" && (
            <TextField
              select
              label={t('forum_review_action_label')}
              fullWidth
              value={reviewForm.action}
              onChange={(e) => setReviewForm((f) => ({ ...f, action: e.target.value }))}
            >
              <MenuItem value="WARN">{t('forum_review_action_warn')}</MenuItem>
              <MenuItem value="HIDE_POST">{t('forum_review_action_hide')}</MenuItem>
              <MenuItem value="BAN_POST">{t('forum_review_action_ban')}</MenuItem>
            </TextField>
          )}

          <TextField
            label={t('forum_review_note_label')}
            fullWidth
            multiline
            rows={3}
            value={reviewForm.reviewNote}
            onChange={(e) => setReviewForm((f) => ({ ...f, reviewNote: e.target.value }))}
            placeholder={t('forum_review_note_placeholder')}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setReviewDialog({ open: false, report: null })}
            variant="outlined"
            color="secondary"
          >
            {t('forum_btn_cancel')}
          </Button>
          <Button onClick={handleReviewSubmit} variant="contained" disabled={submitting}>
            {submitting ? t('forum_btn_processing') : t('forum_btn_confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminForumReportsPage;
