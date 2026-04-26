import { useState } from 'react';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
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
import AdminSectionPanel from '../../components/admin/AdminSectionPanel';
import AdminConfirmDeleteDialog from '../../components/admin/AdminConfirmDeleteDialog';
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
import useAdminEventsLocal from '../../hooks/admin/useAdminEventsLocal';
import { formatDateTime } from '../../utils/dateFormatter';

const statusColorMap = {
  DRAFT: 'default',
  PUBLISHED: 'success',
  CLOSED: 'warning',
  CANCELLED: 'error',
};

const AdminEventsPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const {
    events,
    filteredCount,
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
    updateStatus,
    deleteItem,
  } = useAdminEventsLocal();

  const [detailItem, setDetailItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  return (
    <>
      <AdminSectionPanel
        title="Event management"
        subtitle="Mock UI for reviewing event records, status moderation, and deletion flow."
        action={
          <Button variant="contained" size="small" sx={ADMIN_PRIMARY_ACTION_BUTTON_SX}>
            Create event (mock)
          </Button>
        }
      >
        <Box sx={ADMIN_FILTER_BAR_SX}>
          <TextField
            size="small"
            label="Search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Title, organizer, location..."
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
            sx={{ minWidth: 180 }}
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
            label="Sort by"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(0);
            }}
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
            onChange={(e) => {
              setSortOrder(e.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="DESC">Descending</MenuItem>
            <MenuItem value="ASC">Ascending</MenuItem>
          </TextField>
        </Box>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Organizer</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Timeline</TableCell>
              <TableCell align="right">Reg/Cap</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No events match current filters.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event.id} hover onClick={() => setDetailItem(event)} sx={{ cursor: 'pointer' }}>
                  <TableCell>{event.id}</TableCell>
                  <TableCell sx={{ maxWidth: 240 }}>{event.title}</TableCell>
                  <TableCell>{event.organizerName || '-'}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Chip
                      size="small"
                      color={statusColorMap[event.status] || 'default'}
                      label={formatStatusLabel(event.status)}
                      sx={ADMIN_STATUS_CHIP_SX}
                    />
                  </TableCell>
                  <TableCell>
                    {formatDateTime(event.startDate)} - {formatDateTime(event.endDate)}
                  </TableCell>
                  <TableCell align="right">
                    {event.registeredCount ?? 0}/{event.capacity ?? 0}
                  </TableCell>
                  <TableCell>{formatDateTime(event.updatedAt)}</TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                      <Tooltip title="View">
                        <IconButton size="small" color="primary" onClick={() => setDetailItem(event)}>
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Mark published">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => {
                            updateStatus(event.id, 'PUBLISHED');
                            enqueueSnackbar('Event status updated to PUBLISHED.', { variant: 'success' });
                          }}
                        >
                          <CheckCircleOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Mark cancelled">
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => {
                            updateStatus(event.id, 'CANCELLED');
                            enqueueSnackbar('Event status updated to CANCELLED.', { variant: 'warning' });
                          }}
                        >
                          <CancelOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(event)}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={filteredCount}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20]}
        />
      </AdminSectionPanel>

      <Dialog open={Boolean(detailItem)} onClose={() => setDetailItem(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ color: 'primary.main', fontWeight: 800 }}>Event detail</DialogTitle>
        {detailItem ? (
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
            <Typography variant="body2"><strong>ID:</strong> {detailItem.id}</Typography>
            <Typography variant="body2"><strong>Title:</strong> {detailItem.title}</Typography>
            <Typography variant="body2"><strong>Organizer:</strong> {detailItem.organizerName}</Typography>
            <Typography variant="body2"><strong>Status:</strong> {formatStatusLabel(detailItem.status)}</Typography>
            <Typography variant="body2"><strong>Location:</strong> {detailItem.location || '-'}</Typography>
            <Typography variant="body2"><strong>Start:</strong> {formatDateTime(detailItem.startDate)}</Typography>
            <Typography variant="body2"><strong>End:</strong> {formatDateTime(detailItem.endDate)}</Typography>
            <Typography variant="body2">
              <strong>Registrations:</strong> {detailItem.registeredCount}/{detailItem.capacity}
            </Typography>
          </DialogContent>
        ) : null}
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="contained" onClick={() => setDetailItem(null)} sx={{ textTransform: 'none', fontWeight: 700 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <AdminConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Delete event"
        description={deleteTarget ? `Delete "${deleteTarget.title}" (mock action)?` : ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteItem(deleteTarget.id);
            enqueueSnackbar('Event deleted from mock list.', { variant: 'success' });
          }
          setDeleteTarget(null);
        }}
      />
    </>
  );
};

export default AdminEventsPage;
