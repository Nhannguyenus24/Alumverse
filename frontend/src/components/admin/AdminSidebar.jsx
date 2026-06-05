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
  Tooltip,
  IconButton,
} from '@mui/material';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import TopicOutlinedIcon from '@mui/icons-material/TopicOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import FeedbackOutlinedIcon from '@mui/icons-material/FeedbackOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';

const DRAWER_WIDTH = 280;
const COLLAPSED_WIDTH = 88;

const NAV_GROUPS = (adminBase) => [
  {
    title: 'Tổng quan',
    items: [
      { to: adminBase, end: true, icon: <DashboardOutlinedIcon />, label: 'Bảng điều khiển' },
    ],
  },
  {
    title: 'Quản lý thực thể',
    items: [
      { to: `${adminBase}/users`, icon: <GroupsOutlinedIcon />, label: 'Người dùng', role: 'ADMIN' },
      { to: `${adminBase}/organizations`, icon: <BusinessOutlinedIcon />, label: 'Tổ chức', role: 'ADMIN' },
      { to: `${adminBase}/verifications`, icon: <VerifiedUserOutlinedIcon />, label: 'Xác thực người dùng', role: 'ADMIN' },
      { to: `${adminBase}/mentorship`, icon: <SchoolOutlinedIcon />, label: 'Cố vấn (Mentorship)', role: 'ADMIN' },
    ],
  },
  {
    title: 'Diễn đàn',
    items: [
      { to: `${adminBase}/forum/posts`, icon: <ForumOutlinedIcon />, label: 'Bài viết' },
      { to: `${adminBase}/forum/topics`, icon: <TopicOutlinedIcon />, label: 'Chủ đề', role: 'ADMIN' },
      { to: `${adminBase}/forum/categories`, icon: <AccountTreeOutlinedIcon />, label: 'Danh mục', role: 'ADMIN' },
    ],
  },
    {
    title: 'Nội dung & Cộng đồng',
    items: [
      { to: `${adminBase}/events`, icon: <EventNoteOutlinedIcon />, label: 'Sự kiện', role: 'ADMIN' },
      { to: `${adminBase}/article`, icon: <ArticleOutlinedIcon />, label: 'Bài viết', role: 'ADMIN' },
      { to: `${adminBase}/fundraising`, icon: <VolunteerActivismOutlinedIcon />, label: 'Quyên góp', role: 'ADMIN' },
    ],
  },
  {
    title: 'Hệ thống',
    items: [
      { to: `${adminBase}/feedbacks`, icon: <FeedbackOutlinedIcon />, label: 'Phản hồi', role: 'ADMIN' },
      { to: `${adminBase}/audit-logs`, icon: <GavelOutlinedIcon />, label: 'Nhật ký hệ thống', role: 'ADMIN' },
    ],
  },
];

const AdminSidebar = ({ open, onClose, variant = 'permanent', adminBase, userRole, collapsed = false, onToggle }) => {
  const theme = useTheme();
  const groups = NAV_GROUPS(adminBase);

  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', position: 'relative' }}>
      {/* Floating Toggle Button - Desktop Only */}
      {variant === 'permanent' && (
        <IconButton
          onClick={onToggle}
          size="small"
          sx={{
            position: 'absolute',
            right: -12,
            top: 28,
            width: 24,
            height: 24,
            bgcolor: 'background.paper',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            zIndex: 10,
            '&:hover': { 
              bgcolor: 'primary.main',
              color: 'white',
              borderColor: 'primary.main'
            },
            display: { xs: 'none', md: 'flex' },
            transition: 'all 0.2s ease'
          }}
        >
          {collapsed ? <ChevronRightIcon sx={{ fontSize: 16 }} /> : <ChevronLeftIcon sx={{ fontSize: 16 }} />}
        </IconButton>
      )}

      {/* Brand Header */}
      <Box sx={{ 
        p: 3, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: collapsed ? 'center' : 'flex-start',
        minHeight: 88
      }}>
        <Box
          component="img"
          src={collapsed ? "/alumverse_logo/Logo_Main.svg" : "/alumverse_logo/Logo_Main_Full.svg"}
          alt="ALUMVERSE"
          sx={{ height: collapsed ? 36 : 40, width: 'auto', transition: 'all 0.2s' }}
        />
      </Box>

      <Divider sx={{ mx: 2, opacity: 0.5 }} />

      {/* Nav Items */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 2, px: 1.5 }}>
        {groups.map((group, idx) => {
          const filteredItems = group.items.filter(item => !item.role || item.role === userRole);
          if (filteredItems.length === 0) return null;

          return (
            <Box key={idx} sx={{ mb: 3 }}>
              {!collapsed && (
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
              )}
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
                      <Tooltip title={collapsed ? item.label : ""} placement="right">
                        <ListItemButton
                          sx={{
                            borderRadius: 2,
                            mb: 0.5,
                            py: 1.25,
                            px: collapsed ? 0 : 2,
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            position: 'relative',
                            bgcolor: isActive ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                            color: isActive ? 'primary.main' : 'text.secondary',
                            '&:hover': {
                              bgcolor: isActive ? alpha(theme.palette.primary.main, 0.12) : 'action.hover',
                            },
                            '&::before': (isActive && !collapsed) ? {
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
                              minWidth: collapsed ? 0 : 40,
                              color: isActive ? 'primary.main' : 'text.secondary',
                              justifyContent: 'center',
                              '& svg': { fontSize: 24 },
                            }}
                          >
                            {item.icon}
                          </ListItemIcon>
                          {!collapsed && (
                            <ListItemText
                              primary={item.label}
                              primaryTypographyProps={{
                                fontSize: 14,
                                fontWeight: isActive ? 700 : 500,
                                noWrap: true
                              }}
                            />
                          )}
                        </ListItemButton>
                      </Tooltip>
                    )}
                  </NavLink>
                ))}
              </List>
            </Box>
          );
        })}
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

  const currentWidth = collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: currentWidth,
        flexShrink: 0,
        display: { xs: 'none', md: 'block' },
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        '& .MuiDrawer-paper': {
          width: currentWidth,
          boxSizing: 'border-box',
          borderRight: `1px solid ${theme.palette.divider}`,
          boxShadow: 'none',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflow: 'visible' // CRITICAL: Allow the floating button to be seen
        },
      }}
    >
      {sidebarContent}
    </Drawer>
  );
};

export default AdminSidebar;
