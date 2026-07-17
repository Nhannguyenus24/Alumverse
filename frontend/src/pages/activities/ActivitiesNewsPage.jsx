import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Box, Button, Pagination, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import FeaturedArticleCard from '../../components/articles/FeaturedArticleCard';
import ArticleCard from '../../components/articles/ArticleCard';
import AdminConfirmDeleteDialog from '../../components/admin/AdminConfirmDeleteDialog';
import AlumniContentLayout from '../../layouts/AlumniContentLayout';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { usePublishedNews } from '../../hooks/news/usePublishedNews';
import { normalizeNews } from '../../hooks/articles/normalizeArticle';
import { toCardShape } from '../../hooks/articles/toCardShape';
import { useAuth } from '../../hooks/useAuth';
import { useCanContribute } from '../../hooks/useCanContribute';
import { useSnackbar } from 'notistack';
import apiClient from '../../utils/axios';
import { deleteArticleByChannel, getArticleAdminEditPath } from '../../utils/articleAdminActions';
import {
  ARTICLE_FETCH_LIMIT,
  ARTICLE_PAGE_SIZE,
  applyArticleFilters,
  getArticleFilterConfig,
  paginateArticles,
} from '../../utils/articleListFilters';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import {
  ScrollReveal,
  ScrollRevealGroup,
  ScrollRevealItem,
} from '../../components/animations/ScrollReveal';

const ActivitiesPage = () => {
  const { t } = useTranslation(['nav', 'article']);
  const navigate = useOrgNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const { news: rawNews } = usePublishedNews(0, ARTICLE_FETCH_LIMIT);

  const [filters, setFilters] = useState({ all: true });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filterConfig = useMemo(() => getArticleFilterConfig(t, ['news']), [t]);
  const normalized = useMemo(() => rawNews.map(normalizeNews).filter(Boolean), [rawNews]);
  const filteredNews = useMemo(() => applyArticleFilters(normalized, filters), [normalized, filters]);
  const { items: pageNews, pageInfo } = useMemo(
    () => paginateArticles(filteredNews, page, ARTICLE_PAGE_SIZE),
    [filteredNews, page],
  );

  const [featured, ...rest] = pageNews;
  const featuredCard = featured ? toCardShape(featured) : null;
  const suggestionCards = rest.slice(0, 3).map(toCardShape);
  const dailyCards = rest.slice(3, 6).map(toCardShape);

  const openArticle = (article) => {
    if (!article?.id) return;
    navigate(`/article/${article.channel}/${article.id}`);
  };

  const { isAuthenticated } = useAuth();
  const { isOrgManager } = useCanContribute();
  const isAdmin = isAuthenticated && isOrgManager;

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
    <AlumniContentLayout
      variant="one"
      maxWidth="lg"
      pageTitle={t('article:news')}
      meta={<meta name="description" content={t('article:news_description')} />}
      title={t('article:news')}
      description={t('article:news_description')}
      uppercaseTitle
      actions={isAdmin && (
        <Button
          variant="outlined"
          color="primary"
          startIcon={<ArticleOutlinedIcon />}
          onClick={() => navigate('/admin/article')}
        >
          {t('article:manage_news')}
        </Button>
      )}
      filters={{
        config: filterConfig,
        value: filters,
        onChange: (next) => {
          setFilters(next);
          setPage(0);
        },
      }}
      search={{
        value: filters.search,
        onChange: (val) => {
          setFilters((prev) => ({ ...prev, search: val }));
          setPage(0);
        },
      }}
    >
              {/* FEATURED ARTICLE */}
              {featuredCard && (
                <ScrollReveal sx={{ cursor: 'pointer' }} onClick={() => openArticle(featured)}>
                  <FeaturedArticleCard
                    article={featuredCard}
                    isAdmin={isAdmin}
                    onEdit={() => handleEdit(featured)}
                    onDelete={() => handleDelete(featured)}
                  />
                </ScrollReveal>
              )}

              {/* NEWS SECTION */}
              {suggestionCards.length > 0 && (
                <ScrollRevealGroup stagger={0.08}>
                  <ScrollRevealItem>
                    <Typography variant="h4" fontWeight={700} mb={3}>
                      {t('article:suggestions')}
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
                    {suggestionCards.map((card, i) => (
                      <ScrollRevealItem key={card.id ?? i} sx={{ cursor: 'pointer' }} onClick={() => openArticle(rest[i])}>
                        <ArticleCard
                          article={card}
                          isAdmin={isAdmin}
                          onEdit={() => handleEdit(rest[i])}
                          onDelete={() => handleDelete(rest[i])}
                        />
                      </ScrollRevealItem>
                    ))}
                  </ScrollRevealGroup>
                </ScrollRevealGroup>
              )}

              {/* NEWS SECTION */}
              {dailyCards.length > 0 && (
                <ScrollRevealGroup stagger={0.08}>
                  <ScrollRevealItem>
                    <Typography variant="h4" fontWeight={700} mb={3}>
                      {t('article:daily')}
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
                    {dailyCards.map((card, i) => (
                      <ScrollRevealItem
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
                      </ScrollRevealItem>
                    ))}
                  </ScrollRevealGroup>
                </ScrollRevealGroup>
              )}

              {(pageInfo?.totalPage ?? 0) > 1 && (
                <ScrollReveal sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Pagination
                    color="primary"
                    count={pageInfo.totalPage}
                    page={page + 1}
                    onChange={(_, value) => setPage(value - 1)}
                  />
                </ScrollReveal>
              )}

      <AdminConfirmDeleteDialog
        open={!!deleteTarget}
        title={t('article:delete_article')}
        description={t('article:confirm_delete_desc', { title: deleteTarget?.title })}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
      />
    </AlumniContentLayout>
  );
};

export default ActivitiesPage;
