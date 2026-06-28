import { Box, Button, Container, Stack, Typography, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Page from '../../components/Page';
import Breadcrumb from '../../components/Breadcrumb';
import ForumFilterPanel from '../../components/forum/ForumFilterPanel';
import ForumSponsoredCard from '../../components/forum/ForumSponsoredCard';
import ForumTopicListItem from '../../components/forum/ForumTopicListItem';

import { useOrganization } from '../../hooks/useOrganization';
import { useForumCategoryLogic } from '../../hooks/forum/useForumCategoryLogic';
import { useCanContribute } from '../../hooks/useCanContribute';

const ForumCategoryPage = () => {
  const { t } = useTranslation(['forum', 'common']);
  const { canContribute, isAuthenticated } = useCanContribute();
  const { organization } = useOrganization();
  const organizationId = organization?.id ?? null;

  const {
    categoryId,
    topics,
    topicsPending,
    isError,
    filters,
    activeCategory,
    selectedSidebarId,
    breadcrumbItems,
    pageTitle,
    handleFilterChange,
    navigate,
  } = useForumCategoryLogic(organizationId);

  const handleTopicClick = (topic) => {
    navigate(`/forum/alumni/career/${topic.id}`, {
      state: {
        topicTitle: topic.title,
        topicSummary: {
          id: topic.id,
          title: topic.title,
          createdByMemberId: topic.createdByMemberId ?? null,
          createdAt: topic.createdAt ?? null,
          viewCount: topic.viewCount ?? null,
          categoryId: topic.categoryId ?? null,
        },
        selectedFilterId:
          activeCategory?.parentId != null
            ? `parent-${activeCategory.parentId}`
            : `parent-${categoryId}`,
      },
    });
  };

  if (categoryId == null) {
    return (
      <Page title={t('common:not_found')} meta={<meta name="description" content={t('forum:invalid_category')} />}>
        <Container sx={{ py: 4 }}>
          <Typography color="text.secondary">{t('forum:invalid_category')}</Typography>
          <Button sx={{ mt: 2 }} onClick={() => navigate('/forum')} variant="contained">
            {t('forum:back_to_forum')}
          </Button>
        </Container>
      </Page>
    );
  }

  return (
    <Page
      title={pageTitle}
      meta={<meta name="description" content={t('forum:topics_in_category', { name: activeCategory?.name ?? t('forum:category') })} />}
    >
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          pb: { xs: 4, md: 6 },
          overflowX: 'hidden',
        }}
      >
        <Container maxWidth="xl" sx={{ pt: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3, lg: 6 } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'flex-start',
              gap: { xs: 2, md: 3 },
            }}
          >
            <Stack spacing={2} sx={{ width: { xs: '100%', md: 260 }, flexShrink: 0 }}>
              <ForumFilterPanel filters={filters} selectedId={selectedSidebarId} onChange={handleFilterChange} />
              <ForumSponsoredCard
                title="Sponsored"
                imageSrc="/forum/metro_station.png"
                imageAlt="HCMC Metro Opening"
                caption="HCMC Metro Opening"
              />
            </Stack>

            <Stack
              spacing={0}
              sx={{
                flex: 1,
                minWidth: 0,
                width: '100%',
                px: { xs: 1.5, sm: 2, md: 2.75 },
              }}
            >
              <Breadcrumb items={breadcrumbItems} uppercase color="primary" />
              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  backgroundColor: '#fff',
                  border: 1,
                  borderColor: 'divider',
                }}
              >
                <Box
                  sx={{
                    px: { xs: 1.5, sm: 2, md: 3 },
                    py: { xs: 1.5, md: 2 },
                    borderBottom: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      justifyContent: 'space-between',
                      gap: 2,
                      mt: 1,
                    }}
                  >
                    <Typography
                      variant="h4"
                      component="h1"
                      fontWeight={800}
                      color="primary.main"
                      sx={{
                        fontSize: { xs: '1.35rem', sm: '1.5rem', md: '1.75rem' },
                        wordBreak: 'break-word',
                      }}
                    >
                      {(activeCategory?.name ?? t('forum:category')).toUpperCase()}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 1,
                        width: { xs: '100%', sm: 'auto' },
                      }}
                    >
                      <Tooltip
                        title={canContribute ? "" : (!isAuthenticated ? t('common:verification_required_login') : t('common:verification_required_tooltip'))}
                        placement="top"
                        arrow
                      >
                        <span>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => navigate('/forum/alumni/career/create-topic')}
                            sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
                            disabled={!canContribute}
                          >
                            {t('create_post')}
                          </Button>
                        </span>
                      </Tooltip>
                    </Box>
                  </Box>
                </Box>

                <Box>
                  {topicsPending && !topics?.length ? (
                    <Box sx={{ px: 3, py: 4 }}>
                      <Typography color="text.secondary">{t('common:loading')}</Typography>
                    </Box>
                  ) : !topics?.length ? (
                    <Box sx={{ px: 3, py: 4 }}>
                      <Typography color="text.secondary">{t('no_topics_in_category')}</Typography>
                    </Box>
                  ) : (
                    topics.map((topic) => (
                      <ForumTopicListItem
                        key={topic.id}
                        topic={topic}
                        activeCategory={activeCategory}
                        categoryId={categoryId}
                        onClick={handleTopicClick}
                      />
                    ))
                  )}
                </Box>
              </Box>
            </Stack>
          </Box>
        </Container>
      </Container>
    </Page>
  );
};

export default ForumCategoryPage;
