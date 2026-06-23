import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';

import { getActivitiesSidebar } from '../../constants/activitiesNav';
import { useTranslation } from 'react-i18next';

import Page from '../../components/Page';

import ForumSponsoredCard from '../../components/forum/ForumSponsoredCard';
import DynamicFilterBar from '../../components/DynamicFilterBar';
import SearchBar from '../../components/SearchBar';
import ArticleEventCard from '../../components/articles/ArticleEventCard';
import FeaturedArticleEventCard from '../../components/articles/FeaturedArticleEventCard';
import Sidebar from '../../components/Sidebar';
import AdminConfirmDeleteDialog from '../../components/admin/AdminConfirmDeleteDialog';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { usePublishedEvents } from '../../hooks/articles/usePublishedEvents';
import { toEventCardShape } from '../../hooks/articles/toEventCardShape';
import { useAuth } from '../../hooks/useAuth';
import { eventApi } from '../../utils/api';


const getEventFilters = (t) => [
  {
    type: 'dropdown',
    key: 'type',
    label: t('event:filter_topic'),
    multiple: true,
    options: [
      t('event:opt_academic'),
      t('event:opt_student'),
      t('event:opt_school_event'),
      t('event:opt_community'),
      t('event:opt_announcement'),
    ],
  },
  {
    type: 'dropdown',
    key: 'format',
    label: t('event:filter_format'),
    multiple: true,
    options: ['Online', 'Offline'],
  },
  {
    type: 'date',
    key: 'date',
    label: t('event:filter_date'),
  },
  {
    type: 'dropdown',
    key: 'status',
    label: t('event:filter_status'),
    multiple: true,
    options: [
      t('event:upcoming'),
      t('event:ongoing'),
      t('event:ended'),
    ],
  },
  {
    type: 'topics',
    key: 'topics',
    label: t('event:filter_topic'),
    options: [t('event:opt_trending'), t('event:opt_newest'), t('event:opt_interested')],
  },
];


const ActivitiesPage = () => {
  const { t } = useTranslation(['nav', 'event']);
  const navigate = useOrgNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const { events: upcomingEvents } = usePublishedEvents('upcoming', 0, 9);
  const { events: pastEvents } = usePublishedEvents('past', 0, 6);

  const [filters, setFilters] = useState({ all: true });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [featured, ...upcomingRest] = upcomingEvents;
  const featuredCard = featured ? toEventCardShape(featured) : null;
  const upcomingCards = upcomingRest.slice(0, 6).map(toEventCardShape);
  const pastCards = pastEvents.slice(0, 6).map(toEventCardShape);

  const openArticle = (article) => {
    if (!article?.id) return;
    navigate(`/article/${article.channel}/${article.id}`);
  };

  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && user?.role === 'ADMIN';

  const handleEdit = (event) => {
    navigate(`/activities/events/${event.id}/edit`);
  };

  const handleDelete = (event) => setDeleteTarget(event);

  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await eventApi.deleteEvent(deleteTarget.id);
      queryClient.invalidateQueries({ queryKey: ['publishedEvents'] });
      enqueueSnackbar(t('event:delete_event_success'), { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || t('event:delete_event_failed'), { variant: 'error' });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <Page title={t('event:title')}>
      <Container
        maxWidth={false}
        disableGutters
        sx={{ pb: 6 }}
      >
        <Container maxWidth="xl" sx={{ pt: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3, lg: 6 } }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 3 } }}>
            {/* SIDEBAR */}
            <Stack spacing={2} sx={{ width: { xs: '100%', md: 260 } }}>
              <Sidebar items={getActivitiesSidebar(t)} />
              <ForumSponsoredCard
                title="Sponsored"
                imageSrc="/forum/metro_station.png"
                imageAlt="HCMC Metro Opening"
                caption="HCMC Metro Opening"
              />
            </Stack>

            {/* MAIN CONTENT */}
            <Stack spacing={5}
                   sx={{ flex: 1, minWidth: 0, width: '100%', px: { xs: 1.5, sm: 2, md: 2.75 }}}
            >
              <Stack gap={2}>
                {/* HEADER */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography
                    variant="h1"
                    fontWeight={800}
                    color="primary.main"
                    sx={{ fontSize: { xs: '1.8rem', md: '2.3rem' } }}
                    >
                    {t('event:events').toUpperCase()}
                  </Typography>
                  {isAdmin && (
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => navigate('/admin/events')}
                    >
                      {t('event:manage_events')}
                    </Button>
                  )}
                </Box>

                {/* FILTERS */}
                <DynamicFilterBar
                  config={getEventFilters(t)}
                  value={filters}
                  onChange={setFilters}
                />

                {/* SEARCH */}
                <SearchBar
                  value={filters.search}
                  onChange={(val) =>
                    setFilters((prev) => ({ ...prev, search: val }))
                  }
                />
              </Stack>

              {/* FEATURED ARTICLE */}
              {featuredCard && (
                <Box sx={{ cursor: 'pointer' }} onClick={() => openArticle(featured)}>
                  <FeaturedArticleEventCard
                    article={featuredCard}
                    isAdmin={isAdmin}
                    onEdit={() => handleEdit(featured)}
                    onDelete={() => handleDelete(featured)}
                  />
                </Box>
              )}

              {/* UPCOMING */}
              {upcomingCards.length > 0 && (
                <Box>
                  <Typography variant="h4" fontWeight={700} mb={3}>
                    {t('event:upcoming')}
                  </Typography>

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: '1fr 1fr',
                        md: '1fr 1fr 1fr',
                      },
                      gap: 4,
                    }}
                  >
                    {upcomingCards.map((card, i) => (
                      <Box key={card.id ?? i} sx={{ cursor: 'pointer' }} onClick={() => openArticle(upcomingRest[i])}>
                        <ArticleEventCard
                          article={card}
                          isAdmin={isAdmin}
                          onEdit={() => handleEdit(upcomingRest[i])}
                          onDelete={() => handleDelete(upcomingRest[i])}
                        />
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* PAST */}
              {pastCards.length > 0 && (
                <Box>
                  <Typography variant="h4" fontWeight={700} mb={3}>
                    {t('event:ended')}
                  </Typography>

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: '1fr 1fr',
                        md: '1fr 1fr 1fr',
                      },
                      gap: 4,
                    }}
                  >
                    {pastCards.map((card, i) => (
                      <Box key={card.id ?? i} sx={{ cursor: 'pointer' }} onClick={() => openArticle(pastEvents[i])}>
                        <ArticleEventCard
                          article={card}
                          isAdmin={isAdmin}
                          onEdit={() => handleEdit(pastEvents[i])}
                          onDelete={() => handleDelete(pastEvents[i])}
                        />
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Stack>
          </Box>
        </Container>
      </Container>

      <AdminConfirmDeleteDialog
        open={!!deleteTarget}
        title={t('event:delete_event')}
        description={t('event:confirm_delete_desc', { title: deleteTarget?.title })}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
      />
    </Page>
  );
};

export default ActivitiesPage;
