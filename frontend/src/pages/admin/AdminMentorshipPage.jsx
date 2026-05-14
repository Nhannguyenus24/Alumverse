import { useEffect, useState } from "react";
import { useOutletContext } from "react-router";
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
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "Pending", label: "Chờ duyệt" },
  { value: "Confirmed", label: "Đã xác nhận" },
  { value: "Completed", label: "Hoàn thành" },
  { value: "Cancelled", label: "Đã hủy" },
  { value: "Rejected", label: "Từ chối" },
];

const APPROVAL_OPTIONS = [
  { value: "ALL", label: "Tất cả cố vấn" },
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "APPROVED", label: "Đã duyệt" },
];

const statusChip = (status) => {
  const k = String(status || "").toLowerCase();
  if (k === "pending") return { color: "warning", label: "Chờ duyệt" };
  if (k === "confirmed") return { color: "info", label: "Đã xác nhận" };
  if (k === "completed") return { color: "success", label: "Hoàn thành" };
  if (k === "cancelled") return { color: "default", label: "Đã hủy" };
  if (k === "rejected") return { color: "error", label: "Từ chối" };
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
  const { setBreadcrumbs } = useOutletContext();
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

  useEffect(() => {
    setBreadcrumbs?.([{ label: 'Cố vấn (Mentorship)', active: true }]);
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
      "Đã xác nhận phiên.",
      "Lỗi xác nhận.",
    );
  const handleCancel = async (s) =>
    notify(
      await updateSessionStatus(s.id, "Cancelled"),
      "Đã hủy phiên.",
      "Lỗi hủy phiên.",
    );
  const handleApprove = async (m) =>
    notify(
      await approveMentor(m.memberId),
      "Đã duyệt cố vấn.",
      "Lỗi duyệt cố vấn.",
    );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    notify(
      await deleteSession(deleteTarget.id),
      "Đã xóa phiên.",
      "Lỗi xóa phiên.",
    );
    setDeleteTarget(null);
  };

  return (
    <>
      <AdminSectionPanel
        title="Quản lý cố vấn"
        subtitle="Kiểm duyệt hoạt động cố vấn - các phiên hẹn và duyệt hồ sơ cố vấn trên toàn hệ thống."
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
                xs: "1 1 100%",
                sm: "1 1 calc(50% - 12px)",
                md: "1 1 calc(25% - 12px)",
                lg: "1 1 0",
              },
              },
            }}
          >
            <AdminDashboardMetricTile
              label="Tổng số phiên"
              value={statistics.totalSessions}
            />
            <AdminDashboardMetricTile
              label="Đang chờ"
              value={statistics.pendingSessions}
              valueColor="warning.main"
            />
            <AdminDashboardMetricTile
              label="Đã xác nhận"
              value={statistics.confirmedSessions}
              valueColor="info.main"
            />
            <AdminDashboardMetricTile
              label="Hoàn thành"
              value={statistics.completedSessions}
              valueColor="success.main"
            />
            <AdminDashboardMetricTile
              label="Đã hủy"
              value={statistics.cancelledSessions}
              valueColor="text.disabled"
            />
            <AdminDashboardMetricTile
              label="Bị từ chối"
              value={statistics.rejectedSessions}
              valueColor="error.main"
            />
            <AdminDashboardMetricTile
              label="Tổng cố vấn"
              value={statistics.totalMentors}
              valueColor="primary.main"
            />
            <AdminDashboardMetricTile
              label="Đã duyệt"
              value={statistics.approvedMentors}
              valueColor="success.dark"
            />
            <AdminDashboardMetricTile
              label="Chờ duyệt"
              value={statistics.pendingMentors}
              valueColor="warning.dark"
            />
            <AdminDashboardMetricTile
              label="Lịch trống"
              value={statistics.totalAvailabilities}
              valueColor="info.dark"
            />
            <AdminDashboardMetricTile
              label="Phản hồi"
              value={statistics.totalFeedbacks}
              valueColor="secondary.main"
            />
          </Box>
        ) : null}

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab value="sessions" label={`Phiên hẹn (${sessionTotal})`} />
          <Tab value="mentors" label={`Cố vấn (${mentorTotal})`} />
        </Tabs>

        {tab === "sessions" ? (
          <>
            <Box sx={ADMIN_FILTER_BAR_SX}>
              <TextField
                select
                size="small"
                label="Trạng thái"
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
                    <TableCell>Cố vấn</TableCell>
                    <TableCell>Người được cố vấn</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Loại</TableCell>
                    <TableCell>Thời gian</TableCell>
                    <TableCell>Ngày tạo</TableCell>
                    <TableCell align="right">Thao tác</TableCell>
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
                          Không có phiên hẹn nào khớp với bộ lọc.
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
                              <Tooltip title="Xem">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => setDetailItem(s)}
                                >
                                  <VisibilityOutlinedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {isPending && (
                                <Tooltip title="Xác nhận">
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
                                <Tooltip title="Hủy">
                                  <IconButton
                                    size="small"
                                    color="warning"
                                    onClick={() => handleCancel(s)}
                                  >
                                    <CloseOutlinedIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="Xóa">
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
                label="Phê duyệt"
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
                    <TableCell>Cố vấn</TableCell>
                    <TableCell>Công việc / Công ty</TableCell>
                    <TableCell>Đánh giá</TableCell>
                    <TableCell align="right">Số phiên</TableCell>
                    <TableCell>Phê duyệt</TableCell>
                    <TableCell>Ngày tạo</TableCell>
                    <TableCell align="right">Thao tác</TableCell>
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
                          Không có hồ sơ cố vấn nào khớp với bộ lọc.
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
                            label={m.isApproved ? "Đã duyệt" : "Chờ duyệt"}
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
                            <Tooltip title="Xem">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => setMentorDetail(m)}
                              >
                                <VisibilityOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {!m.isApproved && (
                              <Tooltip title="Duyệt cố vấn">
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
          Chi tiết phiên hẹn
        </DialogTitle>
        {detailItem ? (
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}
          >
            <Typography variant="body2">
              <strong>ID:</strong> {detailItem.id}
            </Typography>
            <Typography variant="body2">
              <strong>Cố vấn:</strong>{" "}
              {detailItem.mentorName || `#${detailItem.mentorMemberId ?? "-"}`}{" "}
              {detailItem.mentorEmail ? `(${detailItem.mentorEmail})` : ""}
            </Typography>
            <Typography variant="body2">
              <strong>Người được cố vấn:</strong>{" "}
              {detailItem.menteeName || `#${detailItem.menteeMemberId ?? "-"}`}{" "}
              {detailItem.menteeEmail ? `(${detailItem.menteeEmail})` : ""}
            </Typography>
            <Typography variant="body2">
              <strong>Trạng thái:</strong> {detailItem.status || "-"}
            </Typography>
            <Typography variant="body2">
              <strong>Loại phiên:</strong> {detailItem.sessionType || "-"}
            </Typography>
            <Typography variant="body2">
              <strong>Thời gian:</strong> {formatDateTime(detailItem.startTime)}{" "}
              → {formatDateTime(detailItem.endTime)}
            </Typography>
            <Typography variant="body2">
              <strong>Link cuộc họp:</strong> {detailItem.meetingLink || "-"}
            </Typography>
            <Typography variant="body2">
              <strong>URL CV:</strong> {detailItem.cvUrl || "-"}
            </Typography>
            <Typography variant="body2">
              <strong>Ngày tạo:</strong>{" "}
              {formatDateTime(detailItem.createdAt)}
            </Typography>
            {detailItem.introduction ? (
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                <strong>Giới thiệu:</strong> {detailItem.introduction}
              </Typography>
            ) : null}
            {detailItem.description ? (
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                <strong>Mô tả:</strong> {detailItem.description}
              </Typography>
            ) : null}
            {detailItem.bookingNote ? (
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                <strong>Ghi chú đặt lịch:</strong> {detailItem.bookingNote}
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
            Đóng
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
          Hồ sơ cố vấn
        </DialogTitle>
        {mentorDetail ? (
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}
          >
            <Typography variant="body2">
              <strong>ID thành viên:</strong> {mentorDetail.memberId}
            </Typography>
            <Typography variant="body2">
              <strong>Tên:</strong> {mentorDetail.mentorName || "-"}
            </Typography>
            <Typography variant="body2">
              <strong>Email:</strong> {mentorDetail.mentorEmail || "-"}
            </Typography>
            <Typography variant="body2">
              <strong>Công việc:</strong> {mentorDetail.currentJobTitle || "-"}{" "}
              {mentorDetail.currentCompany
                ? `@ ${mentorDetail.currentCompany}`
                : ""}
            </Typography>
            <Typography variant="body2">
              <strong>Phê duyệt:</strong>{" "}
              {mentorDetail.isApproved ? "Đã duyệt" : "Chờ duyệt"}
            </Typography>
            <Typography variant="body2">
              <strong>Đánh giá:</strong>{" "}
              {Number(mentorDetail.ratingAvg ?? 0).toFixed(2)}
            </Typography>
            <Typography variant="body2">
              <strong>Tổng số phiên:</strong> {mentorDetail.totalSessions ?? 0}
            </Typography>
            <Typography variant="body2">
              <strong>Ngày tạo:</strong>{" "}
              {formatDateTime(mentorDetail.createdAt)}
            </Typography>
            {mentorDetail.bio ? (
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                <strong>Tiểu sử:</strong> {mentorDetail.bio}
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
              Duyệt
            </Button>
          ) : null}
          <Button
            variant="contained"
            onClick={() => setMentorDetail(null)}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      <AdminConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Xóa phiên hẹn"
        description={
          deleteTarget ? `Xóa vĩnh viễn phiên hẹn #${deleteTarget.id}?` : ""
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default AdminMentorshipPage;
