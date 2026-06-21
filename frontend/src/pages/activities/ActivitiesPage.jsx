import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Box, Button, Container, Stack, Typography } from '@mui/material';

import { ACTIVITIES_SIDEBAR } from '../../constants/activitiesNav';

import Page from '../../components/Page';

import ForumSponsoredCard from '../../components/forum/ForumSponsoredCard';
import DynamicFilterBar from '../../components/DynamicFilterBar';
import SearchBar from '../../components/SearchBar';
import FeaturedArticleCard from '../../components/articles/FeaturedArticleCard';
import ArticleCard from '../../components/articles/ArticleCard';
import ArticleEventCard from '../../components/articles/ArticleEventCard';
import Sidebar from '../../components/Sidebar';
import AdminConfirmDeleteDialog from '../../components/admin/AdminConfirmDeleteDialog';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { usePublishedNews } from '../../hooks/news/usePublishedNews';
import { normalizeNews } from '../../hooks/articles/normalizeArticle';
import { toCardShape } from '../../hooks/articles/toCardShape';
import { usePublishedEvents } from '../../hooks/articles/usePublishedEvents';
import { toEventCardShape } from '../../hooks/articles/toEventCardShape';
import { useAuth } from '../../hooks/useAuth';
import { useSnackbar } from 'notistack';
import apiClient from '../../utils/axios';
import { eventApi } from '../../utils/api';


const FILTERS = [
  {
    type: 'dropdown',
    key: 'type',
    label: 'Chủ đề',
    multiple: true,
    options: [
      'Học thuật',
      'Sinh viên',
      'Sự kiện trường',
      'Cộng đồng',
      'Thông báo',
    ],
  },
  {
    type: 'date',
    key: 'date',
    label: 'Ngày',
  },
  {
    type: 'topics',
    key: 'topics',
    label: 'Chủ đề',
    options: ['Thịnh hành', 'Mới nhất', 'Quan tâm'],
  },
];

const CHANNEL_TO_ENDPOINT = {
  news: '/admin/articles/news',
  alumni: '/admin/articles/alumni-posts',
  achievement: '/admin/articles/achievements',
  job: '/admin/articles/jobs',
  learning: '/admin/articles/learning-resources',
};

const ActivitiesPage = () => {
  const navigate = useOrgNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const { news: rawNews } = usePublishedNews(0, 7);
  const { events: upcomingEvents } = usePublishedEvents('upcoming', 0, 3);

  const [filters, setFilters] = useState({ all: true });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const newsItems = rawNews.map(normalizeNews);
  const [featuredNews, ...newsRest] = newsItems;
  const featuredCard = featuredNews ? toCardShape(featuredNews) : null;
  const newsCards = newsRest.slice(0, 3).map(toCardShape);
  const eventCards = upcomingEvents.slice(0, 3).map(toEventCardShape);

  const openArticle = (article) => {
    if (!article?.id) return;
    navigate(`/article/${article.channel}/${article.id}`);
  };

  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && user?.role === 'ADMIN';

  const handleEdit = (article) => {
    navigate(`/article/${article.channel}/${article.id}/edit`);
  };

  const handleDelete = (article) => setDeleteTarget(article);

  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      if (deleteTarget.channel === 'event') {
        await eventApi.deleteEvent(deleteTarget.id);
        queryClient.invalidateQueries({ queryKey: ['publishedEvents'] });
      } else {
        const endpoint = CHANNEL_TO_ENDPOINT[deleteTarget.channel];
        if (endpoint) await apiClient.delete(`${endpoint}/${deleteTarget.id}`);
        queryClient.invalidateQueries({ queryKey: ['publishedNews'] });
      }
      enqueueSnackbar('Đã xoá thành công.', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Xoá thất bại.', { variant: 'error' });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <Page title="Hoạt động">
      <Container
        maxWidth={false}
        disableGutters
        sx={{ pb: 6 }}
      >
        <Container maxWidth="xl" sx={{ pt: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3, lg: 6 } }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 3 } }}>
            {/* SIDEBAR */}
            <Stack spacing={2} sx={{ width: { xs: '100%', md: 260 } }}>
              <Sidebar items={ACTIVITIES_SIDEBAR} />
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
                    HOẠT ĐỘNG
                  </Typography>
                  {isAdmin && (
                    <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end" useFlexGap>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => navigate('/admin/events')}
                      >
                        Quản lý sự kiện
                      </Button>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => navigate('/admin/article')}
                      >
                        Quản lý tin tức
                      </Button>
                    </Stack>
                  )}
                </Box>

                {/* FILTERS */}
                <DynamicFilterBar
                  config={FILTERS}
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
                <Box sx={{ cursor: 'pointer' }} onClick={() => openArticle(featuredNews)}>
                  <FeaturedArticleCard
                    article={featuredCard}
                    isAdmin={isAdmin}
                    onEdit={() => handleEdit(featuredNews)}
                    onDelete={() => handleDelete(featuredNews)}
                  />
                </Box>
              )}

              {/* NEWS SECTION */}
              {newsCards.length > 0 && (
                <Box>
                  <Typography variant="h4" fontWeight={700} mb={3}>
                    Tin tức hàng ngày
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
                    {newsCards.map((card, i) => (
                      <Box key={card.id ?? i} sx={{ cursor: 'pointer' }} onClick={() => openArticle(newsRest[i])}>
                        <ArticleCard
                          article={card}
                          isAdmin={isAdmin}
                          onEdit={() => handleEdit(newsRest[i])}
                          onDelete={() => handleDelete(newsRest[i])}
                        />
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* EVENTS SECTION */}
              {eventCards.length > 0 && (
                <Box>
                  <Typography variant="h4" fontWeight={700} mb={3}>
                    Sự kiện sắp diễn ra
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
                    {eventCards.map((card, i) => (
                      <Box key={card.id ?? i} sx={{ cursor: 'pointer' }} onClick={() => openArticle(upcomingEvents[i])}>
                        <ArticleEventCard
                          article={card}
                          isAdmin={isAdmin}
                          onEdit={() => handleEdit(upcomingEvents[i])}
                          onDelete={() => handleDelete(upcomingEvents[i])}
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
        title="Xoá bài viết"
        description={`Bạn có chắc muốn xoá "${deleteTarget?.title}"? Hành động này không thể hoàn tác.`}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
      />
    </Page>
  );
};

export default ActivitiesPage;
