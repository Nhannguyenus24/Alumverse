import { NavLink } from 'react-router';
import { useTranslation } from 'react-i18next';
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
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import FeedbackOutlinedIcon from '@mui/icons-material/FeedbackOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import HistoryEduOutlinedIcon from '@mui/icons-material/HistoryEduOutlined';

const DRAWER_WIDTH = 280;
const COLLAPSED_WIDTH = 88;
const ADMIN_HEADER_HEIGHT = 88;

// roles: omit = visible to all; array = visible only to listed roles
const NAV_GROUPS = (adminBase, t) => [
  {
    title: t('admin:nav_group_overview'),
    items: [
      { to: adminBase, end: true, icon: <DashboardOutlinedIcon />, label: t('admin:nav_dashboard') },
    ],
  },
  {
    title: t('admin:nav_group_entity_management'),
    items: [
      { to: `${adminBase}/users`, icon: <GroupsOutlinedIcon />, label: t('admin:nav_users') },
      { to: `${adminBase}/organizations`, icon: <BusinessOutlinedIcon />, label: t('admin:nav_organizations'), roles: ['ADMIN'] },
      { to: `${adminBase}/verifications`, icon: <VerifiedUserOutlinedIcon />, label: t('admin:nav_verifications') },
      { to: `${adminBase}/mentorship`, icon: <SchoolOutlinedIcon />, label: t('admin:nav_mentorship') },
    ],
  },
  {
    title: t('admin:nav_group_forum'),
    items: [
      { to: `${adminBase}/forum/categories`, icon: <AccountTreeOutlinedIcon />, label: t('admin:nav_forum_categories') },
      { to: `${adminBase}/forum/topics`, icon: <TopicOutlinedIcon />, label: t('admin:nav_forum_topics') },
      { to: `${adminBase}/forum/posts`, icon: <ForumOutlinedIcon />, label: t('admin:nav_forum_posts') },
      { to: `${adminBase}/forum/reports`, icon: <FlagOutlinedIcon />, label: t('admin:nav_forum_reports') },
    ],
  },
  {
    title: t('admin:nav_group_content_community'),
    items: [
      { to: `${adminBase}/article`, icon: <ArticleOutlinedIcon />, label: t('admin:nav_article') },
      { to: `${adminBase}/events`, icon: <EventNoteOutlinedIcon />, label: t('admin:nav_events') },
      { to: `${adminBase}/donations`, end: true, icon: <VolunteerActivismOutlinedIcon />, label: t('admin:nav_fundraising') },
      { to: `${adminBase}/donations/bank-accounts`, icon: <AccountBalanceOutlinedIcon />, label: t('admin:nav_bank_accounts') },
    ],
  },
  {
    title: t('admin:nav_group_system'),
    items: [
      { to: `${adminBase}/feedbacks`, icon: <FeedbackOutlinedIcon />, label: t('admin:nav_feedbacks') },
      { to: `${adminBase}/education-requests`, icon: <HistoryEduOutlinedIcon />, label: t('admin:nav_education_requests') },
      { to: `${adminBase}/audit-logs`, icon: <GavelOutlinedIcon />, label: t('admin:nav_audit_logs') },
      { to: `${adminBase}/bot-config`, icon: <SmartToyOutlinedIcon />, label: t('admin:nav_bot_config'), roles: ['ADMIN'] },
    ],
  },
];

const AdminSidebar = ({ open, onClose, variant = 'permanent', adminBase, userRole, collapsed = false, onToggle }) => {
  const theme = useTheme();
  const { t } = useTranslation(['admin']);
  const groups = NAV_GROUPS(adminBase, t);
  const logoSrc = theme.palette.mode === 'dark'
    ? (collapsed ? '/alumverse_logo/Logo_White.svg' : '/alumverse_logo/Logo_White_Full.svg')
    : (collapsed ? '/alumverse_logo/Logo_Main.svg' : '/alumverse_logo/Logo_Main_Full.svg');

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
            top: (ADMIN_HEADER_HEIGHT - 24) / 2,
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
        p: 2.5,
        height: ADMIN_HEADER_HEIGHT,
        minHeight: ADMIN_HEADER_HEIGHT,
        flex: `0 0 ${ADMIN_HEADER_HEIGHT}px`,
        boxSizing: 'border-box',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        <Box
          component="img"
          src={logoSrc}
          alt="ALUMVERSE"
          sx={{ height: collapsed ? 36 : 40, width: 'auto', transition: 'all 0.2s' }}
        />
      </Box>

      <Divider sx={{ mx: 2, opacity: 0.5 }} />

      {/* Nav Items */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 2, px: 1.5 }}>
        {groups.map((group, idx) => {
          const filteredItems = group.items.filter(item => !item.roles || item.roles.includes(userRole));
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
                            borderRadius: 0,
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
                              top: 0,
                              bottom: 0,
                              width: 3,
                              bgcolor: 'primary.main',
                              borderRadius: 0,
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
