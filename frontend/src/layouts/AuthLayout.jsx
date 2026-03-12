import { Outlet } from 'react-router';
import { Box, Container } from '@mui/material';
import Logo from '../components/Logo';

const AuthLayout = () => {
  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        overflow: 'hidden',
      }}
    >
      {/* Left: white panel – top-left logo, form in the middle */}
      <Box
        sx={{
          flex: { xs: '1 1 auto', md: '0 0 50%' },
          width: { xs: '100%', md: '50%' },
          minHeight: { xs: '100vh', md: '100vh' },
          maxHeight: { xs: '100vh', md: 'none' },
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'background.paper',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Logo: top-left, responsive size & padding */}
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
            src="/school_logo/logo_alumverse.png"
            alt="ALUMVERSE HCMUS"
            size="large"
          />
        </Box>

        {/* Form area: scrollable on mobile, centered on desktop */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: { xs: 'flex-start', md: 'center' },
            py: { xs: 3, sm: 3.5, md: 4 },
            px: { xs: 2, sm: 2.5, md: 3 },
            pt: { xs: 10, sm: 11, md: 4 },
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            pb: { xs: 'env(safe-area-inset-bottom, 24px)', md: 4 },
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

      {/* Right: background image – hidden on mobile/tablet */}
      <Box
        sx={{
          flex: { xs: '0 0 0', md: '0 0 50%' },
          width: { xs: 0, md: '50%' },
          minHeight: { xs: 0, md: '100vh' },
          backgroundImage: 'url(/auth_school.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          display: { xs: 'none', md: 'block' },
        }}
      />
    </Container>
  );
};

export default AuthLayout;
