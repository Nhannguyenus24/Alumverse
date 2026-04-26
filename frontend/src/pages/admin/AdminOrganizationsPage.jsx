import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';
import { Typography } from '@mui/material';
import AdminSectionPanel from '../../components/admin/AdminSectionPanel';
import AdminOrganizationMasterDetail from '../../components/admin/AdminOrganizationMasterDetail';
import { adminOrganizationApi } from '../../api/adminOrganizationApi';

const withDefaults = (organization) => ({
  ...organization,
  status: String(organization?.status || 'ACTIVE').toUpperCase(),
});

const AdminOrganizationsPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(null);

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

  const selectedOrganization = useMemo(
    () => organizations.find((org) => org.id === selectedOrganizationId) || null,
    [organizations, selectedOrganizationId],
  );

  const handleEditOrganization = useCallback(async (organization) => {
    const nextName = window.prompt('Enter a new organization name', organization.name || '');
    const normalizedName = (nextName || '').trim();
    if (!normalizedName || normalizedName === organization.name) {
      return;
    }

    try {
      const updated = await adminOrganizationApi.updateOrganization(organization.id, {
        name: normalizedName,
      });
      setOrganizations((prev) =>
        prev.map((item) => (item.id === organization.id ? withDefaults(updated || { ...item, name: normalizedName }) : item)),
      );
      enqueueSnackbar('Organization updated successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(
        error?.response?.data?.message || 'Failed to update organization',
        { variant: 'error' },
      );
    }
  }, [enqueueSnackbar]);

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
        onEditOrganization={handleEditOrganization}
        onRefresh={loadOrganizations}
      />
    </AdminSectionPanel>
  );
};

export default AdminOrganizationsPage;
