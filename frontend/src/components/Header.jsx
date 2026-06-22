import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import {
  AppBar, Toolbar, Box, Typography,
  Button, IconButton, Drawer, List, 
  ListItemButton, ListItemText, Collapse, 
  Divider, useTheme, useMediaQuery, alpha, Tooltip
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import Iconify from './Iconify';
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
  1: 'Verifying',
  2: 'Alumni',
  3: 'Student',
};

const NAV_ITEMS = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Giới thiệu', href: '/introduction',
    children: [
      { label: 'Thông tin chung', href: '/introduction' },
      { label: 'Ban lãnh đạo', href: '/introduction/leaders' },
      { label: 'Đội ngũ', href: '/introduction/team' },
    ]
   },
  { label: 'Kết nối', href: '/search', requiresAuth: true },
  {
    label: 'Vinh danh', href: '/honors',
    children: [
      { label: 'Cựu sinh viên', href: '/honors/alumni' },
      { label: 'Kênh thành tựu', href: '/honors/achievements' },
    ],
  },
  {
    label: 'Hoạt động', href: '/activities', fallbackHref: '/activities/news',
    children: [
      { label: 'Sự kiện', href: '/activities/events', requiresAuth: true },
      { label: 'Tin tức', href: '/activities/news' },
    ],
  },
  {
    label: 'Phát triển', href: '/development', requiresAuth: true,
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
  const {isAdmin, isGuestVerificationLevel, isTransparent } = useMemo(() => {
    const np = getNormalizedPathname(location.pathname, routeSlug);
    const admin = user?.role === 'ADMIN';
    const home = np === '/';
    return {
        isAdmin: admin,
      isGuestVerificationLevel: isAuthenticated && verificationLevel === 0,
      isTransparent: home && !isScrolled,
    };
  }, [location.pathname, routeSlug, user?.role, isAuthenticated, verificationLevel, isScrolled]);

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

  const { displayName, displayRole } = useMemo(() => {
    const name = user?.fullName ?? user?.studentId ?? 'User';
    const rawRole = user?.role ?? 'Student';
    const verLabel = verificationLevel != null
      ? (VERIFICATION_LABELS[verificationLevel] ?? rawRole.charAt(0) + rawRole.slice(1).toLowerCase())
      : rawRole.charAt(0) + rawRole.slice(1).toLowerCase();
    return { displayName: name, displayRole: isAdmin ? 'Admin' : verLabel };
  }, [user, verificationLevel, isAdmin]);

  const handleDrawerToggle = useCallback(() => setMobileOpen((prev) => !prev), []);
  const closeDrawer = useCallback(() => setMobileOpen(false), []);
  const toggleDrawerNav = useCallback((label) => () => {
    setExpandedNav((prev) => ({ ...prev, [label]: !prev[label] }));
  }, []);

  const headerTextColor = isTransparent 
    ? '#FFFFFF' 
    : (isAdmin ? 'primary.contrastText' : 'text.primary');

  const navButtonSx = useMemo(() => ({
    color: headerTextColor, fontWeight: 600, fontSize: '0.9375rem',
    textTransform: 'none', px: 1.5, transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: isTransparent ? 'rgba(255,255,255,0.1)'
        : (isAdmin ? 'rgba(255,255,255,0.08)' : 'action.hover'),
    },
  }), [headerTextColor, isTransparent, isAdmin]);

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
            {NAV_ITEMS.map((item) => {
              const isLocked = item.requiresAuth && !isAuthenticated;
              const buttonContent = (
                <Button 
                  component={isLocked ? 'button' : Link} 
                  to={isLocked ? undefined : toOrgPath(!isAuthenticated && item.fallbackHref ? item.fallbackHref : item.href)} 
                  sx={navButtonSx}
                  disabled={isLocked}
                >
                  {item.label}
                  {isLocked && (
                    <Box component="span" sx={{ ml: 0.5, display: 'inline-flex', verticalAlign: 'middle' }}>
                      <Iconify icon="eva:lock-fill" width={14} height={14} sx={{ opacity: 0.7 }} />
                    </Box>
                  )}
                </Button>
              );

              return (
              <Box
                key={item.label}
                onMouseEnter={() => !isLocked && item.children && setHoveredNav(item.label)}
                onMouseLeave={() => setHoveredNav(null)}
                sx={{ position: 'relative', display: 'flex', alignItems: 'center', py: 2.5 }}
              >
                {isLocked ? (
                  <Tooltip title="Vui lòng đăng nhập để sử dụng" arrow placement="bottom">
                    <span style={{ display: 'inline-block' }}>{buttonContent}</span>
                  </Tooltip>
                ) : buttonContent}

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
                    {item.children.map((child) => {
                      const isChildLocked = child.requiresAuth && !isAuthenticated;
                      const childButtonContent = (
                        <Button
                          key={child.label} 
                          component={isChildLocked ? 'button' : Link} 
                          to={isChildLocked ? undefined : toOrgPath(child.href)}
                          disabled={isChildLocked}
                          sx={{ justifyContent: 'flex-start', textAlign: 'left', px: 2, py: 1,
                                textTransform: 'none', color: 'text.primary', width: '100%', fontWeight: 500,
                                '&:hover': { bgcolor: 'action.hover' } }}
                        >
                          {child.label}
                          {isChildLocked && (
                            <Box component="span" sx={{ ml: 1, display: 'inline-flex', verticalAlign: 'middle' }}>
                              <Iconify icon="eva:lock-fill" width={14} height={14} sx={{ opacity: 0.5 }} />
                            </Box>
                          )}
                        </Button>
                      );
                      
                      return isChildLocked ? (
                        <Tooltip key={child.label} title="Vui lòng đăng nhập để sử dụng" arrow placement="right">
                          <Box component="span" sx={{ display: 'block', width: '100%' }}>{childButtonContent}</Box>
                        </Tooltip>
                      ) : childButtonContent;
                    })}
                  </Box>
                )}
              </Box>
            )})}
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
            top: { xs: 72, md: 80 },
            left: '50%',
            transform: 'translateX(-50%)',
            width: { xs: 'calc(100% - 32px)', sm: 'max-content' },
            maxWidth: '640px',
            zIndex: theme.zIndex.appBar + 2,
            pointerEvents: 'none',
            animation: 'slideDownFade 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            '@keyframes slideDownFade': {
              '0%': { opacity: 0, transform: 'translate(-50%, -20px)' },
              '100%': { opacity: 1, transform: 'translate(-50%, 0)' }
            }
          }}
        >
          <Box
            sx={{
              pointerEvents: 'auto',
              borderRadius: 1,
              px: { xs: 2, sm: 2.5 },
              py: { xs: 1.5, sm: 1.5 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              bgcolor: (theme) => alpha(theme.palette.background.paper, 0.85),
              backdropFilter: 'blur(12px)',
              color: 'text.primary',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, width: '100%' }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: 40, 
                  height: 40, 
                  borderRadius: '50%', 
                  bgcolor: (theme) => alpha(theme.palette.warning.main, 0.12),
                  color: 'warning.dark',
                  flexShrink: 0
                }}
              >
                <Iconify icon="eva:shield-outline" width={24} height={24} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.35 }}>
                  Tài khoản đang ở chế độ Guest
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, lineHeight: 1.35 }}>
                  Hoàn tất xác thực để mở khóa đầy đủ tính năng và nhận vai trò phù hợp.
                </Typography>
              </Box>
            </Box>

            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                flexShrink: 0, 
                borderLeft: { xs: 'none', sm: '1px solid' }, 
                borderTop: { xs: '1px solid', sm: 'none' },
                borderColor: 'divider', 
                pl: { xs: 0, sm: 2 },
                pt: { xs: 1.5, sm: 0 },
                width: { xs: '100%', sm: 'auto' },
                justifyContent: { xs: 'flex-end', sm: 'flex-start' }
              }}
            >
              <Button
                variant="text"
                size="small"
                onClick={() => navigate('/organization-registration')}
                endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
                sx={{
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  color: 'warning.dark',
                  '&:hover': { bgcolor: (theme) => alpha(theme.palette.warning.main, 0.08) },
                  px: 1.5
                }}
              >
                Xác thực ngay
              </Button>

              <IconButton
                size="small"
                aria-label="Ẩn banner xác thực"
                onClick={() => setShowVerificationBanner(false)}
                sx={{ color: 'text.secondary' }}
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
          {NAV_ITEMS.map((item) => {
            const isLocked = item.requiresAuth && !isAuthenticated;
            
            return item.children ? (
            <Box key={item.label}>
              <Tooltip title={isLocked ? "Vui lòng đăng nhập để sử dụng" : ""} arrow placement="top" disableHoverListener={!isLocked}>
                <span>
                  <ListItemButton sx={{ py: 1.25 }} disabled={isLocked}>
                    <ListItemText 
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {item.label}
                          {isLocked && (
                            <Box component="span" sx={{ ml: 1, display: 'inline-flex' }}>
                              <Iconify icon="eva:lock-fill" width={14} height={14} sx={{ opacity: 0.5 }} />
                            </Box>
                          )}
                        </Box>
                      }
                      primaryTypographyProps={{ fontWeight: 500 }} 
                      onClick={() => { if (!isLocked) { navigate(!isAuthenticated && item.fallbackHref ? item.fallbackHref : item.href); closeDrawer(); } }}
                    />
                    <IconButton size="small" disabled={isLocked} onClick={(e) => { e.stopPropagation(); if (!isLocked) toggleDrawerNav(item.label)(); }}>
                      {expandedNav[item.label] ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </ListItemButton>
                </span>
              </Tooltip>
              <Collapse in={expandedNav[item.label]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.children.map((child) => {
                    const isChildLocked = child.requiresAuth && !isAuthenticated;
                    return (
                    <Tooltip key={child.label} title={isChildLocked ? "Vui lòng đăng nhập để sử dụng" : ""} arrow placement="top" disableHoverListener={!isChildLocked}>
                      <span style={{ display: 'block' }}>
                        <ListItemButton component={isChildLocked ? 'div' : Link} to={isChildLocked ? undefined : toOrgPath(child.href)} 
                                        onClick={isChildLocked ? undefined : closeDrawer} sx={{ pl: 4 }} disabled={isChildLocked}>
                          <ListItemText primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {child.label}
                              {isChildLocked && (
                                <Box component="span" sx={{ ml: 1, display: 'inline-flex' }}>
                                  <Iconify icon="eva:lock-fill" width={14} height={14} sx={{ opacity: 0.5 }} />
                                </Box>
                              )}
                            </Box>
                          } primaryTypographyProps={{ variant: 'body2' }} />
                        </ListItemButton>
                      </span>
                    </Tooltip>
                  )})}
                </List>
              </Collapse>
            </Box>
            ) : (
              <Tooltip key={item.label} title={isLocked ? "Vui lòng đăng nhập để sử dụng" : ""} arrow placement="top" disableHoverListener={!isLocked}>
                <span style={{ display: 'block' }}>
                  <ListItemButton onClick={isLocked ? undefined : closeDrawer} disabled={isLocked}
                                  component={isLocked ? 'div' : Link} to={isLocked ? undefined : toOrgPath(!isAuthenticated && item.fallbackHref ? item.fallbackHref : item.href)}>
                    <ListItemText primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {item.label}
                        {isLocked && (
                          <Box component="span" sx={{ ml: 1, display: 'inline-flex' }}>
                            <Iconify icon="eva:lock-fill" width={14} height={14} sx={{ opacity: 0.5 }} />
                          </Box>
                        )}
                      </Box>
                    } primaryTypographyProps={{ fontWeight: 500 }} />
                  </ListItemButton>
                </span>
              </Tooltip>
            )
          })}
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