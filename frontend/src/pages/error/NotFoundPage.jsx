import { Box, Button, Container, Typography } from '@mui/material';

import Page from '../../components/Page';
import SearchOffIcon from '@mui/icons-material/SearchOff';

export default function NotFoundPage() {
  const navigate = useOrgNavigate();

  return (
    <Page
      title="404 Not Found"
      meta={
        <meta
          name="description"
          content="Trang không tồn tại - AlumVerse, Trường Đại học Khoa học Tự nhiên, ĐHQG-HCM"
        />
      }
    >
      <Container maxWidth="md">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            textAlign: 'center',
            py: 5,
          }}
        >
          <SearchOffIcon
            sx={{
              fontSize: 120,
              color: 'primary.main',
              mb: 2,
            }}
          />

          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '4rem', sm: '6rem', md: '8rem' },
              fontWeight: 700,
              color: 'primary.main',
              mb: 2,
            }}
          >
            404
          </Typography>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              mb: 2,
              color: 'text.primary',
            }}
          >
            Page Not Found
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              mb: 4,
              maxWidth: 500,
            }}
          >
            Sorry, we couldn't find the page you're looking for. The page might
            have been removed, had its name changed, or is temporarily
            unavailable.
          </Typography>

          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/')}
              sx={{
                px: 4,
                py: 1.5,
                textTransform: 'none',
                fontSize: '1rem',
              }}
            >
              Go to Home
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate(-1)}
              sx={{
                px: 4,
                py: 1.5,
                textTransform: 'none',
                fontSize: '1rem',
              }}
            >
              Go Back
            </Button>
          </Box>
        </Box>
      </Container>
    </Page>
  );
}