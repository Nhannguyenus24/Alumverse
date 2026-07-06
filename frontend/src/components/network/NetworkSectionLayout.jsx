import { useTranslation } from 'react-i18next';

import AlumniContentLayout from '../../layouts/AlumniContentLayout';
import { getNetworkSidebarItems } from '../../constants/networkNav';

const NetworkSectionLayout = ({ title, children }) => {
  const { t } = useTranslation('network');
  const sidebarItems = getNetworkSidebarItems(t);
  return (
    <AlumniContentLayout
      variant="two"
      pageTitle={title}
      sidebarItems={sidebarItems}
      contentSpacing={4}
    >
      {children}
    </AlumniContentLayout>
  );
};

export default NetworkSectionLayout;
