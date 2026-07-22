import { Box, Container, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import Page from '../components/Page';
import Sidebar from '../components/Sidebar';
import DynamicFilterBar from '../components/DynamicFilterBar';
import SearchBar from '../components/SearchBar';
import ForumSponsoredCard from '../components/forum/ForumSponsoredCard';
import {
  ScrollReveal,
  ScrollRevealGroup,
  ScrollRevealItem,
} from '../components/animations/ScrollReveal';

const DEFAULT_SPONSORED_MEDIA = {
  imageSrc: '/forum/metro_station.png',
  href: 'https://hcmc-metro.com/',
};

const HeaderBlock = ({
  title,
  description,
  actions,
  stats,
  filters,
  search,
  uppercaseTitle = false,
}) => {
  const hasHeader = title || description || actions || stats || filters || search;
  if (!hasHeader) return null;

  return (
    <ScrollRevealGroup
      stagger={0.09}
      sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
    >
      {(title || actions) && (
        <ScrollRevealItem
          sx={{
            display: 'flex',
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
          }}
        >
          {title && (
            <Typography
              variant="h1"
              fontWeight={800}
              color="primary.main"
              sx={{ fontSize: { xs: '1.8rem', md: '2.3rem' } }}
            >
              {uppercaseTitle ? String(title).toUpperCase() : title}
            </Typography>
          )}
          {actions}
        </ScrollRevealItem>
      )}

      {description && (
        <ScrollRevealItem>
          <Typography color="text.secondary">
            {description}
          </Typography>
        </ScrollRevealItem>
      )}

      {stats ? <ScrollRevealItem>{stats}</ScrollRevealItem> : null}

      {filters?.config?.length ? (
        <ScrollRevealItem>
          <DynamicFilterBar
            config={filters.config}
            value={filters.value}
            onChange={filters.onChange}
          />
        </ScrollRevealItem>
      ) : null}

      {search ? (
        <ScrollRevealItem>
          <SearchBar
            value={search.value}
            onChange={search.onChange}
            placeholder={search.placeholder}
          />
        </ScrollRevealItem>
      ) : null}
    </ScrollRevealGroup>
  );
};

const AlumniContentLayout = ({
  pageTitle,
  meta,
  variant = 'one',
  maxWidth,
  minHeight = 'calc(100vh - 72px)',
  sidebarItems,
  sidebar,
  sidebarWidth = 260,
  showSponsored = variant !== 'one',
  sponsored,
  title,
  description,
  actions,
  stats,
  filters,
  search,
  uppercaseTitle,
  header,
  children,
  after,
  contentSpacing = 5,
  mainSx,
  outerSx,
}) => {
  const { t } = useTranslation('forum');
  const isOneColumn = variant === 'one';
  const resolvedMaxWidth = maxWidth ?? (isOneColumn ? 'lg' : 'xl');
  const sidebarContent = sidebar ?? (sidebarItems?.length ? <Sidebar items={sidebarItems} /> : null);
  const resolvedSponsored = sponsored ?? {
    ...DEFAULT_SPONSORED_MEDIA,
    title: t('sponsored'),
    imageAlt: t('sponsored_metro_alt'),
    caption: t('sponsored_metro_title'),
    description: t('sponsored_metro_description'),
  };

  return (
    <Page title={pageTitle ?? title} meta={meta}>
      <Container maxWidth={false} disableGutters sx={{ minHeight, pb: { xs: 4, md: 6 }, overflowX: 'hidden', ...outerSx }}>
        <Container
          maxWidth={resolvedMaxWidth}
          sx={{ pt: { xs: 2, sm: 3, md: 4 }, px: { xs: 1, sm: 3, lg: 6 } }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'flex-start',
              gap: { xs: 2, md: 3 },
            }}
          >
            {!isOneColumn && (
              <Stack spacing={2} sx={{ width: { xs: '100%', md: sidebarWidth }, flexShrink: 0 }}>
                {sidebarContent ? (
                  <ScrollReveal direction="right" delay={0.04}>
                    {sidebarContent}
                  </ScrollReveal>
                ) : null}
                {showSponsored && resolvedSponsored ? (
                  <ScrollReveal direction="right" delay={0.12}>
                    <ForumSponsoredCard {...resolvedSponsored} />
                  </ScrollReveal>
                ) : null}
              </Stack>
            )}

            <Stack
              spacing={contentSpacing}
              sx={{
                flex: 1,
                minWidth: 0,
                width: '100%',
                px: isOneColumn ? 0 : { xs: 0, sm: 2, md: 2.75 },
                ...mainSx,
              }}
            >
              {header ? <ScrollReveal>{header}</ScrollReveal> : (
                <HeaderBlock
                  title={title}
                  description={description}
                  actions={actions}
                  stats={stats}
                  filters={filters}
                  search={search}
                  uppercaseTitle={uppercaseTitle}
                />
              )}
              {children}
            </Stack>
          </Box>
        </Container>
      </Container>
      {after}
    </Page>
  );
};

export default AlumniContentLayout;
