import { Box, Button, Container, Typography, Chip, Stack, Card } from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import UpdateIcon from '@mui/icons-material/Update';
import { useTranslation } from 'react-i18next';
import Page from '../../components/Page';
import { useErrorPageActions } from '../../hooks/useErrorPageActions';
import {
  ScrollRevealGroup,
  ScrollRevealItem,
} from '../../components/animations/ScrollReveal';

export default function MaintenancePage() {
  const { t } = useTranslation('common');
  const { goHome, retry } = useErrorPageActions();

  const maintenanceUpdates = [
    {
      icon: <UpdateIcon sx={{ color: 'primary.main' }} />,
      title: t('maintenance_update_system_upgrade_title'),
      description: t('maintenance_update_system_upgrade_desc'),
      status: t('maintenance_update_status_in_progress'),
    },
    {
      icon: <UpdateIcon sx={{ color: 'primary.main' }} />,
      title: t('maintenance_update_security_title'),
      description: t('maintenance_update_security_desc'),
      status: t('maintenance_update_status_in_progress'),
    },
  ];

  return (
    <Page
      title={t('maintenance_title')}
      meta={
        <meta
          name="description"
          content={t('maintenance_meta_desc')}
        />
      }
    >
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          bgcolor: 'background.default',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.05,
            background: `
            radial-gradient(circle at 20% 50%, currentColor 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, currentColor 0%, transparent 50%),
            radial-gradient(circle at 40% 20%, currentColor 0%, transparent 50%)
          `,
            color: 'primary.main',
          }}
        />

        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <ScrollRevealGroup
            stagger={0.09}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              py: 5,
            }}
          >
            <ScrollRevealItem><Box
              sx={{
                bgcolor: 'primary.main',
                borderRadius: '50%',
                p: 3,
                display: 'inline-flex',
                boxShadow: 3,
                mb: 3,
              }}
            >
              <BuildIcon sx={{ fontSize: 80, color: 'primary.contrastText' }} />
            </Box></ScrollRevealItem>

            <ScrollRevealItem><Typography
              variant="h2"
              sx={{
                fontWeight: 700,
                mb: 2,
                fontSize: { xs: '2rem', sm: '3rem', md: '3.5rem' },
                color: 'text.primary',
              }}
            >
              {t('maintenance_subtitle')}
            </Typography></ScrollRevealItem>

            <ScrollRevealItem><Typography
              variant="h6"
              color="text.secondary"
              sx={{ mb: 2, maxWidth: 600, mx: 'auto', lineHeight: 1.8 }}
            >
              {t('maintenance_desc')}
            </Typography></ScrollRevealItem>

            <ScrollRevealItem><Stack
              direction="row"
              spacing={1}
              justifyContent="center"
              alignItems="center"
              sx={{ mb: 4 }}
            >
              <AccessTimeIcon sx={{ color: 'primary.main' }} />
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ fontWeight: 500 }}
              >
                {t('maintenance_estimated_downtime')}
              </Typography>
            </Stack></ScrollRevealItem>

            <ScrollRevealItem><Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
              {t('maintenance_working_on')}
            </Typography></ScrollRevealItem>

            <ScrollRevealItem sx={{ width: '100%', maxWidth: 700 }}>
            <ScrollRevealGroup stagger={0.08} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {maintenanceUpdates.map((update, index) => (
                <ScrollRevealItem key={index}><Card
                  sx={{
                    p: 2.5,
                    display: 'flex',
                    alignItems: 'center',
                    textAlign: 'left',
                    bgcolor: 'background.paper',
                  }}
                >
                  <Box sx={{ mr: 2, display: 'flex' }}>{update.icon}</Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600, mb: 0.5 }}
                    >
                      {update.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {update.description}
                    </Typography>
                  </Box>
                  <Chip
                    label={update.status}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Card></ScrollRevealItem>
              ))}
            </ScrollRevealGroup>
            </ScrollRevealItem>

            <ScrollRevealItem>
              <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
                <Button variant="contained" onClick={retry}>
                  {t('server_error_refresh')}
                </Button>
                <Button variant="outlined" onClick={goHome}>
                  {t('not_found_go_home')}
                </Button>
              </Stack>
            </ScrollRevealItem>
          </ScrollRevealGroup>
        </Container>
      </Box>
    </Page>
  );
}
