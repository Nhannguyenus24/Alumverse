import LoadingSkeleton from '../../components/LoadingSkeleton';
import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Rating,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DoneAllOutlinedIcon from "@mui/icons-material/DoneAllOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import BlockIcon from "@mui/icons-material/Block";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import HourglassEmptyOutlinedIcon from "@mui/icons-material/HourglassEmptyOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import AdminConfirmDeleteDialog from "../../components/admin/AdminConfirmDeleteDialog";
import AdminDataTable from "../../components/admin/AdminDataTable";
import ActionOverlay from "../../components/ActionOverlay";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { ADMIN_STATUS_CHIP_SX } from "../../constants/adminUiShared";
import { getAdminMentorshipSessionStatusOptions } from "../../constants/adminDefaultMentorship";
import useAdminMentorship from "../../hooks/admin/useAdminMentorship";
import { useAdminSystemContext } from "../../stores/AdminStore";
import { formatDateTime } from "../../utils/dateFormatter";
import AdminDashboardMetricTile from "../../components/admin/AdminDashboardMetricTile";

const statusChip = (status, t) => {
  const k = String(status || "").toLowerCase();
  if (k === "pending") return { color: "warning", label: t('mentorship_status_pending') };
  if (k === "confirmed") return { color: "info", label: t('mentorship_status_confirmed') };
  if (k === "completed") return { color: "success", label: t('mentorship_status_completed') };
  if (k === "cancelled") return { color: "default", label: t('mentorship_status_cancelled') };
  if (k === "rejected") return { color: "error", label: t('mentorship_status_rejected') };
  return { color: "default", label: status || "-" };
};

/** Chip trạng thái duyệt hồ sơ mentor (PENDING / APPROVED / REJECTED / NEED_UPDATE). */
const mentorStatusChip = (status, t) => {
  const s = String(status || "").toUpperCase();
  if (s === "APPROVED") return { color: "success", label: t('mentorship_approval_approved') };
  if (s === "REJECTED") return { color: "error", label: t('mentorship_status_rejected') };
  if (s === "NEED_UPDATE") return { color: "warning", label: t('mentorship_btn_request_update') };
  return { color: "warning", label: t('mentorship_approval_pending') };
};

const mentorApproval = (mentor) => {
  const status = String(mentor?.status || '').toUpperCase();
  return {
    status,
    isApproved: status === 'APPROVED',
    isPending: status === 'PENDING',
    needsReview: status === 'PENDING' || status === 'NEED_UPDATE',
  };
};

const reportStatusChip = (status, t) => {
  const s = String(status || "").toUpperCase();
  if (s === "RESOLVED") return { color: "success", label: t('mentorship_report_status_resolved') };
  if (s === "DISMISSED") return { color: "default", label: t('mentorship_report_status_dismissed') };
  return { color: "warning", label: t('mentorship_report_status_pending') };
};

const accountStatusChip = (status) => {
  const s = String(status || "").toUpperCase();
  if (s === "BANNED") return { color: "error", label: "BANNED" };
  if (s === "SUSPENDED") return { color: "warning", label: "SUSPENDED" };
  if (s === "ACTIVE") return { color: "success", label: "ACTIVE" };
  return { color: "default", label: status || "-" };
};

const PersonCell = ({ name, email, fallback }) => (
  <Box>
    <Typography variant="body2" sx={{ fontWeight: 600 }}>
      {name || fallback || "-"}
    </Typography>
    {email ? (
      <Typography variant="caption" color="text.secondary">
        {email}
      </Typography>
    ) : null}
  </Box>
);

const DetailRow = ({ label, children }) => (
  <Typography variant="body2">
    <strong>{label}:</strong> {children}
  </Typography>
);

const AdminMentorshipPage = () => {
  const { t } = useTranslation('admin');

  const sessionStatusOptions = getAdminMentorshipSessionStatusOptions(t);

  const { setBreadcrumbs } = useOutletContext();
  const { stableOrgId } = useAdminSystemContext();
  const {
    sessions, sessionTotal, sessionLoading,
    sessionPage, setSessionPage, sessionRowsPerPage, setSessionRowsPerPage,
    statusFilter, setStatusFilter, updateSessionStatus, deleteSession,

    mentors, mentorTotal, mentorLoading,
    mentorCounts,
    mentorPage, setMentorPage, mentorRowsPerPage, setMentorRowsPerPage,
    approvalFilter, setApprovalFilter,
    approveMentor, rejectMentor, requestMentorUpdate,

    mentees, menteeTotal, menteeLoading,
    menteePage, setMenteePage, menteeRowsPerPage, setMenteeRowsPerPage,

    reports, reportTotal, reportLoading,
    reportPage, setReportPage, reportRowsPerPage, setReportRowsPerPage,
    reportStatusFilter, setReportStatusFilter, resolveReport,

    statistics,
  } = useAdminMentorship(stableOrgId);

  useEffect(() => {
    setBreadcrumbs?.([{ label: t('nav_mentorship'), active: true }]);
  }, [setBreadcrumbs]);

  const [tab, setTab] = useState("pending");
  const [detailItem, setDetailItem] = useState(null);
  const [mentorDetail, setMentorDetail] = useState(null);
  const [reportDetail, setReportDetail] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  // Dialog nhập lý do cho reject / request-update: { mode, mentor, reason }
  const [reviewDialog, setReviewDialog] = useState(null);
  // Dialog xử lý report: { report, action, note }
  const [resolveDialog, setResolveDialog] = useState(null);
  const { run, pending } = useAsyncAction();

  // The hook methods catch internally and return true/false; throw on false so
  // run() reports the error snackbar instead of a false success.
  const handleConfirm = (s) =>
    run(async () => { if (!(await updateSessionStatus(s.id, "Confirmed"))) throw new Error(); },
      { successMessage: t('mentorship_session_confirmed'), errorMessage: t('mentorship_session_confirm_error') });

  const handleCancel = (s) =>
    run(async () => { if (!(await updateSessionStatus(s.id, "Cancelled"))) throw new Error(); },
      { successMessage: t('mentorship_session_cancelled'), errorMessage: t('mentorship_session_cancel_error') });

  const handleApprove = (m, onDone) =>
    run(async () => { if (!(await approveMentor(m.memberId))) throw new Error(); },
      { successMessage: t('mentorship_mentor_approved'), errorMessage: t('mentorship_mentor_approve_error'), onSuccess: onDone });

  const handleReviewSubmit = () => {
    if (!reviewDialog) return;
    const reason = (reviewDialog.reason || '').trim();
    if (!reason) return;
    const isReject = reviewDialog.mode === 'reject';
    run(
      async () => {
        const ok = isReject
          ? await rejectMentor(reviewDialog.mentor.memberId, reason)
          : await requestMentorUpdate(reviewDialog.mentor.memberId, reason);
        if (!ok) throw new Error();
      },
      {
        successMessage: isReject ? t('mentorship_mentor_rejected') : t('mentorship_mentor_update_requested'),
        errorMessage: isReject ? t('mentorship_mentor_reject_error') : t('mentorship_mentor_update_request_error'),
        onSuccess: () => { setReviewDialog(null); setMentorDetail(null); },
      },
    );
  };

  const handleResolveSubmit = () => {
    if (!resolveDialog) return;
    run(
      async () => { if (!(await resolveReport(resolveDialog.report.id, resolveDialog.action, (resolveDialog.note || '').trim()))) throw new Error(); },
      {
        successMessage: t('mentorship_report_resolved_ok'),
        errorMessage: t('mentorship_report_resolve_error'),
        onSuccess: () => { setResolveDialog(null); setReportDetail(null); },
      },
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    run(async () => { if (!(await deleteSession(deleteTarget.id))) throw new Error(); },
      { successMessage: t('mentorship_session_deleted'), errorMessage: t('mentorship_session_delete_error'), onSuccess: () => setDeleteTarget(null) });
  };

  // Khi chuyển tab, đặt bộ lọc mentor phù hợp: tab "Cần duyệt" chỉ xem PENDING.
  const changeTab = (value) => {
    setTab(value);
    if (value === 'pending') { setApprovalFilter('PENDING'); setMentorPage(0); }
    if (value === 'mentors') { setApprovalFilter('ALL'); setMentorPage(0); }
  };

  const metricRows = statistics
    ? [
        [
          { label: t('metric_total_mentors'), value: statistics.totalMentors, icon: <SchoolOutlinedIcon /> },
          { label: t('metric_approved_mentors'), value: statistics.approvedMentors, icon: <VerifiedUserOutlinedIcon /> },
          { label: t('metric_pending_mentors'), value: statistics.pendingMentors, icon: <PendingActionsOutlinedIcon /> },
        ],
        [
          { label: t('metric_total_sessions'), value: statistics.totalSessions, icon: <EventNoteOutlinedIcon /> },
          { label: t('mentorship_metric_pending_sessions'), value: statistics.pendingSessions, icon: <HourglassEmptyOutlinedIcon /> },
          { label: t('mentorship_metric_confirmed_sessions'), value: statistics.confirmedSessions, icon: <EventAvailableOutlinedIcon /> },
          { label: t('metric_completed_sessions'), value: statistics.completedSessions, icon: <TaskAltOutlinedIcon /> },
        ],
        [
          { label: t('mentorship_metric_cancelled_sessions'), value: statistics.cancelledSessions, icon: <EventBusyOutlinedIcon /> },
          { label: t('mentorship_metric_rejected_sessions'), value: statistics.rejectedSessions, icon: <BlockOutlinedIcon /> },
          { label: t('mentorship_metric_availabilities'), value: statistics.totalAvailabilities, icon: <CalendarMonthOutlinedIcon /> },
          { label: t('metric_feedbacks'), value: statistics.totalFeedbacks, icon: <RateReviewOutlinedIcon /> },
        ],
      ]
    : [];

  // ---- Column builders ----
  const mentorColumns = (showReviewActions) => [
    {
      id: "mentor",
      label: t('mentorship_col_mentor'),
      render: (_, m) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32 }}>{(m.mentorName || "?").charAt(0).toUpperCase()}</Avatar>
          <PersonCell name={m.mentorName} email={m.mentorEmail} fallback={`#${m.memberId}`} />
        </Box>
      ),
    },
    {
      id: "job",
      label: t('mentorship_col_job_company'),
      render: (_, m) => (
        <>
          <Typography variant="body2">{m.currentJobTitle || "-"}</Typography>
          <Typography variant="caption" color="text.secondary">{m.currentCompany || ""}</Typography>
        </>
      ),
    },
    {
      id: "rating",
      label: t('mentorship_col_rating'),
      render: (_, m) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Rating value={Number(m.ratingAvg) || 0} size="small" readOnly precision={0.1} />
          <Typography variant="caption" color="text.secondary">{Number(m.ratingAvg ?? 0).toFixed(1)}</Typography>
        </Box>
      ),
    },
    { id: "totalSessions", label: t('mentorship_col_session_count'), align: "right", render: (_, m) => m.totalSessions ?? 0 },
    {
      id: "approval",
      label: t('mentorship_col_approval'),
      render: (_, m) => {
        const chip = mentorStatusChip(m.status, t);
        return <Chip size="small" color={chip.color} label={chip.label} sx={ADMIN_STATUS_CHIP_SX} />;
      },
    },
    { id: "createdAt", label: t('mentorship_col_created_at'), render: (_, m) => formatDateTime(m.createdAt) },
    {
      id: "actions",
      label: t('col_actions'),
      align: "right",
      render: (_, m) => (
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
          <Tooltip title={t('mentorship_tooltip_view')}>
            <IconButton size="small" color="primary" onClick={() => setMentorDetail(m)}>
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {(showReviewActions || mentorApproval(m).needsReview) && mentorApproval(m).needsReview && (
            <>
              <Tooltip title={t('mentorship_tooltip_approve_mentor')}>
                <span><IconButton size="small" color="success" disabled={pending} onClick={() => handleApprove(m)}>
                  <CheckCircleOutlineIcon fontSize="small" />
                </IconButton></span>
              </Tooltip>
              <Tooltip title={t('mentorship_tooltip_request_update')}>
                <span><IconButton size="small" color="warning" disabled={pending} onClick={() => setReviewDialog({ mode: 'request', mentor: m, reason: '' })}>
                  <EditNoteOutlinedIcon fontSize="small" />
                </IconButton></span>
              </Tooltip>
              <Tooltip title={t('mentorship_tooltip_reject')}>
                <span><IconButton size="small" color="error" disabled={pending} onClick={() => setReviewDialog({ mode: 'reject', mentor: m, reason: '' })}>
                  <BlockIcon fontSize="small" />
                </IconButton></span>
              </Tooltip>
            </>
          )}
        </Box>
      ),
    },
  ];

  const menteeColumns = [
    {
      id: "mentee",
      label: t('mentorship_col_mentee'),
      render: (_, m) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32 }}>{(m.menteeName || "?").charAt(0).toUpperCase()}</Avatar>
          <PersonCell name={m.menteeName} email={m.menteeEmail} fallback={`#${m.memberId}`} />
        </Box>
      ),
    },
    { id: "totalSessions", label: t('mentorship_col_mentee_sessions'), align: "right", render: (_, m) => m.totalSessions ?? 0 },
    { id: "completedSessions", label: t('metric_completed_sessions'), align: "right", render: (_, m) => m.completedSessions ?? 0 },
    { id: "lastSessionAt", label: t('mentorship_col_last_session'), render: (_, m) => formatDateTime(m.lastSessionAt) },
    {
      id: "userStatus",
      label: t('mentorship_col_account_status'),
      render: (_, m) => {
        const chip = accountStatusChip(m.userStatus);
        return <Chip size="small" color={chip.color} label={chip.label} sx={ADMIN_STATUS_CHIP_SX} />;
      },
    },
  ];

  const reportColumns = [
    { id: "id", label: "ID", render: (_, r) => `#${r.id}` },
    { id: "reporter", label: t('mentorship_col_reporter'), render: (_, r) => <PersonCell name={r.reporterName} email={r.reporterEmail} fallback={`#${r.reporterMemberId}`} /> },
    {
      id: "reported",
      label: t('mentorship_col_reported'),
      render: (_, r) => (
        <Box>
          <PersonCell name={r.reportedName} email={r.reportedEmail} fallback={`#${r.reportedMemberId}`} />
          {r.reportedUserStatus && r.reportedUserStatus !== 'ACTIVE' ? (
            <Chip size="small" sx={{ mt: 0.5, ...ADMIN_STATUS_CHIP_SX }} color={accountStatusChip(r.reportedUserStatus).color} label={accountStatusChip(r.reportedUserStatus).label} />
          ) : null}
        </Box>
      ),
    },
    { id: "reasonCategory", label: t('mentorship_col_reason'), render: (_, r) => r.reasonCategory || "-" },
    {
      id: "status",
      label: t('col_status'),
      render: (_, r) => {
        const chip = reportStatusChip(r.status, t);
        return <Chip size="small" color={chip.color} label={chip.label} sx={ADMIN_STATUS_CHIP_SX} />;
      },
    },
    { id: "createdAt", label: t('mentorship_col_created_at'), render: (_, r) => formatDateTime(r.createdAt) },
    {
      id: "actions",
      label: t('col_actions'),
      align: "right",
      render: (_, r) => (
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
          <Tooltip title={t('mentorship_tooltip_view')}>
            <IconButton size="small" color="primary" onClick={() => setReportDetail(r)}>
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {String(r.status).toUpperCase() === 'PENDING' && (
            <Tooltip title={t('mentorship_tooltip_resolve')}>
              <span><IconButton size="small" color="warning" disabled={pending} onClick={() => setResolveDialog({ report: r, action: 'NONE', note: '' })}>
                <GavelOutlinedIcon fontSize="small" />
              </IconButton></span>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  const sessionColumns = [
    { id: "id", label: "ID" },
    { id: "mentor", label: t('mentorship_col_mentor'), render: (_, s) => <PersonCell name={s.mentorName} email={s.mentorEmail} fallback={s.mentorMemberId ? `#${s.mentorMemberId}` : "-"} /> },
    { id: "mentee", label: t('mentorship_col_mentee'), render: (_, s) => <PersonCell name={s.menteeName} email={s.menteeEmail} fallback={s.menteeMemberId ? `#${s.menteeMemberId}` : "-"} /> },
    {
      id: "status", label: t('col_status'),
      render: (_, s) => { const chip = statusChip(s.status, t); return <Chip size="small" color={chip.color} label={chip.label} sx={ADMIN_STATUS_CHIP_SX} />; },
    },
    { id: "sessionType", label: t('mentorship_col_type'), render: (_, s) => s.sessionType || "-" },
    {
      id: "time", label: t('mentorship_col_time'),
      render: (_, s) => s.startTime ? (<Typography variant="caption">{formatDateTime(s.startTime)}<br />→ {formatDateTime(s.endTime)}</Typography>) : "-",
    },
    { id: "createdAt", label: t('mentorship_col_created_at'), render: (_, s) => formatDateTime(s.createdAt) },
    {
      id: "actions", label: t('col_actions'), align: "right",
      render: (_, s) => {
        const isPending = String(s.status).toLowerCase() === "pending";
        const isCancellable = ["pending", "confirmed"].includes(String(s.status).toLowerCase());
        return (
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
            <Tooltip title={t('mentorship_tooltip_view')}>
              <IconButton size="small" color="primary" onClick={() => setDetailItem(s)}><VisibilityOutlinedIcon fontSize="small" /></IconButton>
            </Tooltip>
            {isPending && (
              <Tooltip title={t('mentorship_tooltip_confirm')}>
                <span><IconButton size="small" color="success" disabled={pending} onClick={() => handleConfirm(s)}><DoneAllOutlinedIcon fontSize="small" /></IconButton></span>
              </Tooltip>
            )}
            {isCancellable && (
              <Tooltip title={t('mentorship_tooltip_cancel')}>
                <span><IconButton size="small" color="warning" disabled={pending} onClick={() => handleCancel(s)}><CloseOutlinedIcon fontSize="small" /></IconButton></span>
              </Tooltip>
            )}
            <Tooltip title={t('mentorship_tooltip_delete')}>
              <span><IconButton size="small" color="error" disabled={pending} onClick={() => setDeleteTarget(s)}><DeleteOutlineIcon fontSize="small" /></IconButton></span>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  const pendingCount = useMemo(
    () => mentorCounts?.pending ?? 0,
    [mentorCounts],
  );
  const mentorListCount = mentorCounts?.all ?? 0;

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, color: "primary.main" }}>{t('mentorship_page_title')}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>{t('mentorship_page_subtitle')}</Typography>
      </Box>

      {statistics ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mb: 4 }}>
          {metricRows.map((row, rowIndex) => (
            <Box key={rowIndex} sx={{ display: "flex", flexWrap: "wrap", gap: 3, "& > *": { flex: { xs: "1 1 100%", sm: "1 1 calc(50% - 12px)", lg: `1 1 calc(${100 / row.length}% - 18px)` } } }}>
              {row.map((metric) => (<AdminDashboardMetricTile key={metric.label} label={metric.label} value={metric.value} icon={metric.icon} />))}
            </Box>
          ))}
        </Box>
      ) : null}

      <Tabs value={tab} onChange={(_, v) => changeTab(v)} sx={{ mb: 2 }} variant="scrollable" scrollButtons="auto">
        <Tab value="pending" label={`${t('mentorship_tab_pending')} (${pendingCount})`} />
        <Tab value="mentors" label={`${t('mentorship_tab_mentors')} (${mentorListCount})`} />
        <Tab value="mentees" label={`${t('mentorship_tab_mentee_list')} (${menteeTotal})`} />
        <Tab value="sessions" label={`${t('mentorship_tab_sessions')} (${sessionTotal})`} />
        <Tab value="reports" label={`${t('mentorship_tab_reports')} (${reportTotal})`} />
      </Tabs>

      {tab === "pending" && (
        mentorLoading
          ? <Stack alignItems="center" sx={{ py: 4 }}><LoadingSkeleton /></Stack>
          : <AdminDataTable
              columns={mentorColumns(true)}
              rows={mentors}
              totalCount={mentorTotal}
              page={mentorPage}
              rowsPerPage={mentorRowsPerPage}
              onPageChange={(_, p) => setMentorPage(p)}
              onRowsPerPageChange={(e) => { setMentorRowsPerPage(Number(e.target.value)); setMentorPage(0); }}
              onRowClick={(m) => setMentorDetail(m)}
              emptyMessage={t('mentorship_pending_empty')}
            />
      )}

      {tab === "mentors" && (
        mentorLoading
          ? <Stack alignItems="center" sx={{ py: 4 }}><LoadingSkeleton /></Stack>
          : <AdminDataTable
              columns={mentorColumns(false)}
              rows={mentors}
              totalCount={mentorTotal}
              page={mentorPage}
              rowsPerPage={mentorRowsPerPage}
              onPageChange={(_, p) => setMentorPage(p)}
              onRowsPerPageChange={(e) => { setMentorRowsPerPage(Number(e.target.value)); setMentorPage(0); }}
              onRowClick={(m) => setMentorDetail(m)}
              emptyMessage={t('mentorship_mentors_empty')}
              filters={
                <TextField select size="small" label={t('mentorship_col_approval')} value={approvalFilter}
                  onChange={(e) => { setApprovalFilter(e.target.value); setMentorPage(0); }} sx={{ minWidth: 200 }}>
                  <MenuItem value="ALL">{t('mentorship_approval_all')}</MenuItem>
                  <MenuItem value="PENDING">{t('mentorship_approval_pending')}</MenuItem>
                  <MenuItem value="APPROVED">{t('mentorship_approval_approved')}</MenuItem>
                </TextField>
              }
            />
      )}

      {tab === "mentees" && (
        menteeLoading
          ? <Stack alignItems="center" sx={{ py: 4 }}><LoadingSkeleton /></Stack>
          : <AdminDataTable
              columns={menteeColumns}
              rows={mentees}
              totalCount={menteeTotal}
              page={menteePage}
              rowsPerPage={menteeRowsPerPage}
              onPageChange={(_, p) => setMenteePage(p)}
              onRowsPerPageChange={(e) => { setMenteeRowsPerPage(Number(e.target.value)); setMenteePage(0); }}
              emptyMessage={t('mentorship_mentees_empty')}
            />
      )}

      {tab === "sessions" && (
        sessionLoading
          ? <Stack alignItems="center" sx={{ py: 4 }}><LoadingSkeleton /></Stack>
          : <AdminDataTable
              columns={sessionColumns}
              rows={sessions}
              totalCount={sessionTotal}
              page={sessionPage}
              rowsPerPage={sessionRowsPerPage}
              onPageChange={(_, p) => setSessionPage(p)}
              onRowsPerPageChange={(e) => { setSessionRowsPerPage(Number(e.target.value)); setSessionPage(0); }}
              onRowClick={(s) => setDetailItem(s)}
              emptyMessage={t('mentorship_sessions_empty')}
              filters={
                <TextField select size="small" label={t('col_status')} value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setSessionPage(0); }} sx={{ minWidth: 200 }}>
                  {sessionStatusOptions.map((opt) => (<MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>))}
                </TextField>
              }
            />
      )}

      {tab === "reports" && (
        reportLoading
          ? <Stack alignItems="center" sx={{ py: 4 }}><LoadingSkeleton /></Stack>
          : <AdminDataTable
              columns={reportColumns}
              rows={reports}
              totalCount={reportTotal}
              page={reportPage}
              rowsPerPage={reportRowsPerPage}
              onPageChange={(_, p) => setReportPage(p)}
              onRowsPerPageChange={(e) => { setReportRowsPerPage(Number(e.target.value)); setReportPage(0); }}
              onRowClick={(r) => setReportDetail(r)}
              emptyMessage={t('mentorship_reports_empty')}
              filters={
                <TextField select size="small" label={t('col_status')} value={reportStatusFilter}
                  onChange={(e) => { setReportStatusFilter(e.target.value); setReportPage(0); }} sx={{ minWidth: 200 }}>
                  <MenuItem value="ALL">{t('mentorship_report_status_all')}</MenuItem>
                  <MenuItem value="PENDING">{t('mentorship_report_status_pending')}</MenuItem>
                  <MenuItem value="RESOLVED">{t('mentorship_report_status_resolved')}</MenuItem>
                  <MenuItem value="DISMISSED">{t('mentorship_report_status_dismissed')}</MenuItem>
                </TextField>
              }
            />
      )}

      {/* SESSION DETAIL */}
      <Dialog open={Boolean(detailItem)} onClose={() => setDetailItem(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ color: "primary.main", fontWeight: 800 }}>{t('mentorship_session_detail_title')}</DialogTitle>
        {detailItem ? (
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
            <DetailRow label="ID">{detailItem.id}</DetailRow>
            <DetailRow label={t('mentorship_col_mentor')}>{detailItem.mentorName || `#${detailItem.mentorMemberId ?? "-"}`} {detailItem.mentorEmail ? `(${detailItem.mentorEmail})` : ""}</DetailRow>
            <DetailRow label={t('mentorship_col_mentee')}>{detailItem.menteeName || `#${detailItem.menteeMemberId ?? "-"}`} {detailItem.menteeEmail ? `(${detailItem.menteeEmail})` : ""}</DetailRow>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" component="span"><strong>{t('col_status')}:</strong></Typography>
              <Chip size="small" color={statusChip(detailItem.status, t).color} label={statusChip(detailItem.status, t).label} sx={ADMIN_STATUS_CHIP_SX} />
            </Box>
            <DetailRow label={t('mentorship_detail_session_type')}>{detailItem.sessionType || "-"}</DetailRow>
            <DetailRow label={t('mentorship_col_time')}>{formatDateTime(detailItem.startTime)} → {formatDateTime(detailItem.endTime)}</DetailRow>
            <DetailRow label={t('mentorship_detail_meeting_link')}>{detailItem.meetingLink || "-"}</DetailRow>
            <DetailRow label="URL CV">{detailItem.cvUrl || "-"}</DetailRow>
            <DetailRow label={t('mentorship_col_created_at')}>{formatDateTime(detailItem.createdAt)}</DetailRow>
            {detailItem.introduction ? <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}><strong>{t('mentorship_detail_introduction')}:</strong> {detailItem.introduction}</Typography> : null}
            {detailItem.description ? <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}><strong>{t('mentorship_detail_description')}:</strong> {detailItem.description}</Typography> : null}
            {detailItem.bookingNote ? <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}><strong>{t('mentorship_detail_booking_note')}:</strong> {detailItem.bookingNote}</Typography> : null}

            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{t('mentorship_detail_audit')}</Typography>
            <DetailRow label={t('mentorship_col_mentor')}>{detailItem.mentorJoinedAt ? `${t('mentorship_detail_joined')} · ${formatDateTime(detailItem.mentorJoinedAt)}` : t('mentorship_detail_not_joined')}</DetailRow>
            <DetailRow label={t('mentorship_col_mentee')}>{detailItem.menteeJoinedAt ? `${t('mentorship_detail_joined')} · ${formatDateTime(detailItem.menteeJoinedAt)}` : t('mentorship_detail_not_joined')}</DetailRow>
            {detailItem.startedAt ? <DetailRow label={t('mentorship_status_confirmed')}>{formatDateTime(detailItem.startedAt)}</DetailRow> : null}
            {detailItem.endedAt ? <DetailRow label={t('mentorship_status_completed')}>{formatDateTime(detailItem.endedAt)}</DetailRow> : null}
            {detailItem.cancelReason ? <DetailRow label={t('mentorship_status_cancelled')}>{detailItem.cancelReason}</DetailRow> : null}
          </DialogContent>
        ) : null}
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" color="secondary" onClick={() => setDetailItem(null)} sx={{ textTransform: "none", fontWeight: 700 }}>{t('mentorship_btn_close')}</Button>
        </DialogActions>
      </Dialog>

      {/* MENTOR PROFILE DETAIL + REVIEW HISTORY */}
      <Dialog open={Boolean(mentorDetail)} onClose={() => setMentorDetail(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ color: "primary.main", fontWeight: 800 }}>{t('mentorship_mentor_profile_title')}</DialogTitle>
        {mentorDetail ? (
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
            <DetailRow label={t('mentorship_detail_member_id')}>{mentorDetail.memberId}</DetailRow>
            <DetailRow label={t('mentorship_detail_name')}>{mentorDetail.mentorName || "-"}</DetailRow>
            <DetailRow label="Email">{mentorDetail.mentorEmail || "-"}</DetailRow>
            <DetailRow label={t('mentorship_detail_job')}>{mentorDetail.currentJobTitle || "-"} {mentorDetail.currentCompany ? `@ ${mentorDetail.currentCompany}` : ""}</DetailRow>
            <DetailRow label={t('mentorship_col_rating')}>{Number(mentorDetail.ratingAvg ?? 0).toFixed(2)}</DetailRow>
            <DetailRow label={t('mentorship_detail_total_sessions')}>{mentorDetail.totalSessions ?? 0}</DetailRow>
            <DetailRow label={t('mentorship_col_created_at')}>{formatDateTime(mentorDetail.createdAt)}</DetailRow>

            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{t('mentorship_detail_review_history')}</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" component="span"><strong>{t('mentorship_detail_review_status')}:</strong></Typography>
              <Chip size="small" color={mentorStatusChip(mentorDetail.status, t).color} label={mentorStatusChip(mentorDetail.status, t).label} sx={ADMIN_STATUS_CHIP_SX} />
            </Box>
            {mentorDetail.reviewedAt || mentorDetail.reviewNote ? (
              <>
                <DetailRow label={t('mentorship_detail_reviewed_at')}>{formatDateTime(mentorDetail.reviewedAt)}</DetailRow>
                {mentorDetail.reviewNote ? <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}><strong>{t('mentorship_detail_review_note')}:</strong> {mentorDetail.reviewNote}</Typography> : null}
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">{t('mentorship_detail_no_review')}</Typography>
            )}
          </DialogContent>
        ) : null}
        <DialogActions sx={{ px: 3, pb: 2, gap: 1, flexWrap: 'wrap' }}>
          {mentorDetail && mentorApproval(mentorDetail).needsReview ? (
            <>
              <Button variant="contained" color="success" disabled={pending} startIcon={<CheckCircleOutlineIcon />}
                onClick={() => handleApprove(mentorDetail, () => setMentorDetail(null))} sx={{ textTransform: "none", fontWeight: 700 }}>
                {t('mentorship_btn_approve')}
              </Button>
              <Button variant="outlined" color="warning" disabled={pending} startIcon={<EditNoteOutlinedIcon />}
                onClick={() => setReviewDialog({ mode: 'request', mentor: mentorDetail, reason: '' })} sx={{ textTransform: "none", fontWeight: 700 }}>
                {t('mentorship_btn_request_update')}
              </Button>
              <Button variant="outlined" color="error" disabled={pending} startIcon={<BlockIcon />}
                onClick={() => setReviewDialog({ mode: 'reject', mentor: mentorDetail, reason: '' })} sx={{ textTransform: "none", fontWeight: 700 }}>
                {t('mentorship_btn_reject')}
              </Button>
            </>
          ) : null}
          <Button variant="outlined" color="secondary" onClick={() => setMentorDetail(null)} sx={{ textTransform: "none", fontWeight: 700 }}>{t('mentorship_btn_close')}</Button>
        </DialogActions>
      </Dialog>

      {/* REPORT DETAIL */}
      <Dialog open={Boolean(reportDetail)} onClose={() => setReportDetail(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ color: "primary.main", fontWeight: 800 }}>{t('mentorship_report_detail_title')}</DialogTitle>
        {reportDetail ? (
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
            <DetailRow label="ID">#{reportDetail.id}</DetailRow>
            <DetailRow label={t('mentorship_tab_sessions')}>#{reportDetail.sessionId ?? "-"}</DetailRow>
            <DetailRow label={t('mentorship_col_reporter')}>{reportDetail.reporterName || `#${reportDetail.reporterMemberId}`} {reportDetail.reporterEmail ? `(${reportDetail.reporterEmail})` : ""}</DetailRow>
            <DetailRow label={t('mentorship_col_reported')}>{reportDetail.reportedName || `#${reportDetail.reportedMemberId}`} {reportDetail.reportedEmail ? `(${reportDetail.reportedEmail})` : ""}</DetailRow>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" component="span"><strong>{t('mentorship_col_account_status')}:</strong></Typography>
              <Chip size="small" color={accountStatusChip(reportDetail.reportedUserStatus).color} label={accountStatusChip(reportDetail.reportedUserStatus).label} sx={ADMIN_STATUS_CHIP_SX} />
            </Box>
            <DetailRow label={t('mentorship_col_reason')}>{reportDetail.reasonCategory || "-"}</DetailRow>
            {reportDetail.description ? <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}><strong>{t('mentorship_detail_description')}:</strong> {reportDetail.description}</Typography> : null}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" component="span"><strong>{t('col_status')}:</strong></Typography>
              <Chip size="small" color={reportStatusChip(reportDetail.status, t).color} label={reportStatusChip(reportDetail.status, t).label} sx={ADMIN_STATUS_CHIP_SX} />
            </Box>
            <DetailRow label={t('mentorship_col_created_at')}>{formatDateTime(reportDetail.createdAt)}</DetailRow>
            {reportDetail.actionTaken && reportDetail.actionTaken !== 'NONE' ? <DetailRow label={t('mentorship_report_action_label')}>{reportDetail.actionTaken}</DetailRow> : null}
            {reportDetail.resolutionNote ? <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}><strong>{t('mentorship_report_note_label')}:</strong> {reportDetail.resolutionNote}</Typography> : null}
            {reportDetail.resolvedAt ? <DetailRow label={t('mentorship_detail_reviewed_at')}>{formatDateTime(reportDetail.resolvedAt)}</DetailRow> : null}
          </DialogContent>
        ) : null}
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          {reportDetail && String(reportDetail.status).toUpperCase() === 'PENDING' ? (
            <Button variant="contained" color="warning" startIcon={<GavelOutlinedIcon />} disabled={pending}
              onClick={() => setResolveDialog({ report: reportDetail, action: 'NONE', note: '' })} sx={{ textTransform: "none", fontWeight: 700 }}>
              {t('mentorship_report_resolve_submit')}
            </Button>
          ) : null}
          <Button variant="outlined" color="secondary" onClick={() => setReportDetail(null)} sx={{ textTransform: "none", fontWeight: 700 }}>{t('mentorship_btn_close')}</Button>
        </DialogActions>
      </Dialog>

      {/* REJECT / REQUEST-UPDATE (reason) */}
      <Dialog open={Boolean(reviewDialog)} onClose={() => !pending && setReviewDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>
          {reviewDialog?.mode === 'reject' ? t('mentorship_reject_title') : t('mentorship_request_update_title')}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus fullWidth multiline minRows={4} sx={{ mt: 1 }}
            label={reviewDialog?.mode === 'reject' ? t('mentorship_reject_reason_label') : t('mentorship_request_update_reason_label')}
            value={reviewDialog?.reason ?? ''}
            onChange={(e) => setReviewDialog((s) => ({ ...s, reason: e.target.value }))}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setReviewDialog(null)} disabled={pending}>{t('mentorship_btn_close')}</Button>
          <Button variant="contained" color={reviewDialog?.mode === 'reject' ? 'error' : 'warning'}
            disabled={pending || !(reviewDialog?.reason || '').trim()} onClick={handleReviewSubmit} sx={{ fontWeight: 700 }}>
            {reviewDialog?.mode === 'reject' ? t('mentorship_btn_reject') : t('mentorship_btn_request_update')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* RESOLVE REPORT (action + note) */}
      <Dialog open={Boolean(resolveDialog)} onClose={() => !pending && setResolveDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>{t('mentorship_report_resolve_title')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField select fullWidth sx={{ mt: 1 }} label={t('mentorship_report_action_label')}
            value={resolveDialog?.action ?? 'NONE'} onChange={(e) => setResolveDialog((s) => ({ ...s, action: e.target.value }))}>
            <MenuItem value="NONE">{t('mentorship_report_action_none')}</MenuItem>
            <MenuItem value="WARNING">{t('mentorship_report_action_warning')}</MenuItem>
            <MenuItem value="SUSPENDED">{t('mentorship_report_action_suspend')}</MenuItem>
            <MenuItem value="BANNED">{t('mentorship_report_action_ban')}</MenuItem>
            <MenuItem value="DISMISS">{t('mentorship_report_action_dismiss')}</MenuItem>
          </TextField>
          <TextField fullWidth multiline minRows={3} label={t('mentorship_report_note_label')}
            value={resolveDialog?.note ?? ''} onChange={(e) => setResolveDialog((s) => ({ ...s, note: e.target.value }))} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setResolveDialog(null)} disabled={pending}>{t('mentorship_btn_close')}</Button>
          <Button variant="contained" color="warning" disabled={pending} onClick={handleResolveSubmit} sx={{ fontWeight: 700 }}>
            {t('mentorship_report_resolve_submit')}
          </Button>
        </DialogActions>
      </Dialog>

      <AdminConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title={t('mentorship_delete_session_title')}
        description={deleteTarget ? t('mentorship_delete_session_desc', { id: deleteTarget.id }) : ""}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={pending}
      />

      <ActionOverlay open={pending} />
    </Box>
  );
};

export default AdminMentorshipPage;
