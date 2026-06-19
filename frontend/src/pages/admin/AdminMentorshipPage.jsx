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
import useAdminMentorship from "../../hooks/admin/useAdminMentorship";
import { useAdminSystemContext } from "../../stores/AdminStore";
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

  const metricRows = statistics
    ? [
        [
          {
            label: "Tổng cố vấn",
            value: statistics.totalMentors,
            icon: <SchoolOutlinedIcon />,
          },
          {
            label: "Cố vấn đã duyệt",
            value: statistics.approvedMentors,
            icon: <VerifiedUserOutlinedIcon />,
          },
          {
            label: "Cố vấn chờ duyệt",
            value: statistics.pendingMentors,
            icon: <PendingActionsOutlinedIcon />,
          },
        ],
        [
          {
            label: "Tổng số phiên",
            value: statistics.totalSessions,
            icon: <EventNoteOutlinedIcon />,
          },
          {
            label: "Phiên đang chờ",
            value: statistics.pendingSessions,
            icon: <HourglassEmptyOutlinedIcon />,
          },
          {
            label: "Phiên đã xác nhận",
            value: statistics.confirmedSessions,
            icon: <EventAvailableOutlinedIcon />,
          },
          {
            label: "Phiên hoàn thành",
            value: statistics.completedSessions,
            icon: <TaskAltOutlinedIcon />,
          },
        ],
        [
          {
            label: "Phiên đã bị hủy",
            value: statistics.cancelledSessions,
            icon: <EventBusyOutlinedIcon />,
          },
          {
            label: "Phiên bị từ chối",
            value: statistics.rejectedSessions,
            icon: <BlockOutlinedIcon />,
          },
          {
            label: "Lịch trống",
            value: statistics.totalAvailabilities,
            icon: <CalendarMonthOutlinedIcon />,
          },
          {
            label: "Phản hồi",
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
            Quản lý cố vấn
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, fontWeight: 500 }}
          >
            Kiểm duyệt hoạt động cố vấn, phiên hẹn và hồ sơ cố vấn trên toàn hệ thống.
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
        <Tab value="sessions" label={`Phiên hẹn (${sessionTotal})`} />
        <Tab value="mentors" label={`Cố vấn (${mentorTotal})`} />
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
                    label: "Cố vấn",
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
                    label: "Người được cố vấn",
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
                    label: "Trạng thái",
                    render: (_, s) => {
                      const chip = statusChip(s.status);
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
                    label: "Loại",
                    render: (_, s) => s.sessionType || "-",
                  },
                  {
                    id: "time",
                    label: "Thời gian",
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
                    label: "Ngày tạo",
                    render: (_, s) => formatDateTime(s.createdAt),
                  },
                  {
                    id: "actions",
                    label: "Thao tác",
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
                          <Tooltip title="Xem">
                            <IconButton size="small" color="primary" onClick={() => setDetailItem(s)}>
                              <VisibilityOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {isPending && (
                            <Tooltip title="Xác nhận">
                              <IconButton size="small" color="success" onClick={() => handleConfirm(s)}>
                                <DoneAllOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {isCancellable && (
                            <Tooltip title="Hủy">
                              <IconButton size="small" color="warning" onClick={() => handleCancel(s)}>
                                <CloseOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Xóa">
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
                emptyMessage="Không có phiên hẹn nào khớp với bộ lọc."
                filters={
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
                    label: "Cố vấn",
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
                    label: "Công việc / Công ty",
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
                    label: "Đánh giá",
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
                    label: "Số phiên",
                    align: "right",
                    render: (_, m) => m.totalSessions ?? 0,
                  },
                  {
                    id: "approval",
                    label: "Phê duyệt",
                    render: (_, m) => (
                      <Chip
                        size="small"
                        color={m.isApproved ? "success" : "warning"}
                        label={m.isApproved ? "Đã duyệt" : "Chờ duyệt"}
                        sx={ADMIN_STATUS_CHIP_SX}
                      />
                    ),
                  },
                  {
                    id: "createdAt",
                    label: "Ngày tạo",
                    render: (_, m) => formatDateTime(m.createdAt),
                  },
                  {
                    id: "actions",
                    label: "Thao tác",
                    align: "right",
                    render: (_, m) => (
                      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="Xem">
                          <IconButton size="small" color="primary" onClick={() => setMentorDetail(m)}>
                            <VisibilityOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {!m.isApproved && (
                          <Tooltip title="Duyệt cố vấn">
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
                emptyMessage="Không có hồ sơ cố vấn nào khớp với bộ lọc."
                filters={
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
              variant="contained"
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
            variant="outlined"
            color="secondary"
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
    </Box>
  );
};

export default AdminMentorshipPage;
