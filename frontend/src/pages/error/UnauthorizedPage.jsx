import { useTranslation } from 'react-i18next';
import { useErrorPageActions } from '../../hooks/useErrorPageActions';



const UnauthorizedPage = () => {
  const { t } = useTranslation('common');
  const { goHome } = useErrorPageActions();

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
          <ScrollRevealGroup
            stagger={0.09}
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
            <ScrollRevealItem>
              <Typography variant="h1" sx={{ fontSize: { xs: '5rem', sm: '8rem' }, fontWeight: 700 }}>
                403
              </Typography>
            </ScrollRevealItem>
            <ScrollRevealItem>
              <Typography variant="h5">{t('unauthorized_heading')}</Typography>
            </ScrollRevealItem>
            <ScrollRevealItem>
              <Typography variant="body1" color="text.secondary">
                {t('unauthorized_desc')}
              </Typography>
            </ScrollRevealItem>
            <ScrollRevealItem>
              <Button onClick={goHome} variant="contained" sx={{ mt: 2 }}>
                {t('not_found_go_home')}
              </Button>
            </ScrollRevealItem>
          </ScrollRevealGroup>
        </Container>
      </Box>
    </Page>
  );
};

export default UnauthorizedPage;
