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
import Brightness6RoundedIcon from '@mui/icons-material/Brightness6Rounded';
import { useTranslation } from 'react-i18next';
import Iconify from './Iconify';
import Notification from './Notification';
import Logo from './Logo';
import AccountMenu from './AccountMenu';
import MessagesNavDropdown from './MessagesNavDropdown';
import LanguageSwitcher from './LanguageSwitcher';
import { useAuth } from '../hooks/useAuth';
import { useOrgNavigate, useOrgPath } from '../hooks/useOrgNavigate';
import { getNormalizedPathname } from '../utils/pathUtils';
import useThemeModeStore from '../stores/themeModeStore';
import { HEADER_HEIGHT } from '../constants/layout';

const LOGO_SRC = '/alumverse_logo/Logo_Main_Full.svg';
const LOGO_SRC_WHITE = '/alumverse_logo/Logo_White_Full.svg';

const VERIFICATION_LABELS = {
  0: 'Guest',
  1: 'Verifying',
  2: 'Alumni',
  3: 'Student',
};

const getNavItems = (t) => [
  { label: t('nav:home'), href: '/' },
  { label: t('nav:introduction'), href: '/introduction',
    children: [
      { label: t('nav:intro_general'), href: '/introduction' },
      { label: t('nav:intro_leaders'), href: '/introduction/leaders' },
      { label: t('nav:intro_team'), href: '/introduction/team' },
    ]
  },
  { label: t('nav:network'), href: '/search', requiresAuth: true },
  {
    label: t('nav:honors'), href: '/honors',
    children: [
      { label: t('nav:honors_alumni'), href: '/honors/alumni' },
      { label: t('nav:honors_achievements'), href: '/honors/achievements' },
    ],
  },
  {
    label: t('nav:activities'), href: '/activities',
    children: [
      { label: t('nav:events'), href: '/activities/events', requiresAuth: true },
      { label: t('nav:news'), href: '/activities/news' },
    ],
  },
  {
    label: t('nav:development'), href: '/development', requiresAuth: true,
    children: [
      { label: t('nav:mentorship'), href: '/development/mentorship' },
      { label: t('nav:academics'), href: '/development/academics' },
      { label: t('nav:jobs'), href: '/development/jobs' },
    ],
  },
  { label: t('nav:forum'), href: '/forum' },
  { label: t('nav:donation'), href: '/donations' },
  { label: t('nav:contact'), href: '/contact' },
];

const Header = () => {
  const { t } = useTranslation(['nav', 'auth']);
  const theme = useTheme();
  const navigate = useOrgNavigate();
  const toOrgPath = useOrgPath();
  const location = useLocation();
  const { slug: routeSlug } = useParams();
  const { isAuthenticated, user, verificationLevel } = useAuth();
  const themeMode = useThemeModeStore((state) => state.mode);
  const toggleThemeMode = useThemeModeStore((state) => state.toggleMode);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredNav, setHoveredNav] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedNav, setExpandedNav] = useState({});
  const [showVerificationBanner, setShowVerificationBanner] = useState(true);

  const HEADER_DESKTOP_BREAKPOINT = 1280;
  const isDesktop = useMediaQuery(theme.breakpoints.up(HEADER_DESKTOP_BREAKPOINT));
  const normalizedPath = useMemo(
    () => getNormalizedPathname(location.pathname, routeSlug),
    [location.pathname, routeSlug]
  );
  const { isAdmin, isGuestVerificationLevel, isTransparent, isOrgRegistrationPage } = useMemo(() => {
    const admin = user?.role === 'ADMIN';
    const home = normalizedPath === '/';
    return {
      isAdmin: admin,
      isGuestVerificationLevel: isAuthenticated && verificationLevel === 0,
      isTransparent: home && !isScrolled,
      isOrgRegistrationPage: normalizedPath === '/organization-registration',
    };
  }, [normalizedPath, user?.role, isAuthenticated, verificationLevel, isScrolled]);

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

  const navItems = useMemo(() => getNavItems(t), [t]);

  const handleDrawerToggle = useCallback(() => setMobileOpen((prev) => !prev), []);
  const closeDrawer = useCallback(() => setMobileOpen(false), []);
  const toggleDrawerNav = useCallback((label) => () => {
    setExpandedNav((prev) => ({ ...prev, [label]: !prev[label] }));
  }, []);

  const headerTextColor = isTransparent
    ? '#FFFFFF'
    : (isAdmin ? 'primary.contrastText' : 'text.primary');

  const navButtonSx = useMemo(() => ({
    color: headerTextColor, fontWeight: 600, fontSize: { xs: '0.875rem', xl: '0.9375rem' },
    textTransform: 'none', px: { xs: 1, xl: 1.5 }, transition: 'all 0.3s ease',
    position: 'relative',
    borderRadius: 1,
    '&:hover': {
      backgroundColor: isTransparent ? 'rgba(255,255,255,0.1)'
        : (isAdmin ? 'rgba(255,255,255,0.08)' : 'action.hover'),
    },
  }), [headerTextColor, isTransparent, isAdmin]);

  const getNavActive = useCallback((item) => {
    if (item.href === '/') {
      return normalizedPath === '/';
    }

    const paths = [item.href, ...(item.children || []).map((child) => child.href)];
    return paths.some((path) => normalizedPath === path || normalizedPath.startsWith(`${path}/`));
  }, [normalizedPath]);

  const getNavActiveSx = useCallback((active) => {
    if (!active) return {};

    const activeColor = isTransparent ? '#FFFFFF' : (isAdmin ? 'primary.contrastText' : 'primary.main');
    return {
      color: activeColor,
      fontWeight: 800,
    };
  }, [isAdmin, isTransparent]);

  const shouldUseDarkAdminLogo = isAdmin
    && !isTransparent
    && theme.palette.primary.contrastText !== '#fff'
    && theme.palette.primary.contrastText !== '#FFFFFF';
  const logoSrc = (isTransparent || isAdmin) ? LOGO_SRC_WHITE : LOGO_SRC;
  const logoSx = shouldUseDarkAdminLogo ? { filter: 'brightness(0)' } : undefined;

  const appBarMinHeight = HEADER_HEIGHT;

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
        <Toolbar sx={{ minHeight: appBarMinHeight, px: { xs: 1.5, sm: 2 }, justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
            <Link to={toOrgPath('/')} style={{ display: 'flex', alignItems: 'center' }}>
              <Logo
                variant="image"
                src={logoSrc}
                alt="AlumVerse"
                size="medium"
                sx={logoSx}
              />
            </Link>
          </Box>

          {isDesktop && (
            <Box sx={{ 
              display: 'flex', alignItems: 'center', gap: { xs: 0.5, xl: 1 }, whiteSpace: 'nowrap', 
              zIndex: 5, flex: 1, justifyContent: 'center' 
            }}>
              {navItems.map((item) => {
                const isLocked = item.requiresAuth && !isAuthenticated;
                const isActive = getNavActive(item);
                const buttonContent = (
                  <Button
                    component={isLocked ? 'button' : Link}
                    to={isLocked ? undefined : toOrgPath(item.href)}
                    sx={{ ...navButtonSx, ...getNavActiveSx(isActive) }}
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
                      <Tooltip title={t('nav:login_required')} arrow placement="bottom">
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
                        }}
                      >
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
                            <Tooltip key={child.label} title={t('nav:login_required')} arrow placement="right">
                              <Box component="span" sx={{ display: 'block', width: '100%' }}>{childButtonContent}</Box>
                            </Tooltip>
                          ) : childButtonContent;
                        })}
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
            {isDesktop ? (
              <>
                <Tooltip
                  title={themeMode === 'dark'
                    ? t('nav:switch_to_light_mode', { defaultValue: 'Chuyển sang giao diện sáng' })
                    : t('nav:switch_to_dark_mode', { defaultValue: 'Chuyển sang giao diện tối' })}
                  arrow
                >
                  <IconButton
                    size="small"
                    aria-label={t('nav:toggle_theme_aria_label', { defaultValue: 'Đổi chế độ sáng tối' })}
                    onClick={toggleThemeMode}
                    sx={{
                      color: isTransparent ? '#FFFFFF' : (isAdmin ? 'primary.contrastText' : 'primary.main'),
                      mr: 0.25,
                      '&:hover': {
                        bgcolor: isTransparent ? 'rgba(255,255,255,0.12)' : 'action.hover',
                      },
                    }}
                  >
                    <Brightness6RoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <LanguageSwitcher
                  contrastMode={isTransparent || isAdmin}
                  color={headerTextColor}
                  buttonSx={{
                    '&:hover': {
                      bgcolor: isTransparent ? 'rgba(255,255,255,0.12)' : (isAdmin ? 'rgba(255,255,255,0.08)' : 'action.hover'),
                    },
                  }}
                />

                {isAuthenticated ? (
                  <>
                    <Notification headerTextColor={headerTextColor} />
                    <MessagesNavDropdown headerTextColor={headerTextColor} />
                    <AccountMenu
                    displayName={displayName} displayRole={displayRole}
                    avatarUrl={user?.avatarUrl} contrastMode={isTransparent || isAdmin}
                    textColor={headerTextColor} />
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
                                ? { borderColor: '#FFFFFF', color: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.1)' }
                                : { borderColor: 'primary.dark', color: 'primary.main', bgcolor: 'primary.lighter' },
                            }}
                    >
                      {t('auth:register')}
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
                      {t('auth:login')}
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

      {isGuestVerificationLevel && showVerificationBanner && !isOrgRegistrationPage && (
        <Box
          sx={{
            position: 'fixed',
            top: HEADER_HEIGHT,
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
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 40, height: 40, borderRadius: '50%',
                  bgcolor: (theme) => alpha(theme.palette.warning.main, 0.12),
                  color: 'warning.dark', flexShrink: 0
                }}
              >
                <Iconify icon="eva:shield-outline" width={24} height={24} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.35 }}>
                  {t('auth:guest_banner_title')}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, lineHeight: 1.35 }}>
                  {t('auth:guest_banner_desc')}
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0,
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
                variant="text" size="small"
                onClick={() => navigate('/organization-registration')}
                endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
                sx={{
                  fontWeight: 600, whiteSpace: 'nowrap', color: 'warning.dark',
                  '&:hover': { bgcolor: (theme) => alpha(theme.palette.warning.main, 0.08) },
                  px: 1.5
                }}
              >
                {t('auth:verify_now')}
              </Button>

              <IconButton
                size="small"
                aria-label={t('auth:hide_banner')}
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
        <Box sx={{ py: 2, px: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
            {t('nav:language')}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip
              title={themeMode === 'dark'
                ? t('nav:switch_to_light_mode', { defaultValue: 'Chuyển sang giao diện sáng' })
                : t('nav:switch_to_dark_mode', { defaultValue: 'Chuyển sang giao diện tối' })}
              arrow
            >
              <IconButton
                size="small"
                aria-label={t('nav:toggle_theme_aria_label', { defaultValue: 'Đổi chế độ sáng tối' })}
                onClick={toggleThemeMode}
                sx={{ color: 'primary.main' }}
              >
                <Brightness6RoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <LanguageSwitcher />
          </Box>
        </Box>

        <Divider />

        <List component="nav" sx={{ py: 1 }}>
          {navItems.map((item) => {
            const isLocked = item.requiresAuth && !isAuthenticated;

            return item.children ? (
              <Box key={item.label}>
                <Tooltip title={isLocked ? t('nav:login_required') : ''} arrow placement="top" disableHoverListener={!isLocked}>
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
                        onClick={() => { if (!isLocked) { navigate(item.href); closeDrawer(); } }}
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
                        <Tooltip key={child.label} title={isChildLocked ? t('nav:login_required') : ''} arrow placement="top" disableHoverListener={!isChildLocked}>
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
                      );
                    })}
                  </List>
                </Collapse>
              </Box>
            ) : (
              <Tooltip key={item.label} title={isLocked ? t('nav:login_required') : ''} arrow placement="top" disableHoverListener={!isLocked}>
                <span style={{ display: 'block' }}>
                  <ListItemButton onClick={isLocked ? undefined : closeDrawer} disabled={isLocked}
                                  component={isLocked ? 'div' : Link} to={isLocked ? undefined : toOrgPath(item.href)}>
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
            );
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
                {t('auth:register')}
              </Button>
              <Button component={Link} to={toOrgPath('/auth/login')} variant="contained"
                fullWidth onClick={closeDrawer}
              >
                {t('auth:login')}
              </Button>
            </>
          )}
        </Box>
      </Drawer>
    </>
  );
};

export default Header;
