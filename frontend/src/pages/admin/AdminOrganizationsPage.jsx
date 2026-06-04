import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';
import { Box, Button, Grid, Paper, Stack, Typography, Skeleton } from '@mui/material';
import { useOutletContext } from 'react-router';
import AddIcon from '@mui/icons-material/Add';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AdminSectionPanel from '../../components/admin/AdminSectionPanel';
import AdminOrganizationMasterDetail from '../../components/admin/AdminOrganizationMasterDetail';
import AdminOrganizationEditDialog from '../../components/admin/AdminOrganizationEditDialog';
import AdminOrganizationIntroductionDialog from '../../components/admin/AdminOrganizationIntroductionDialog';
import { adminOrganizationApi, organizationApi } from '../../utils/api';
import AdminDashboardMetricTile from '../../components/admin/AdminDashboardMetricTile';
const withDefaults = (organization) => ({
  ...organization,
  status: String(organization?.status || 'ACTIVE').toUpperCase(),
});

const AdminOrganizationsPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(null);
   const [introduction, setIntroduction] = useState(null);
  const { setBreadcrumbs } = useOutletContext();
  
  useEffect(() => {
    setBreadcrumbs?.([{ label: 'Tổ chức', active: true }]);
  }, [setBreadcrumbs]);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [introDialogOpen, setIntroDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const loadOrganizations = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await adminOrganizationApi.getOrganizations({ page: 0, size: 100 });
      setOrganizations(Array.isArray(rows) ? rows.map(withDefaults) : []);
    } catch (error) {
      setOrganizations([]);
      enqueueSnackbar(error?.response?.data?.message || 'Không thể tải danh sách tổ chức', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => { loadOrganizations(); }, [loadOrganizations]);

  useEffect(() => {
    if (organizations.length === 0) return;
    setSelectedOrganizationId((prev) => {
      if (prev == null || !organizations.some((o) => o.id === prev)) return organizations[0].id;
      return prev;
    });
  }, [organizations]);

  useEffect(() => {
    if (selectedOrganizationId) {
      organizationApi.getIntroduction(selectedOrganizationId)
        .then(data => setIntroduction(data || null))
        .catch(() => setIntroduction(null));
    } else setIntroduction(null);
  }, [selectedOrganizationId]);

  const selectedOrganization = useMemo(
    () => organizations.find((org) => org.id === selectedOrganizationId) || null,
    [organizations, selectedOrganizationId],
  );

  const handleUpdateOrganization = useCallback(async (orgId, payload) => {
    const targetId = orgId || editTarget?.id;
    if (!targetId) return;

    const parseIfNeeded = (val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string' && val.trim().startsWith('[')) {
        try { return JSON.parse(val); } catch { return []; }
      }
      return Array.isArray(val) ? val : [];
    };

    const cleanPayload = {
      name: payload.name,
      slug: payload.slug,
      logoUrl: payload.logoUrl,
      status: payload.status,
      featuresConfig: payload.featuresConfig,
      programs: parseIfNeeded(payload.programs),
      majors: parseIfNeeded(payload.majors),
    };

    try {
      const updated = await adminOrganizationApi.updateOrganization(targetId, cleanPayload);
      setOrganizations((prev) => prev.map((item) => (item.id === targetId ? withDefaults(updated || { ...item, ...cleanPayload }) : item)));
      setEditDialogOpen(false);
      enqueueSnackbar('Đã cập nhật thông tin tổ chức', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || 'Không thể cập nhật tổ chức', { variant: 'error' });
    }
  }, [editTarget, enqueueSnackbar]);

  const handleUpdateIntroduction = useCallback(async (payload) => {
    if (!selectedOrganizationId) return;
    try {
      const updated = await adminOrganizationApi.upsertIntroduction(selectedOrganizationId, payload);
      setIntroduction(updated || { ...introduction, ...payload });
      setIntroDialogOpen(false);
      enqueueSnackbar('Đã cập nhật giới thiệu tổ chức', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || 'Không thể cập nhật giới thiệu', { variant: 'error' });
    }
  }, [selectedOrganizationId, introduction, enqueueSnackbar]);

  const stats = useMemo(() => {
    const total = organizations.length;
    const active = organizations.filter(o => o.status === 'ACTIVE').length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [organizations]);

  const handleCreateOrganization = useCallback(async (payload) => {
    try {
      const created = await adminOrganizationApi.createOrganization(payload);
      setOrganizations(prev => [withDefaults(created), ...prev]);
      setEditDialogOpen(false);
      enqueueSnackbar('Đã tạo tổ chức mới thành công', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || 'Không thể tạo tổ chức mới', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  if (loading && organizations.length === 0) {
    return (
      <Stack spacing={3}>
        <Skeleton variant="rounded" height={100} />
        <Grid container spacing={3}>
          {[1, 2, 3].map(i => (
            <Grid item xs={12} md={4} key={i}><Skeleton variant="rounded" height={120} /></Grid>
          ))}
        </Grid>
        <Skeleton variant="rounded" height={600} />
      </Stack>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main' }}>
            Quản lý tổ chức
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
            Cấu hình thông tin, giới thiệu và nhân sự cho các đơn vị trường học/tổ chức.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { setEditTarget(null); setEditDialogOpen(true); }}
          sx={{ borderRadius: 1, fontWeight: 700, textTransform: 'none' }}
        >
          Thêm tổ chức
        </Button>
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
          label="Tổng tổ chức"
          value={stats.total}
          icon={<BusinessIcon />}
        />
        <AdminDashboardMetricTile
          label="Đang hoạt động"
          value={stats.active}
          icon={<CheckCircleIcon />}
          valueColor="success.main"
        />
        <AdminDashboardMetricTile
          label="Tạm ngưng"
          value={stats.inactive}
          icon={<ErrorIcon />}
          valueColor="error.main"
        />
      </Box>

      <AdminOrganizationMasterDetail
        organizations={organizations}
        selectedOrganizationId={selectedOrganizationId}
        onSelectOrganizationId={setSelectedOrganizationId}
        selectedOrganization={selectedOrganization}
        selectedIntroduction={introduction}
        onEditOrganization={(org) => { setEditTarget(org); setEditDialogOpen(true); }}
        onEditIntroduction={() => setIntroDialogOpen(true)}
        onUpdateOrganization={(org) => handleUpdateOrganization(org.id, org)}
        onRefresh={loadOrganizations}
      />

      <AdminOrganizationEditDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        organization={editTarget}
        onConfirm={editTarget ? (payload) => handleUpdateOrganization(editTarget.id, payload) : handleCreateOrganization}
      />

      <AdminOrganizationIntroductionDialog
        open={introDialogOpen}
        onClose={() => setIntroDialogOpen(false)}
        introduction={introduction}
        onConfirm={handleUpdateIntroduction}
      />
    </Box>
  );
};

const StatCard = ({ label, value, icon }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      border: 1,
      borderColor: 'divider',
      borderRadius: 3,
      display: 'flex',
      alignItems: 'center',
      gap: 2,
    }}
  >
    <Box
      sx={{
        p: 1.5,
        borderRadius: 1,
        bgcolor: 'action.hover',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgColor: 'primary.main'
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.25 }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 800 }}>
        {value}
      </Typography>
    </Box>
  </Paper>
);

export default AdminOrganizationsPage;
