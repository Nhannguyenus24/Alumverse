import { NavLink } from 'react-router';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  alpha,
  useTheme,
} from '@mui/material';
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
import FeedbackOutlinedIcon from '@mui/icons-material/FeedbackOutlined';

const DRAWER_WIDTH = 280;

const NAV_GROUPS = (adminBase) => [
  {
    title: 'Tổng quan',
    items: [
      { to: adminBase, end: true, icon: <DashboardOutlinedIcon />, label: 'Dashboard' },
    ],
  },
  {
    title: 'Quản lý thực thể',
    items: [
      { to: `${adminBase}/users`, icon: <GroupsOutlinedIcon />, label: 'Người dùng', role: 'ADMIN' },
      { to: `${adminBase}/organizations`, icon: <BusinessOutlinedIcon />, label: 'Tổ chức', role: 'ADMIN' },
      { to: `${adminBase}/mentorship`, icon: <SchoolOutlinedIcon />, label: 'Cố vấn (Mentorship)', role: 'ADMIN' },
    ],
  },
  {
    title: 'Nội dung & Cộng đồng',
    items: [
      { to: `${adminBase}/forum/posts`, icon: <ForumOutlinedIcon />, label: 'Bài viết Diễn đàn' },
      { to: `${adminBase}/forum/topics`, icon: <TopicOutlinedIcon />, label: 'Chủ đề', role: 'ADMIN' },
      { to: `${adminBase}/forum/categories`, icon: <AccountTreeOutlinedIcon />, label: 'Danh mục', role: 'ADMIN' },
      { to: `${adminBase}/events`, icon: <EventNoteOutlinedIcon />, label: 'Sự kiện', role: 'ADMIN' },
      { to: `${adminBase}/fundraising`, icon: <VolunteerActivismOutlinedIcon />, label: 'Gây quỹ', role: 'ADMIN' },
    ],
  },
  {
    title: 'Hệ thống',
    items: [
      { to: `${adminBase}/feedbacks`, icon: <FeedbackOutlinedIcon />, label: 'Góp ý / Phản hồi', role: 'ADMIN' },
      { to: `${adminBase}/audit-logs`, icon: <GavelOutlinedIcon />, label: 'Nhật ký hệ thống', role: 'ADMIN' },
    ],
  },
];

const AdminSidebar = ({ open, onClose, variant = 'permanent', adminBase, userRole }) => {
  const theme = useTheme();
  const groups = NAV_GROUPS(adminBase);

  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      {/* Brand Header */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          component="img"
          src="/alumverse_logo/Logo_Main_Full.svg"
          alt="ALUMVERSE"
          sx={{ height: 40, width: 'auto' }}
        />
      </Box>

      <Divider sx={{ mx: 2, opacity: 0.5 }} />

      {/* Nav Items */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 2, px: 1.5 }}>
        {groups.map((group, idx) => {
          // Filter items by role
          const filteredItems = group.items.filter(item => !item.role || item.role === userRole);
          if (filteredItems.length === 0) return null;

          return (
            <Box key={idx} sx={{ mb: 3 }}>
              <Typography
                variant="overline"
                sx={{
                  px: 2,
                  mb: 1,
                  display: 'block',
                  color: 'text.disabled',
                  fontWeight: 700,
                  letterSpacing: 1.2,
                }}
              >
                {group.title}
              </Typography>
              <List disablePadding>
                {filteredItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                    onClick={variant === 'temporary' ? onClose : undefined}
                  >
                    {({ isActive }) => (
                      <ListItemButton
                        sx={{
                          borderRadius: 2,
                          mb: 0.5,
                          py: 1,
                          px: 2,
                          position: 'relative',
                          bgcolor: isActive ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                          color: isActive ? 'primary.main' : 'text.secondary',
                          '&:hover': {
                            bgcolor: isActive ? alpha(theme.palette.primary.main, 0.12) : 'action.hover',
                          },
                          // Indicator line
                          '&::before': isActive ? {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            top: '20%',
                            bottom: '20%',
                            width: 3,
                            bgcolor: 'primary.main',
                            borderRadius: '0 4px 4px 0',
                          } : {},
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 40,
                            color: isActive ? 'primary.main' : 'text.secondary',
                            '& svg': { fontSize: 22 },
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{
                            fontSize: 14,
                            fontWeight: isActive ? 700 : 500,
                          }}
                        />
                      </ListItemButton>
                    )}
                  </NavLink>
                ))}
              </List>
            </Box>
          );
        })}
      </Box>

      {/* Sidebar Footer (Optional) */}
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: 'action.hover' }}>
        <Typography variant="caption" color="text.disabled" fontWeight={600} align="center" display="block">
          HCMUS ALUMNI ADMIN v2.0
        </Typography>
      </Box>
    </Box>
  );

  if (variant === 'temporary') {
    return (
      <Drawer
        open={open}
        onClose={onClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        {sidebarContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        display: { xs: 'none', md: 'block' },
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: `1px solid ${theme.palette.divider}`,
          boxShadow: 'none',
        },
      }}
    >
      {sidebarContent}
    </Drawer>
  );
};

export default AdminSidebar;
