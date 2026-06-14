import SearchIcon from '@mui/icons-material/Search';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PeopleIcon from '@mui/icons-material/People';
import BlockIcon from '@mui/icons-material/Block';

export const NETWORK_SIDEBAR_ITEMS = [
  { id: '/search', label: 'Tìm kiếm', icon: <SearchIcon /> },
  { id: '/search/requests', label: 'Yêu cầu kết nối', icon: <MailOutlineIcon /> },
  { id: '/search/connections', label: 'Kết nối hiện tại', icon: <PeopleIcon /> },
  { id: '/search/restricted-connections', label: 'Kết nối bị hạn chế', icon: <BlockIcon /> },
];
