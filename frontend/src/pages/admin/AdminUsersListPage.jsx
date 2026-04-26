import { useState } from 'react';

import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  IconButton,
  Menu,
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
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AdminSectionPanel from '../../components/admin/AdminSectionPanel';
import AdminStatusChip from '../../components/admin/AdminStatusChip';
import AdminUserFormDialog from '../../components/admin/AdminUserFormDialog';
import AdminConfirmDeleteDialog from '../../components/admin/AdminConfirmDeleteDialog';
import AdminBanUserDialog from '../../components/admin/AdminBanUserDialog';
import { formatAccountStatusLabel } from '../../constants/adminStatusDisplay';
import { ADMIN_ORGANIZATION_OPTIONS, USER_ROLES, USER_STATUSES } from '../../constants/adminDefaultUsers';
import { useAdminUsersContext } from '../../contexts/AdminUsersContext';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { formatDateTime } from '../../utils/dateFormatter';

const AdminUsersListPage = () => {
  const navigate = useOrgNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const {
    users,
    filteredCount,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
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
    createUser,
    updateUser,
    updateUserStatus,
    deleteUser,
    banUser,
    unbanUser,
  } = useAdminUsersContext();

  const [userFormOpen, setUserFormOpen] = useState(false);
  const [userFormMode, setUserFormMode] = useState('create');
  const [editingUser, setEditingUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [userStatusMenu, setUserStatusMenu] = useState(null);
  const [banTarget, setBanTarget] = useState(null);

  return (
    <>
      <AdminSectionPanel
        title="User management"
        subtitle="Search, filter by organization, sort, paginate. Open a user for the full detail tabs (§2.2)."
        action={
          <Button
            variant="contained"
            size="small"
            startIcon={<AddOutlinedIcon />}
            onClick={() => {
              setUserFormMode('create');
              setEditingUser(null);
              setUserFormOpen(true);
            }}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Add user
          </Button>
        }
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            flexWrap: 'wrap',
            gap: 2,
            mb: 2,
            alignItems: { xs: 'stretch', md: 'center' },
          }}
        >
          <TextField
            size="small"
            label="Search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            placeholder="Email, username, full name…"
            sx={{ flex: '1 1 220px', minWidth: 200 }}
          />
          <TextField
            select
            size="small"
            label="Role"
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="ALL">All roles</MenuItem>
            {USER_ROLES.map((role) => (
              <MenuItem key={role} value={role}>
                {role}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="ALL">All statuses</MenuItem>
            {USER_STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Organization"
            value={organizationFilter}
            onChange={(event) => {
              setOrganizationFilter(event.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="ALL">All organizations</MenuItem>
            {ADMIN_ORGANIZATION_OPTIONS.map((org) => (
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
            onChange={(event) => {
              setSortBy(event.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="createdAt">Created date</MenuItem>
            <MenuItem value="updatedAt">Last updated</MenuItem>
            <MenuItem value="fullName">Name</MenuItem>
            <MenuItem value="email">Email</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label="Order"
            value={sortOrder}
            onChange={(event) => {
              setSortOrder(event.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="DESC">Descending</MenuItem>
            <MenuItem value="ASC">Ascending</MenuItem>
          </TextField>
        </Box>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Full name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Organization</TableCell>
              <TableCell>Created at</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No users match your filters.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/users/${u.id}`)}>
                  <TableCell>{u.id}</TableCell>
                  <TableCell>{u.email || '-'}</TableCell>
                  <TableCell>{u.userName || '-'}</TableCell>
                  <TableCell>{u.fullName || '-'}</TableCell>
                  <TableCell>{u.role || '-'}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <AdminStatusChip
                      status={u.status}
                      category="account"
                      label={
                        <Box
                          component="span"
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.25,
                            pr: 0.25,
                          }}
                        >
                          {formatAccountStatusLabel(u.status)}
                          <ArrowDropDownIcon sx={{ fontSize: 18, opacity: 0.9 }} />
                        </Box>
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        setUserStatusMenu({ anchorEl: e.currentTarget, user: u });
                      }}
                      sx={{
                        cursor: 'pointer',
                        maxWidth: '100%',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 180 }}>
                    <Typography variant="body2" noWrap>
                      {u.organizationName || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatDateTime(u.createdAt)}</TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                      <Tooltip title="View">
                        <IconButton size="small" color="primary" onClick={() => navigate(`/admin/users/${u.id}`)}>
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            setUserFormMode('edit');
                            setEditingUser(u);
                            setUserFormOpen(true);
                          }}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {u.status === 'BANNED' ? (
                        <Tooltip title="Unban">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => {
                              unbanUser(u.id);
                              enqueueSnackbar('User unbanned.', { variant: 'success' });
                            }}
                          >
                            <LockOpenOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Ban">
                          <IconButton size="small" color="warning" onClick={() => setBanTarget(u)}>
                            <BlockOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(u)}>
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
          onPageChange={(_, next) => setPage(next)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(Number(event.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage="Rows per page"
        />
      </AdminSectionPanel>

      <Menu
        anchorEl={userStatusMenu?.anchorEl}
        open={Boolean(userStatusMenu)}
        onClose={() => setUserStatusMenu(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        disableScrollLock
        slotProps={{ paper: { sx: { minWidth: 200 } } }}
      >
        {userStatusMenu
          ? USER_STATUSES.map((st) => {
              const active = (userStatusMenu.user.status || 'ACTIVE') === st;
              return (
                <MenuItem
                  key={st}
                  selected={active}
                  onClick={() => {
                    updateUserStatus(userStatusMenu.user.id, st);
                    enqueueSnackbar(`User status set to ${formatAccountStatusLabel(st)}.`, { variant: 'success' });
                    setUserStatusMenu(null);
                  }}
                >
                  {formatAccountStatusLabel(st)}
                </MenuItem>
              );
            })
          : null}
      </Menu>

      <AdminUserFormDialog
        open={userFormOpen}
        mode={userFormMode}
        user={editingUser}
        onClose={() => setUserFormOpen(false)}
        onSubmit={(payload) => {
          if (userFormMode === 'create') {
            createUser(payload);
            enqueueSnackbar('User created successfully.', { variant: 'success' });
          } else if (editingUser) {
            updateUser(editingUser.id, payload);
            enqueueSnackbar('User updated successfully.', { variant: 'success' });
          }
        }}
      />

      <AdminBanUserDialog
        open={Boolean(banTarget)}
        user={banTarget}
        onClose={() => setBanTarget(null)}
        onConfirm={(banPayload) => {
          if (banTarget) {
            banUser(banTarget.id, banPayload);
            enqueueSnackbar('User banned.', { variant: 'success' });
          }
          setBanTarget(null);
        }}
      />

      <AdminConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Delete user"
        description={
          deleteTarget
            ? `This will remove ${deleteTarget.fullName || deleteTarget.email} (#${deleteTarget.id}). Demo: local state only.`
            : ''
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteUser(deleteTarget.id);
            enqueueSnackbar('User removed from list.', { variant: 'success' });
          }
          setDeleteTarget(null);
        }}
      />
    </>
  );
};

export default AdminUsersListPage;
