import { useMemo, useState } from 'react';
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
import {
  ARTICLE_FETCH_LIMIT,
  applyArticleFilters,
  getArticleFilterConfig,
  paginateArticles,
} from '../../utils/articleListFilters';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import {
  ScrollReveal,
  ScrollRevealGroup,
  ScrollRevealItem,
} from '../../components/animations/ScrollReveal';

const ActivitiesPage = () => {
  const { t } = useTranslation(['nav', 'event']);
  const navigate = useOrgNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [upcomingPage, setUpcomingPage] = useState(0);
  const [pastPage, setPastPage] = useState(0);
  const { events: upcomingEvents } = usePublishedEvents('upcoming', 0, ARTICLE_FETCH_LIMIT);
  const { events: pastEvents } = usePublishedEvents('past', 0, ARTICLE_FETCH_LIMIT);

  const [filters, setFilters] = useState({ all: true });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filterConfig = useMemo(() => getArticleFilterConfig(t, ['event']), [t]);
  const filteredUpcomingEvents = useMemo(
    () => applyArticleFilters(upcomingEvents, filters),
    [upcomingEvents, filters],
  );
  const filteredPastEvents = useMemo(
    () => applyArticleFilters(pastEvents, filters),
    [pastEvents, filters],
  );
  const { items: pagedUpcomingEvents, pageInfo: upcomingPageInfo } = useMemo(
    () => paginateArticles(filteredUpcomingEvents, upcomingPage, 7),
    [filteredUpcomingEvents, upcomingPage],
  );
  const { items: pagedPastEvents, pageInfo: pastPageInfo } = useMemo(
    () => paginateArticles(filteredPastEvents, pastPage, 6),
    [filteredPastEvents, pastPage],
  );

  const [featured, ...upcomingRest] = pagedUpcomingEvents;
  const featuredCard = featured ? toEventCardShape(featured) : null;
  const upcomingCards = upcomingRest.slice(0, 6).map(toEventCardShape);
  const pastCards = pagedPastEvents.slice(0, 6).map(toEventCardShape);

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
        config: filterConfig,
        value: filters,
        onChange: (next) => {
          setFilters(next);
          setUpcomingPage(0);
          setPastPage(0);
        },
      }}
      search={{
        value: filters.search,
        onChange: (val) => {
          setFilters((prev) => ({ ...prev, search: val }));
          setUpcomingPage(0);
          setPastPage(0);
        },
      }}
    >
              {/* FEATURED ARTICLE */}
              {featuredCard && (
                <ScrollReveal sx={{ cursor: 'pointer' }} onClick={() => openArticle(featured)}>
                  <FeaturedArticleEventCard
                    article={featuredCard}
                    isAdmin={isAdmin}
                    onEdit={() => handleEdit(featured)}
                    onDelete={() => handleDelete(featured)}
                  />
                </ScrollReveal>
              )}

              {/* UPCOMING */}
              {upcomingCards.length > 0 && (
                <ScrollRevealGroup stagger={0.08}>
                  <ScrollRevealItem>
                    <Typography variant="h4" fontWeight={700} mb={3}>
                      {t('event:upcoming')}
                    </Typography>
                  </ScrollRevealItem>

                  <ScrollRevealGroup
                    stagger={0.08}
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
                      <ScrollRevealItem key={card.id ?? i} sx={{ cursor: 'pointer' }} onClick={() => openArticle(upcomingRest[i])}>
                        <ArticleEventCard
                          article={card}
                          isAdmin={isAdmin}
                          onEdit={() => handleEdit(upcomingRest[i])}
                          onDelete={() => handleDelete(upcomingRest[i])}
                        />
                      </ScrollRevealItem>
                    ))}
                  </ScrollRevealGroup>
                  {(upcomingPageInfo?.totalPage ?? 0) > 1 && (
                    <ScrollRevealItem sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                      <Pagination
                        color="primary"
                        count={upcomingPageInfo.totalPage}
                        page={upcomingPage + 1}
                        onChange={(_, value) => setUpcomingPage(value - 1)}
                      />
                    </ScrollRevealItem>
                  )}
                </ScrollRevealGroup>
              )}

              {/* PAST */}
              {pastCards.length > 0 && (
                <ScrollRevealGroup stagger={0.08}>
                  <ScrollRevealItem>
                    <Typography variant="h4" fontWeight={700} mb={3}>
                      {t('event:ended')}
                    </Typography>
                  </ScrollRevealItem>

                  <ScrollRevealGroup
                    stagger={0.08}
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
                      <ScrollRevealItem key={card.id ?? i} sx={{ cursor: 'pointer' }} onClick={() => openArticle(pagedPastEvents[i])}>
                        <ArticleEventCard
                          article={card}
                          isAdmin={isAdmin}
                          onEdit={() => handleEdit(pagedPastEvents[i])}
                          onDelete={() => handleDelete(pagedPastEvents[i])}
                        />
                      </ScrollRevealItem>
                    ))}
                  </ScrollRevealGroup>
                  {(pastPageInfo?.totalPage ?? 0) > 1 && (
                    <ScrollRevealItem sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                      <Pagination
                        color="primary"
                        count={pastPageInfo.totalPage}
                        page={pastPage + 1}
                        onChange={(_, value) => setPastPage(value - 1)}
                      />
                    </ScrollRevealItem>
                  )}
                </ScrollRevealGroup>
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
