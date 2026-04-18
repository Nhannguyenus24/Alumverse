import { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import { Typography } from '@mui/material';
import AdminSectionPanel from '../../components/admin/AdminSectionPanel';
import AdminOrganizationMasterDetail from '../../components/admin/AdminOrganizationMasterDetail';
import { useAdminSystemContext } from '../../contexts/AdminSystemContext';

const AdminOrganizationsPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { loading, organizations } = useAdminSystemContext();
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(null);

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
        onDemoAction={(action, org) => {
          const labels = {
            edit: `Demo: edit "${org.name}"`,
            toggle: `Demo: toggle status for "${org.name}"`,
            details: `Demo: full details #${org.id}`,
          };
          enqueueSnackbar(labels[action] || 'Demo action', { variant: 'info' });
        }}
      />
    </AdminSectionPanel>
  );
};

export default AdminOrganizationsPage;
