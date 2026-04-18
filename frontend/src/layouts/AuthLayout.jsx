import { Outlet } from 'react-router';
import { Box } from '@mui/material';
import Logo from '../components/Logo';

const AuthLayout = () => {
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
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            pt: { xs: 2, sm: 2.5, md: 3 },
            pl: { xs: 2, sm: 2.5, md: 3 },
            pr: 2,
            zIndex: 1,
          }}
        >
          <Logo
            variant="image"
            src="/alumverse_logo/Logo_Main_Full.svg"
            alt="ALUMVERSE HCMUS"
            size="large"
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
