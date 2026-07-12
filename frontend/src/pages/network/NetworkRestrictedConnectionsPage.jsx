import { useTranslation } from 'react-i18next';




const NetworkRestrictedConnectionsPage = () => {
  const { t } = useTranslation('network');

  return (
    <NetworkSectionLayout title={t('restricted_layout_title')}>
      <ScrollRevealGroup stagger={0.08} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <ScrollRevealItem><Typography
          variant="h1"
          fontWeight={800}
          color="primary.main"
          sx={{ fontSize: { xs: '1.8rem', md: '2.3rem' } }}
        >
          {t('restricted_heading')}
        </Typography></ScrollRevealItem>

        <ScrollRevealItem><Typography color="text.secondary">
          {t('restricted_subheading')}
        </Typography></ScrollRevealItem>

        <NetworkBlockedMembersSection />
      </ScrollRevealGroup>
    </NetworkSectionLayout>
  );
};

export default NetworkRestrictedConnectionsPage;
