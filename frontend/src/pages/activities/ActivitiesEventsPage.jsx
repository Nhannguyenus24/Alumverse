import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Box, Button, Pagination, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';

import { useTranslation } from 'react-i18next';

import ArticleEventCard from '../../components/articles/ArticleEventCard';
import FeaturedArticleEventCard from '../../components/articles/FeaturedArticleEventCard';
import AdminConfirmDeleteDialog from '../../components/admin/AdminConfirmDeleteDialog';
import AlumniContentLayout from '../../layouts/AlumniContentLayout';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { usePublishedEvents } from '../../hooks/articles/usePublishedEvents';
import { toEventCardShape } from '../../hooks/articles/toEventCardShape';
import { useAuth } from '../../hooks/useAuth';
import { eventApi } from '../../utils/api';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';


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
    options: [t('event:format_online'), t('event:format_offline')],
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

  const [upcomingPage, setUpcomingPage] = useState(0);
  const [pastPage, setPastPage] = useState(0);
  const { events: upcomingEvents, pageInfo: upcomingPageInfo } = usePublishedEvents('upcoming', upcomingPage, 7);
  const { events: pastEvents, pageInfo: pastPageInfo } = usePublishedEvents('past', pastPage, 6);

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
    navigate(`/post/event/${event.id}`);
  };

  const handleDelete = (event) => setDeleteTarget(event);

  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await eventApi.deleteAdminEvent(deleteTarget.id);
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
    <AlumniContentLayout
      variant="one"
      maxWidth="lg"
      pageTitle={t('event:title')}
      meta={<meta name="description" content={t('event:events_description')} />}
      title={t('event:events')}
      description={t('event:events_description')}
      uppercaseTitle
      actions={isAdmin && (
        <Button
          variant="outlined"
          color="primary"
          startIcon={<EventNoteOutlinedIcon />}
          onClick={() => navigate('/admin/events')}
        >
          {t('event:manage_events')}
        </Button>
      )}
      filters={{
        config: getEventFilters(t),
        value: filters,
        onChange: setFilters,
      }}
      search={{
        value: filters.search,
        onChange: (val) => setFilters((prev) => ({ ...prev, search: val })),
      }}
    >
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
                  {(upcomingPageInfo?.totalPage ?? 0) > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                      <Pagination
                        color="primary"
                        count={upcomingPageInfo.totalPage}
                        page={upcomingPage + 1}
                        onChange={(_, value) => setUpcomingPage(value - 1)}
                      />
                    </Box>
                  )}
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
                  {(pastPageInfo?.totalPage ?? 0) > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                      <Pagination
                        color="primary"
                        count={pastPageInfo.totalPage}
                        page={pastPage + 1}
                        onChange={(_, value) => setPastPage(value - 1)}
                      />
                    </Box>
                  )}
                </Box>
              )}

      <AdminConfirmDeleteDialog
        open={!!deleteTarget}
        title={t('event:delete_event')}
        description={t('event:confirm_delete_desc', { title: deleteTarget?.title })}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
      />
    </AlumniContentLayout>
  );
};

export default ActivitiesPage;
