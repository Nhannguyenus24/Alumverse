import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Box, Button, Pagination, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';

import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupsIcon from '@mui/icons-material/Groups';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

import FeaturedArticleCard from '../../components/articles/FeaturedArticleCard';
import ArticleCard from '../../components/articles/ArticleCard';
import AdminConfirmDeleteDialog from '../../components/admin/AdminConfirmDeleteDialog';
import AlumniContentLayout from '../../layouts/AlumniContentLayout';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useAuth } from '../../hooks/useAuth';
import { useCanContribute } from '../../hooks/useCanContribute';
import { ContributeGuardTooltip } from '../../components/ContributeGuard';
import { usePublishedAlumniPosts } from '../../hooks/articles/usePublishedAlumniPosts';
import { toCardShape } from '../../hooks/articles/toCardShape';
import apiClient from '../../utils/axios';
import { deleteArticleByChannel, getArticleAdminEditPath } from '../../utils/articleAdminActions';
import {
  ARTICLE_FETCH_LIMIT,
  ARTICLE_PAGE_SIZE,
  applyArticleFilters,
  getArticleFilterConfig,
  paginateArticles,
} from '../../utils/articleListFilters';
import { getHonorsSidebarItems } from '../../constants/honorsNav';
import {
  ScrollReveal,
  ScrollRevealGroup,
  ScrollRevealItem,
} from '../../components/animations/ScrollReveal';

const HonorsAlumniPage = () => {
  const { t } = useTranslation(['honors', 'common']);
  const navigate = useOrgNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { canContribute, isOrgManager } = useCanContribute();
  const isAdmin = isAuthenticated && isOrgManager;
  const sidebar = getHonorsSidebarItems(t);
  const filters = useMemo(() => getArticleFilterConfig(t, ['alumni']), [t]);

  const [page, setPage] = useState(0);
  const { articles } = usePublishedAlumniPosts(0, ARTICLE_FETCH_LIMIT);

  const [filterValues, setFilterValues] = useState({ all: true });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filteredArticles = useMemo(() => applyArticleFilters(articles, filterValues), [articles, filterValues]);
  const { items: pagedArticles, pageInfo } = useMemo(
    () => paginateArticles(filteredArticles, page, ARTICLE_PAGE_SIZE),
    [filteredArticles, page],
  );

  const [featured, ...rest] = pagedArticles;
  const featuredCard = featured ? toCardShape(featured) : null;
  const cards = rest.slice(0, 9).map(toCardShape);

  const openArticle = (article) => {
    if (!article?.id) return;
    navigate(`/article/${article.channel}/${article.id}`);
  };

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
      queryClient.invalidateQueries({ queryKey: ['publishedAlumniPosts'] });
      enqueueSnackbar(t('honors:delete_success'), { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || t('honors:delete_failed'), { variant: 'error' });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <AlumniContentLayout
      variant="two"
      pageTitle={t('honors:alumni_page_title')}
      sidebarItems={sidebar}
      title={t('honors:alumni_heading')}
      description={t('honors:alumni_description')}
      actions={!isAdmin && isAuthenticated ? (
        <ContributeGuardTooltip>
          <Button
            variant="contained"
            disabled={!canContribute}
            startIcon={<GroupsIcon />}
            onClick={() => navigate('/post/alumni')}
          >
            {t('honors:submit_achievement_request')}
          </Button>
        </ContributeGuardTooltip>
      ) : isAdmin ? (
        <Button variant="outlined" color="primary" startIcon={<EmojiEventsIcon />} onClick={() => navigate('/admin/article')}>
          {t('honors:manage_honors')}
        </Button>
      ) : null}
      filters={{
        config: filters,
        value: filterValues,
        onChange: (next) => {
          setFilterValues(next);
          setPage(0);
        },
      }}
      search={{
        value: filterValues.search,
        onChange: (val) => {
          setFilterValues((prev) => ({ ...prev, search: val }));
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

              {/* ALUMNI SECTION */}
              {cards.length > 0 && (
                <ScrollRevealGroup stagger={0.08}>
                  <ScrollRevealItem><Typography variant="h4" fontWeight={700} mb={3}>{t('honors:section_alumni')}</Typography></ScrollRevealItem>

                  <ScrollRevealGroup stagger={0.08}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                      gap: 4,
                    }}
                  >
                    {cards.map((card, i) => (
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
        title={t('honors:delete_dialog_title')}
        description={t('honors:delete_dialog_desc', { title: deleteTarget?.title ?? '' })}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
      />
    </AlumniContentLayout>
  );
};

export default HonorsAlumniPage;
