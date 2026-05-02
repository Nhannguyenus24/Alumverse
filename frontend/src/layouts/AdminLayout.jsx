import { useState } from 'react';
import { NavLink, Outlet, useMatch } from 'react-router';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import TopicOutlinedIcon from '@mui/icons-material/TopicOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import useAdminSystemData from '../hooks/admin/useAdminSystemData';
import useAdminUsersLocal from '../hooks/admin/useAdminUsersLocal';
import useAdminForumData from '../hooks/admin/useAdminForumData';
import { AdminSystemProvider } from '../contexts/AdminSystemContext';
import { AdminUsersProvider } from '../contexts/AdminUsersContext';
import { AdminForumProvider } from '../contexts/AdminForumContext';
import { useAuth } from '../hooks/useAuth';
import Page from '../components/Page';

const HEADER_HEIGHT = 64;
const DRAWER_WIDTH = 260;

function buildNavItems(adminBase, isAdmin) {
  return [
    { to: adminBase, end: true, icon: <DashboardOutlinedIcon fontSize="small" />, label: 'Dashboard' },
    ...(isAdmin ? [
      { to: `${adminBase}/users`, icon: <GroupsOutlinedIcon fontSize="small" />, label: 'Users' },
    ] : []),
    { to: `${adminBase}/forum/posts`, icon: <ForumOutlinedIcon fontSize="small" />, label: 'Forum Posts' },
    ...(isAdmin ? [
      { to: `${adminBase}/forum/topics`, icon: <TopicOutlinedIcon fontSize="small" />, label: 'Topics' },
      { to: `${adminBase}/forum/categories`, icon: <AccountTreeOutlinedIcon fontSize="small" />, label: 'Categories' },
      { to: `${adminBase}/organizations`, icon: <BusinessOutlinedIcon fontSize="small" />, label: 'Organizations' },
    ] : []),
    ...(isAdmin ? [
      { to: `${adminBase}/events`, icon: <EventNoteOutlinedIcon fontSize="small" />, label: 'Events' },
      { to: `${adminBase}/mentorship`, icon: <SchoolOutlinedIcon fontSize="small" />, label: 'Mentorship' },
      { to: `${adminBase}/fundraising`, icon: <VolunteerActivismOutlinedIcon fontSize="small" />, label: 'Fundraising' },
    ] : []),
    ...(isAdmin ? [
      { to: `${adminBase}/audit-logs`, icon: <GavelOutlinedIcon fontSize="small" />, label: 'Audit Logs' },
    ] : []),
  ];
}

const NavButton = ({ to, end, icon, label }) => (
  <NavLink to={to} end={end} style={{ textDecoration: 'none' }}>
    {({ isActive }) => (
      <Button
        startIcon={icon}
        size="small"
        sx={{
          textTransform: 'none',
          whiteSpace: 'nowrap',
          fontSize: 13,
          fontWeight: isActive ? 600 : 400,
          color: isActive ? 'primary.contrastText' : 'text.secondary',
          bgcolor: isActive ? 'primary.main' : 'transparent',
          borderRadius: 1.5,
          px: 1.5,
          py: 0.75,
          '&:hover': {
            bgcolor: isActive ? 'primary.dark' : 'action.hover',
            color: isActive ? 'primary.contrastText' : 'text.primary',
          },
        }}
      >
        {label}
      </Button>
    )}
  </NavLink>
);

const AdminHeader = ({ navItems, onMenuOpen, user, onLogout }) => (
  <AppBar
    position="fixed"
    elevation={0}
    sx={{
      bgcolor: 'background.paper',
      borderBottom: 1,
      borderColor: 'divider',
      color: 'text.primary',
    }}
  >
    <Toolbar sx={{ gap: 1, minHeight: `${HEADER_HEIGHT}px !important` }}>
      <IconButton edge="start" onClick={onMenuOpen} sx={{ display: { md: 'none' } }}>
        <MenuIcon />
      </IconButton>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
        <AdminPanelSettingsOutlinedIcon sx={{ color: 'primary.main', fontSize: 22 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: -0.5 }}>
          Admin
        </Typography>
      </Box>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5, display: { xs: 'none', md: 'flex' } }} />

      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          gap: 0.5,
          flex: 1,
          overflowX: 'auto',
          alignItems: 'center',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {navItems.map(({ to, end, icon, label }) => (
          <NavButton key={to} to={to} end={end} icon={icon} label={label} />
        ))}
      </Box>

      <Box sx={{ flex: 1, display: { md: 'none' } }} />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 13, fontWeight: 700 }}>
          {(user?.fullName || user?.userName || 'A')[0].toUpperCase()}
        </Avatar>
        <Typography
          variant="body2"
          sx={{
            display: { xs: 'none', sm: 'block' },
            fontWeight: 500,
            maxWidth: 140,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {user?.fullName || user?.userName || 'Admin'}
        </Typography>
        <Tooltip title="Đăng xuất">
          <IconButton size="small" onClick={onLogout} sx={{ color: 'text.secondary' }}>
            <LogoutOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Toolbar>
  </AppBar>
);

const AdminNavDrawer = ({ open, onClose, navItems }) => (
  <Drawer
    anchor="left"
    open={open}
    onClose={onClose}
    sx={{ display: { md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
  >
    <Box sx={{ pt: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <AdminPanelSettingsOutlinedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>
            Admin
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Divider />
      <List dense sx={{ px: 1, pt: 1 }}>
        {navItems.map(({ to, end, icon, label }) => (
          <NavLink key={to} to={to} end={end} style={{ textDecoration: 'none', color: 'inherit' }} onClick={onClose}>
            {({ isActive }) => (
              <ListItemButton selected={isActive} sx={{ borderRadius: 1.5, mb: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36, color: isActive ? 'primary.main' : 'text.secondary' }}>
                  {icon}
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'primary.main' : 'text.primary',
                  }}
                />
              </ListItemButton>
            )}
          </NavLink>
        ))}
      </List>
    </Box>
  </Drawer>
);

const AdminFooter = ({ isSlugContext, slug }) => (
  <Box
    component="footer"
    sx={{
      py: 1.5,
      px: 3,
      borderTop: 1,
      borderColor: 'divider',
      bgcolor: 'background.paper',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
    }}
  >
    <Typography variant="caption" color="text.disabled">
      Admin Control Center · HCMUS Alumni System
    </Typography>
    {isSlugContext ? (
      <Button
        component={NavLink}
        to={`/${slug}`}
        size="small"
        sx={{ textTransform: 'none', fontSize: 12, color: 'text.secondary', py: 0.25, minWidth: 0 }}
      >
        Quay về trang chính
      </Button>
    ) : (
      <Typography variant="caption" color="text.disabled">
        © {new Date().getFullYear()} HCMUS
      </Typography>
    )}
  </Box>
);

const AdminLayoutShell = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const slugMatchNested = useMatch('/:slug/admin/*');
  const slugMatchExact = useMatch('/:slug/admin');
  const slugMatch = slugMatchNested ?? slugMatchExact;
  const isSlugContext = Boolean(slugMatch);
  const slug = slugMatch?.params?.slug;
  const adminBase = isSlugContext ? `/${slug}/admin` : '/admin';
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const navItems = buildNavItems(adminBase, isAdmin);

  return (
    <Page
      title="Admin"
      meta={<meta name="description" content="Admin area" />}
      sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
    >
      <AdminHeader
        navItems={navItems}
        onMenuOpen={() => setDrawerOpen(true)}
        user={user}
        onLogout={logout}
      />
      <AdminNavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        navItems={navItems}
      />
      <Box
        component="main"
        sx={{
          flex: 1,
          mt: `${HEADER_HEIGHT}px`,
          px: { xs: 2, md: 3 },
          py: 3,
        }}
      >
        <Outlet />
      </Box>
      <AdminFooter isSlugContext={isSlugContext} slug={slug} />
    </Page>
  );
};

const AdminLayout = () => {
  const system = useAdminSystemData();
  const users = useAdminUsersLocal();
  const forum = useAdminForumData(system.activeOrgId);

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
