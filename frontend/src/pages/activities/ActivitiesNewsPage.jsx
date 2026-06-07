import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Box, Button, Container, Stack, Typography } from '@mui/material';

import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import EventIcon from '@mui/icons-material/Event';
import ArticleIcon from '@mui/icons-material/Article';

import Page from '../../components/Page';

import ForumSponsoredCard from '../../components/forum/ForumSponsoredCard';
import DynamicFilterBar from '../../components/DynamicFilterBar';
import SearchBar from '../../components/SearchBar';
import FeaturedArticleCard from '../../components/articles/FeaturedArticleCard';
import ArticleCard from '../../components/articles/ArticleCard';
import Sidebar from '../../components/Sidebar';
import AdminConfirmDeleteDialog from '../../components/admin/AdminConfirmDeleteDialog';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { usePublishedNews } from '../../hooks/news/usePublishedNews';
import { normalizeNews } from '../../hooks/articles/normalizeArticle';
import { toCardShape } from '../../hooks/articles/toCardShape';
import { useAuth } from '../../hooks/useAuth';
import { useSnackbar } from 'notistack';
import apiClient from '../../utils/axios';

const SIDEBAR = [
  { id: '/activities', label: 'Hoạt động', icon: <LocalActivityIcon /> },
  { id: '/activities/events', label: 'Sự kiện', icon: <EventIcon /> },
  { id: '/activities/news', label: 'Tin tức', icon: <ArticleIcon /> },
];

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

  const { news: rawNews } = usePublishedNews(0, 12);

  const [filters, setFilters] = useState({ all: true });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const normalized = rawNews.map(normalizeNews);
  const [featured, ...rest] = normalized;
  const featuredCard = featured ? toCardShape(featured) : null;
  const suggestionCards = rest.slice(0, 3).map(toCardShape);
  const dailyCards = rest.slice(3, 6).map(toCardShape);

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
      const endpoint = CHANNEL_TO_ENDPOINT[deleteTarget.channel];
      if (endpoint) await apiClient.delete(`${endpoint}/${deleteTarget.id}`);
      queryClient.invalidateQueries({ queryKey: ['publishedNews'] });
      enqueueSnackbar('Đã xoá thành công.', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Xoá thất bại.', { variant: 'error' });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <Page title="Tin tức">
      <Container
        maxWidth={false}
        disableGutters
        sx={{ pb: 6 }}
      >
        <Container maxWidth="xl" sx={{ pt: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3, lg: 6 } }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 3 } }}>
            {/* SIDEBAR */}
            <Stack spacing={2} sx={{ width: { xs: '100%', md: 260 } }}>
              <Sidebar items={SIDEBAR} />
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
                    TIN TỨC
                  </Typography>
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
                <Box sx={{ cursor: 'pointer' }} onClick={() => openArticle(featured)}>
                  <FeaturedArticleCard
                    article={featuredCard}
                    isAdmin={isAdmin}
                    onEdit={() => handleEdit(featured)}
                    onDelete={() => handleDelete(featured)}
                  />
                </Box>
              )}

              {/* NEWS SECTION */}
              {suggestionCards.length > 0 && (
                <Box>
                  <Typography variant="h4" fontWeight={700} mb={3}>
                    Gợi ý
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
                    {suggestionCards.map((card, i) => (
                      <Box key={card.id ?? i} sx={{ cursor: 'pointer' }} onClick={() => openArticle(rest[i])}>
                        <ArticleCard
                          article={card}
                          isAdmin={isAdmin}
                          onEdit={() => handleEdit(rest[i])}
                          onDelete={() => handleDelete(rest[i])}
                        />
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* NEWS SECTION */}
              {dailyCards.length > 0 && (
                <Box>
                  <Typography variant="h4" fontWeight={700} mb={3}>
                    Hàng ngày
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
                    {dailyCards.map((card, i) => (
                      <Box
                        key={card.id ?? i}
                        sx={{ cursor: 'pointer' }}
                        onClick={() => openArticle(rest[i + 3])}
                      >
                        <ArticleCard
                          article={card}
                          isAdmin={isAdmin}
                          onEdit={() => handleEdit(rest[i + 3])}
                          onDelete={() => handleDelete(rest[i + 3])}
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