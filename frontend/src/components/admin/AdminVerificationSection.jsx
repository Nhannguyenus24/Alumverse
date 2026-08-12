import { Box, Stack } from '@mui/material';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import { useTranslation } from 'react-i18next';
import Chart from '../Chart';
import AdminSectionPanel from './AdminSectionPanel';
import AdminDashboardMetricTile from './AdminDashboardMetricTile';
import useAdminVerificationStats from '../../hooks/admin/useAdminVerificationStats';
import { useAdminSystemContext } from '../../stores/AdminStore';

const metricRowSx = {
  '& > *': { flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 0' } },
};

const AdminVerificationSection = ({ from, to }) => {
  const { t } = useTranslation('admin');
  const system = useAdminSystemContext();
  const { stats } = useAdminVerificationStats(system?.stableOrgId, from, to);

  const alumniStatusData = [
    { name: t('admin:verification_pending'), count: Number(stats.pendingAlumniRequests) },
    { name: t('admin:verification_approved'), count: Number(stats.approvedAlumniRequests) },
    { name: t('admin:verification_rejected'), count: Number(stats.rejectedAlumniRequests) },
    { name: t('admin:verification_needs_revision'), count: Number(stats.needsRevisionRequests) },
  ];

  const peerStatusData = [
    { name: t('admin:verification_pending'), count: Number(stats.pendingPeerVerifications) },
    { name: t('admin:verification_approved'), count: Number(stats.approvedPeerVerifications) },
  ];

  return (
    <AdminSectionPanel
      title={t('admin:verification_section_title')}
      subtitle={t('admin:verification_section_subtitle')}
    >
      <Stack spacing={3}>
        <Stack spacing={2}>
          <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
            <AdminDashboardMetricTile
              label={t('admin:verification_total_requests')}
              value={Number(stats.totalAlumniVerificationRequests).toLocaleString()}
              icon={<VerifiedUserOutlinedIcon />}
            />
            <AdminDashboardMetricTile
              label={t('admin:verification_peer_total')}
              value={Number(stats.totalPeerVerifications).toLocaleString()}
              icon={<GroupsOutlinedIcon />}
            />
          </Stack>
          <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
            <AdminDashboardMetricTile
              label={t('admin:verification_pending')}
              value={Number(stats.pendingAlumniRequests).toLocaleString()}
              icon={<PendingActionsOutlinedIcon />}
            />
            <AdminDashboardMetricTile
              label={t('admin:verification_approved')}
              value={Number(stats.approvedAlumniRequests).toLocaleString()}
              icon={<TaskAltOutlinedIcon />}
            />
            <AdminDashboardMetricTile
              label={t('admin:verification_rejected')}
              value={Number(stats.rejectedAlumniRequests).toLocaleString()}
              icon={<BlockOutlinedIcon />}
            />
          </Stack>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="stretch">
          <Box flex={1} minWidth={0}>
            <Chart
              type="bar"
              title={t('admin:chart_alumni_verification_by_status')}
              data={alumniStatusData}
              dataKey="count"
              xAxisKey="name"
              height={260}
            />
          </Box>
          <Box flex={1} minWidth={0}>
            <Chart
              type="bar"
              title={t('admin:chart_peer_verification_by_status')}
              data={peerStatusData}
              dataKey="count"
              xAxisKey="name"
              height={260}
            />
          </Box>
        </Stack>
      </Stack>
    </AdminSectionPanel>
  );
};

export default AdminVerificationSection;
