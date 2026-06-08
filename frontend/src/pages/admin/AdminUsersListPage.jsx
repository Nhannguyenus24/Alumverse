import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router';
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
} from '@mui/material';
import { useDebounce } from '../../hooks/useDebounce';
import { exportToCSV } from '../../utils/exportUtils';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
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
import { useAdminUsersContext } from '../../stores/AdminStore';
import { adminOrganizationApi } from '../../utils/api';
import { formatDateTime } from '../../utils/dateFormatter';

const AdminUsersListPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const {
    users,
    filteredCount,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
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
              <VisibilityOutlinedIcon fontSize="small" sx={{ color: 'primary.main' }} />
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

  const [now] = useState(() => Date.now());
  const stats = {
    total: filteredCount,
    active: users.filter(u => u.status === 'ACTIVE').length,
    banned: users.filter(u => u.status === 'BANNED').length,
    newToday: users.filter(u => new Date(u.createdAt) > new Date(now - 24 * 60 * 60 * 1000)).length,
  };

  return (
    <Box>
      <Box
        sx={{
          mb: 4,
          display: "flex",
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: "space-between",
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2
        }}
      >
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main' }}>
            Quản lý người dùng
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, fontWeight: 500 }}
          >
            Tìm kiếm, phân quyền và giám sát trạng thái tài khoản toàn hệ thống.
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 3,
          mb: 4,
          '& > *': {
            flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 0' },
          },
        }}
      >
        <AdminDashboardMetricTile
          label="Tổng người dùng"
          value={stats.total}
          icon={<PeopleAltOutlinedIcon />}
        />
        <AdminDashboardMetricTile
          label="Tham gia hôm nay"
          value={stats.newToday}
          icon={<PersonAddOutlinedIcon />}
          valueColor="info.main"
        />
        <AdminDashboardMetricTile
          label="Tài khoản hoạt động"
          value={stats.active}
          icon={<VerifiedUserOutlinedIcon />}
          valueColor="success.main"
        />
        <AdminDashboardMetricTile
          label="Tài khoản bị chặn"
          value={stats.banned}
          icon={<GppBadOutlinedIcon />}
          valueColor="error.main"
        />
      </Box>

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
        onExport={handleExport}
        addButton={
          <Button
            variant="contained"
            size="small"
            startIcon={<AddOutlinedIcon />}
            onClick={() => { setUserFormMode('create'); setEditingUser(null); setUserFormOpen(true); }}
            sx={{ fontWeight: 700, textTransform: 'none', ml: 1 }}
          >
            Thêm
          </Button>
        }
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
              try { await updateUserStatus(userStatusMenu.user.id, st); } catch (e) { console.error(e); }
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
