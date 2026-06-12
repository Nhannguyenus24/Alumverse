import NetworkSectionLayout from '../../components/network/NetworkSectionLayout';
import NetworkConnectionsPanel from '../../components/network/NetworkConnectionsPanel';

const NetworkConnectionsPage = () => (
  <NetworkSectionLayout title="Kết nối hiện tại">
    <NetworkConnectionsPanel variant="page" enableBlock />
  </NetworkSectionLayout>
);

export default NetworkConnectionsPage;
