import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';
import { Typography } from '@mui/material';
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

  if (loading) {
    return (
      <AdminSectionPanel title="Organizations" subtitle="Loading...">
        <Typography variant="body2" color="text.secondary">
          Loading organization data...
        </Typography>
      </AdminSectionPanel>
    );
  }

  return (
    <AdminSectionPanel
      title="Organizations"
      subtitle="Master-detail view for organizations connected to admin metrics data."
    >
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

      <AdminOrganizationEditDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        organization={editTarget}
        onConfirm={handleUpdateOrganization}
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

export default AdminOrganizationsPage;
