import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import MenuIcon from '@mui/icons-material/Menu';
import Notification from './Notification';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PersonIcon from '@mui/icons-material/Person';
import Logo from './Logo';
import AccountMenu from './AccountMenu';
import { useAuth } from '../hooks/useAuth';

const LOGO_SRC = '/school_logo/logo_alumverse.png';
const LOGO_SRC_WHITE = '/school_logo/logo_alumverse_white.png';

const NAV_ITEMS = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Giới thiệu', href: '/introduction' },
  { label: 'Vinh danh', href: '/honors' },
  {
    label: 'Hoạt động',
    children: [
      { label: 'Sự kiện', href: '/activities/events' },
      { label: 'Tin tức', href: '/activities/news' },
    ],
  },
  {
    label: 'Phát triển',
    children: [
      { label: 'Học bổng', href: '/development/scholarships' },
      { label: 'Hợp tác', href: '/development/partnership' },
    ],
  },
  { label: 'Diễn đàn', href: '/forum' },
  { label: 'Quyên góp', href: '/donate' },
  { label: 'Liên hệ', href: '/contact' },
];

const Header = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  // Show full nav only from this width up; below = hamburger (avoids cramped nav)
const HEADER_DESKTOP_BREAKPOINT = 1280;
const isDesktop = useMediaQuery(theme.breakpoints.up(HEADER_DESKTOP_BREAKPOINT));
  const { isAuthenticated, user } = useAuth();

  const isAdmin = user?.role === 'ADMIN';

  const [anchorHoatDong, setAnchorHoatDong] = useState(null);
  const [anchorPhatTrien, setAnchorPhatTrien] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedNav, setExpandedNav] = useState({});

  const displayName = user?.userName ?? 'User';
  const rawRole = user?.role ?? 'Student';
  const displayRole = rawRole ? rawRole.charAt(0) + rawRole.slice(1).toLowerCase() : 'Student';

  const handleDrawerToggle = () => setMobileOpen((prev) => !prev);
  const closeDrawer = () => setMobileOpen(false);
  const toggleDrawerNav = (label) => () => {
    setExpandedNav((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleOpenMenu = (setter) => (e) => {
    e.stopPropagation();
    setter(e.currentTarget);
  };
  const handleCloseMenu = (setter) => () => setter(null);

  const headerTextColor = isAdmin ? 'primary.contrastText' : 'text.primary';

  const navButtonSx = {
    color: headerTextColor,
    fontWeight: 500,
    fontSize: '0.9375rem',
    textTransform: 'none',
    px: 1.5,
    minWidth: 0,
    flexShrink: 0,
    '&:hover': { backgroundColor: isAdmin ? 'rgba(255,255,255,0.08)' : 'action.hover' },
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backgroundColor: isAdmin ? 'primary.main' : 'background.paper',
        color: isAdmin ? 'primary.contrastText' : 'text.primary',
        borderBottom: 1,
        borderColor: isAdmin ? 'transparent' : 'divider',
      }}
    >
      <Toolbar
        sx={{
          minHeight: { xs: 56, md: 64 },
          px: { xs: 1.5, sm: 2 },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
            <Logo
              variant="image"
              src={isAdmin ? LOGO_SRC_WHITE : LOGO_SRC}
              alt="Alumverse"
              size="medium"
            />
          </Link>
        </Box>

        {isDesktop && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              gap: 0.5,
              flexWrap: 'nowrap',
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}
          >
              {NAV_ITEMS.map((item) =>
                item.children ? (
                  <Box key={item.label} sx={{ flexShrink: 0 }}>
                    <Button
                      endIcon={<KeyboardArrowDownIcon fontSize="small" />}
                      sx={navButtonSx}
                      onClick={(e) =>
                        item.label === 'Hoạt động'
                          ? handleOpenMenu(setAnchorHoatDong)(e)
                          : handleOpenMenu(setAnchorPhatTrien)(e)
                      }
                    >
                      {item.label}
                    </Button>
                    <Menu
                      anchorEl={item.label === 'Hoạt động' ? anchorHoatDong : anchorPhatTrien}
                      open={
                        (item.label === 'Hoạt động' && !!anchorHoatDong) ||
                        (item.label === 'Phát triển' && !!anchorPhatTrien)
                      }
                      onClose={
                        item.label === 'Hoạt động'
                          ? handleCloseMenu(setAnchorHoatDong)
                          : handleCloseMenu(setAnchorPhatTrien)
                      }
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                      slotProps={{ paper: { sx: { mt: 1.5, minWidth: 160 } } }}
                    >
                      {item.children.map((child) => (
                        <MenuItem
                          key={child.label}
                          component={Link}
                          to={child.href}
                          onClick={
                            item.label === 'Hoạt động'
                              ? handleCloseMenu(setAnchorHoatDong)
                              : handleCloseMenu(setAnchorPhatTrien)
                          }
                          sx={{ py: 1.25 }}
                        >
                          {child.label}
                        </MenuItem>
                      ))}
                    </Menu>
                  </Box>
                ) : (
                  <Button
                    key={item.label}
                    component={Link}
                    to={item.href}
                    sx={navButtonSx}
                  >
                    {item.label}
                  </Button>
                )
              )}
            </Box>
          )}

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flex: 1, gap: 0.5 }}>
          {isDesktop ? (
            <>
              <Typography
                component="span"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: isAdmin ? 'primary.contrastText' : 'primary.main',
                  mr: 1,
                  cursor: 'pointer',
                }}
              >
                VI
              </Typography>

              {isAuthenticated ? (
                <>
                  <Notification />
                  <IconButton
                    size="small"
                    aria-label="Tin nhắn"
                    sx={{ color: headerTextColor }}
                  >
                    <EmailOutlinedIcon fontSize="small" />
                  </IconButton>
                  <AccountMenu
                    displayName={displayName}
                    displayRole={displayRole}
                    avatarUrl={user?.avatarUrl}
                    contrastMode={isAdmin}
                  />
                </>
              ) : (
                <>
                  <Button
                    component={Link}
                    to="/auth/register"
                    variant="outlined"
                    color="primary"
                    size="small"
                    sx={{ fontWeight: 600 }}
                  >
                    Đăng ký
                  </Button>
                  <Button
                    component={Link}
                    to="/auth/login"
                    variant="contained"
                    color="primary"
                    size="small"
                    sx={{ fontWeight: 600 }}
                  >
                    Đăng nhập
                  </Button>
                </>
              )}
            </>
          ) : (
            <IconButton
              aria-label="Mở menu"
              onClick={handleDrawerToggle}
              sx={{ color: headerTextColor }}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Box>
      </Toolbar>

      <Drawer
        variant="temporary"
        anchor="right"
        open={mobileOpen}
        onClose={closeDrawer}
        ModalProps={{ keepMounted: true }}
        slotProps={{
          paper: {
            sx: { width: { xs: '85%', sm: 320 }, boxSizing: 'border-box' },
          },
        }}
      >
        <Box sx={{ py: 2, px: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ mb: 1 }}>
            Ngôn ngữ
          </Typography>
          <Typography component="span" sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'primary.main' }}>
            VI
          </Typography>
        </Box>
        <Divider />
        <List component="nav" sx={{ py: 1 }}>
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <Box key={item.label}>
                <ListItemButton onClick={toggleDrawerNav(item.label)} sx={{ py: 1.25 }}>
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 500 }} />
                  {expandedNav[item.label] ? (
                    <ExpandLess sx={{ color: 'text.secondary' }} />
                  ) : (
                    <ExpandMore sx={{ color: 'text.secondary' }} />
                  )}
                </ListItemButton>
                <Collapse in={expandedNav[item.label]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children.map((child) => (
                      <ListItemButton
                        key={child.label}
                        component={Link}
                        to={child.href}
                        onClick={closeDrawer}
                        sx={{ pl: 3, py: 1 }}
                      >
                        <ListItemText primary={child.label} primaryTypographyProps={{ variant: 'body2' }} />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </Box>
            ) : (
              <ListItemButton key={item.label} component={Link} to={item.href} onClick={closeDrawer}>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 500 }} />
              </ListItemButton>
            )
          )}
        </List>
        <Divider />
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {isAuthenticated ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                borderRadius: 1,
                bgcolor: 'action.hover',
                cursor: 'pointer',
              }}
              onClick={() => {
                closeDrawer();
                navigate('/dashboard');
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {user?.avatarUrl ? (
                  <Box
                    component="img"
                    src={user.avatarUrl}
                    alt=""
                    sx={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <PersonIcon sx={{ fontSize: 24 }} />
                )}
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={600} color="text.primary">
                  {displayName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {displayRole}
                </Typography>
              </Box>
            </Box>
          ) : (
            <>
              <Button
                component={Link}
                to="/auth/register"
                variant="outlined"
                color="primary"
                fullWidth
                onClick={closeDrawer}
                sx={{ fontWeight: 600 }}
              >
                Đăng ký
              </Button>
              <Button
                component={Link}
                to="/auth/login"
                variant="contained"
                color="primary"
                fullWidth
                onClick={closeDrawer}
                sx={{ fontWeight: 600 }}
              >
                Đăng nhập
              </Button>
            </>
          )}
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default Header;
