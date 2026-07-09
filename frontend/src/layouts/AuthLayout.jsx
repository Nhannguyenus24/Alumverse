import { Outlet } from 'react-router';
import { Box, useTheme } from '@mui/material';
import Logo from '../components/Logo';
import { useOrgNavigate } from '../hooks/useOrgNavigate';
import useOrganizationStore from '../stores/organizationStore';

const AuthLayout = () => {
  const navigate = useOrgNavigate();
  const theme = useTheme();
  const { organization } = useOrganizationStore();
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
        <Box
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
          }}
        >
          <Logo
            variant="image"
            src={logoSrc}
            alt="ALUMVERSE HCMUS"
            size="medium"
            sx={{
              filter: shouldGlowLogo
                ? 'drop-shadow(0 0 2px rgba(255,255,255,0.95)) drop-shadow(0 0 8px rgba(255,255,255,0.72)) drop-shadow(0 0 14px rgba(255,255,255,0.42))'
                : 'none',
              transition: 'filter 0.25s ease',
            }}
          />
        </Box>

        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: { xs: 'flex-start', md: 'center' },
            px: { xs: 2, sm: 2.5, md: 3 },
            pt: { xs: 10, sm: 11, md: 4 },
            pb: { xs: 'env(safe-area-inset-bottom, 24px)', md: 4 },
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <Box
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
          </Box>
        </Box>
      </Box>

      <Box
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
