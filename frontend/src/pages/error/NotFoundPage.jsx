import { Box, Button, Container, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Page from '../../components/Page';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import { useErrorPageActions } from '../../hooks/useErrorPageActions';
import {
  ScrollRevealGroup,
  ScrollRevealItem,
} from '../../components/animations/ScrollReveal';

export default function NotFoundPage() {
  const { goBack, goHome } = useErrorPageActions();
  const { t } = useTranslation('common');

  return (
    <Page
      title={t('not_found_title')}
      meta={
        <meta
          name="description"
          content={t('not_found_meta_desc')}
        />
      }
    >
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Container maxWidth="md">
          <ScrollRevealGroup
            stagger={0.09}
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
          <ScrollRevealItem>
            <SearchOffIcon
              sx={{
                fontSize: 120,
                color: 'primary.main',
                mb: 2,
              }}
            />
          </ScrollRevealItem>

          <ScrollRevealItem>
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
          </ScrollRevealItem>

          <ScrollRevealItem>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                mb: 2,
                color: 'text.primary',
              }}
            >
              {t('not_found_heading')}
            </Typography>
          </ScrollRevealItem>

          <ScrollRevealItem>
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                mb: 4,
                maxWidth: 500,
              }}
            >
              {t('not_found_desc')}
            </Typography>
          </ScrollRevealItem>

          <ScrollRevealItem>
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
                onClick={goHome}
                sx={{ px: 4, py: 1.5, textTransform: 'none', fontSize: '1rem' }}
              >
                {t('not_found_go_home')}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={goBack}
                sx={{ px: 4, py: 1.5, textTransform: 'none', fontSize: '1rem' }}
              >
                {t('not_found_go_back')}
              </Button>
            </Box>
          </ScrollRevealItem>
          </ScrollRevealGroup>
        </Container>
      </Box>
    </Page>
  );
}
