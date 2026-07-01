import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Box, Button, Container, Pagination, Stack, Typography } from '@mui/material';

import { getActivitiesSidebar } from '../../constants/activitiesNav';
import { useTranslation } from 'react-i18next';

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
import { deleteArticleByChannel, getArticleAdminEditPath } from '../../utils/articleAdminActions';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';


const getNewsFilters = (t) => [
  {
    type: 'dropdown',
    key: 'type',
    label: t('article:filter_topic'),
    multiple: true,
    options: [
      t('article:opt_academic'),
      t('article:opt_student'),
      t('article:opt_school_event'),
      t('article:opt_community'),
      t('article:opt_announcement'),
    ],
  },
  {
    type: 'date',
    key: 'date',
    label: t('article:filter_date'),
  },
  {
    type: 'topics',
    key: 'topics',
    label: t('article:filter_topic'),
    options: [t('article:opt_trending'), t('article:opt_newest'), t('article:opt_interested')],
  },
];

const ActivitiesPage = () => {
  const { t } = useTranslation(['nav', 'article']);
  const navigate = useOrgNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const { news: rawNews, pageInfo } = usePublishedNews(page, 10);

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
    const editPath = getArticleAdminEditPath(article);
    if (editPath) navigate(editPath);
  };

  const handleDelete = (article) => setDeleteTarget(article);

  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteArticleByChannel(apiClient, deleteTarget);
      queryClient.invalidateQueries({ queryKey: ['publishedNews'] });
      enqueueSnackbar(t('article:delete_success'), { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || t('article:delete_failed'), { variant: 'error' });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <Page title={t('article:news')}>
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
                    {t('article:news').toUpperCase()}
                  </Typography>
                  {isAdmin && (
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<ArticleOutlinedIcon />}
                      onClick={() => navigate('/admin/article')}
                    >
                      {t('article:manage_news')}
                    </Button>
                  )}
                </Box>

                {/* FILTERS */}
                <DynamicFilterBar
                  config={getNewsFilters(t)}
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
                    {t('article:suggestions')}
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
                    {t('article:daily')}
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

              {(pageInfo?.totalPage ?? 0) > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Pagination
                    color="primary"
                    count={pageInfo.totalPage}
                    page={page + 1}
                    onChange={(_, value) => setPage(value - 1)}
                  />
                </Box>
              )}
            </Stack>
          </Box>
        </Container>
      </Container>

      <AdminConfirmDeleteDialog
        open={!!deleteTarget}
        title={t('article:delete_article')}
        description={t('article:confirm_delete_desc', { title: deleteTarget?.title })}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
      />
    </Page>
  );
};

export default ActivitiesPage;
