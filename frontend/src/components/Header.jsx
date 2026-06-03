import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import {
  AppBar, Toolbar, Box, Typography,
  Button, IconButton, Drawer, List, 
  ListItemButton, ListItemText, Collapse, 
  Divider, useTheme, useMediaQuery
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import Notification from './Notification';
import Logo from './Logo';
import AccountMenu from './AccountMenu';
import MessagesNavDropdown from './MessagesNavDropdown';
import { useAuth } from '../hooks/useAuth';
import { useOrgNavigate, useOrgPath } from '../hooks/useOrgNavigate';
import { getNormalizedPathname } from '../utils/pathUtils';

const LOGO_SRC = '/alumverse_logo/Logo_Main_Full.svg';
const LOGO_SRC_WHITE = '/alumverse_logo/Logo_White_Full.svg';

const VERIFICATION_LABELS = {
  0: 'Guest',
  1: 'Student',
  2: 'Alumni',
};

const NAV_ITEMS = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Giới thiệu', href: '/introduction' },
  { label: 'Kết nối', href: '/search' },
  {
    label: 'Vinh danh', href: '/honors',
    children: [
      { label: 'Cựu sinh viên', href: '/honors/alumni' },
      { label: 'Kênh thành tựu', href: '/honors/achievements' },
    ],
  },
  {
    label: 'Hoạt động', href: '/activities',
    children: [
      { label: 'Sự kiện', href: '/activities/events' },
      { label: 'Tin tức', href: '/activities/news' },
    ],
  },
  {
    label: 'Phát triển', href: '/development',
    children: [
      { label: 'Cố vấn', href: '/development/mentorship' },
      { label: 'Cơ hội học tập', href: '/development/academics' },
      { label: 'Cơ hội việc làm', href: '/development/jobs' },
    ],
  },
  { label: 'Diễn đàn', href: '/forum' },
  { label: 'Quyên góp', href: '/donations' },
  { label: 'Liên hệ', href: '/contact' },
];

const Header = () => {
  const theme = useTheme();
  const navigate = useOrgNavigate();
  const toOrgPath = useOrgPath();
  const location = useLocation();
  const { slug: routeSlug } = useParams();
  const { isAuthenticated, user, verificationLevel } = useAuth();
  // State for Scroll and UI
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredNav, setHoveredNav] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedNav, setExpandedNav] = useState({});
  const [showVerificationBanner, setShowVerificationBanner] = useState(true);

  const HEADER_DESKTOP_BREAKPOINT = 1280;
  const isDesktop = useMediaQuery(theme.breakpoints.up(HEADER_DESKTOP_BREAKPOINT));
  const normalizedPathname = getNormalizedPathname(location.pathname, routeSlug);
  const isHomePage = normalizedPathname === '/';
  const isAdmin = user?.role === 'ADMIN';
  const isGuestVerificationLevel = isAuthenticated && verificationLevel === 0;

  const isTransparent = isHomePage && !isScrolled;

  const rafRef = useRef(null);
  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 150);
        rafRef.current = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const displayName = user?.userName ?? 'User';
  const rawRole = user?.role ?? 'Student';
  const verificationLabel = verificationLevel != null
    ? VERIFICATION_LABELS[verificationLevel] ?? rawRole.charAt(0) + rawRole.slice(1).toLowerCase()
    : rawRole.charAt(0) + rawRole.slice(1).toLowerCase();
  const displayRole = isAdmin ? 'Admin' : verificationLabel;

  const handleDrawerToggle = () => setMobileOpen((prev) => !prev);
  const closeDrawer = () => setMobileOpen(false);
  const toggleDrawerNav = (label) => () => {
    setExpandedNav((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const headerTextColor = isTransparent 
    ? '#FFFFFF' 
    : (isAdmin ? 'primary.contrastText' : 'text.primary');

  const navButtonSx = {
    color: headerTextColor, 
    fontWeight: 500, 
    fontSize: '0.9375rem',
    textTransform: 'none', 
    px: 1.5, 
    transition: 'all 0.3s ease',
    '&:hover': { 
      backgroundColor: isTransparent ? 'rgba(255,255,255,0.1)' :
      (isAdmin ? 'rgba(255,255,255,0.08)' : 'action.hover') 
    },
  };

  const appBarMinHeight = { xs: 56, md: 64 };

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          backgroundColor: isTransparent ? 'transparent' : (isAdmin ? 'primary.main' : 'background.paper'),
          color: headerTextColor,
          borderBottom: isTransparent ? 'none' : (isAdmin ? 'transparent' : 1),
          borderColor: 'divider',
          transition: 'all 0.4s ease-in-out',
        }}
      >
        <Toolbar sx={{ minHeight: appBarMinHeight,
                       px: { xs: 1.5, sm: 2 },
                       justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
            <Link to={toOrgPath('/')} style={{ display: 'flex', alignItems: 'center' }}>
              <Logo 
                variant="image" 
                src={(isTransparent || isAdmin) ? LOGO_SRC_WHITE : LOGO_SRC} 
                alt="AlumVerse" 
                size="medium" 
              />
            </Link>
          </Box>

        {isDesktop && (
          <Box sx={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)',
                     display: 'flex', alignItems: 'center', gap: 1, whiteSpace: 'nowrap', zIndex: 5 }}>
            {NAV_ITEMS.map((item) => (
              <Box
                key={item.label}
                onMouseEnter={() => item.children && setHoveredNav(item.label)}
                onMouseLeave={() => setHoveredNav(null)}
                sx={{ position: 'relative', display: 'flex', alignItems: 'center', py: 2.5 }}
              >
                <Button component={Link} to={toOrgPath(item.href)} sx={navButtonSx}>
                  {item.label}
                </Button>

                {item.children && hoveredNav === item.label && (
                  <Box
                    onMouseEnter={() => setHoveredNav(item.label)}
                    onMouseLeave={() => setHoveredNav(null)}
                    sx={{
                      position: 'absolute', top: '100%', pt: 1, left: '50%', transform: 'translateX(-50%)',
                      display: 'flex', flexDirection: 'column', bgcolor: 'background.paper',
                      borderRadius: 1, boxShadow: 3, py: 0.5, px: 0.5,
                      width: 'max-content', minWidth: 180, zIndex: 10,
                      border: '1px solid', borderColor: 'divider'
                    }} >
                    {item.children.map((child) => (
                      <Button
                        key={child.label} component={Link} to={toOrgPath(child.href)}
                        sx={{ justifyContent: 'flex-start', textAlign: 'left', px: 2, py: 1,
                              textTransform: 'none', color: 'text.primary', width: '100%',
                              '&:hover': { bgcolor: 'action.hover' } }}
                      >
                        {child.label}
                      </Button>
                    ))}
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
          {isDesktop ? (
            <>
              <Typography component="span"
                sx={{ fontSize: '0.875rem', fontWeight: 600,
                      color: isTransparent ? '#FFFFFF' : (isAdmin ? 'primary.contrastText' : 'primary.main'),
                      mr: 1, cursor: 'pointer', transition: 'color 0.3s' }}
              >
                VI
              </Typography>

              {isAuthenticated ? (
                <>
                  <Notification headerTextColor={headerTextColor} />
                  <MessagesNavDropdown headerTextColor={headerTextColor} />
                  <AccountMenu
                    displayName={displayName} displayRole={displayRole}
                    avatarUrl={user?.avatarUrl} contrastMode={isTransparent || isAdmin} />
                </>
              ) : (
                <>
                  <Button component={Link} to={toOrgPath('/auth/register')}
                          variant="outlined" size="small"
                          sx={{
                            fontWeight: 600,
                            color: isTransparent ? '#FFFFFF' : 'primary.main',
                            borderColor: isTransparent ? '#FFFFFF' : 'primary.main',
                            '&:hover': isTransparent
                              ? { borderColor: '#FFFFFF', color: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.1)', }
                              : { borderColor: 'primary.dark', color: 'primary.main', bgcolor: 'primary.lighter', },
                          }}
                  >
                    Đăng ký
                  </Button>
                  <Button component={Link} to={toOrgPath('/auth/login')}
                          variant="contained" size="small"
                          sx={{ 
                            fontWeight: 600,
                            bgcolor: isTransparent ? '#FFFFFF' : 'primary.main',
                            color: isTransparent ? 'primary.main' : 'primary.contrastText',
                            '&:hover': { bgcolor: isTransparent ? '#f0f0f0' : 'primary.dark' }
                          }}
                  >
                    Đăng nhập
                  </Button>
                </>
              )}
            </>
          ) : (
            <IconButton onClick={handleDrawerToggle} sx={{ color: headerTextColor }}>
              <MenuIcon />
            </IconButton>
          )}
        </Box>
        </Toolbar>
      </AppBar>

      {isGuestVerificationLevel && showVerificationBanner && (
        <Box
          sx={{
            position: 'fixed',
            top: appBarMinHeight,
            left: 0,
            right: 0,
            px: { xs: 1.5, sm: 2, md: 3 },
            pt: 1,
            zIndex: theme.zIndex.appBar + 2,
            pointerEvents: 'none',
          }}
        >
          <Box
            sx={{
              pointerEvents: 'auto',
              position: 'relative',
              borderRadius: 1,
              px: { xs: 1.5, sm: 2 },
              py: { xs: 1.25, sm: 1.5, md: 1.75 },
              display: 'flex',
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
              gap: 1.5,
              bgcolor: isAdmin ? 'rgba(255,255,255,0.1)' : 'warning.main',
              color: isAdmin ? 'primary.contrastText' : 'warning.contrastText',
              border: '1px solid',
              borderColor: isAdmin ? 'rgba(255,255,255,0.18)' : 'warning.main',
              boxShadow: 3,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.35 }}>
                Tài khoản đang ở chế độ Guest
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 0.25, lineHeight: 1.35 }}>
                Hoàn tất xác thực để mở khóa đầy đủ tính năng và nhận vai trò phù hợp.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
              <Button
                variant="contained"
                size="small"
                onClick={() => navigate('/organization-registration')}
                sx={{
                  position: 'relative',
                  zIndex: theme.zIndex.appBar + 3,
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  bgcolor: isAdmin ? '#FFFFFF' : 'warning.dark',
                  color: isAdmin ? 'primary.main' : '#FFFFFF',
                  '&:hover': {
                    bgcolor: isAdmin ? '#f5f5f5' : 'warning.dark',
                  },
                }}
              >
                Xác thực ngay
              </Button>

              <IconButton
                size="small"
                aria-label="Ẩn banner xác thực"
                onClick={() => setShowVerificationBanner(false)}
                sx={{
                  color: isAdmin ? 'primary.contrastText' : 'warning.contrastText',
                  bgcolor: 'transparent',
                  alignSelf: 'flex-start',
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Box>
      )}

      <Drawer
        variant="temporary" anchor="right" open={mobileOpen} onClose={closeDrawer}
        slotProps={{ paper: { sx: { width: { xs: '85%', sm: 320 } } } }}
      >
        <Box sx={{ py: 2, px: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" 
                      fontWeight={600} sx={{ mb: 1 }}>
            Ngôn ngữ
          </Typography>
          <Typography component="span"
                      sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'primary.main' }}>
            VI
          </Typography>
        </Box>

        <Divider />

        <List component="nav" sx={{ py: 1 }}>
          {NAV_ITEMS.map((item) =>
          item.children ? (
            <Box key={item.label}>
              <ListItemButton sx={{ py: 1.25 }}>
                <ListItemText 
                  primary={item.label}
                  primaryTypographyProps={{ fontWeight: 500 }} 
                  onClick={() => { navigate(item.href); closeDrawer(); }}
                />
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleDrawerNav(item.label)(); }}>
                  {expandedNav[item.label] ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </ListItemButton>
              <Collapse in={expandedNav[item.label]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.children.map((child) => (
                    <ListItemButton key={child.label} component={Link} to={toOrgPath(child.href)} 
                                    onClick={closeDrawer} sx={{ pl: 4 }}>
                      <ListItemText primary={child.label} primaryTypographyProps={{ variant: 'body2' }} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            </Box>
            ) : (
              <ListItemButton key={item.label} onClick={closeDrawer}
                              component={Link} to={toOrgPath(item.href)}>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 500 }} />
              </ListItemButton>
            )
          )}
        </List>

        <Divider />

        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {isAuthenticated ? (
            <Box sx={{ display: 'flex', alignItems: 'center',
                        gap: 1.5, p: 1.5, borderRadius: 1, bgcolor: 'action.hover' }}
                  onClick={() => { closeDrawer(); navigate('/dashboard'); }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '50%',
                          bgcolor: 'primary.main', color: 'primary.contrastText',
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {user?.avatarUrl ?
                  <Box component="img" src={user.avatarUrl}
                        sx={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  : <PersonIcon />}
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={600}>{displayName}</Typography>
                <Typography variant="caption" color="text.secondary">{displayRole}</Typography>
              </Box>
            </Box>
          ) : (
            <>
                    <Button component={Link} to={toOrgPath('/auth/register')} variant="outlined"
                      fullWidth onClick={closeDrawer}
              >
                Đăng ký
              </Button>
                    <Button component={Link} to={toOrgPath('/auth/login')} variant="contained"
                      fullWidth onClick={closeDrawer}
              >
                Đăng nhập
              </Button>
            </>
          )}
        </Box>
      </Drawer>
    </>
  );
};

export default Header;