import { useTranslation } from 'react-i18next';

import NetworkSectionLayout from '../../components/network/NetworkSectionLayout';
import NetworkConnectionsPanel from '../../components/network/NetworkConnectionsPanel';

const NetworkConnectionsPage = () => {
  const { t } = useTranslation('network');

  return (
    <NetworkSectionLayout title={t('connections_layout_title')}>
      <NetworkConnectionsPanel variant="page" enableBlock />
    </NetworkSectionLayout>
  );
};

export default NetworkConnectionsPage;
