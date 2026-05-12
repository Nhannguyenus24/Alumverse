import { useEffect, useMemo, useState } from 'react';
import { useMatch, useNavigate, useOutletContext } from 'react-router';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
  Stack,
  alpha,
  useTheme,
  Avatar,
  Grid,
} from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { useDebounce } from '../../hooks/useDebounce';
import { exportToCSV } from '../../utils/exportUtils';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import PasswordOutlinedIcon from '@mui/icons-material/PasswordOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import GppBadOutlinedIcon from '@mui/icons-material/GppBadOutlined';

import AdminStatusChip from '../../components/admin/AdminStatusChip';
import AdminUserFormDialog from '../../components/admin/AdminUserFormDialog';
import AdminConfirmDeleteDialog from '../../components/admin/AdminConfirmDeleteDialog';
import AdminBanUserDialog from '../../components/admin/AdminBanUserDialog';
import AdminDataTable from '../../components/admin/AdminDataTable';
import AdminDashboardMetricTile from '../../components/admin/AdminDashboardMetricTile';
import { formatAccountStatusLabel } from '../../constants/adminStatusDisplay';
import { USER_ROLES, USER_STATUSES } from '../../constants/adminDefaultUsers';
import { useAdminUsersContext } from '../../contexts/AdminUsersContext';
import { useAuth } from '../../hooks/useAuth';
import { resetPasswordByAdmin } from '../../api/adminUserApi';
import { formatDateTime } from '../../utils/dateFormatter';
import { adminOrganizationApi } from '../../api/adminOrganizationApi';

const AdminUsersListPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const slugMatchWildcard = useMatch('/:slug/admin/*');
  const slugMatchExact = useMatch('/:slug/admin');
  const slugMatch = slugMatchWildcard ?? slugMatchExact;
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
    sortedUsers,
  } = useAdminUsersContext();

  const { setBreadcrumbs } = useOutletContext();
  const [searchTerm, setSearchTerm] = useState(search);
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    setBreadcrumbs?.([{ label: 'Người dùng', active: true }]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    setSearch(debouncedSearch);
  }, [debouncedSearch, setSearch]);

  const handleExport = () => {
    const exportData = sortedUsers.map(u => ({
      ID: u.id,
      'Họ tên': u.fullName || u.userName,
      Email: u.email,
      'Vai trò': u.role,
      'Trạng thái': formatAccountStatusLabel(u.status),
      'Tổ chức': u.organizationName || '-',
      'Ngày tham gia': formatDateTime(u.createdAt)
    }));
    exportToCSV(exportData, `users_export_${new Date().getTime()}.csv`);
  };

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
    return () => { active = false; };
  }, []);

  const columns = [
    {
      id: 'user',
      label: 'Người dùng',
      render: (_, u) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar 
            src={u.avatarUrl} 
            sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontSize: 13, fontWeight: 700 }}
          >
            {(u.fullName || u.userName || '?')[0].toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {u.fullName || u.userName}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {u.email}
            </Typography>
          </Box>
        </Stack>
      )
    },
    { id: 'role', label: 'Vai trò' },
    {
      id: 'status',
      label: 'Trạng thái',
      render: (status, u) => (
        <AdminStatusChip
          status={status}
          category="account"
          label={formatAccountStatusLabel(status)}
          onClick={(e) => {
            e.stopPropagation();
            setUserStatusMenu({ anchorEl: e.currentTarget, user: u });
          }}
          sx={{ cursor: 'pointer' }}
        />
      )
    },
    { id: 'organizationName', label: 'Tổ chức' },
    { id: 'createdAt', label: 'Ngày tham gia', render: (val) => formatDateTime(val) },
    {
      id: 'actions',
      label: '',
      align: 'right',
      render: (_, u) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end" onClick={(e) => e.stopPropagation()}>
          <Tooltip title="Xem chi tiết">
            <IconButton size="small" onClick={() => navigate(`/admin/users/${u.id}`)}>
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <IconButton
              size="small"
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
            <Tooltip title="Bỏ chặn">
              <IconButton size="small" color="success" onClick={() => unbanUser(u.id)}>
                <LockOpenOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Chặn">
              <IconButton size="small" color="warning" onClick={() => setBanTarget(u)}>
                <BlockOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Xóa">
            <IconButton size="small" color="error" onClick={() => setDeleteTarget(u)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Đặt lại mật khẩu">
            <IconButton
              size="small"
              onClick={() => {
                const nextPass = window.prompt(`Mật khẩu mới cho người dùng #${u.id}:`, '');
                if (!nextPass || nextPass.length < 8) {
                  if (nextPass) enqueueSnackbar('Mật khẩu phải từ 8 ký tự.', { variant: 'warning' });
                  return;
                }
                resetPasswordByAdmin(u.id, {
                  newPassword: nextPass,
                  adminUserId: Number(currentUser?.id),
                  reason: 'Admin reset from list',
                }).then(() => enqueueSnackbar('Đã đặt lại mật khẩu.', { variant: 'success' }))
                  .catch(err => enqueueSnackbar(err?.response?.data?.message || 'Lỗi đặt lại mật khẩu.', { variant: 'error' }));
              }}
            >
              <PasswordOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ];

  const Filters = (
    <Stack direction="row" spacing={1}>
      <TextField
        select
        size="small"
        label="Vai trò"
        value={roleFilter}
        onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}
        sx={{ minWidth: 120 }}
      >
        <MenuItem value="ALL">Tất cả</MenuItem>
        {USER_ROLES.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
      </TextField>
      <TextField
        select
        size="small"
        label="Trạng thái"
        value={statusFilter}
        onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
        sx={{ minWidth: 140 }}
      >
        <MenuItem value="ALL">Tất cả</MenuItem>
        {USER_STATUSES.map((s) => <MenuItem key={s} value={s}>{formatAccountStatusLabel(s)}</MenuItem>)}
      </TextField>
    </Stack>
  );

  const stats = {
    total: filteredCount,
    active: users.filter(u => u.status === 'ACTIVE').length,
    banned: users.filter(u => u.status === 'BANNED').length,
    newToday: users.filter(u => new Date(u.createdAt) > new Date(Date.now() - 24*60*60*1000)).length,
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -1 }}>
            Quản lý người dùng
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
            Quản lý tài khoản, phân quyền và trạng thái hoạt động của thành viên.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadOutlinedIcon />}
            onClick={handleExport}
            sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
          >
            Xuất Excel
          </Button>
          <Button
            variant="contained"
            startIcon={<AddOutlinedIcon />}
            onClick={() => { setUserFormMode('create'); setEditingUser(null); setUserFormOpen(true); }}
            sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
          >
            Thêm người dùng
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <AdminDashboardMetricTile
            label="Tổng người dùng"
            value={stats.total}
            icon={<PeopleAltOutlinedIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AdminDashboardMetricTile
            label="Thành viên mới (24h)"
            value={stats.newToday}
            icon={<PersonAddOutlinedIcon />}
            valueColor="info.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AdminDashboardMetricTile
            label="Tài khoản hoạt động"
            value={stats.active}
            icon={<VerifiedUserOutlinedIcon />}
            valueColor="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AdminDashboardMetricTile
            label="Tài khoản bị chặn"
            value={stats.banned}
            icon={<GppBadOutlinedIcon />}
            valueColor="error.main"
          />
        </Grid>
      </Grid>

      <AdminDataTable
        columns={columns}
        rows={users}
        totalCount={filteredCount}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(_, next) => setPage(next)}
        onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
        onSearchChange={(val) => { setSearchTerm(val); setPage(0); }}
        searchValue={searchTerm}
        searchPlaceholder="Tìm theo tên, email, username..."
        filters={Filters}
        onRowClick={(u) => navigate(`/admin/users/${u.id}`)}
      />

      {/* Status Menu */}
      <Menu
        anchorEl={userStatusMenu?.anchorEl}
        open={Boolean(userStatusMenu)}
        onClose={() => setUserStatusMenu(null)}
        PaperProps={{ sx: { borderRadius: 2, mt: 1, minWidth: 160, boxShadow: theme.shadows[10] } }}
      >
        {USER_STATUSES.map((st) => (
          <MenuItem
            key={st}
            selected={userStatusMenu?.user.status === st}
            onClick={async () => {
              try { await updateUserStatus(userStatusMenu.user.id, st); } catch {}
              setUserStatusMenu(null);
            }}
            sx={{ fontSize: 14, fontWeight: 500 }}
          >
            {formatAccountStatusLabel(st)}
          </MenuItem>
        ))}
      </Menu>

      {/* Dialogs */}
      <AdminUserFormDialog
        open={userFormOpen}
        mode={userFormMode}
        user={editingUser}
        organizationOptions={organizationOptions}
        onClose={() => setUserFormOpen(false)}
        onSubmit={async (payload) => {
          if (userFormMode === 'create') await createUser(payload);
          else if (editingUser) await updateUser(editingUser.id, payload);
        }}
      />

      <AdminBanUserDialog
        open={Boolean(banTarget)}
        user={banTarget}
        onClose={() => setBanTarget(null)}
        onConfirm={async (p) => {
          if (banTarget) await banUser(banTarget.id, p);
          setBanTarget(null);
        }}
      />

      <AdminConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Xóa người dùng"
        description={deleteTarget ? `Bạn có chắc chắn muốn xóa tạm thời người dùng ${deleteTarget.fullName || deleteTarget.email} (#${deleteTarget.id})?` : ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) await deleteUser(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </Box>
  );
};

export default AdminUsersListPage;
