import { useState, useTransition } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Stack,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Breadcrumbs,
  Link as MuiLink,
  alpha,
  useTheme,
  Select,
  FormControl,
  Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';
import { useAdminSystemContext } from '../../stores/AdminStore';
import useThemeModeStore from '../../stores/themeModeStore';
import LanguageSwitcher from '../LanguageSwitcher';

const ADMIN_HEADER_HEIGHT = 88;

const ThemeModeIcon = ({ rotated = false }) => (
  <Box
    component="span"
    sx={{
      width: 18,
      height: 18,
      borderRadius: '50%',
      border: '2px solid currentColor',
      background: 'linear-gradient(90deg, currentColor 0 50%, transparent 50% 100%)',
      display: 'inline-block',
      transform: rotated ? 'rotate(180deg)' : 'rotate(0deg)',
      transition: 'transform 320ms ease',
    }}
  />
);

const AdminHeader = ({ adminBase = '/admin', onMenuOpen, isSidebarCollapsed, user, onLogout, breadcrumbs }) => {
  const theme = useTheme();
  const { t } = useTranslation(['admin', 'auth']);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [, startTransition] = useTransition();
  const themeMode = useThemeModeStore((state) => state.mode);
  const toggleThemeMode = useThemeModeStore((state) => state.toggleMode);

  const { organizations, activeOrgId, setActiveOrgId } = useAdminSystemContext();

  const handleOpenUserMenu = (event) => setAnchorEl(event.currentTarget);
  const handleCloseUserMenu = () => setAnchorEl(null);

  const handleLogout = () => {
    handleCloseUserMenu();
    onLogout();
  };

  const SIDEBAR_WIDTH = 280;
  const SIDEBAR_COLLAPSED_WIDTH = 88;
  const currentSidebarWidth = isSidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  const showOrgSelector = organizations && organizations.length > 0;

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${currentSidebarWidth}px)` },
        ml: { md: `${currentSidebarWidth}px` },
        bgcolor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${theme.palette.divider}`,
        color: 'text.primary',
        height: ADMIN_HEADER_HEIGHT,
        zIndex: theme.zIndex.appBar,
        transition: theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      }}
    >
      <Toolbar
        sx={{
          justifyContent: 'space-between',
          height: ADMIN_HEADER_HEIGHT,
          minHeight: ADMIN_HEADER_HEIGHT,
          '@media (min-width: 600px)': {
            minHeight: ADMIN_HEADER_HEIGHT,
          },
        }}
      >
        {/* Left Side: Toggle (Mobile Only) & Breadcrumbs */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0, flex: 1 }}>
          {/* Mobile Toggle */}
          <IconButton
            edge="start"
            onClick={onMenuOpen}
            sx={{ mr: 1, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" />}
            aria-label="breadcrumb"
            sx={{ display: { xs: 'none', sm: 'block' } }}
          >
            <MuiLink
              component={RouterLink}
              underline="hover"
              color="inherit"
              to={adminBase}
              sx={{ display: 'flex', alignItems: 'center', fontSize: 14, fontWeight: 500 }}
            >
              <HomeOutlinedIcon sx={{ mr: 0.5, fontSize: 18 }} />
              {t('admin:breadcrumb_admin')}
            </MuiLink>
            
            {breadcrumbs && (
              breadcrumbs.map((crumb, idx) => (
                crumb.path || crumb.href ? (
                  <MuiLink
                    key={idx}
                    component={RouterLink}
                    underline="hover"
                    color="inherit"
                    to={crumb.path || crumb.href}
                    sx={{ fontSize: 14, fontWeight: crumb.active ? 600 : 500 }}
                  >
                    {crumb.label}
                  </MuiLink>
                ) : (
                  <Typography key={idx} color="text.primary" sx={{ fontSize: 14, fontWeight: 600 }}>
                    {crumb.label}
                  </Typography>
                )
              ))
            )}
          </Breadcrumbs>
        </Stack>

        {/* Center: Organization Selector */}
        {showOrgSelector && (
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              display: { xs: 'none', md: 'flex' },
              mx: 2,
              flexShrink: 0,
            }}
          >
            <FormControl variant="standard" size="small" sx={{ minWidth: 160 }}>
              <Select
                value={activeOrgId || ''}
                onChange={(e) => startTransition(() => setActiveOrgId(e.target.value))}
                disableUnderline
                id="admin-org-selector"
                inputProps={{ 'aria-label': t('admin:select_organization_aria') }}
                sx={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'text.primary',
                  '& .MuiSelect-select': {
                    py: 0.5,
                    px: 1,
                    borderRadius: 1.5,
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    color: 'primary.main',
                    '&:focus': {
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                      borderRadius: 1.5,
                    },
                  },
                  '& .MuiSelect-icon': {
                    color: 'primary.main',
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      mt: 1,
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                      '& .MuiMenuItem-root': {
                        fontSize: 13,
                        fontWeight: 600,
                        borderRadius: 1,
                        mx: 0.5,
                        my: 0.25,
                        '&.Mui-selected': {
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: 'primary.main',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.15),
                          },
                        },
                      },
                    },
                  },
                }}
              >
                {organizations.map((org) => (
                  <MenuItem key={org.id} value={org.id}>
                    {org.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        )}

        {/* Right Side: Profile Dropdown Only */}
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Tooltip title={themeMode === 'dark' ? t('admin:switch_to_light_mode') : t('admin:switch_to_dark_mode')} arrow>
            <IconButton
              aria-label={t('admin:toggle_theme_aria_label')}
              onClick={toggleThemeMode}
              sx={{
                color: 'primary.main',
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.14) },
              }}
            >
              <ThemeModeIcon rotated={themeMode === 'dark'} />
            </IconButton>
          </Tooltip>

          <LanguageSwitcher
            color="primary.main"
            buttonSx={{
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.14) },
            }}
          />

          <IconButton
            onClick={handleOpenUserMenu}
            sx={{
              color: 'inherit',
              width: 48,
              height: 48,
              p: 0,
              borderRadius: '50%',
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) },
            }}
          >
            <Avatar
              src={user?.avatarUrl || undefined}
              sx={{
                width: 40,
                height: 40,
                bgcolor: 'primary.main',
                fontSize: 15,
                fontWeight: 800,
                boxShadow: `0 0 0 2px ${theme.palette.background.paper}, 0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}`,
              }}
            >
              {(user?.fullName || user?.studentId || 'A')[0].toUpperCase()}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleCloseUserMenu}
            onClick={handleCloseUserMenu}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              elevation: 0,
              sx: {
                mt: 1.5,
                minWidth: 220,
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                '& .MuiMenuItem-root': {
                  px: 2,
                  py: 1.2,
                  borderRadius: 2,
                  mx: 1,
                  my: 0.5,
                }
              },
            }}
          >
            <Box sx={{ px: 2.5, py: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                {user?.fullName || user?.studentId}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.role} · {t('admin:administrator_role_caption')}
              </Typography>
            </Box>
            <Box sx={{ bgcolor: 'divider', height: 1, my: 0.5 }} />
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main', '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) } }}>
              <ListItemIcon>
                <LogoutOutlinedIcon fontSize="small" color="error" />
              </ListItemIcon>
              <Typography variant="body2" fontWeight={700}>{t('auth:logout')}</Typography>
            </MenuItem>
          </Menu>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};

export default AdminHeader;
