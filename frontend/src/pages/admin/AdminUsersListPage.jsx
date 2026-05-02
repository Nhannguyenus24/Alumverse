import { useEffect, useMemo, useState } from 'react';
import { useMatch, useNavigate } from 'react-router';

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
import PasswordOutlinedIcon from '@mui/icons-material/PasswordOutlined';
import AdminSectionPanel from '../../components/admin/AdminSectionPanel';
import AdminStatusChip from '../../components/admin/AdminStatusChip';
import AdminUserFormDialog from '../../components/admin/AdminUserFormDialog';
import AdminConfirmDeleteDialog from '../../components/admin/AdminConfirmDeleteDialog';
import AdminBanUserDialog from '../../components/admin/AdminBanUserDialog';
import { formatAccountStatusLabel } from '../../constants/adminStatusDisplay';
import { USER_ROLES, USER_STATUSES } from '../../constants/adminDefaultUsers';
import { useAdminUsersContext } from '../../contexts/AdminUsersContext';
import { useAuth } from '../../hooks/useAuth';
import { resetPasswordByAdmin } from '../../api/adminUserApi';
import { formatDateTime } from '../../utils/dateFormatter';
import { adminOrganizationApi } from '../../api/adminOrganizationApi';

const AdminUsersListPage = () => {
  const navigate = useNavigate();
  const slugMatch = useMatch('/:slug/admin/*') ?? useMatch('/:slug/admin');
  const adminBase = useMemo(
    () => (slugMatch?.params?.slug ? `/${slugMatch.params.slug}/admin` : '/admin'),
    [slugMatch?.params?.slug],
  );
  const { user } = useAuth();
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
  const [organizationOptions, setOrganizationOptions] = useState([]);

  useEffect(() => {
    let active = true;
    const loadOrganizations = async () => {
      try {
        const rows = await adminOrganizationApi.getOrganizations({ page: 0, size: 200 });
        if (!active) return;
        setOrganizationOptions(Array.isArray(rows) ? rows : []);
      } catch {
        if (!active) return;
        setOrganizationOptions([]);
      }
    };
    void loadOrganizations();
    return () => {
      active = false;
    };
  }, []);

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
            {organizationOptions.map((org) => (
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
                <TableRow key={u.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`${adminBase}/users/${u.id}`)}>
                  <TableCell>{u.id}</TableCell>
                  <TableCell>{u.email || '-'}</TableCell>
                  <TableCell>{u.userName || '-'}</TableCell>
                  <TableCell>
                    {[u.fullName, u.userName, u.email].map((x) => (typeof x === 'string' ? x.trim() : x)).find(Boolean) || '-'}
                  </TableCell>
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
                        <IconButton size="small" color="primary" onClick={() => navigate(`${adminBase}/users/${u.id}`)}>
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
                            onClick={async () => {
                              try {
                                await unbanUser(u.id);
                              } catch {
                                /* snackbar in hook */
                              }
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
                      <Tooltip title="Reset password">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={async () => {
                            const nextPassword = window.prompt(`Temporary password for user #${u.id}:`, '');
                            if (!nextPassword) return;
                            if (nextPassword.length < 8) {
                              enqueueSnackbar('Password must be at least 8 characters.', { variant: 'warning' });
                              return;
                            }
                            try {
                              await resetPasswordByAdmin(u.id, {
                                newPassword: nextPassword,
                                adminUserId: Number(user?.id),
                                reason: 'Reset from users list',
                              });
                              enqueueSnackbar('Password reset successfully.', { variant: 'success' });
                            } catch (error) {
                              enqueueSnackbar(error?.response?.data?.message || 'Failed to reset password.', {
                                variant: 'error',
                              });
                            }
                          }}
                        >
                          <PasswordOutlinedIcon fontSize="small" />
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
                  onClick={async () => {
                    try {
                      await updateUserStatus(userStatusMenu.user.id, st);
                    } catch {
                      /* snackbar in hook */
                    }
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
        organizationOptions={organizationOptions}
        onClose={() => setUserFormOpen(false)}
        onSubmit={async (payload) => {
          if (userFormMode === 'create') {
            await createUser(payload);
          } else if (editingUser) {
            await updateUser(editingUser.id, payload);
          }
        }}
      />

      <AdminBanUserDialog
        open={Boolean(banTarget)}
        user={banTarget}
        onClose={() => setBanTarget(null)}
        onConfirm={async (banPayload) => {
          if (!banTarget) {
            return;
          }
          try {
            await banUser(banTarget.id, banPayload);
          } catch {
            /* snackbar in hook */
          }
          setBanTarget(null);
        }}
      />

      <AdminConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Delete user"
        description={
          deleteTarget
            ? `Soft-delete ${deleteTarget.fullName || deleteTarget.email} (#${deleteTarget.id})? Status becomes DELETED on the server.`
            : ''
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) {
            return;
          }
          try {
            await deleteUser(deleteTarget.id);
          } catch {
            /* snackbar in hook */
          }
          setDeleteTarget(null);
        }}
      />
    </>
  );
};

export default AdminUsersListPage;
