import { useMemo, useState } from "react";
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
  useTheme,
  alpha,
} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PeopleIcon from "@mui/icons-material/People";

import AdminStatusChip from "../../components/admin/AdminStatusChip";
import AdminDashboardMetricTile from "../../components/admin/AdminDashboardMetricTile";
import AdminConfirmDeleteDialog from "../../components/admin/AdminConfirmDeleteDialog";
import AdminEventFormDialog from "../../components/admin/AdminEventFormDialog";
import AdminEventTicketsDialog from "../../components/admin/AdminEventTicketsDialog";
import AdminDataTable from "../../components/admin/AdminDataTable";
import {
  ADMIN_EVENT_SORT_OPTIONS,
  ADMIN_EVENT_STATUS_OPTIONS,
} from "../../constants/adminDefaultEvents";
import useAdminEventsData from "../../hooks/admin/useAdminEventsData";
import { formatDateTime } from "../../utils/dateFormatter";

const AdminEventsPage = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const {
    events,
    totalItems,
    statistics,
    organizations,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    organizationFilter,
    setOrganizationFilter,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    publishEvent,
    unpublishEvent,
    createEvent,
    updateEvent,
    deleteEvent,
  } = useAdminEventsData();

  const [createOpen, setCreateOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [participantsTarget, setParticipantsTarget] = useState(null);

  const orgNameById = useMemo(() => {
    const map = new Map();
    (organizations || []).forEach((o) => map.set(o.id, o.name));
    return map;
  }, [organizations]);

  const handlePublish = async (event) => {
    const ok = await publishEvent(event.id);
    enqueueSnackbar(ok ? "Đã công khai sự kiện." : "Lỗi khi công khai.", {
      variant: ok ? "success" : "error",
    });
  };

  const handleUnpublish = async (event) => {
    const ok = await unpublishEvent(event.id);
    enqueueSnackbar(ok ? "Đã gỡ sự kiện." : "Lỗi khi gỡ.", {
      variant: ok ? "success" : "warning",
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await deleteEvent(deleteTarget.id);
    enqueueSnackbar(ok ? "Đã xóa sự kiện." : "Lỗi khi xóa.", {
      variant: ok ? "success" : "error",
    });
    setDeleteTarget(null);
  };

  const handleEditSubmit = async (payload) => {
    if (!editTarget) return false;
    const ok = await updateEvent(editTarget.id, payload);
    enqueueSnackbar(ok ? "Đã cập nhật sự kiện." : "Lỗi khi cập nhật.", {
      variant: ok ? "success" : "error",
    });
    return ok;
  };

  const orgLabel = (id) => orgNameById.get(id) ?? `#${id ?? "-"}`;

  const columns = [
    { id: "id", label: "ID" },
    {
      id: "title",
      label: "Tiêu đề",
      render: (val) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {val}
        </Typography>
      ),
    },
    { id: "organizationId", label: "Tổ chức", render: (val) => orgLabel(val) },
    {
      id: "isPublished",
      label: "Trạng thái",
      render: (val) => (
        <AdminStatusChip
          status={val ? "PUBLISHED" : "DRAFT"}
          category="event"
          label={val ? "Đã đăng" : "Bản nháp"}
        />
      ),
    },
    {
      id: "timeline",
      label: "Thời gian",
      render: (_, row) => (
        <Box>
          <Typography
            variant="caption"
            sx={{ display: "block", fontWeight: 500 }}
          >
            {formatDateTime(row.startTime)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            đến {formatDateTime(row.endTime)}
          </Typography>
        </Box>
      ),
    },
    { id: "interestedCount", label: "Quan tâm", align: "right" },
    {
      id: "actions",
      label: "",
      align: "right",
      render: (_, e) => (
        <Stack
          direction="row"
          spacing={0.5}
          justifyContent="flex-end"
          onClick={(ev) => ev.stopPropagation()}
        >
          <Tooltip title="Chi tiết">
            <IconButton size="small" onClick={() => setDetailItem(e)}>
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <IconButton size="small" onClick={() => setEditTarget(e)}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Danh sách đăng ký">
            <IconButton
              size="small"
              color="primary"
              onClick={() => setParticipantsTarget(e)}
            >
              <GroupOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {e.isPublished ? (
            <Tooltip title="Gỡ bài">
              <IconButton
                size="small"
                color="warning"
                onClick={() => handleUnpublish(e)}
              >
                <CancelOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Đăng bài">
              <IconButton
                size="small"
                color="success"
                onClick={() => handlePublish(e)}
              >
                <CheckCircleOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Xóa">
            <IconButton
              size="small"
              color="error"
              onClick={() => setDeleteTarget(e)}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  const Filters = (
    <Stack direction="row" spacing={1}>
      <TextField
        select
        size="small"
        label="Trạng thái"
        value={statusFilter}
        onChange={(e) => {
          setStatusFilter(e.target.value);
          setPage(0);
        }}
        sx={{ minWidth: 140 }}
      >
        {ADMIN_EVENT_STATUS_OPTIONS.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        label="Tổ chức"
        value={organizationFilter}
        onChange={(e) => {
          setOrganizationFilter(e.target.value);
          setPage(0);
        }}
        sx={{ minWidth: 180 }}
      >
        <MenuItem value="ALL">Tất cả tổ chức</MenuItem>
        {(organizations || []).map((org) => (
          <MenuItem key={org.id} value={String(org.id)}>
            {org.name}
          </MenuItem>
        ))}
      </TextField>
    </Stack>
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
            Quản lý sự kiện
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, fontWeight: 500 }}
          >
            Tạo mới, phê duyệt và theo dõi các sự kiện cộng đồng, workshop và
            hội thảo.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddOutlinedIcon />}
          onClick={() => setCreateOpen(true)}
          sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none" }}
        >
          Tạo sự kiện
        </Button>
      </Box>

      {statistics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <AdminDashboardMetricTile
              label="Tổng sự kiện"
              value={statistics.totalEvents}
              icon={<CalendarTodayOutlinedIcon />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AdminDashboardMetricTile
              label="Đã đăng"
              value={statistics.publishedEvents}
              icon={<CheckCircleIcon />}
              valueColor="success.main"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AdminDashboardMetricTile
              label="Sắp diễn ra"
              value={statistics.upcomingEvents}
              icon={<AccessTimeIcon />}
              valueColor="warning.main"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AdminDashboardMetricTile
              label="Lượt quan tâm"
              value={statistics.totalInterests}
              icon={<PeopleIcon />}
              valueColor="primary.main"
            />
          </Grid>
        </Grid>
      )}

      <AdminDataTable
        columns={columns}
        rows={events}
        totalCount={totalItems}
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
        onRowClick={(e) => setDetailItem(e)}
        loading={loading}
      />

      {/* Dialogs */}
      <Dialog
        open={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Chi tiết sự kiện</DialogTitle>
        {detailItem && (
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography
                variant="h6"
                color="primary.main"
                sx={{ fontWeight: 700 }}
              >
                {detailItem.title}
              </Typography>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block" }}
                >
                  Tổ chức
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {orgLabel(detailItem.organizationId)}
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block" }}
                  >
                    Bắt đầu
                  </Typography>
                  <Typography variant="body2">
                    {formatDateTime(detailItem.startTime)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block" }}
                  >
                    Kết thúc
                  </Typography>
                  <Typography variant="body2">
                    {formatDateTime(detailItem.endTime)}
                  </Typography>
                </Grid>
              </Grid>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block" }}
                >
                  Địa điểm
                </Typography>
                <Typography variant="body2">
                  {detailItem.location || "-"}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block" }}
                >
                  Mô tả
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {detailItem.description || "Không có mô tả."}
                </Typography>
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

      <AdminEventFormDialog
        open={createOpen}
        event={null}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (p) => {
          const ok = await createEvent(p);
          if (ok) enqueueSnackbar("Đã tạo sự kiện.", { variant: "success" });
          return ok;
        }}
      />

      <AdminEventFormDialog
        open={Boolean(editTarget)}
        event={editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEditSubmit}
      />

      <AdminEventTicketsDialog
        open={Boolean(participantsTarget)}
        event={participantsTarget}
        onClose={() => setParticipantsTarget(null)}
      />

      <AdminConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Xóa sự kiện"
        description={
          deleteTarget
            ? `Bạn có chắc chắn muốn xóa sự kiện "${deleteTarget.title}"?`
            : ""
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </Box>
  );
};

export default AdminEventsPage;
