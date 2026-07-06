import SearchIcon from '@mui/icons-material/Search';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PeopleIcon from '@mui/icons-material/People';
import BlockIcon from '@mui/icons-material/Block';

export const getNetworkSidebarItems = (t) => [
  { id: '/network', label: t('network:title'), icon: <SearchIcon /> },
  { id: '/network/requests', label: t('network:connection_request'), icon: <MailOutlineIcon /> },
  { id: '/network/connections', label: t('network:current_connections'), icon: <PeopleIcon /> },
  { id: '/network/restricted-connections', label: t('network:restricted_connections'), icon: <BlockIcon /> },
];
