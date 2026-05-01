import { useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';
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
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import AdminSectionPanel from '../../components/admin/AdminSectionPanel';
import AdminConfirmDeleteDialog from '../../components/admin/AdminConfirmDeleteDialog';
import AdminEventFormDialog from '../../components/admin/AdminEventFormDialog';
import AdminEventTicketsDialog from '../../components/admin/AdminEventTicketsDialog';
import {
  ADMIN_EVENT_SORT_OPTIONS,
  ADMIN_EVENT_STATUS_OPTIONS,
} from '../../constants/adminDefaultEvents';
import {
  ADMIN_FILTER_BAR_SX,
  ADMIN_PRIMARY_ACTION_BUTTON_SX,
  ADMIN_STATUS_CHIP_SX,
  formatStatusLabel,
} from '../../constants/adminUiShared';
import useAdminEventsData from '../../hooks/admin/useAdminEventsData';
import { formatDateTime } from '../../utils/dateFormatter';

const publishStatusChip = (isPublished) =>
  isPublished
    ? { color: 'success', label: 'Published' }
    : { color: 'default', label: 'Draft' };

const StatTile = ({ label, value }) => (
  <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', height: '100%' }}>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
      {label}
    </Typography>
    <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
      {value ?? '-'}
    </Typography>
  </Paper>
);

const AdminEventsPage = () => {
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
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    updateStatus,
    deleteItem,
  } = useAdminEventsData();

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
    enqueueSnackbar(
      ok ? 'Event published.' : 'Failed to publish event.',
      { variant: ok ? 'success' : 'error' },
    );
  };

  const handleUnpublish = async (event) => {
    const ok = await unpublishEvent(event.id);
    enqueueSnackbar(
      ok ? 'Event unpublished.' : 'Failed to unpublish event.',
      { variant: ok ? 'success' : 'warning' },
    );
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await deleteEvent(deleteTarget.id);
    enqueueSnackbar(
      ok ? 'Event deleted.' : 'Failed to delete event.',
      { variant: ok ? 'success' : 'error' },
    );
    setDeleteTarget(null);
  };

  const handleEditSubmit = async (payload) => {
    if (!editTarget) return false;
    const ok = await updateEvent(editTarget.id, payload);
    enqueueSnackbar(
      ok ? 'Event updated.' : 'Failed to update event.',
      { variant: ok ? 'success' : 'error' },
    );
    return ok;
  };

  const orgLabel = (id) => orgNameById.get(id) ?? `#${id ?? '-'}`;

  return (
    <>
      <AdminSectionPanel
        title="Event management"
        subtitle="Review event records, moderate status, and remove events via API."
        action={
          <Button variant="contained" size="small" sx={ADMIN_PRIMARY_ACTION_BUTTON_SX}>
            Create event
          </Button>
        }
      >
        {statistics ? (
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={6} sm={4} md={2}>
              <StatTile label="Total events" value={statistics.totalEvents} />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <StatTile label="Published" value={statistics.publishedEvents} />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <StatTile label="Draft" value={statistics.unpublishedEvents} />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <StatTile label="Upcoming" value={statistics.upcomingEvents} />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <StatTile label="Ongoing" value={statistics.ongoingEvents} />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <StatTile label="Past" value={statistics.pastEvents} />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <StatTile label="Tickets registered" value={statistics.registeredTickets} />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <StatTile label="Tickets checked-in" value={statistics.checkedInTickets} />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <StatTile label="Tickets cancelled" value={statistics.cancelledTickets} />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <StatTile label="Total interests" value={statistics.totalInterests} />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <StatTile label="New today" value={statistics.newEventsToday} />
            </Grid>
          </Grid>
        ) : null}

        <Box sx={ADMIN_FILTER_BAR_SX}>
          <TextField
            size="small"
            label="Search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Title or description..."
            sx={{ flex: '1 1 220px', minWidth: 220 }}
          />
          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 200 }}
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
            label="Organization"
            value={organizationFilter}
            onChange={(e) => {
              setOrganizationFilter(e.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="ALL">All organizations</MenuItem>
            {(organizations || []).map((org) => (
              <MenuItem key={org.id} value={String(org.id)}>
                {org.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Sort by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            sx={{ minWidth: 180 }}
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
            label="Order"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="DESC">Descending</MenuItem>
            <MenuItem value="ASC">Ascending</MenuItem>
          </TextField>
        </Box>

        {loading ? (
          <Stack alignItems="center" sx={{ py: 4 }}>
            <CircularProgress size={28} />
          </Stack>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Organization</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Timeline</TableCell>
                <TableCell align="right">Capacity</TableCell>
                <TableCell align="right">Interested</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No events match current filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => {
                  const chip = publishStatusChip(event.isPublished);
                  return (
                    <TableRow
                      key={event.id}
                      hover
                      onClick={() => setDetailItem(event)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{event.id}</TableCell>
                      <TableCell sx={{ maxWidth: 240 }}>
                        <Typography variant="body2" noWrap>
                          {event.title}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 180 }}>
                        <Typography variant="body2" noWrap>
                          {orgLabel(event.organizationId)}
                        </Typography>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Chip
                          size="small"
                          color={chip.color}
                          label={chip.label}
                          sx={ADMIN_STATUS_CHIP_SX}
                        />
                      </TableCell>
                      <TableCell>
                        {formatDateTime(event.startTime)} - {formatDateTime(event.endTime)}
                      </TableCell>
                      <TableCell align="right">{event.maxCapacity ?? '-'}</TableCell>
                      <TableCell align="right">{event.interestedCount ?? 0}</TableCell>
                      <TableCell>{formatDateTime(event.createdAt)}</TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <Tooltip title="View">
                            <IconButton size="small" color="primary" onClick={() => setDetailItem(event)}>
                              <VisibilityOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" color="primary" onClick={() => setEditTarget(event)}>
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Tickets & interests">
                            <IconButton size="small" color="primary" onClick={() => setParticipantsTarget(event)}>
                              <GroupOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {event.isPublished ? (
                            <Tooltip title="Unpublish">
                              <IconButton size="small" color="warning" onClick={() => handleUnpublish(event)}>
                                <CancelOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Publish">
                              <IconButton size="small" color="success" onClick={() => handlePublish(event)}>
                                <CheckCircleOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => setDeleteTarget(event)}>
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
          count={totalItems}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 50]}
        />
      </AdminSectionPanel>

      <Dialog open={Boolean(detailItem)} onClose={() => setDetailItem(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ color: 'primary.main', fontWeight: 800 }}>Event detail</DialogTitle>
        {detailItem ? (
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
            <Typography variant="body2"><strong>ID:</strong> {detailItem.id}</Typography>
            <Typography variant="body2"><strong>Title:</strong> {detailItem.title}</Typography>
            <Typography variant="body2"><strong>Organization:</strong> {orgLabel(detailItem.organizationId)}</Typography>
            <Typography variant="body2"><strong>Creator member ID:</strong> {detailItem.creatorMemberId ?? '-'}</Typography>
            <Typography variant="body2"><strong>Status:</strong> {detailItem.isPublished ? 'Published' : 'Draft'}</Typography>
            <Typography variant="body2"><strong>Location:</strong> {detailItem.location || '-'}</Typography>
            <Typography variant="body2"><strong>Start:</strong> {formatDateTime(detailItem.startTime)}</Typography>
            <Typography variant="body2"><strong>End:</strong> {formatDateTime(detailItem.endTime)}</Typography>
            <Typography variant="body2"><strong>Registration window:</strong> {formatDateTime(detailItem.registrationStartAt)} - {formatDateTime(detailItem.registrationEndAt)}</Typography>
            <Typography variant="body2"><strong>Capacity:</strong> {detailItem.maxCapacity ?? '-'}</Typography>
            <Typography variant="body2"><strong>Interested:</strong> {detailItem.interestedCount ?? 0}</Typography>
            <Typography variant="body2"><strong>Created at:</strong> {formatDateTime(detailItem.createdAt)}</Typography>
            {detailItem.description ? (
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                <strong>Description:</strong> {detailItem.description}
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
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Tickets & interests
          </Button>
          <Button
            variant="outlined"
            startIcon={<EditOutlinedIcon />}
            onClick={() => {
              setEditTarget(detailItem);
              setDetailItem(null);
            }}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Edit
          </Button>
          <Button variant="contained" onClick={() => setDetailItem(null)} sx={{ textTransform: 'none', fontWeight: 700 }}>
            Close
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
        title="Delete event"
        description={deleteTarget ? `Delete "${deleteTarget.title}"?` : ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteItem(deleteTarget.id);
            enqueueSnackbar('Event deleted.', { variant: 'success' });
          }
          setDeleteTarget(null);
        }}
      />
    </>
  );
};

export default AdminEventsPage;
