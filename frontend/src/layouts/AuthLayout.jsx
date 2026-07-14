import { Outlet, useLocation } from 'react-router';
import { Box, useTheme } from '@mui/material';
import Logo from '../components/Logo';
import { useOrgNavigate } from '../hooks/useOrgNavigate';
import useOrganizationStore from '../stores/organizationStore';
import { ScrollReveal } from '../components/animations/ScrollReveal';

const AuthLayout = () => {
  const location = useLocation();
  const navigate = useOrgNavigate();
  const theme = useTheme();
  const { organization } = useOrganizationStore();
  const isLoginPage = /\/auth\/login\/?$/.test(location.pathname);
  const isCompactAuthPage = isLoginPage || /\/auth\/change-password\/?$/.test(location.pathname) || /\/admin\/change-password\/?$/.test(location.pathname);
  const defaultLogoSrc = theme.palette.mode === 'dark'
    ? '/alumverse_logo/Logo_White_Full.svg'
    : '/alumverse_logo/Logo_Main_Full.svg';
  const logoSrc = organization?.logoUrl || defaultLogoSrc;
  const shouldGlowLogo = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          flex: { xs: '1 1 auto', md: '0 0 50%' },
          width: { xs: '100%', md: '50%' },
          minHeight: '100vh',
          maxHeight: { xs: '100vh', md: 'none' },
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'background.paper',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <ScrollReveal
          direction="down"
          distance={16}
          delay={0.08}
          onClick={() => navigate('/')}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            pt: { xs: 2, sm: 2.5, md: 3 },
            pl: { xs: 2, sm: 2.5, md: 3 },
            pr: 2,
            zIndex: 1,
            cursor: 'pointer',
            maxWidth: { xs: 'calc(100% - 32px)', md: 'calc(50vw - 48px)' },
            '@media (max-height: 720px)': {
              pt: { xs: 1.25, md: 1.5 },
              pl: { xs: 1.5, md: 2 },
            },
          }}
        >
          <Logo
            variant="image"
            src={logoSrc}
            alt="ALUMVERSE HCMUS"
            size="medium"
            sx={{
              height: { xs: 34, sm: 38, md: 'clamp(28px, 6svh, 40px)' },
              maxWidth: '100%',
              objectFit: 'contain',
              filter: shouldGlowLogo
                ? 'drop-shadow(0 0 2px rgba(255,255,255,0.95)) drop-shadow(0 0 8px rgba(255,255,255,0.72)) drop-shadow(0 0 14px rgba(255,255,255,0.42))'
                : 'none',
              transition: 'filter 0.25s ease',
            }}
          />
        </ScrollReveal>

        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: {
              xs: isCompactAuthPage ? 'center' : 'flex-start',
              md: 'center',
            },
            px: { xs: 2, sm: 2.5, md: 3 },
            pt: {
              xs: isCompactAuthPage ? 'max(80px, env(safe-area-inset-top, 0px))' : 10,
              sm: isCompactAuthPage ? 10 : 11,
              md: 4,
            },
            pb: {
              xs: isCompactAuthPage ? 'max(80px, env(safe-area-inset-bottom, 0px))' : 'env(safe-area-inset-bottom, 24px)',
              sm: isCompactAuthPage ? 10 : 'env(safe-area-inset-bottom, 24px)',
              md: 4,
            },
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            '@media (max-height: 720px)': {
              justifyContent: isCompactAuthPage ? 'center' : 'flex-start',
              pt: { xs: isCompactAuthPage ? 7 : 7, md: isCompactAuthPage ? 3 : 6 },
              pb: { xs: isCompactAuthPage ? 7 : 2, md: isCompactAuthPage ? 3 : 2 },
            },
          }}
        >
          <ScrollReveal
            delay={0.12}
            sx={{
              width: '100%',
              maxWidth: 400,
              mx: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
            }}
          >
            <Outlet />
          </ScrollReveal>
        </Box>
      </Box>

      <ScrollReveal
        direction="left"
        distance={34}
        duration={0.8}
        sx={{
          display: { xs: 'none', md: 'block' },
          flex: '0 0 50%',
          width: '50%',
          minHeight: '100vh',
          backgroundImage: 'url(/auth_school.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
    </Box>
  );
};

export default AuthLayout;
