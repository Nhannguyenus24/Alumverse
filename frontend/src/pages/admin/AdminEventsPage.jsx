import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
  IconButton,
  MenuItem,
  Stack,
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
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import TodayOutlinedIcon from "@mui/icons-material/TodayOutlined";
import PlayCircleOutlineOutlinedIcon from "@mui/icons-material/PlayCircleOutlineOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import DraftsOutlinedIcon from "@mui/icons-material/DraftsOutlined";
import UpcomingOutlinedIcon from "@mui/icons-material/UpcomingOutlined";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
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

const AdminEventsPage = () => {
  const { t } = useTranslation(["admin", "common"]);
  const { enqueueSnackbar } = useSnackbar();

  const publishStatusChip = (isPublished) =>
    isPublished
      ? { color: "success", label: t("admin:published_chip") }
      : { color: "default", label: t("admin:draft_chip") };
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
    setBreadcrumbs?.([{ label: t('admin:events'), active: true }]);
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
    enqueueSnackbar(ok ? t("admin:event_published") : t("admin:event_publish_failed"), {
      variant: ok ? "success" : "error",
    });
  };

  const handleUnpublish = async (event) => {
    const ok = await unpublishEvent(event.id);
    enqueueSnackbar(ok ? t("admin:event_unpublished") : t("admin:event_unpublish_failed"), {
      variant: ok ? "success" : "warning",
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await deleteEvent(deleteTarget.id);
    enqueueSnackbar(ok ? t("admin:event_deleted") : t("admin:event_delete_failed"), {
      variant: ok ? "success" : "error",
    });
    setDeleteTarget(null);
  };

  const handleEditSubmit = async (payload) => {
    if (!editTarget) return false;
    const ok = await updateEvent(editTarget.id, payload);
    enqueueSnackbar(ok ? t("admin:event_updated") : t("admin:event_update_failed"), {
      variant: ok ? "success" : "error",
    });
    return ok;
  };

  const orgLabel = (id) => orgNameById.get(id) ?? `#${id ?? "-"}`;
  const eventMetricRows = statistics
    ? [
        [
          {
            label: t("admin:stats_total_events"),
            value: statistics.totalEvents,
            icon: <EventNoteOutlinedIcon />,
          },
          {
            label: t("admin:stats_total_interests"),
            value: statistics.totalInterests,
            icon: <FavoriteBorderOutlinedIcon />,
          },
          {
            label: t("admin:stats_new_today"),
            value: statistics.newEventsToday,
            icon: <TodayOutlinedIcon />,
          },
          {
            label: t("admin:stats_ongoing"),
            value: statistics.ongoingEvents,
            icon: <PlayCircleOutlineOutlinedIcon />,
          },
        ],
        [
          {
            label: t("admin:stats_past"),
            value: statistics.pastEvents,
            icon: <HistoryOutlinedIcon />,
          },
          {
            label: t("admin:stats_published"),
            value: statistics.publishedEvents,
            icon: <CampaignOutlinedIcon />,
          },
          {
            label: t("admin:stats_draft"),
            value: statistics.unpublishedEvents,
            icon: <DraftsOutlinedIcon />,
          },
          {
            label: t("admin:stats_upcoming"),
            value: statistics.upcomingEvents,
            icon: <UpcomingOutlinedIcon />,
          },
        ],
        [
          {
            label: t("admin:stats_registered_tickets"),
            value: statistics.registeredTickets,
            icon: <ConfirmationNumberOutlinedIcon />,
          },
          {
            label: t("admin:stats_checked_in_tickets"),
            value: statistics.checkedInTickets,
            icon: <HowToRegOutlinedIcon />,
          },
          {
            label: t("admin:stats_cancelled_tickets"),
            value: statistics.cancelledTickets,
            icon: <EventBusyOutlinedIcon />,
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
            {t("admin:manage_events")}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, fontWeight: 500 }}
          >
            {t("admin:manage_events_desc")}
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
          {eventMetricRows.map((row, rowIndex) => (
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

      <AdminDataTable
        columns={[
            { id: "id", label: "ID" },
            {
              id: "title",
              label: t("admin:col_title"),
              render: (val) => (
                <Typography variant="body2" noWrap sx={{ maxWidth: 240 }}>
                  {val}
                </Typography>
              ),
            },
            {
              id: "organizationId",
              label: t("admin:col_organization"),
              render: (val) => (
                <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                  {orgLabel(val)}
                </Typography>
              ),
            },
            {
              id: "isPublished",
              label: t("admin:col_status"),
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
              label: t("admin:col_time"),
              render: (_, event) => `${formatDateTime(event.startTime)} - ${formatDateTime(event.endTime)}`,
            },
            {
              id: "maxCapacity",
              label: t("admin:col_capacity"),
              align: "right",
              render: (val) => val ?? "-",
            },
            {
              id: "interestedCount",
              label: t("admin:col_interested"),
              align: "right",
              render: (val) => val ?? 0,
            },
            {
              id: "createdAt",
              label: t("admin:col_created_at"),
              render: (val) => formatDateTime(val),
            },
            {
              id: "actions",
              label: t("admin:col_actions"),
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
                  <Tooltip title={t("common:view_more")}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => setDetailItem(event)}
                    >
                      <VisibilityOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t("common:edit")}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => setEditTarget(event)}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t("admin:tooltip_organize_event")}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => orgNavigate(`/admin/events/${event.id}/organize`)}
                    >
                      <EventAvailableOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t("admin:tooltip_tickets_interests")}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => setParticipantsTarget(event)}
                    >
                      <GroupOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {event.isPublished ? (
                    <Tooltip title={t("admin:tooltip_unpublish")}>
                      <IconButton
                        size="small"
                        color="warning"
                        onClick={() => handleUnpublish(event)}
                      >
                        <CancelOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title={t("admin:tooltip_publish")}>
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => handlePublish(event)}
                      >
                        <CheckCircleOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title={t("common:delete")}>
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
        searchPlaceholder={t("admin:search_event_placeholder")}
        onRowClick={(event) => setDetailItem(event)}
        filters={
          <Stack direction="row" spacing={1}>
            <TextField
              select
              size="small"
              label={t("admin:col_status")}
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
              label={t("admin:filter_sort_label")}
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
              label={t("admin:filter_order_label")}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              sx={{ minWidth: 110 }}
            >
              <MenuItem value="DESC">{t("admin:order_desc")}</MenuItem>
              <MenuItem value="ASC">{t("admin:order_asc")}</MenuItem>
            </TextField>
          </Stack>
        }
      />

      <Dialog
        open={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ color: "primary.main", fontWeight: 800 }}>
          {t("admin:event_detail_title")}
        </DialogTitle>
        {detailItem ? (
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}
          >
            <Typography variant="body2">
              <strong>ID:</strong> {detailItem.id}
            </Typography>
            <Typography variant="body2">
              <strong>{t("admin:col_title")}:</strong> {detailItem.title}
            </Typography>
            <Typography variant="body2">
              <strong>{t("admin:col_organization")}:</strong>{" "}
              {orgLabel(detailItem.organizationId)}
            </Typography>
            <Typography variant="body2">
              <strong>{t("admin:event_detail_creator")}:</strong>{" "}
              {detailItem.creatorMemberId ?? "-"}
            </Typography>
            <Typography variant="body2">
              <strong>{t("admin:col_status")}:</strong>{" "}
              {detailItem.isPublished ? t("admin:published_chip") : t("admin:draft_chip")}
            </Typography>
            <Typography variant="body2">
              <strong>{t("admin:event_field_location")}:</strong> {detailItem.location || "-"}
            </Typography>
            <Typography variant="body2">
              <strong>{t("admin:event_detail_start")}:</strong> {formatDateTime(detailItem.startTime)}
            </Typography>
            <Typography variant="body2">
              <strong>{t("admin:event_detail_end")}:</strong> {formatDateTime(detailItem.endTime)}
            </Typography>
            <Typography variant="body2">
              <strong>{t("admin:event_detail_registration_time")}:</strong>{" "}
              {formatDateTime(detailItem.registrationStartAt)} -{" "}
              {formatDateTime(detailItem.registrationEndAt)}
            </Typography>
            <Typography variant="body2">
              <strong>{t("admin:col_capacity")}:</strong> {detailItem.maxCapacity ?? "-"}
            </Typography>
            <Typography variant="body2">
              <strong>{t("admin:col_interested")}:</strong> {detailItem.interestedCount ?? 0}
            </Typography>
            <Typography variant="body2">
              <strong>{t("admin:col_created_at")}:</strong>{" "}
              {formatDateTime(detailItem.createdAt)}
            </Typography>
            {detailItem.description ? (
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                <strong>{t("admin:event_detail_description")}:</strong> {detailItem.description}
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
            {t("admin:btn_tickets_interests")}
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
            {t("common:edit")}
          </Button>
          <Button
            variant="contained"
            onClick={() => setDetailItem(null)}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            {t("common:close")}
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
        title={t("admin:delete_event_title")}
        description={
          deleteTarget
            ? t("admin:delete_event_desc", { title: deleteTarget.title, id: deleteTarget.id })
            : ""
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </Box>
  );
};

export default AdminEventsPage;
