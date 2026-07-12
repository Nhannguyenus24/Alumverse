import { useTranslation } from 'react-i18next';




const NetworkConnectionsPanel = ({ variant = 'page', enableBlock = true }) => {
  const { t } = useTranslation('network');
  const showBlockedSection = variant === 'embedded';

  return (
    <Stack spacing={4}>
      {variant === 'page' ? (
        <ScrollRevealGroup stagger={0.08} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <ScrollRevealItem><Typography
            variant="h1"
            fontWeight={800}
            color="primary.main"
            sx={{ fontSize: { xs: '1.8rem', md: '2.3rem' } }}
          >
            {t('connections_heading')}
          </Typography></ScrollRevealItem>
          <ScrollRevealItem><Typography color="text.secondary">
            {t('connections_subheading')}
          </Typography></ScrollRevealItem>
        </ScrollRevealGroup>
      ) : null}

      <NetworkConnectionsSection enableBlock={enableBlock} />

      {showBlockedSection ? (
        <>
          <ScrollReveal><Divider /></ScrollReveal>
          <NetworkBlockedMembersSection />
        </>
      ) : null}
    </Stack>
  );
};

export default NetworkConnectionsPanel;
