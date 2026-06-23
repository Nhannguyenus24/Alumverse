import { useTranslation } from 'react-i18next';
import { Box, Container, Stack } from '@mui/material';

import Page from '../Page';
import Sidebar from '../Sidebar';
import { getNetworkSidebarItems } from '../../pages/network/networkSidebarConfig';

const NetworkSectionLayout = ({ title, children }) => {
  const { t } = useTranslation('network');
  const sidebarItems = getNetworkSidebarItems(t);
  return (
  <Page title={title}>
    <Container maxWidth={false} disableGutters sx={{ pb: 6 }}>
      <Container
        maxWidth="xl"
        sx={{
          pt: { xs: 2, sm: 3, md: 4 },
          px: { xs: 2, sm: 3, lg: 6 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 2, md: 3 },
          }}
        >
          <Stack sx={{ width: { xs: '100%', md: 260 }, flexShrink: 0 }}>
            <Sidebar items={sidebarItems} />
          </Stack>

          <Stack
            spacing={4}
            sx={{
              flex: 1,
              minWidth: 0,
              width: '100%',
              px: { xs: 1.5, sm: 2, md: 2.75 },
            }}
          >
            {children}
          </Stack>
        </Box>
      </Container>
    </Container>
  </Page>
  );
};

export default NetworkSectionLayout;
