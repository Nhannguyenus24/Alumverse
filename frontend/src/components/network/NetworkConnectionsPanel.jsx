import { Divider, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import NetworkConnectionsSection from './NetworkConnectionsSection';
import NetworkBlockedMembersSection from './NetworkBlockedMembersSection';

const NetworkConnectionsPanel = ({ variant = 'page', enableBlock = true }) => {
  const { t } = useTranslation('network');
  const showBlockedSection = variant === 'embedded';

  return (
    <Stack spacing={4}>
      {variant === 'page' ? (
        <Stack spacing={2}>
          <Typography
            variant="h1"
            fontWeight={800}
            color="primary.main"
            sx={{ fontSize: { xs: '1.8rem', md: '2.3rem' } }}
          >
            {t('connections_heading')}
          </Typography>
          <Typography color="text.secondary">
            {t('connections_subheading')}
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
