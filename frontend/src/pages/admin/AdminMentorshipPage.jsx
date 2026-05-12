import { useState } from "react";
import { useSnackbar } from "notistack";
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
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Rating,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
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
import AdminSectionPanel from "../../components/admin/AdminSectionPanel";
import AdminConfirmDeleteDialog from "../../components/admin/AdminConfirmDeleteDialog";
import {
  ADMIN_FILTER_BAR_SX,
  ADMIN_STATUS_CHIP_SX,
} from "../../constants/adminUiShared";
import useAdminMentorship from "../../hooks/admin/useAdminMentorship";
import { formatDateTime } from "../../utils/dateFormatter";
import AdminDashboardMetricTile from "../../components/admin/AdminDashboardMetricTile";

const SESSION_STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "Pending", label: "Pending" },
  { value: "Confirmed", label: "Confirmed" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
  { value: "Rejected", label: "Rejected" },
];

const APPROVAL_OPTIONS = [
  { value: "ALL", label: "All mentors" },
  { value: "PENDING", label: "Pending approval" },
  { value: "APPROVED", label: "Approved" },
];

const statusChip = (status) => {
  const k = String(status || "").toLowerCase();
  if (k === "pending") return { color: "warning", label: "Pending" };
  if (k === "confirmed") return { color: "info", label: "Confirmed" };
  if (k === "completed") return { color: "success", label: "Completed" };
  if (k === "cancelled") return { color: "default", label: "Cancelled" };
  if (k === "rejected") return { color: "error", label: "Rejected" };
  return { color: "default", label: status || "-" };
};

const StatTile = ({ label, value }) => (
  <Paper
    variant="outlined"
    sx={{ p: 1.5, textAlign: "center", height: "100%" }}
  >
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ display: "block" }}
    >
      {label}
    </Typography>
    <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
      {value ?? "-"}
    </Typography>
  </Paper>
);

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
  const { enqueueSnackbar } = useSnackbar();
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
  } = useAdminMentorship();

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
      "Session confirmed.",
      "Failed to confirm.",
    );
  const handleCancel = async (s) =>
    notify(
      await updateSessionStatus(s.id, "Cancelled"),
      "Session cancelled.",
      "Failed to cancel.",
    );
  const handleApprove = async (m) =>
    notify(
      await approveMentor(m.memberId),
      "Mentor approved.",
      "Failed to approve mentor.",
    );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    notify(
      await deleteSession(deleteTarget.id),
      "Session deleted.",
      "Failed to delete session.",
    );
    setDeleteTarget(null);
  };

  return (
    <>
      <AdminSectionPanel
        title="Mentorship management"
        subtitle="Cross-organization mentorship moderation — sessions and mentor approval — backed by /api/admin/mentorship."
      >
        {statistics ? (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              mb: 3,
              "& > *": {
                flex: {
                  xs: "1 1 calc(50% - 12px)",
                  sm: "1 1 calc(33.333% - 12px)",
                  md: "1 1 calc(20% - 12px)",
                  lg: "1 1 0",
                },
              },
            }}
          >
            <AdminDashboardMetricTile
              label="Total sessions"
              value={statistics.totalSessions}
            />
            <AdminDashboardMetricTile
              label="Pending"
              value={statistics.pendingSessions}
              valueColor="warning.main"
            />
            <AdminDashboardMetricTile
              label="Confirmed"
              value={statistics.confirmedSessions}
              valueColor="info.main"
            />
            <AdminDashboardMetricTile
              label="Completed"
              value={statistics.completedSessions}
              valueColor="success.main"
            />
            <AdminDashboardMetricTile
              label="Cancelled"
              value={statistics.cancelledSessions}
              valueColor="text.disabled"
            />
            <AdminDashboardMetricTile
              label="Rejected"
              value={statistics.rejectedSessions}
              valueColor="error.main"
            />
            <AdminDashboardMetricTile
              label="Total mentors"
              value={statistics.totalMentors}
              valueColor="primary.main"
            />
            <AdminDashboardMetricTile
              label="Approved mentors"
              value={statistics.approvedMentors}
              valueColor="success.dark"
            />
            <AdminDashboardMetricTile
              label="Pending mentors"
              value={statistics.pendingMentors}
              valueColor="warning.dark"
            />
            <AdminDashboardMetricTile
              label="Availabilities"
              value={statistics.totalAvailabilities}
              valueColor="info.dark"
            />
            <AdminDashboardMetricTile
              label="Feedbacks"
              value={statistics.totalFeedbacks}
              valueColor="secondary.main"
            />
          </Box>
        ) : null}

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab value="sessions" label={`Sessions (${sessionTotal})`} />
          <Tab value="mentors" label={`Mentors (${mentorTotal})`} />
        </Tabs>

        {tab === "sessions" ? (
          <>
            <Box sx={ADMIN_FILTER_BAR_SX}>
              <TextField
                select
                size="small"
                label="Status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setSessionPage(0);
                }}
                sx={{ minWidth: 200 }}
              >
                {SESSION_STATUS_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {sessionLoading ? (
              <Stack alignItems="center" sx={{ py: 4 }}>
                <CircularProgress size={28} />
              </Stack>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Mentor</TableCell>
                    <TableCell>Mentee</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Time slot</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sessions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ py: 2 }}
                        >
                          No mentorship sessions match current filter.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sessions.map((s) => {
                      const chip = statusChip(s.status);
                      const isPending =
                        String(s.status).toLowerCase() === "pending";
                      const isCancellable = ["pending", "confirmed"].includes(
                        String(s.status).toLowerCase(),
                      );
                      return (
                        <TableRow
                          key={s.id}
                          hover
                          onClick={() => setDetailItem(s)}
                          sx={{ cursor: "pointer" }}
                        >
                          <TableCell>{s.id}</TableCell>
                          <TableCell>
                            <PersonCell
                              name={s.mentorName}
                              email={s.mentorEmail}
                              fallback={
                                s.mentorMemberId ? `#${s.mentorMemberId}` : "-"
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <PersonCell
                              name={s.menteeName}
                              email={s.menteeEmail}
                              fallback={
                                s.menteeMemberId ? `#${s.menteeMemberId}` : "-"
                              }
                            />
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Chip
                              size="small"
                              color={chip.color}
                              label={chip.label}
                              sx={ADMIN_STATUS_CHIP_SX}
                            />
                          </TableCell>
                          <TableCell>{s.sessionType || "-"}</TableCell>
                          <TableCell>
                            {s.startTime ? (
                              <Typography variant="caption">
                                {formatDateTime(s.startTime)}
                                <br />→ {formatDateTime(s.endTime)}
                              </Typography>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>{formatDateTime(s.createdAt)}</TableCell>
                          <TableCell
                            align="right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: 0.5,
                              }}
                            >
                              <Tooltip title="View">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => setDetailItem(s)}
                                >
                                  <VisibilityOutlinedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {isPending && (
                                <Tooltip title="Confirm">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => handleConfirm(s)}
                                  >
                                    <DoneAllOutlinedIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {isCancellable && (
                                <Tooltip title="Cancel">
                                  <IconButton
                                    size="small"
                                    color="warning"
                                    onClick={() => handleCancel(s)}
                                  >
                                    <CloseOutlinedIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => setDeleteTarget(s)}
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}

            <TablePagination
              component="div"
              count={sessionTotal}
              page={sessionPage}
              rowsPerPage={sessionRowsPerPage}
              onPageChange={(_, p) => setSessionPage(p)}
              onRowsPerPageChange={(e) => {
                setSessionRowsPerPage(Number(e.target.value));
                setSessionPage(0);
              }}
              rowsPerPageOptions={[10, 20, 50]}
            />
          </>
        ) : (
          <>
            <Box sx={ADMIN_FILTER_BAR_SX}>
              <TextField
                select
                size="small"
                label="Approval"
                value={approvalFilter}
                onChange={(e) => {
                  setApprovalFilter(e.target.value);
                  setMentorPage(0);
                }}
                sx={{ minWidth: 200 }}
              >
                {APPROVAL_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {mentorLoading ? (
              <Stack alignItems="center" sx={{ py: 4 }}>
                <CircularProgress size={28} />
              </Stack>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Mentor</TableCell>
                    <TableCell>Job / Company</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell align="right">Sessions</TableCell>
                    <TableCell>Approval</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mentors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ py: 2 }}
                        >
                          No mentor profiles match current filter.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    mentors.map((m) => (
                      <TableRow
                        key={m.memberId}
                        hover
                        onClick={() => setMentorDetail(m)}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Avatar sx={{ width: 32, height: 32 }}>
                              {(m.mentorName || "?").charAt(0).toUpperCase()}
                            </Avatar>
                            <PersonCell
                              name={m.mentorName}
                              email={m.mentorEmail}
                              fallback={`#${m.memberId}`}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {m.currentJobTitle || "-"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {m.currentCompany || ""}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <Rating
                              value={Number(m.ratingAvg) || 0}
                              size="small"
                              readOnly
                              precision={0.1}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {Number(m.ratingAvg ?? 0).toFixed(1)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {m.totalSessions ?? 0}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Chip
                            size="small"
                            color={m.isApproved ? "success" : "warning"}
                            label={m.isApproved ? "Approved" : "Pending"}
                            sx={ADMIN_STATUS_CHIP_SX}
                          />
                        </TableCell>
                        <TableCell>{formatDateTime(m.createdAt)}</TableCell>
                        <TableCell
                          align="right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "flex-end",
                              gap: 0.5,
                            }}
                          >
                            <Tooltip title="View">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => setMentorDetail(m)}
                              >
                                <VisibilityOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {!m.isApproved && (
                              <Tooltip title="Approve mentor">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleApprove(m)}
                                >
                                  <CheckCircleOutlineIcon fontSize="small" />
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
            )}

            <TablePagination
              component="div"
              count={mentorTotal}
              page={mentorPage}
              rowsPerPage={mentorRowsPerPage}
              onPageChange={(_, p) => setMentorPage(p)}
              onRowsPerPageChange={(e) => {
                setMentorRowsPerPage(Number(e.target.value));
                setMentorPage(0);
              }}
              rowsPerPageOptions={[10, 20, 50]}
            />
          </>
        )}
      </AdminSectionPanel>

      <Dialog
        open={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ color: "primary.main", fontWeight: 800 }}>
          Session detail
        </DialogTitle>
        {detailItem ? (
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}
          >
            <Typography variant="body2">
              <strong>ID:</strong> {detailItem.id}
            </Typography>
            <Typography variant="body2">
              <strong>Mentor:</strong>{" "}
              {detailItem.mentorName || `#${detailItem.mentorMemberId ?? "-"}`}{" "}
              {detailItem.mentorEmail ? `(${detailItem.mentorEmail})` : ""}
            </Typography>
            <Typography variant="body2">
              <strong>Mentee:</strong>{" "}
              {detailItem.menteeName || `#${detailItem.menteeMemberId ?? "-"}`}{" "}
              {detailItem.menteeEmail ? `(${detailItem.menteeEmail})` : ""}
            </Typography>
            <Typography variant="body2">
              <strong>Status:</strong> {detailItem.status || "-"}
            </Typography>
            <Typography variant="body2">
              <strong>Session type:</strong> {detailItem.sessionType || "-"}
            </Typography>
            <Typography variant="body2">
              <strong>Time slot:</strong> {formatDateTime(detailItem.startTime)}{" "}
              → {formatDateTime(detailItem.endTime)}
            </Typography>
            <Typography variant="body2">
              <strong>Meeting link:</strong> {detailItem.meetingLink || "-"}
            </Typography>
            <Typography variant="body2">
              <strong>CV URL:</strong> {detailItem.cvUrl || "-"}
            </Typography>
            <Typography variant="body2">
              <strong>Created at:</strong>{" "}
              {formatDateTime(detailItem.createdAt)}
            </Typography>
            {detailItem.introduction ? (
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                <strong>Introduction:</strong> {detailItem.introduction}
              </Typography>
            ) : null}
            {detailItem.description ? (
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                <strong>Description:</strong> {detailItem.description}
              </Typography>
            ) : null}
            {detailItem.bookingNote ? (
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                <strong>Booking note:</strong> {detailItem.bookingNote}
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
            Close
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
          Mentor profile
        </DialogTitle>
        {mentorDetail ? (
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}
          >
            <Typography variant="body2">
              <strong>Member ID:</strong> {mentorDetail.memberId}
            </Typography>
            <Typography variant="body2">
              <strong>Name:</strong> {mentorDetail.mentorName || "-"}
            </Typography>
            <Typography variant="body2">
              <strong>Email:</strong> {mentorDetail.mentorEmail || "-"}
            </Typography>
            <Typography variant="body2">
              <strong>Job:</strong> {mentorDetail.currentJobTitle || "-"}{" "}
              {mentorDetail.currentCompany
                ? `@ ${mentorDetail.currentCompany}`
                : ""}
            </Typography>
            <Typography variant="body2">
              <strong>Approval:</strong>{" "}
              {mentorDetail.isApproved ? "Approved" : "Pending"}
            </Typography>
            <Typography variant="body2">
              <strong>Rating:</strong>{" "}
              {Number(mentorDetail.ratingAvg ?? 0).toFixed(2)}
            </Typography>
            <Typography variant="body2">
              <strong>Total sessions:</strong> {mentorDetail.totalSessions ?? 0}
            </Typography>
            <Typography variant="body2">
              <strong>Created at:</strong>{" "}
              {formatDateTime(mentorDetail.createdAt)}
            </Typography>
            {mentorDetail.bio ? (
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                <strong>Bio:</strong> {mentorDetail.bio}
              </Typography>
            ) : null}
          </DialogContent>
        ) : null}
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          {mentorDetail && !mentorDetail.isApproved ? (
            <Button
              variant="outlined"
              color="success"
              startIcon={<CheckCircleOutlineIcon />}
              onClick={async () => {
                await handleApprove(mentorDetail);
                setMentorDetail(null);
              }}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              Approve
            </Button>
          ) : null}
          <Button
            variant="contained"
            onClick={() => setMentorDetail(null)}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <AdminConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Delete session"
        description={
          deleteTarget ? `Permanently delete session #${deleteTarget.id}?` : ""
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default AdminMentorshipPage;
