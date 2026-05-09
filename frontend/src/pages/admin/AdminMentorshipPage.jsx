import { useState } from "react";
import { useSnackbar } from "notistack";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DoneAllOutlinedIcon from "@mui/icons-material/DoneAllOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import SchoolIcon from "@mui/icons-material/School";
import HandshakeIcon from "@mui/icons-material/Handshake";
import StarIcon from "@mui/icons-material/Star";
import QueryBuilderIcon from "@mui/icons-material/QueryBuilder";

import AdminStatusChip from "../../components/admin/AdminStatusChip";
import AdminDashboardMetricTile from "../../components/admin/AdminDashboardMetricTile";
import AdminConfirmDeleteDialog from "../../components/admin/AdminConfirmDeleteDialog";
import AdminDataTable from "../../components/admin/AdminDataTable";
import { ADMIN_MENTORSHIP_STATUS_OPTIONS } from "../../constants/adminDefaultMentorships";
import useAdminMentorshipData from "../../hooks/admin/useAdminMentorshipData";
import { formatDateTime } from "../../utils/dateFormatter";

const AdminMentorshipPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const {
    mentorships,
    filteredCount,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    updateStatus,
    deleteItem,
  } = useAdminMentorshipData();

  const [detailItem, setDetailItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Aggregated stats for visualization
  const stats = {
    totalSessions: mentorships.length,
    activeMatches: mentorships.filter((m) => m.status === "CONFIRMED").length,
    avgRating: mentorships.length
      ? (
          mentorships.reduce((acc, m) => acc + (m.feedbackScore || 0), 0) /
            mentorships.filter((m) => m.feedbackScore).length || 0
        ).toFixed(1)
      : 0,
    totalMinutes: mentorships.reduce(
      (acc, m) => acc + (m.durationMinutes || 0),
      0,
    ),
  };

  const columns = [
    { id: "id", label: "ID" },
    {
      id: "mentorName",
      label: "Cố vấn (Mentor)",
      render: (val) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {val}
        </Typography>
      ),
    },
    { id: "menteeName", label: "Người học (Mentee)" },
    {
      id: "topic",
      label: "Chủ đề",
      render: (val) => (
        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
          {val}
        </Typography>
      ),
    },
    {
      id: "status",
      label: "Trạng thái",
      render: (val) => (
        <AdminStatusChip
          status={val}
          category="mentorship"
          label={
            val === "CONFIRMED"
              ? "Đã xác nhận"
              : val === "COMPLETED"
                ? "Hoàn thành"
                : val === "CANCELLED"
                  ? "Đã hủy"
                  : "Đang chờ"
          }
        />
      ),
    },
    {
      id: "sessionDate",
      label: "Thời gian",
      render: (val) => formatDateTime(val),
    },
    {
      id: "durationMinutes",
      label: "Thời lượng",
      align: "right",
      render: (val) => `${val} phút`,
    },
    {
      id: "actions",
      label: "",
      align: "right",
      render: (_, session) => (
        <Stack
          direction="row"
          spacing={0.5}
          justifyContent="flex-end"
          onClick={(ev) => ev.stopPropagation()}
        >
          <Tooltip title="Chi tiết">
            <IconButton size="small" onClick={() => setDetailItem(session)}>
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Hoàn thành">
            <IconButton
              size="small"
              color="success"
              onClick={() => {
                updateStatus(session.id, "COMPLETED");
                enqueueSnackbar("Đã đánh dấu hoàn thành.", {
                  variant: "success",
                });
              }}
            >
              <DoneAllOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Hủy buổi">
            <IconButton
              size="small"
              color="warning"
              onClick={() => {
                updateStatus(session.id, "CANCELLED");
                enqueueSnackbar("Đã hủy buổi cố vấn.", { variant: "warning" });
              }}
            >
              <CloseOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Xóa">
            <IconButton
              size="small"
              color="error"
              onClick={() => setDeleteTarget(session)}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  const Filters = (
    <TextField
      select
      size="small"
      label="Trạng thái"
      value={statusFilter}
      onChange={(e) => {
        setStatusFilter(e.target.value);
        setPage(0);
      }}
      sx={{ minWidth: 160 }}
    >
      {ADMIN_MENTORSHIP_STATUS_OPTIONS.map((opt) => (
        <MenuItem key={opt.value} value={opt.value}>
          {opt.label}
        </MenuItem>
      ))}
    </TextField>
  );

  return (
    <Box>
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -1 }}>
            Quản lý cố vấn
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, fontWeight: 500 }}
          >
            Theo dõi và điều phối các chương trình Mentorship giữa Cựu sinh viên
            và Sinh viên.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddOutlinedIcon />}
          sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none" }}
        >
          Tạo buổi cố vấn
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <AdminDashboardMetricTile
            label="Tổng số buổi"
            value={stats.totalSessions}
            icon={<SchoolIcon />}
            valueColor="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AdminDashboardMetricTile
            label="Đang kết nối"
            value={stats.activeMatches}
            icon={<HandshakeIcon />}
            valueColor="info.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AdminDashboardMetricTile
            label="Đánh giá trung bình"
            value={stats.avgRating}
            icon={<StarIcon />}
            valueColor="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AdminDashboardMetricTile
            label="Tổng số phút"
            value={stats.totalMinutes}
            icon={<QueryBuilderIcon />}
            valueColor="success.main"
          />
        </Grid>
      </Grid>

      <AdminDataTable
        columns={columns}
        rows={mentorships}
        totalCount={filteredCount}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(Number(e.target.value));
          setPage(0);
        }}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(0);
        }}
        searchValue={search}
        filters={Filters}
        onRowClick={(m) => setDetailItem(m)}
      />

      {/* Dialogs */}
      <Dialog
        open={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Chi tiết buổi cố vấn</DialogTitle>
        {detailItem && (
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography
                variant="h6"
                color="primary.main"
                sx={{ fontWeight: 700 }}
              >
                {detailItem.topic}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block" }}
                  >
                    Cố vấn
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {detailItem.mentorName}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block" }}
                  >
                    Người học
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {detailItem.menteeName}
                  </Typography>
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block" }}
                  >
                    Thời gian
                  </Typography>
                  <Typography variant="body2">
                    {formatDateTime(detailItem.sessionDate)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block" }}
                  >
                    Thời lượng
                  </Typography>
                  <Typography variant="body2">
                    {detailItem.durationMinutes} phút
                  </Typography>
                </Grid>
              </Grid>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block" }}
                >
                  Điểm đánh giá
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <StarIcon sx={{ fontSize: 18, color: "warning.main" }} />
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {detailItem.feedbackScore || "Chưa có"}
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </DialogContent>
        )}
        <DialogActions sx={{ p: 3 }}>
          <Button
            variant="outlined"
            onClick={() => setDetailItem(null)}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      <AdminConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Xóa hồ sơ cố vấn"
        description={
          deleteTarget
            ? `Bạn có chắc chắn muốn xóa buổi cố vấn #${deleteTarget.id}?`
            : ""
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteItem(deleteTarget.id);
            enqueueSnackbar("Đã xóa hồ sơ.", { variant: "success" });
          }
          setDeleteTarget(null);
        }}
      />
    </Box>
  );
};

export default AdminMentorshipPage;
