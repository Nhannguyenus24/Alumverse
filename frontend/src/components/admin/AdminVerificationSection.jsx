import { Box, Stack } from '@mui/material';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import Chart from '../Chart';
import AdminSectionPanel from './AdminSectionPanel';
import AdminDashboardMetricTile from './AdminDashboardMetricTile';
import useAdminVerificationStats from '../../hooks/admin/useAdminVerificationStats';

const metricRowSx = {
  '& > *': { flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 0' } },
};

const AdminVerificationSection = () => {
  const { stats } = useAdminVerificationStats();

  const alumniStatusData = [
    { name: 'Chờ duyệt', count: Number(stats.pendingAlumniRequests) },
    { name: 'Đã duyệt', count: Number(stats.approvedAlumniRequests) },
    { name: 'Từ chối', count: Number(stats.rejectedAlumniRequests) },
    { name: 'Cần chỉnh sửa', count: Number(stats.needsRevisionRequests) },
  ];

  const peerStatusData = [
    { name: 'Chờ duyệt', count: Number(stats.pendingPeerVerifications) },
    { name: 'Đã duyệt', count: Number(stats.approvedPeerVerifications) },
  ];

  return (
    <AdminSectionPanel
      title="Xác minh tài khoản"
      subtitle="Trạng thái yêu cầu xác minh alumni và xác minh đồng nghiệp."
    >
      <Stack spacing={3}>
        <Stack spacing={2}>
          <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
            <AdminDashboardMetricTile
              label="Tổng yêu cầu xác minh"
              value={Number(stats.totalAlumniVerificationRequests).toLocaleString()}
              icon={<VerifiedUserOutlinedIcon />}
            />
            <AdminDashboardMetricTile
              label="Lượt xác minh đồng nghiệp"
              value={Number(stats.totalPeerVerifications).toLocaleString()}
              icon={<GroupsOutlinedIcon />}
            />
          </Stack>
          <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
            <AdminDashboardMetricTile
              label="Chờ duyệt"
              value={Number(stats.pendingAlumniRequests).toLocaleString()}
              icon={<PendingActionsOutlinedIcon />}
            />
            <AdminDashboardMetricTile
              label="Đã duyệt"
              value={Number(stats.approvedAlumniRequests).toLocaleString()}
              icon={<TaskAltOutlinedIcon />}
            />
            <AdminDashboardMetricTile
              label="Bị từ chối"
              value={Number(stats.rejectedAlumniRequests).toLocaleString()}
              icon={<BlockOutlinedIcon />}
            />
          </Stack>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="stretch">
          <Box flex={1} minWidth={0}>
            <Chart
              type="bar"
              title="Yêu cầu xác minh alumni theo trạng thái"
              data={alumniStatusData}
              dataKey="count"
              xAxisKey="name"
              height={260}
            />
          </Box>
          <Box flex={1} minWidth={0}>
            <Chart
              type="bar"
              title="Xác minh đồng nghiệp theo trạng thái"
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
