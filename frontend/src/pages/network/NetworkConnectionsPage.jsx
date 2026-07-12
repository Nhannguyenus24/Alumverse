import { useTranslation } from 'react-i18next';


const NetworkConnectionsPage = () => {
  const { t } = useTranslation('network');

  return (
    <NetworkSectionLayout title={t('connections_layout_title')}>
      <NetworkConnectionsPanel variant="page" enableBlock />
    </NetworkSectionLayout>
  );
};

export default NetworkConnectionsPage;
