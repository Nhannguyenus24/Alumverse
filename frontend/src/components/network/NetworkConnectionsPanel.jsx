import { Divider, Stack, Typography } from '@mui/material';

import NetworkConnectionsSection from './NetworkConnectionsSection';
import NetworkBlockedMembersSection from './NetworkBlockedMembersSection';

const NetworkConnectionsPanel = ({ variant = 'page', enableBlock = true }) => {
  const showBlockedSection = variant === 'embedded';

  return (
    <Stack spacing={4}>
      {variant === 'page' ? (
        <Stack spacing={1}>
          <Typography
            variant="h1"
            fontWeight={800}
            color="primary.main"
            sx={{ fontSize: { xs: '1.8rem', md: '2.3rem' } }}
          >
            KẾT NỐI HIỆN TẠI
          </Typography>
          <Typography color="text.secondary">
            Xem và quản lý các kết nối hiện tại của bạn.
          </Typography>
        </Stack>
      ) : null}

      <NetworkConnectionsSection enableBlock={enableBlock} />

      {showBlockedSection ? (
        <>
          <Divider />
          <NetworkBlockedMembersSection />
        </>
      ) : null}
    </Stack>
  );
};

export default NetworkConnectionsPanel;
