import { Link } from 'react-router';
import { Box, Typography, Button, Container } from '@mui/material';
import Page from '../../components/Page';

const UnauthorizedPage = () => {
  return (
    <Page
      title="403 Unauthorized"
      meta={
        <meta
          name="description"
          content="Không có quyền truy cập - AlumVerse, Trường Đại học Khoa học Tự nhiên, ĐHQG-HCM"
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
            gap: 2,
            textAlign: 'center',
          }}
        >
          <Typography variant="h1" sx={{ fontSize: '8rem', fontWeight: 700 }}>
            403
          </Typography>
          <Typography variant="h5">Unauthorized Access</Typography>
          <Typography variant="body1" color="text.secondary">
            You don't have permission to access this page.
          </Typography>
          <Button component={Link} to="/" variant="contained" sx={{ mt: 2 }}>
            Go to Home
          </Button>
        </Box>
      </Container>
    </Page>
  );
};

export default UnauthorizedPage;