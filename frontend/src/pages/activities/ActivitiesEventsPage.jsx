import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { Button, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';

import { useTranslation } from 'react-i18next';

import ArticleEventCard from '../../components/articles/ArticleEventCard';
import FeaturedArticleEventCard from '../../components/articles/FeaturedArticleEventCard';
import AppPagination from '../../components/AppPagination';
import AdminConfirmDeleteDialog from '../../components/admin/AdminConfirmDeleteDialog';
import AlumniContentLayout from '../../layouts/AlumniContentLayout';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { usePublishedEvents } from '../../hooks/articles/usePublishedEvents';
import { useDebounce } from '../../hooks/useDebounce';
import { toEventCardShape } from '../../hooks/articles/toEventCardShape';
import { useOrganization } from '../../hooks/useOrganization';
import { useAuth } from '../../hooks/useAuth';
import { useCanContribute } from '../../hooks/useCanContribute';
import { eventApi } from '../../utils/api';
import {
  getArticleFilterConfig,
} from '../../utils/articleListFilters';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import { getOrganizationHeroBannerUrl } from '../../utils/organizationBrand';
import {
  ScrollReveal,
  ScrollRevealGroup,
  ScrollRevealItem,
} from '../../components/animations/ScrollReveal';

const EVENT_SECTION_PAGE_SIZE = 6;

const ActivitiesPage = () => {
  const { t } = useTranslation(['nav', 'event']);
  const { slug } = useParams();
  const navigate = useOrgNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { organization } = useOrganization();
  const cardFallbackImage = useMemo(() => getOrganizationHeroBannerUrl(organization), [organization]);

  const [upcomingPage, setUpcomingPage] = useState(0);
  const [ongoingPage, setOngoingPage] = useState(0);
  const [pastPage, setPastPage] = useState(0);
  const [filters, setFilters] = useState({ all: true });
  const debouncedSearch = useDebounce(filters.search ?? '', 400);
  const selectedSort = Array.isArray(filters.sort) ? filters.sort[0] : filters.sort;
  const eventFilterOptions = {
    keyword: debouncedSearch,
    topics: filters.topic,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    sort: selectedSort === 'oldest' ? 'oldest' : 'newest',
  };
  const {
    featured,
    events: upcomingEvents,
    pageInfo: upcomingPageInfo,
  } = usePublishedEvents('upcoming', upcomingPage, EVENT_SECTION_PAGE_SIZE, {
    ...eventFilterOptions,
    withFeatured: true,
  });
  const {
    events: ongoingEvents,
    pageInfo: ongoingPageInfo,
  } = usePublishedEvents('ongoing', ongoingPage, EVENT_SECTION_PAGE_SIZE, {
    ...eventFilterOptions,
    excludeFeatured: true,
  });
  const {
    events: pastEvents,
    pageInfo: pastPageInfo,
  } = usePublishedEvents('past', pastPage, EVENT_SECTION_PAGE_SIZE, eventFilterOptions);
  const upcomingTotalPage = upcomingPageInfo?.totalPage;
  const ongoingTotalPage = ongoingPageInfo?.totalPage;
  const pastTotalPage = pastPageInfo?.totalPage;

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filterConfig = useMemo(() => getArticleFilterConfig(t, ['event']), [t]);

  useEffect(() => {
    if (upcomingTotalPage == null) return;
    setUpcomingPage((current) => Math.min(current, Math.max(upcomingTotalPage - 1, 0)));
  }, [upcomingTotalPage]);

  useEffect(() => {
    if (ongoingTotalPage == null) return;
    setOngoingPage((current) => Math.min(current, Math.max(ongoingTotalPage - 1, 0)));
  }, [ongoingTotalPage]);

  useEffect(() => {
    if (pastTotalPage == null) return;
    setPastPage((current) => Math.min(current, Math.max(pastTotalPage - 1, 0)));
  }, [pastTotalPage]);

  const featuredCard = featured ? toEventCardShape(featured, cardFallbackImage) : null;
  const upcomingCards = upcomingEvents.map((event) => toEventCardShape(event, cardFallbackImage));
  const ongoingCards = ongoingEvents.map((event) => toEventCardShape(event, cardFallbackImage));
  const pastCards = pastEvents.map((event) => toEventCardShape(event, cardFallbackImage));

  const openArticle = (article) => {
    if (!article?.id) return;
    navigate(`/article/${article.channel}/${article.id}`);
  };

  const { isAuthenticated } = useAuth();
  const { isOrgManager } = useCanContribute();
  const isAdmin = isAuthenticated && isOrgManager;
  const adminBase = slug ? `/${slug}/admin` : '/admin';

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
          onClick={() => navigate(`${adminBase}/events`)}
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
          setOngoingPage(0);
          setPastPage(0);
        },
      }}
      search={{
        value: filters.search,
        onChange: (val) => {
          setFilters((prev) => ({ ...prev, search: val }));
          setUpcomingPage(0);
          setOngoingPage(0);
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
                      <ScrollRevealItem key={card.id ?? i} sx={{ cursor: 'pointer' }} onClick={() => openArticle(upcomingEvents[i])}>
                        <ArticleEventCard
                          article={card}
                          isAdmin={isAdmin}
                          onEdit={() => handleEdit(upcomingEvents[i])}
                          onDelete={() => handleDelete(upcomingEvents[i])}
                        />
                      </ScrollRevealItem>
                    ))}
                  </ScrollRevealGroup>
                  <AppPagination
                    count={upcomingPageInfo?.totalPage ?? 1}
                    page={upcomingPage + 1}
                    onChange={(_, value) => setUpcomingPage(value - 1)}
                  />
                </ScrollRevealGroup>
              )}

              {/* ONGOING */}
              {ongoingCards.length > 0 && (
                <ScrollRevealGroup stagger={0.08}>
                  <ScrollRevealItem>
                    <Typography variant="h4" fontWeight={700} mb={3}>
                      {t('event:ongoing')}
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
                    {ongoingCards.map((card, i) => (
                      <ScrollRevealItem key={card.id ?? i} sx={{ cursor: 'pointer' }} onClick={() => openArticle(ongoingEvents[i])}>
                        <ArticleEventCard
                          article={card}
                          isAdmin={isAdmin}
                          onEdit={() => handleEdit(ongoingEvents[i])}
                          onDelete={() => handleDelete(ongoingEvents[i])}
                        />
                      </ScrollRevealItem>
                    ))}
                  </ScrollRevealGroup>
                  <AppPagination
                    count={ongoingPageInfo?.totalPage ?? 1}
                    page={ongoingPage + 1}
                    onChange={(_, value) => setOngoingPage(value - 1)}
                  />
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
                      <ScrollRevealItem key={card.id ?? i} sx={{ cursor: 'pointer' }} onClick={() => openArticle(pastEvents[i])}>
                        <ArticleEventCard
                          article={card}
                          isAdmin={isAdmin}
                          onEdit={() => handleEdit(pastEvents[i])}
                          onDelete={() => handleDelete(pastEvents[i])}
                        />
                      </ScrollRevealItem>
                    ))}
                  </ScrollRevealGroup>
                  <AppPagination
                    count={pastPageInfo?.totalPage ?? 1}
                    page={pastPage + 1}
                    onChange={(_, value) => setPastPage(value - 1)}
                  />
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
