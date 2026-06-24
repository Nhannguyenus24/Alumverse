import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import { useTranslation } from 'react-i18next';
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
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
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
import AdminBulkImportDialog from '../../components/admin/AdminBulkImportDialog';
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
  const { t } = useTranslation(['admin', 'common']);
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
    bulkImportUsers,
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
    setBreadcrumbs?.([{ label: t('admin:breadcrumb_users'), active: true }]);
  }, [setBreadcrumbs, t]);

  useEffect(() => {
    setSearch(debouncedSearch);
  }, [debouncedSearch, setSearch]);

  const handleExport = () => {
    const exportData = sortedUsers.map(u => ({
      ID: u.id,
      [t('admin:export_col_fullname')]: u.fullName || u.studentId,
      Email: u.email,
      [t('admin:export_col_role')]: u.role,
      [t('admin:export_col_status')]: formatAccountStatusLabel(u.status),
      [t('admin:export_col_organization')]: u.organizationName || '-',
      [t('admin:export_col_joined_at')]: formatDateTime(u.createdAt)
    }));
    exportToCSV(exportData, `users_export_${new Date().getTime()}.csv`);
  };

  const [userFormOpen, setUserFormOpen] = useState(false);
  const [userFormMode, setUserFormMode] = useState('create');
  const [editingUser, setEditingUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [userStatusMenu, setUserStatusMenu] = useState(null);
  const [banTarget, setBanTarget] = useState(null);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
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

  const columns = useMemo(() => [
    {
      id: 'user',
      label: t('admin:col_user'),
      render: (_, u) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            src={u.avatarUrl}
            sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontSize: 13, fontWeight: 700 }}
          >
            {(u.fullName || u.studentId || '?')[0].toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {u.fullName || u.studentId}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {u.email}
            </Typography>
          </Box>
        </Stack>
      )
    },
    { id: 'role', label: t('admin:col_role') },
    {
      id: 'status',
      label: t('admin:col_status'),
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
    { id: 'organizationName', label: t('admin:col_organization') },
    { id: 'createdAt', label: t('admin:col_joined_at'), render: (val) => formatDateTime(val) },
    {
      id: 'actions',
      label: '',
      align: 'right',
      render: (_, u) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end" onClick={(e) => e.stopPropagation()}>
          <Tooltip title={t('admin:tooltip_view_detail')}>
            <IconButton size="small" onClick={() => navigate(`/admin/users/${u.id}`)}>
              <VisibilityOutlinedIcon fontSize="small" sx={{ color: 'primary.main' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('admin:tooltip_edit')}>
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
            <Tooltip title={t('admin:tooltip_unban')}>
              <IconButton size="small" color="success" onClick={() => unbanUser(u.id)}>
                <LockOpenOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title={t('admin:tooltip_ban')}>
              <IconButton size="small" color="warning" onClick={() => setBanTarget(u)}>
                <BlockOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title={t('admin:tooltip_delete')}>
            <IconButton size="small" color="error" onClick={() => setDeleteTarget(u)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ], [theme, navigate, unbanUser, setBanTarget, setDeleteTarget, setUserStatusMenu, setUserFormMode, setEditingUser, setUserFormOpen, t]);

  const Filters = (
    <Stack direction="row" spacing={1}>
      <TextField
        select
        size="small"
        label={t('admin:filter_role')}
        value={roleFilter}
        onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}
        sx={{ minWidth: 120 }}
      >
        <MenuItem value="ALL">{t('admin:filter_all')}</MenuItem>
        {USER_ROLES.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
      </TextField>
      <TextField
        select
        size="small"
        label={t('admin:filter_status')}
        value={statusFilter}
        onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
        sx={{ minWidth: 140 }}
      >
        <MenuItem value="ALL">{t('admin:filter_all')}</MenuItem>
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
            {t('admin:page_users_title')}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, fontWeight: 500 }}
          >
            {t('admin:page_users_subtitle')}
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
          label={t('admin:metric_total_users')}
          value={stats.total}
          icon={<PeopleAltOutlinedIcon />}
        />
        <AdminDashboardMetricTile
          label={t('admin:metric_joined_today')}
          value={stats.newToday}
          icon={<PersonAddOutlinedIcon />}
          valueColor="info.main"
        />
        <AdminDashboardMetricTile
          label={t('admin:metric_active_accounts')}
          value={stats.active}
          icon={<VerifiedUserOutlinedIcon />}
          valueColor="success.main"
        />
        <AdminDashboardMetricTile
          label={t('admin:metric_banned_accounts')}
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
        searchPlaceholder={t('admin:search_users_placeholder')}
        filters={Filters}
        onExport={handleExport}
        addButton={
          <Stack direction="row" spacing={1} sx={{ ml: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileUploadOutlinedIcon />}
              onClick={() => setBulkImportOpen(true)}
              sx={{ fontWeight: 700, textTransform: 'none' }}
            >
              Nhập Excel
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddOutlinedIcon />}
              onClick={() => { setUserFormMode('create'); setEditingUser(null); setUserFormOpen(true); }}
              sx={{ fontWeight: 700, textTransform: 'none' }}
            >
              {t('admin:add_user')}
            </Button>
          </Stack>
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
      <AdminBulkImportDialog
        open={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        organizationOptions={organizationOptions}
        onBulkImport={bulkImportUsers}
      />

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
        title={t('admin:delete_user_title')}
        description={deleteTarget ? t('admin:delete_user_description', { name: deleteTarget.fullName || deleteTarget.email, id: deleteTarget.id }) : ''}
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
