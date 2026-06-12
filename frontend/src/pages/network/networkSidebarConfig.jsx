import SearchIcon from '@mui/icons-material/Search';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PeopleIcon from '@mui/icons-material/People';

export const NETWORK_SIDEBAR_ITEMS = [
  { id: '/search', label: 'Tìm kiếm', icon: <SearchIcon /> },
  { id: '/search/requests', label: 'Yêu cầu kết nối', icon: <MailOutlineIcon /> },
  { id: '/search/connections', label: 'Kết nối hiện tại', icon: <PeopleIcon /> },
];
