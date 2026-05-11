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
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import AdminSectionPanel from '../../components/admin/AdminSectionPanel';
import AdminConfirmDeleteDialog from '../../components/admin/AdminConfirmDeleteDialog';
import {
  ADMIN_FUNDRAISING_SORT_OPTIONS,
  ADMIN_FUNDRAISING_STATUS_OPTIONS,
} from '../../constants/adminDefaultFundraisings';
import {
  ADMIN_FILTER_BAR_SX,
  ADMIN_PRIMARY_ACTION_BUTTON_SX,
  ADMIN_STATUS_CHIP_SX,
  formatStatusLabel,
} from '../../constants/adminUiShared';
import useAdminFundraisingsData from '../../hooks/admin/useAdminFundraisingsData';
import { formatDateTime } from '../../utils/dateFormatter';
import { formatCurrencyVnd } from '../../utils/numberFormatter';

const statusColorMap = {
  DRAFT: 'default',
  ACTIVE: 'success',
  PAUSED: 'warning',
  COMPLETED: 'info',
};

const AdminFundraisingsPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const {
    fundraisings,
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
  } = useAdminFundraisingsData();

  const [detailItem, setDetailItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  return (
    <>
      <AdminSectionPanel
        title="Fundraising management"
        subtitle="Campaign oversight with API-backed data and moderation actions."
        action={
          <Button variant="contained" size="small" sx={ADMIN_PRIMARY_ACTION_BUTTON_SX}>
            Create campaign
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
            placeholder="Title, owner, status..."
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
            {ADMIN_FUNDRAISING_STATUS_OPTIONS.map((opt) => (
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
            {ADMIN_FUNDRAISING_SORT_OPTIONS.map((opt) => (
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
              <TableCell>Campaign</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Target</TableCell>
              <TableCell align="right">Raised</TableCell>
              <TableCell align="right">Donors</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fundraisings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No fundraising campaigns match your filters.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              fundraisings.map((fund) => (
                <TableRow key={fund.id} hover onClick={() => setDetailItem(fund)} sx={{ cursor: 'pointer' }}>
                  <TableCell>{fund.id}</TableCell>
                  <TableCell sx={{ maxWidth: 240 }}>{fund.title}</TableCell>
                  <TableCell>{fund.ownerName || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={statusColorMap[fund.status] || 'default'}
                      label={formatStatusLabel(fund.status)}
                      sx={ADMIN_STATUS_CHIP_SX}
                    />
                  </TableCell>
                  <TableCell align="right">{formatCurrencyVnd(fund.targetAmount)}</TableCell>
                  <TableCell align="right">{formatCurrencyVnd(fund.raisedAmount)}</TableCell>
                  <TableCell align="right">{fund.donorCount ?? 0}</TableCell>
                  <TableCell>{formatDateTime(fund.updatedAt)}</TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                      <Tooltip title="View">
                        <IconButton size="small" color="primary" onClick={() => setDetailItem(fund)}>
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Mark active">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => {
                            updateStatus(fund.id, 'ACTIVE');
                            enqueueSnackbar('Campaign status updated to ACTIVE.', { variant: 'success' });
                          }}
                        >
                          <CheckCircleOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Mark paused">
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => {
                            updateStatus(fund.id, 'PAUSED');
                            enqueueSnackbar('Campaign status updated to PAUSED.', { variant: 'warning' });
                          }}
                        >
                          <PauseCircleOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(fund)}>
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
        <DialogTitle sx={{ color: 'primary.main', fontWeight: 800 }}>Fundraising campaign detail</DialogTitle>
        {detailItem ? (
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
            <Typography variant="body2"><strong>ID:</strong> {detailItem.id}</Typography>
            <Typography variant="body2"><strong>Title:</strong> {detailItem.title}</Typography>
            <Typography variant="body2"><strong>Owner:</strong> {detailItem.ownerName}</Typography>
            <Typography variant="body2"><strong>Status:</strong> {formatStatusLabel(detailItem.status)}</Typography>
            <Typography variant="body2"><strong>Target:</strong> {formatCurrencyVnd(detailItem.targetAmount)}</Typography>
            <Typography variant="body2"><strong>Raised:</strong> {formatCurrencyVnd(detailItem.raisedAmount)}</Typography>
            <Typography variant="body2"><strong>Donors:</strong> {detailItem.donorCount ?? 0}</Typography>
            <Typography variant="body2"><strong>Updated:</strong> {formatDateTime(detailItem.updatedAt)}</Typography>
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
        title="Delete fundraising campaign"
        description={deleteTarget ? `Delete "${deleteTarget.title}"?` : ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteItem(deleteTarget.id);
            enqueueSnackbar('Fundraising campaign deleted.', { variant: 'success' });
          }
          setDeleteTarget(null);
        }}
      />
    </>
  );
};

export default AdminFundraisingsPage;
