import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router";
import { useSnackbar } from "notistack";
import { useDebounce } from "../../hooks/useDebounce";
import { useOrgNavigate, useOrgPath } from "../../hooks/useOrgNavigate";


import {
  getAdminEventSortOptions,
  getAdminEventStatusOptions,
} from "../../constants/adminDefaultEvents";
import useAdminEvents from "../../hooks/admin/useAdminEvents";
import { useAdminSystemContext } from "../../stores/AdminStore";
import { formatDateTime } from "../../utils/dateFormatter";

const AdminEventsPage = () => {
  const { t } = useTranslation(["admin", "common", "event"]);
  const { enqueueSnackbar } = useSnackbar();

  const publishStatus = (isPublished) => (isPublished ? "PUBLISHED" : "DRAFT");
  const orgNavigate = useOrgNavigate();
  const toOrgPath = useOrgPath();
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
  } = useAdminEvents(stableOrgId || 'ALL');
  const { setBreadcrumbs } = useOutletContext();

  const [searchTerm, setSearchTerm] = useState(search);
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    setSearch(debouncedSearch);
  }, [debouncedSearch, setSearch]);

  useEffect(() => {
    setBreadcrumbs?.([{ label: t('admin:events'), active: true }]);
  }, [setBreadcrumbs, t]);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const eventStatusOptions = useMemo(() => getAdminEventStatusOptions(t), [t]);
  const eventSortOptions = useMemo(() => getAdminEventSortOptions(t), [t]);

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

  const openInNewTab = (path) => {
    window.open(toOrgPath(path), "_blank", "noopener,noreferrer");
  };
  const openEventManage = (event) => openInNewTab(`/admin/events/${event.id}`);
  const openEventEdit = (event) => openInNewTab(`/post/event/${event.id}`);

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
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => orgNavigate("/post/event")}
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          {t("event:create_event")}
        </Button>
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
              render: (val) => (
                <AdminStatusChip status={publishStatus(val)} category="event" />
              ),
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
                  <Tooltip title={t("admin:tooltip_detail")}>
                    <IconButton
                      size="small"
                      sx={{ color: "primary.main" }}
                      onClick={() => openEventManage(event)}
                    >
                      <LaunchOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t("admin:tooltip_edit")}>
                    <IconButton
                      size="small"
                      sx={{ color: "secondary.main" }}
                      onClick={() => openEventEdit(event)}
                    >
                      <EditOutlinedIcon fontSize="small" />
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
        onRowClick={openEventManage}
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
              {eventStatusOptions.map((opt) => (
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
              {eventSortOptions.map((opt) => (
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
