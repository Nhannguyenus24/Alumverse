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
import { usePublishedAchievements } from '../../hooks/articles/usePublishedAchievements';
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

const getSidebar = (t) => [
  { id: '/honors', label: t('honors:sidebar_honors'), icon: <EmojiEventsIcon /> },
  { id: '/honors/alumni', label: t('honors:sidebar_alumni'), icon: <GroupsIcon /> },
  { id: '/honors/achievements', label: t('honors:sidebar_achievements'), icon: <TrendingUpIcon /> },
];

const HonorsAchievementsPage = () => {
  const { t } = useTranslation(['honors', 'common']);
  const navigate = useOrgNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const { canContribute } = useCanContribute();
  const isAdmin = isAuthenticated && user?.role === 'ADMIN';
  const sidebar = getSidebar(t);
  const filters = useMemo(() => getArticleFilterConfig(t, ['achievement']), [t]);

  const [page, setPage] = useState(0);
  const { achievements } = usePublishedAchievements(0, ARTICLE_FETCH_LIMIT);

  const [filterValues, setFilterValues] = useState({ all: true });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filteredAchievements = useMemo(
    () => applyArticleFilters(achievements, filterValues),
    [achievements, filterValues],
  );
  const { items: pagedAchievements, pageInfo } = useMemo(
    () => paginateArticles(filteredAchievements, page, ARTICLE_PAGE_SIZE),
    [filteredAchievements, page],
  );

  const [featured, ...rest] = pagedAchievements;
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
      queryClient.invalidateQueries({ queryKey: ['publishedAchievements'] });
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
      pageTitle={t('honors:achievements_page_title')}
      meta={<meta name="description" content={t('honors:achievements_description')} />}
      sidebarItems={sidebar}
      title={t('honors:achievements_heading')}
      description={t('honors:achievements_description')}
      actions={!isAdmin && isAuthenticated ? (
        <ContributeGuardTooltip>
          <Button
            variant="contained"
            disabled={!canContribute}
            startIcon={<EmojiEventsIcon />}
            onClick={() => navigate('/post/achievement')}
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
                <Box sx={{ cursor: 'pointer' }} onClick={() => openArticle(featured)}>
                  <FeaturedArticleCard
                    article={featuredCard}
                    isAdmin={isAdmin}
                    onEdit={() => handleEdit(featured)}
                    onDelete={() => handleDelete(featured)}
                  />
                </Box>
              )}

              {/* ACHIEVEMENTS SECTION */}
              {cards.length > 0 && (
                <Box>
                  <Typography variant="h4" fontWeight={700} mb={3}>
                    {t('honors:section_achievements')}
                  </Typography>

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                      gap: 4,
                    }}
                  >
                    {cards.map((card, i) => (
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

export default HonorsAchievementsPage;
