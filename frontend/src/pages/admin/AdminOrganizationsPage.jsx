import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';
import { Box, Button, Grid, Paper, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AdminSectionPanel from '../../components/admin/AdminSectionPanel';
import AdminOrganizationMasterDetail from '../../components/admin/AdminOrganizationMasterDetail';
import AdminOrganizationEditDialog from '../../components/admin/AdminOrganizationEditDialog';
import AdminOrganizationIntroductionDialog from '../../components/admin/AdminOrganizationIntroductionDialog';
import { adminOrganizationApi } from '../../api/adminOrganizationApi';
import { organizationApi } from '../../api/organizationApi';

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
  
  // Dialog states
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
      enqueueSnackbar(
        error?.response?.data?.message || 'Failed to load organizations',
        { variant: 'error' },
      );
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  useEffect(() => {
    if (organizations.length === 0) {
      return;
    }
    setSelectedOrganizationId((prev) => {
      if (prev == null) {
        return organizations[0].id;
      }
      if (organizations.some((o) => o.id === prev)) {
        return prev;
      }
      return organizations[0].id;
    });
  }, [organizations]);

  // Load introduction when selection changes
  useEffect(() => {
    if (selectedOrganizationId) {
      const fetchIntro = async () => {
        try {
          const data = await organizationApi.getIntroduction(selectedOrganizationId);
          setIntroduction(data || null);
        } catch (error) {
          console.error('Failed to load introduction', error);
          setIntroduction(null);
        }
      };
      fetchIntro();
    } else {
      setIntroduction(null);
    }
  }, [selectedOrganizationId]);

  const selectedOrganization = useMemo(
    () => organizations.find((org) => org.id === selectedOrganizationId) || null,
    [organizations, selectedOrganizationId],
  );

  const handleUpdateOrganization = useCallback(async (payload) => {
    if (!editTarget) return;
    try {
      const updated = await adminOrganizationApi.updateOrganization(editTarget.id, payload);
      setOrganizations((prev) =>
        prev.map((item) => (item.id === editTarget.id ? withDefaults(updated || { ...item, ...payload }) : item)),
      );
      setEditDialogOpen(false);
      enqueueSnackbar('Đã cập nhật thông tin tổ chức', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(
        error?.response?.data?.message || 'Không thể cập nhật tổ chức',
        { variant: 'error' },
      );
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
      enqueueSnackbar(
        error?.response?.data?.message || 'Không thể cập nhật giới thiệu',
        { variant: 'error' },
      );
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
      enqueueSnackbar(
        error?.response?.data?.message || 'Không thể tạo tổ chức mới',
        { variant: 'error' },
      );
    }
  }, [enqueueSnackbar]);

  if (loading && organizations.length === 0) {
    return (
      <AdminSectionPanel title="Organizations" subtitle="Đang tải danh sách tổ chức...">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Grid container spacing={2}>
            {[1, 2, 3].map(i => (
              <Grid item xs={12} md={4} key={i}>
                <Paper sx={{ p: 2, height: 100, borderRadius: 2, bgcolor: 'action.hover' }} />
              </Grid>
            ))}
          </Grid>
          <Paper sx={{ height: 400, borderRadius: 2, bgcolor: 'action.hover' }} />
        </Box>
      </AdminSectionPanel>
    );
  }

  return (
    <AdminSectionPanel
      title="Organizations"
      subtitle="Quản lý và cấu hình các tổ chức/trường học trong hệ thống."
      action={
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditTarget(null);
            setEditDialogOpen(true);
          }}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
        >
          Thêm tổ chức
        </Button>
      }
    >
      <Stack spacing={3}>
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={4}>
            <StatCard
              label="Tổng tổ chức"
              value={stats.total}
              icon={<BusinessIcon sx={{ color: 'primary.main' }} />}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard
              label="Đang hoạt động"
              value={stats.active}
              icon={<CheckCircleIcon sx={{ color: 'success.main' }} />}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard
              label="Tạm ngưng"
              value={stats.inactive}
              icon={<ErrorIcon sx={{ color: 'error.main' }} />}
            />
          </Grid>
        </Grid>

        <AdminOrganizationMasterDetail
          organizations={organizations}
          selectedOrganizationId={selectedOrganizationId}
          onSelectOrganizationId={setSelectedOrganizationId}
          selectedOrganization={selectedOrganization}
          selectedIntroduction={introduction}
          onEditOrganization={(org) => {
            setEditTarget(org);
            setEditDialogOpen(true);
          }}
          onEditIntroduction={() => setIntroDialogOpen(true)}
          onRefresh={loadOrganizations}
        />
      </Stack>

      <AdminOrganizationEditDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        organization={editTarget}
        onConfirm={editTarget ? handleUpdateOrganization : handleCreateOrganization}
      />

      <AdminOrganizationIntroductionDialog
        open={introDialogOpen}
        onClose={() => setIntroDialogOpen(false)}
        introduction={introduction}
        onConfirm={handleUpdateIntroduction}
      />
    </AdminSectionPanel>
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
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: (theme) => theme.customShadows?.z8 || '0 8px 16px 0 rgba(0,0,0,0.08)',
      },
    }}
  >
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        bgcolor: 'action.hover',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
