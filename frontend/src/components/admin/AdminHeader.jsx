import { useState } from 'react';
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
  Button,
  Breadcrumbs,
  Link as MuiLink,
  alpha,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';

const AdminHeader = ({ onMenuOpen, isSidebarCollapsed, user, onLogout }) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleOpenUserMenu = (event) => setAnchorEl(event.currentTarget);
  const handleCloseUserMenu = () => setAnchorEl(null);

  const handleLogout = () => {
    handleCloseUserMenu();
    onLogout();
  };

  const SIDEBAR_WIDTH = 280;
  const SIDEBAR_COLLAPSED_WIDTH = 88;
  const currentSidebarWidth = isSidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

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
        zIndex: theme.zIndex.appBar,
        transition: theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: 70 }}>
        {/* Left Side: Toggle (Mobile Only) & Breadcrumbs */}
        <Stack direction="row" alignItems="center" spacing={1}>
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
              underline="hover"
              color="inherit"
              href="/admin"
              sx={{ display: 'flex', alignItems: 'center', fontSize: 14, fontWeight: 500 }}
            >
              <HomeOutlinedIcon sx={{ mr: 0.5, fontSize: 18 }} />
              Admin
            </MuiLink>
            <Typography color="text.primary" sx={{ fontSize: 14, fontWeight: 600 }}>
              Dashboard
            </Typography>
          </Breadcrumbs>
        </Stack>

        {/* Right Side: Profile Dropdown Only */}
        <Stack direction="row" alignItems="center">
          <Button
            onClick={handleOpenUserMenu}
            sx={{
              textTransform: 'none',
              color: 'inherit',
              borderRadius: 2.5,
              p: 0.5,
              pl: 1.5,
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: 'primary.main',
                  fontSize: 15,
                  fontWeight: 800,
                  boxShadow: `0 0 0 2px ${theme.palette.background.paper}, 0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}`,
                }}
              >
                {(user?.fullName || user?.userName || 'A')[0].toUpperCase()}
              </Avatar>
            </Stack>
          </Button>

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
                {user?.fullName || user?.userName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.role} · Quản trị viên
              </Typography>
            </Box>
            <Box sx={{ bgcolor: 'divider', height: 1, my: 0.5 }} />
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main', '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) } }}>
              <ListItemIcon>
                <LogoutOutlinedIcon fontSize="small" color="error" />
              </ListItemIcon>
              <Typography variant="body2" fontWeight={700}>Đăng xuất</Typography>
            </MenuItem>
          </Menu>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};

export default AdminHeader;
