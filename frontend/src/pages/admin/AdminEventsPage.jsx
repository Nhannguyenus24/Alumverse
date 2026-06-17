import { useMemo, useState, useEffect } from "react";
import { useOutletContext } from "react-router";
import { useSnackbar } from "notistack";
import { useDebounce } from "../../hooks/useDebounce";
import { useOrgNavigate } from "../../hooks/useOrgNavigate";
import {
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
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import AdminSectionPanel from "../../components/admin/AdminSectionPanel";
import AdminConfirmDeleteDialog from "../../components/admin/AdminConfirmDeleteDialog";
import AdminEventFormDialog from "../../components/admin/AdminEventFormDialog";
import AdminEventTicketsDialog from "../../components/admin/AdminEventTicketsDialog";
import AdminDataTable from "../../components/admin/AdminDataTable";
import {
  ADMIN_EVENT_SORT_OPTIONS,
  ADMIN_EVENT_STATUS_OPTIONS,
} from "../../constants/adminDefaultEvents";
import {
  ADMIN_FILTER_BAR_SX,
  ADMIN_STATUS_CHIP_SX,
} from "../../constants/adminUiShared";
import useAdminEvents from "../../hooks/admin/useAdminEvents";
import { useAdminSystemContext } from "../../stores/AdminStore";
import { formatDateTime } from "../../utils/dateFormatter";
import AdminDashboardMetricTile from "../../components/admin/AdminDashboardMetricTile";

const publishStatusChip = (isPublished) =>
  isPublished
    ? { color: "success", label: "Đã đăng" }
    : { color: "default", label: "Bản nháp" };

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

const AdminEventsPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const orgNavigate = useOrgNavigate();
  const { stableOrgId } = useAdminSystemContext();
  const {
    events,
    totalItems,
    statistics,
    organizations,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    publishEvent,
    unpublishEvent,
    deleteEvent,
    updateEvent,
  } = useAdminEvents(stableOrgId || 'ALL');
  const { setBreadcrumbs } = useOutletContext();

  const [searchTerm, setSearchTerm] = useState(search);
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    setSearch(debouncedSearch);
  }, [debouncedSearch, setSearch]);

  useEffect(() => {
    setBreadcrumbs?.([{ label: 'Sự kiện', active: true }]);
  }, [setBreadcrumbs]);

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
    enqueueSnackbar(ok ? "Event published." : "Failed to publish event.", {
      variant: ok ? "success" : "error",
    });
  };

  const handleUnpublish = async (event) => {
    const ok = await unpublishEvent(event.id);
    enqueueSnackbar(ok ? "Event unpublished." : "Failed to unpublish event.", {
      variant: ok ? "success" : "warning",
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await deleteEvent(deleteTarget.id);
    enqueueSnackbar(ok ? "Event deleted." : "Failed to delete event.", {
      variant: ok ? "success" : "error",
    });
    setDeleteTarget(null);
  };

  const handleEditSubmit = async (payload) => {
    if (!editTarget) return false;
    const ok = await updateEvent(editTarget.id, payload);
    enqueueSnackbar(ok ? "Event updated." : "Failed to update event.", {
      variant: ok ? "success" : "error",
    });
    return ok;
  };

  const orgLabel = (id) => orgNameById.get(id) ?? `#${id ?? "-"}`;

  return (
    <>
      <AdminSectionPanel
        title="Quản lý sự kiện"
        subtitle="Danh sách sự kiện, kiểm duyệt và xóa sự kiện trên toàn hệ thống."
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
              label="Tổng sự kiện"
              value={statistics.totalEvents}
            />
            <AdminDashboardMetricTile
              label="Đã đăng"
              value={statistics.publishedEvents}
              valueColor="success.main"
            />
            <AdminDashboardMetricTile
              label="Bản nháp"
              value={statistics.unpublishedEvents}
              valueColor="text.secondary"
            />
            <AdminDashboardMetricTile
              label="Sắp tới"
              value={statistics.upcomingEvents}
              valueColor="info.main"
            />
            <AdminDashboardMetricTile
              label="Đang diễn ra"
              value={statistics.ongoingEvents}
              valueColor="warning.main"
            />
            <AdminDashboardMetricTile
              label="Đã qua"
              value={statistics.pastEvents}
              valueColor="text.disabled"
            />
            <AdminDashboardMetricTile
              label="Vé đã đăng ký"
              value={statistics.registeredTickets}
              valueColor="primary.main"
            />
            <AdminDashboardMetricTile
              label="Vé đã check-in"
              value={statistics.checkedInTickets}
              valueColor="success.dark"
            />
            <AdminDashboardMetricTile
              label="Vé đã hủy"
              value={statistics.cancelledTickets}
              valueColor="error.main"
            />
            <AdminDashboardMetricTile
              label="Tổng lượt quan tâm"
              value={statistics.totalInterests}
              valueColor="secondary.main"
            />
            <AdminDashboardMetricTile
              label="Mới hôm nay"
              value={statistics.newEventsToday}
              valueColor="success.main"
            />
          </Box>
        ) : null}

        <AdminDataTable
          columns={[
            { id: "id", label: "ID" },
            {
              id: "title",
              label: "Tiêu đề",
              render: (val) => (
                <Typography variant="body2" noWrap sx={{ maxWidth: 240 }}>
                  {val}
                </Typography>
              ),
            },
            {
              id: "organizationId",
              label: "Tổ chức",
              render: (val) => (
                <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                  {orgLabel(val)}
                </Typography>
              ),
            },
            {
              id: "isPublished",
              label: "Trạng thái",
              render: (val) => {
                const chip = publishStatusChip(val);
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
              id: "time",
              label: "Thời gian",
              render: (_, event) => `${formatDateTime(event.startTime)} - ${formatDateTime(event.endTime)}`,
            },
            {
              id: "maxCapacity",
              label: "Sức chứa",
              align: "right",
              render: (val) => val ?? "-",
            },
            {
              id: "interestedCount",
              label: "Quan tâm",
              align: "right",
              render: (val) => val ?? 0,
            },
            {
              id: "createdAt",
              label: "Ngày tạo",
              render: (val) => formatDateTime(val),
            },
            {
              id: "actions",
              label: "Thao tác",
              align: "right",
              render: (_, event) => (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 0.5,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Tooltip title="Xem">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => setDetailItem(event)}
                    >
                      <VisibilityOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Chỉnh sửa">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => setEditTarget(event)}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Tổ chức sự kiện">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => orgNavigate(`/admin/events/${event.id}/organize`)}
                    >
                      <EventAvailableOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Vé & lượt quan tâm">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => setParticipantsTarget(event)}
                    >
                      <GroupOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {event.isPublished ? (
                    <Tooltip title="Gỡ đăng">
                      <IconButton
                        size="small"
                        color="warning"
                        onClick={() => handleUnpublish(event)}
                      >
                        <CancelOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Đăng sự kiện">
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => handlePublish(event)}
                      >
                        <CheckCircleOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Xóa">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteTarget(event)}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              ),
            },
          ]}
          rows={events}
          totalCount={totalItems}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setPage(0);
          }}
          onSearchChange={(val) => {
            setSearchTerm(val);
            setPage(0);
          }}
          searchValue={searchTerm}
          searchPlaceholder="Tiêu đề hoặc mô tả..."
          onRowClick={(event) => setDetailItem(event)}
          filters={
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
                sx={{ minWidth: 160 }}
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
                label="Sắp xếp"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                sx={{ minWidth: 140 }}
              >
                {ADMIN_EVENT_SORT_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                label="Thứ tự"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                sx={{ minWidth: 110 }}
              >
                <MenuItem value="DESC">Giảm dần</MenuItem>
                <MenuItem value="ASC">Tăng dần</MenuItem>
              </TextField>
            </Stack>
          }
        />
      </AdminSectionPanel>

      <Dialog
        open={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ color: "primary.main", fontWeight: 800 }}>
          Chi tiết sự kiện
        </DialogTitle>
        {detailItem ? (
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}
          >
            <Typography variant="body2">
              <strong>ID:</strong> {detailItem.id}
            </Typography>
            <Typography variant="body2">
              <strong>Tiêu đề:</strong> {detailItem.title}
            </Typography>
            <Typography variant="body2">
              <strong>Tổ chức:</strong>{" "}
              {orgLabel(detailItem.organizationId)}
            </Typography>
            <Typography variant="body2">
              <strong>ID thành viên tạo:</strong>{" "}
              {detailItem.creatorMemberId ?? "-"}
            </Typography>
            <Typography variant="body2">
              <strong>Trạng thái:</strong>{" "}
              {detailItem.isPublished ? "Đã đăng" : "Bản nháp"}
            </Typography>
            <Typography variant="body2">
              <strong>Địa điểm:</strong> {detailItem.location || "-"}
            </Typography>
            <Typography variant="body2">
              <strong>Bắt đầu:</strong> {formatDateTime(detailItem.startTime)}
            </Typography>
            <Typography variant="body2">
              <strong>Kết thúc:</strong> {formatDateTime(detailItem.endTime)}
            </Typography>
            <Typography variant="body2">
              <strong>Thời gian đăng ký:</strong>{" "}
              {formatDateTime(detailItem.registrationStartAt)} -{" "}
              {formatDateTime(detailItem.registrationEndAt)}
            </Typography>
            <Typography variant="body2">
              <strong>Sức chứa:</strong> {detailItem.maxCapacity ?? "-"}
            </Typography>
            <Typography variant="body2">
              <strong>Quan tâm:</strong> {detailItem.interestedCount ?? 0}
            </Typography>
            <Typography variant="body2">
              <strong>Ngày tạo:</strong>{" "}
              {formatDateTime(detailItem.createdAt)}
            </Typography>
            {detailItem.description ? (
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                <strong>Mô tả:</strong> {detailItem.description}
              </Typography>
            ) : null}
          </DialogContent>
        ) : null}
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<GroupOutlinedIcon />}
            onClick={() => {
              setParticipantsTarget(detailItem);
              setDetailItem(null);
            }}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Vé & lượt quan tâm
          </Button>
          <Button
            variant="outlined"
            startIcon={<EditOutlinedIcon />}
            onClick={() => {
              setEditTarget(detailItem);
              setDetailItem(null);
            }}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Chỉnh sửa
          </Button>
          <Button
            variant="contained"
            onClick={() => setDetailItem(null)}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

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
            ? `Xóa vĩnh viễn sự kiện "${deleteTarget.title}" (#${deleteTarget.id})?`
            : ""
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default AdminEventsPage;
