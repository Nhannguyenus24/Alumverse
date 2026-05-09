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
  Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';

const AdminHeader = ({ onMenuOpen, user, onLogout }) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleOpenUserMenu = (event) => setAnchorEl(event.currentTarget);
  const handleCloseUserMenu = () => setAnchorEl(null);

  const handleLogout = () => {
    handleCloseUserMenu();
    onLogout();
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { md: `calc(100% - 280px)` },
        ml: { md: `280px` },
        bgcolor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${theme.palette.divider}`,
        color: 'text.primary',
        zIndex: theme.zIndex.appBar,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: 70 }}>
        {/* Left Side: Mobile Menu & Breadcrumbs */}
        <Stack direction="row" alignItems="center" spacing={1}>
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

        {/* Right Side: Search, Actions, Profile */}
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {/* Global Search Button */}
          <Tooltip title="Tìm kiếm (Ctrl+K)">
            <IconButton
              sx={{
                bgcolor: 'action.hover',
                borderRadius: 2,
                '&:hover': { bgcolor: 'action.selected' }
              }}
            >
              <SearchIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Quick Action Button */}
          <Button
            variant="contained"
            startIcon={<AddCircleOutlineIcon />}
            size="small"
            sx={{
              display: { xs: 'none', sm: 'flex' },
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              px: 2,
              boxShadow: theme.customShadows?.primary,
            }}
          >
            Tạo mới
          </Button>

          <Box sx={{ width: 1, height: 24, bgcolor: 'divider', mx: 1, display: { xs: 'none', sm: 'block' } }} />

          {/* Profile Dropdown */}
          <Button
            onClick={handleOpenUserMenu}
            sx={{
              textTransform: 'none',
              color: 'inherit',
              borderRadius: 2.5,
              p: 0.5,
              pl: 1,
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Typography
                variant="body2"
                sx={{
                  display: { xs: 'none', lg: 'block' },
                  fontWeight: 700,
                  color: 'text.primary',
                }}
              >
                {user?.fullName || user?.userName || 'Admin'}
              </Typography>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: 'primary.main',
                  fontSize: 14,
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
                minWidth: 200,
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
