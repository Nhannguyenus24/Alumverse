import { useTranslation } from 'react-i18next';
import { Stack, Typography } from '@mui/material';

import NetworkSectionLayout from '../../components/network/NetworkSectionLayout';
import NetworkBlockedMembersSection from '../../components/network/NetworkBlockedMembersSection';

const NetworkRestrictedConnectionsPage = () => {
  const { t } = useTranslation('network');

  return (
    <NetworkSectionLayout title={t('restricted_layout_title')}>
      <Stack spacing={2}>
        <Typography
          variant="h1"
          fontWeight={800}
          color="primary.main"
          sx={{ fontSize: { xs: '1.8rem', md: '2.3rem' } }}
        >
          {t('restricted_heading')}
        </Typography>

        <Typography color="text.secondary">
          {t('restricted_subheading')}
        </Typography>

        <NetworkBlockedMembersSection />
      </Stack>
    </NetworkSectionLayout>
  );
};

export default NetworkRestrictedConnectionsPage;
