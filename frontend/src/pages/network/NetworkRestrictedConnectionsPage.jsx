import { Stack, Typography } from '@mui/material';

import NetworkSectionLayout from '../../components/network/NetworkSectionLayout';
import NetworkBlockedMembersSection from '../../components/network/NetworkBlockedMembersSection';

const NetworkRestrictedConnectionsPage = () => (
  <NetworkSectionLayout title="Kết nối bị hạn chế">
    <Stack spacing={2}>
      <Typography
        variant="h1"
        fontWeight={800}
        color="primary.main"
        sx={{ fontSize: { xs: '1.8rem', md: '2.3rem' } }}
      >
        KẾT NỐI BỊ HẠN CHẾ
      </Typography>

      <Typography color="text.secondary">
        Xem và quản lý danh sách người bạn đã chặn.
      </Typography>

      <NetworkBlockedMembersSection />
    </Stack>
  </NetworkSectionLayout>
);

export default NetworkRestrictedConnectionsPage;
