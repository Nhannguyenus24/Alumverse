import { Link } from 'react-router';
import { Box, Typography, Button, Container } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Page from '../../components/Page';

const UnauthorizedPage = () => {
  const { t } = useTranslation('common');

  return (
    <Page
      title={t('unauthorized_title')}
      meta={
        <meta
          name="description"
          content={t('unauthorized_meta_desc')}
        />
      }
    >
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
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
          <Typography variant="h5">{t('unauthorized_heading')}</Typography>
          <Typography variant="body1" color="text.secondary">
            {t('unauthorized_desc')}
          </Typography>
          <Button component={Link} to="/" variant="contained" sx={{ mt: 2 }}>
            {t('not_found_go_home')}
          </Button>
          </Box>
        </Container>
      </Box>
    </Page>
  );
};

export default UnauthorizedPage;
