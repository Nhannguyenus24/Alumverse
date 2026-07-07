import { useEffect, useState } from "react";
import { useOutletContext } from "react-router";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import {
  ADMIN_STATUS_CHIP_SX,
} from "../../constants/adminUiShared";
import {
  getAdminMentorshipApprovalOptions,
  getAdminMentorshipSessionStatusOptions,
} from "../../constants/adminDefaultMentorship";
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

const AdminMentorshipPage = () => {
  const { t } = useTranslation('admin');

  const sessionStatusOptions = getAdminMentorshipSessionStatusOptions(t);
  const approvalOptions = getAdminMentorshipApprovalOptions(t);

  const { enqueueSnackbar } = useSnackbar();
  const { setBreadcrumbs } = useOutletContext();
  const { stableOrgId } = useAdminSystemContext();
  const {
    sessions,
    sessionTotal,
    sessionLoading,
    sessionPage,
    setSessionPage,
    sessionRowsPerPage,
    setSessionRowsPerPage,
    statusFilter,
    setStatusFilter,
    updateSessionStatus,
    deleteSession,
    mentors,
    mentorTotal,
    mentorLoading,
    mentorPage,
    setMentorPage,
    mentorRowsPerPage,
    setMentorRowsPerPage,
    approvalFilter,
    setApprovalFilter,
    approveMentor,
    statistics,
  } = useAdminMentorship(stableOrgId);

  useEffect(() => {
    setBreadcrumbs?.([{ label: t('nav_mentorship'), active: true }]);
  }, [setBreadcrumbs]);

  const [tab, setTab] = useState("sessions");
  const [detailItem, setDetailItem] = useState(null);
  const [mentorDetail, setMentorDetail] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const notify = (ok, okMsg, failMsg) =>
    enqueueSnackbar(ok ? okMsg : failMsg, {
      variant: ok ? "success" : "error",
    });

  const handleConfirm = async (s) =>
    notify(
      await updateSessionStatus(s.id, "Confirmed"),
      t('mentorship_session_confirmed'),
      t('mentorship_session_confirm_error'),
    );
  const handleCancel = async (s) =>
    notify(
      await updateSessionStatus(s.id, "Cancelled"),
      t('mentorship_session_cancelled'),
      t('mentorship_session_cancel_error'),
    );
  const handleApprove = async (m) =>
    notify(
      await approveMentor(m.memberId),
      t('mentorship_mentor_approved'),
      t('mentorship_mentor_approve_error'),
    );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    notify(
      await deleteSession(deleteTarget.id),
      t('mentorship_session_deleted'),
      t('mentorship_session_delete_error'),
    );
    setDeleteTarget(null);
  };

  const metricRows = statistics
    ? [
        [
          {
            label: t('metric_total_mentors'),
            value: statistics.totalMentors,
            icon: <SchoolOutlinedIcon />,
          },
          {
            label: t('metric_approved_mentors'),
            value: statistics.approvedMentors,
            icon: <VerifiedUserOutlinedIcon />,
          },
          {
            label: t('metric_pending_mentors'),
            value: statistics.pendingMentors,
            icon: <PendingActionsOutlinedIcon />,
          },
        ],
        [
          {
            label: t('metric_total_sessions'),
            value: statistics.totalSessions,
            icon: <EventNoteOutlinedIcon />,
          },
          {
            label: t('mentorship_metric_pending_sessions'),
            value: statistics.pendingSessions,
            icon: <HourglassEmptyOutlinedIcon />,
          },
          {
            label: t('mentorship_metric_confirmed_sessions'),
            value: statistics.confirmedSessions,
            icon: <EventAvailableOutlinedIcon />,
          },
          {
            label: t('metric_completed_sessions'),
            value: statistics.completedSessions,
            icon: <TaskAltOutlinedIcon />,
          },
        ],
        [
          {
            label: t('mentorship_metric_cancelled_sessions'),
            value: statistics.cancelledSessions,
            icon: <EventBusyOutlinedIcon />,
          },
          {
            label: t('mentorship_metric_rejected_sessions'),
            value: statistics.rejectedSessions,
            icon: <BlockOutlinedIcon />,
          },
          {
            label: t('mentorship_metric_availabilities'),
            value: statistics.totalAvailabilities,
            icon: <CalendarMonthOutlinedIcon />,
          },
          {
            label: t('metric_feedbacks'),
            value: statistics.totalFeedbacks,
            icon: <RateReviewOutlinedIcon />,
          },
        ],
      ]
    : [];

  return (
    <Box>
      <Box
        sx={{
          mb: 4,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, color: "primary.main" }}>
            {t('mentorship_page_title')}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, fontWeight: 500 }}
          >
            {t('mentorship_page_subtitle')}
          </Typography>
        </Box>
      </Box>

      {statistics ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            mb: 4,
          }}
        >
          {metricRows.map((row, rowIndex) => (
            <Box
              key={rowIndex}
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 3,
                "& > *": {
                  flex: {
                    xs: "1 1 100%",
                    sm: "1 1 calc(50% - 12px)",
                    lg: `1 1 calc(${100 / row.length}% - 18px)`,
                  },
                },
              }}
            >
              {row.map((metric) => (
                <AdminDashboardMetricTile
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                  icon={metric.icon}
                />
              ))}
            </Box>
          ))}
        </Box>
      ) : null}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab value="sessions" label={`${t('mentorship_tab_sessions')} (${sessionTotal})`} />
        <Tab value="mentors" label={`${t('mentorship_tab_mentors')} (${mentorTotal})`} />
      </Tabs>

      {tab === "sessions" ? (
          <>
            {sessionLoading ? (
              <Stack alignItems="center" sx={{ py: 4 }}>
                <CircularProgress size={28} />
              </Stack>
            ) : (
              <AdminDataTable
                columns={[
                  { id: "id", label: "ID" },
                  {
                    id: "mentor",
                    label: t('mentorship_col_mentor'),
                    render: (_, s) => (
                      <PersonCell
                        name={s.mentorName}
                        email={s.mentorEmail}
                        fallback={s.mentorMemberId ? `#${s.mentorMemberId}` : "-"}
                      />
                    ),
                  },
                  {
                    id: "mentee",
                    label: t('mentorship_col_mentee'),
                    render: (_, s) => (
                      <PersonCell
                        name={s.menteeName}
                        email={s.menteeEmail}
                        fallback={s.menteeMemberId ? `#${s.menteeMemberId}` : "-"}
                      />
                    ),
                  },
                  {
                    id: "status",
                    label: t('col_status'),
                    render: (_, s) => {
                      const chip = statusChip(s.status, t);
                      return (
                        <Chip
                          size="small"
                          color={chip.color}
                          label={chip.label}
                          sx={ADMIN_STATUS_CHIP_SX}
                        />
                      );
                    },
                  },
                  {
                    id: "sessionType",
                    label: t('mentorship_col_type'),
                    render: (_, s) => s.sessionType || "-",
                  },
                  {
                    id: "time",
                    label: t('mentorship_col_time'),
                    render: (_, s) =>
                      s.startTime ? (
                        <Typography variant="caption">
                          {formatDateTime(s.startTime)}
                          <br />→ {formatDateTime(s.endTime)}
                        </Typography>
                      ) : (
                        "-"
                      ),
                  },
                  {
                    id: "createdAt",
                    label: t('mentorship_col_created_at'),
                    render: (_, s) => formatDateTime(s.createdAt),
                  },
                  {
                    id: "actions",
                    label: t('col_actions'),
                    align: "right",
                    render: (_, s) => {
                      const isPending = String(s.status).toLowerCase() === "pending";
                      const isCancellable = ["pending", "confirmed"].includes(String(s.status).toLowerCase());
                      return (
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 0.5,
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Tooltip title={t('mentorship_tooltip_view')}>
                            <IconButton size="small" color="primary" onClick={() => setDetailItem(s)}>
                              <VisibilityOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {isPending && (
                            <Tooltip title={t('mentorship_tooltip_confirm')}>
                              <IconButton size="small" color="success" onClick={() => handleConfirm(s)}>
                                <DoneAllOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {isCancellable && (
                            <Tooltip title={t('mentorship_tooltip_cancel')}>
                              <IconButton size="small" color="warning" onClick={() => handleCancel(s)}>
                                <CloseOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title={t('mentorship_tooltip_delete')}>
                            <IconButton size="small" color="error" onClick={() => setDeleteTarget(s)}>
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      );
                    },
                  },
                ]}
                rows={sessions}
                totalCount={sessionTotal}
                page={sessionPage}
                rowsPerPage={sessionRowsPerPage}
                onPageChange={(_, p) => setSessionPage(p)}
                onRowsPerPageChange={(e) => {
                  setSessionRowsPerPage(Number(e.target.value));
                  setSessionPage(0);
                }}
                onRowClick={(s) => setDetailItem(s)}
                emptyMessage={t('mentorship_sessions_empty')}
                filters={
                  <TextField
                    select
                    size="small"
                    label={t('col_status')}
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setSessionPage(0);
                    }}
                    sx={{ minWidth: 200 }}
                  >
                    {sessionStatusOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                }
              />
            )}
          </>
      ) : (
          <>
            {mentorLoading ? (
              <Stack alignItems="center" sx={{ py: 4 }}>
                <CircularProgress size={28} />
              </Stack>
            ) : (
              <AdminDataTable
                columns={[
                  {
                    id: "mentor",
                    label: t('mentorship_col_mentor'),
                    render: (_, m) => (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {(m.mentorName || "?").charAt(0).toUpperCase()}
                        </Avatar>
                        <PersonCell
                          name={m.mentorName}
                          email={m.mentorEmail}
                          fallback={`#${m.memberId}`}
                        />
                      </Box>
                    ),
                  },
                  {
                    id: "job",
                    label: t('mentorship_col_job_company'),
                    render: (_, m) => (
                      <>
                        <Typography variant="body2">{m.currentJobTitle || "-"}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {m.currentCompany || ""}
                        </Typography>
                      </>
                    ),
                  },
                  {
                    id: "rating",
                    label: t('mentorship_col_rating'),
                    render: (_, m) => (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Rating value={Number(m.ratingAvg) || 0} size="small" readOnly precision={0.1} />
                        <Typography variant="caption" color="text.secondary">
                          {Number(m.ratingAvg ?? 0).toFixed(1)}
                        </Typography>
                      </Box>
                    ),
                  },
                  {
                    id: "totalSessions",
                    label: t('mentorship_col_session_count'),
                    align: "right",
                    render: (_, m) => m.totalSessions ?? 0,
                  },
                  {
                    id: "approval",
                    label: t('mentorship_col_approval'),
                    render: (_, m) => (
                      <Chip
                        size="small"
                        color={m.isApproved ? "success" : "warning"}
                        label={m.isApproved ? t('mentorship_approval_approved') : t('mentorship_approval_pending')}
                        sx={ADMIN_STATUS_CHIP_SX}
                      />
                    ),
                  },
                  {
                    id: "createdAt",
                    label: t('mentorship_col_created_at'),
                    render: (_, m) => formatDateTime(m.createdAt),
                  },
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
                        {!m.isApproved && (
                          <Tooltip title={t('mentorship_tooltip_approve_mentor')}>
                            <IconButton size="small" color="success" onClick={() => handleApprove(m)}>
                              <CheckCircleOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    ),
                  },
                ]}
                rows={mentors}
                totalCount={mentorTotal}
                page={mentorPage}
                rowsPerPage={mentorRowsPerPage}
                onPageChange={(_, p) => setMentorPage(p)}
                onRowsPerPageChange={(e) => {
                  setMentorRowsPerPage(Number(e.target.value));
                  setMentorPage(0);
                }}
                onRowClick={(m) => setMentorDetail(m)}
                emptyMessage={t('mentorship_mentors_empty')}
                filters={
                  <TextField
                    select
                    size="small"
                    label={t('mentorship_col_approval')}
                    value={approvalFilter}
                    onChange={(e) => {
                      setApprovalFilter(e.target.value);
                      setMentorPage(0);
                    }}
                    sx={{ minWidth: 200 }}
                  >
                    {approvalOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                }
              />
            )}
          </>
      )}

      <Dialog
        open={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ color: "primary.main", fontWeight: 800 }}>
          {t('mentorship_session_detail_title')}
        </DialogTitle>
        {detailItem ? (
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}
          >
            <Typography variant="body2">
              <strong>ID:</strong> {detailItem.id}
            </Typography>
            <Typography variant="body2">
              <strong>{t('mentorship_col_mentor')}:</strong>{" "}
              {detailItem.mentorName || `#${detailItem.mentorMemberId ?? "-"}`}{" "}
              {detailItem.mentorEmail ? `(${detailItem.mentorEmail})` : ""}
            </Typography>
            <Typography variant="body2">
              <strong>{t('mentorship_col_mentee')}:</strong>{" "}
              {detailItem.menteeName || `#${detailItem.menteeMemberId ?? "-"}`}{" "}
              {detailItem.menteeEmail ? `(${detailItem.menteeEmail})` : ""}
            </Typography>
            <Typography variant="body2">
              <strong>{t('col_status')}:</strong> {detailItem.status || "-"}
            </Typography>
            <Typography variant="body2">
              <strong>{t('mentorship_detail_session_type')}:</strong> {detailItem.sessionType || "-"}
            </Typography>
            <Typography variant="body2">
              <strong>{t('mentorship_col_time')}:</strong> {formatDateTime(detailItem.startTime)}{" "}
              → {formatDateTime(detailItem.endTime)}
            </Typography>
            <Typography variant="body2">
              <strong>{t('mentorship_detail_meeting_link')}:</strong> {detailItem.meetingLink || "-"}
            </Typography>
            <Typography variant="body2">
              <strong>URL CV:</strong> {detailItem.cvUrl || "-"}
            </Typography>
            <Typography variant="body2">
              <strong>{t('mentorship_col_created_at')}:</strong>{" "}
              {formatDateTime(detailItem.createdAt)}
            </Typography>
            {detailItem.introduction ? (
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                <strong>{t('mentorship_detail_introduction')}:</strong> {detailItem.introduction}
              </Typography>
            ) : null}
            {detailItem.description ? (
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                <strong>{t('mentorship_detail_description')}:</strong> {detailItem.description}
              </Typography>
            ) : null}
            {detailItem.bookingNote ? (
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                <strong>{t('mentorship_detail_booking_note')}:</strong> {detailItem.bookingNote}
              </Typography>
            ) : null}
          </DialogContent>
        ) : null}
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="contained"
            onClick={() => setDetailItem(null)}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            {t('mentorship_btn_close')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(mentorDetail)}
        onClose={() => setMentorDetail(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ color: "primary.main", fontWeight: 800 }}>
          {t('mentorship_mentor_profile_title')}
        </DialogTitle>
        {mentorDetail ? (
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}
          >
            <Typography variant="body2">
              <strong>{t('mentorship_detail_member_id')}:</strong> {mentorDetail.memberId}
            </Typography>
            <Typography variant="body2">
              <strong>{t('mentorship_detail_name')}:</strong> {mentorDetail.mentorName || "-"}
            </Typography>
            <Typography variant="body2">
              <strong>Email:</strong> {mentorDetail.mentorEmail || "-"}
            </Typography>
            <Typography variant="body2">
              <strong>{t('mentorship_detail_job')}:</strong> {mentorDetail.currentJobTitle || "-"}{" "}
              {mentorDetail.currentCompany
                ? `@ ${mentorDetail.currentCompany}`
                : ""}
            </Typography>
            <Typography variant="body2">
              <strong>{t('mentorship_col_approval')}:</strong>{" "}
              {mentorDetail.isApproved ? t('mentorship_approval_approved') : t('mentorship_approval_pending')}
            </Typography>
            <Typography variant="body2">
              <strong>{t('mentorship_col_rating')}:</strong>{" "}
              {Number(mentorDetail.ratingAvg ?? 0).toFixed(2)}
            </Typography>
            <Typography variant="body2">
              <strong>{t('mentorship_detail_total_sessions')}:</strong> {mentorDetail.totalSessions ?? 0}
            </Typography>
            <Typography variant="body2">
              <strong>{t('mentorship_col_created_at')}:</strong>{" "}
              {formatDateTime(mentorDetail.createdAt)}
            </Typography>
            {mentorDetail.bio ? (
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                <strong>{t('mentorship_detail_bio')}:</strong> {mentorDetail.bio}
              </Typography>
            ) : null}
          </DialogContent>
        ) : null}
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          {mentorDetail && !mentorDetail.isApproved ? (
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleOutlineIcon />}
              onClick={async () => {
                await handleApprove(mentorDetail);
                setMentorDetail(null);
              }}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              {t('mentorship_btn_approve')}
            </Button>
          ) : null}
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => setMentorDetail(null)}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            {t('mentorship_btn_close')}
          </Button>
        </DialogActions>
      </Dialog>

      <AdminConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title={t('mentorship_delete_session_title')}
        description={
          deleteTarget ? t('mentorship_delete_session_desc', { id: deleteTarget.id }) : ""
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </Box>
  );
};

export default AdminMentorshipPage;
