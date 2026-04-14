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
import DoneAllOutlinedIcon from '@mui/icons-material/DoneAllOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import AdminSectionPanel from '../../components/admin/AdminSectionPanel';
import AdminConfirmDeleteDialog from '../../components/admin/AdminConfirmDeleteDialog';
import {
  ADMIN_MENTORSHIP_SORT_OPTIONS,
  ADMIN_MENTORSHIP_STATUS_OPTIONS,
} from '../../constants/adminDefaultMentorships';
import {
  ADMIN_FILTER_BAR_SX,
  ADMIN_PRIMARY_ACTION_BUTTON_SX,
  ADMIN_STATUS_CHIP_SX,
  formatStatusLabel,
} from '../../constants/adminUiShared';
import useAdminMentorshipsLocal from '../../hooks/admin/useAdminMentorshipsLocal';

const formatDateTime = (value) => {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(value);
  }
};

const statusColorMap = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  COMPLETED: 'success',
  CANCELLED: 'default',
};

const AdminMentorshipPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const {
    mentorships,
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
  } = useAdminMentorshipsLocal();

  const [detailItem, setDetailItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  return (
    <>
      <AdminSectionPanel
        title="Mentorship management"
        subtitle="Mock moderation UI for mentorship sessions, statuses, and basic actions."
        action={
          <Button variant="contained" size="small" sx={ADMIN_PRIMARY_ACTION_BUTTON_SX}>
            Create session (mock)
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
            placeholder="Mentor, mentee, topic..."
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
            {ADMIN_MENTORSHIP_STATUS_OPTIONS.map((opt) => (
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
            {ADMIN_MENTORSHIP_SORT_OPTIONS.map((opt) => (
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
              <TableCell>Mentor</TableCell>
              <TableCell>Mentee</TableCell>
              <TableCell>Topic</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Session date</TableCell>
              <TableCell align="right">Duration</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mentorships.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No mentorship records found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              mentorships.map((session) => (
                <TableRow key={session.id} hover onClick={() => setDetailItem(session)} sx={{ cursor: 'pointer' }}>
                  <TableCell>{session.id}</TableCell>
                  <TableCell>{session.mentorName}</TableCell>
                  <TableCell>{session.menteeName}</TableCell>
                  <TableCell sx={{ maxWidth: 220 }}>{session.topic}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={statusColorMap[session.status] || 'default'}
                      label={formatStatusLabel(session.status)}
                      sx={ADMIN_STATUS_CHIP_SX}
                    />
                  </TableCell>
                  <TableCell>{formatDateTime(session.sessionDate)}</TableCell>
                  <TableCell align="right">{session.durationMinutes} min</TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                      <Tooltip title="View">
                        <IconButton size="small" color="primary" onClick={() => setDetailItem(session)}>
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Mark completed">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => {
                            updateStatus(session.id, 'COMPLETED');
                            enqueueSnackbar('Session marked as COMPLETED.', { variant: 'success' });
                          }}
                        >
                          <DoneAllOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Cancel session">
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => {
                            updateStatus(session.id, 'CANCELLED');
                            enqueueSnackbar('Session marked as CANCELLED.', { variant: 'warning' });
                          }}
                        >
                          <CloseOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(session)}>
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
        <DialogTitle sx={{ color: 'primary.main', fontWeight: 800 }}>Mentorship session detail</DialogTitle>
        {detailItem ? (
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
            <Typography variant="body2"><strong>ID:</strong> {detailItem.id}</Typography>
            <Typography variant="body2"><strong>Mentor:</strong> {detailItem.mentorName}</Typography>
            <Typography variant="body2"><strong>Mentee:</strong> {detailItem.menteeName}</Typography>
            <Typography variant="body2"><strong>Topic:</strong> {detailItem.topic}</Typography>
            <Typography variant="body2"><strong>Status:</strong> {formatStatusLabel(detailItem.status)}</Typography>
            <Typography variant="body2"><strong>Date:</strong> {formatDateTime(detailItem.sessionDate)}</Typography>
            <Typography variant="body2"><strong>Duration:</strong> {detailItem.durationMinutes} minutes</Typography>
            <Typography variant="body2">
              <strong>Feedback score:</strong> {detailItem.feedbackScore ?? '-'}
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
        title="Delete mentorship record"
        description={deleteTarget ? `Delete session #${deleteTarget.id} (mock action)?` : ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteItem(deleteTarget.id);
            enqueueSnackbar('Mentorship record deleted from mock list.', { variant: 'success' });
          }
          setDeleteTarget(null);
        }}
      />
    </>
  );
};

export default AdminMentorshipPage;
