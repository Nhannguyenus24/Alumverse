import { NavLink, Outlet } from 'react-router';
import { Box, Button, Typography } from '@mui/material';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import TopicOutlinedIcon from '@mui/icons-material/TopicOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import Page from '../components/Page';
import useAdminSystemData from '../hooks/admin/useAdminSystemData';
import useAdminUsersLocal from '../hooks/admin/useAdminUsersLocal';
import useAdminForumPostsLocal from '../hooks/admin/useAdminForumPostsLocal';
import { AdminSystemProvider } from '../contexts/AdminSystemContext';
import { AdminUsersProvider } from '../contexts/AdminUsersContext';
import { AdminForumProvider } from '../contexts/AdminForumContext';
import { useAuth } from '../hooks/useAuth';

const linkButtonSx = (isActive) => ({
  justifyContent: 'flex-start',
  textTransform: 'none',
  py: 1.1,
  px: 1.5,
  borderRadius: 1.5,
  width: '100%',
  color: isActive ? 'primary.contrastText' : 'text.primary',
  bgcolor: isActive ? 'primary.main' : 'transparent',
  '&:hover': { bgcolor: isActive ? 'primary.dark' : 'action.hover' },
});

const NavItem = ({ to, end, icon, label }) => (
  <NavLink to={to} end={end} style={{ textDecoration: 'none', width: '100%' }}>
    {({ isActive }) => (
      <Button startIcon={icon} sx={linkButtonSx(isActive)}>
        {label}
      </Button>
    )}
  </NavLink>
);

const AdminLayoutShell = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <Page title="Admin" meta={<meta name="description" content="Admin area" />}>
      <Box sx={{ px: { xs: 2, md: 3 }, py: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
              Admin Control Center
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Navigate using the sidebar. Pages follow the admin system design routes.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'stretch', flexDirection: { xs: 'column', md: 'row' } }}>
            <PaperNav isAdmin={isAdmin} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
              <Outlet />
            </Box>
          </Box>
        </Box>
      </Box>
    </Page>
  );
};

const PaperNav = ({isAdmin}) => (
  <Box
    component="nav"
    sx={{
      width: { xs: '100%', md: 280 },
      border: 1,
      borderColor: 'divider',
      borderRadius: 2,
      p: 1.2,
      display: 'flex',
      flexDirection: 'column',
      gap: 0.75,
      bgcolor: 'background.paper',
      flexShrink: 0,
    }}
    aria-label="Admin navigation"
  >
    <NavItem to="/admin" end icon={<DashboardOutlinedIcon fontSize="small" />} label="Dashboard" />
    {isAdmin ? (
      <NavItem to="/admin/users" icon={<GroupsOutlinedIcon fontSize="small" />} label="Users" />
    ) : null}
    <NavItem to="/admin/forum/posts" icon={<ForumOutlinedIcon fontSize="small" />} label="Forum posts" />
    {isAdmin ? (
      <>
        <NavItem to="/admin/forum/topics" icon={<TopicOutlinedIcon fontSize="small" />} label="Forum topics" />
        <NavItem
          to="/admin/forum/categories"
          icon={<AccountTreeOutlinedIcon fontSize="small" />}
          label="Forum categories"
        />
        <NavItem to="/admin/organizations" icon={<BusinessOutlinedIcon fontSize="small" />} label="Organizations" />
        <NavItem to="/admin/audit-logs" icon={<GavelOutlinedIcon fontSize="small" />} label="Audit logs" />
        <NavItem to="/admin/analytics" icon={<AnalyticsOutlinedIcon fontSize="small" />} label="Analytics" />
      </>
    ) : null}
  </Box>
);

const AdminLayout = () => {
  const system = useAdminSystemData();
  const users = useAdminUsersLocal();
  const forum = useAdminForumPostsLocal();

  return (
    <AdminSystemProvider value={system}>
      <AdminUsersProvider value={users}>
        <AdminForumProvider value={forum}>
          <AdminLayoutShell />
        </AdminForumProvider>
      </AdminUsersProvider>
    </AdminSystemProvider>
  );
};

export default AdminLayout;
