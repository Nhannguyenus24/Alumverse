import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { Box, Button, ListItemIcon, ListItemText, Menu, MenuItem, Stack, Typography } from '@mui/material';
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
import { usePublishedAlumniPosts } from '../../hooks/articles/usePublishedAlumniPosts';
import { useDebounce } from '../../hooks/useDebounce';
import { toCardShape } from '../../hooks/articles/toCardShape';
import { useOrganization } from '../../hooks/useOrganization';
import apiClient from '../../utils/axios';
import { deleteArticleByChannel, getArticleAdminEditPath } from '../../utils/articleAdminActions';
import { getArticleFilterConfig } from '../../utils/articleListFilters';
import { getHonorsSidebarItems } from '../../constants/honorsNav';
import { getOrganizationHeroBannerUrl } from '../../utils/organizationBrand';
import {
  ScrollReveal,
  ScrollRevealGroup,
  ScrollRevealItem,
} from '../../components/animations/ScrollReveal';

const HONORS_PREVIEW_SIZE = 6;

const articleTime = (article) => {
  const value = article?.updatedAt ?? article?.createdAt ?? article?.publishedAt;
  const time = value ? new Date(value).getTime() : 0;
  return Number.isNaN(time) ? 0 : time;
};

const pickFeatured = (achievement, alumni, direction) => {
  if (!achievement) return alumni;
  if (!alumni) return achievement;
  if (direction === 'oldest') {
    return articleTime(achievement) <= articleTime(alumni) ? achievement : alumni;
  }
  return articleTime(achievement) >= articleTime(alumni) ? achievement : alumni;
};

const HonorsPage = () => {
  const { t } = useTranslation(['honors', 'common']);
  const { slug } = useParams();
  const navigate = useOrgNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { organization } = useOrganization();
  const cardFallbackImage = useMemo(() => getOrganizationHeroBannerUrl(organization), [organization]);
  const { isAuthenticated } = useAuth();
  const { canContribute, isOrgManager } = useCanContribute();
  const isAdmin = isAuthenticated && isOrgManager;
  const adminBase = slug ? `/${slug}/admin` : '/admin';

  const [filters, setFilters] = useState({
    all: true,
  });
  const debouncedSearch = useDebounce(filters.search ?? '', 400);
  const selectedSort = Array.isArray(filters.sort) ? filters.sort[0] : filters.sort;
  const requestFilters = {
    q: debouncedSearch,
    topics: filters.topic,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    direction: selectedSort,
  };

  const { featured: featuredAchievement, achievements } = usePublishedAchievements(
    0, HONORS_PREVIEW_SIZE, requestFilters,
  );
  const { featured: featuredAlumni, articles: alumniArticles } = usePublishedAlumniPosts(
    0, HONORS_PREVIEW_SIZE, requestFilters,
  );

  const [submitAnchorEl, setSubmitAnchorEl] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filterConfig = useMemo(() => getArticleFilterConfig(t, ['alumni', 'achievement']), [t]);

  // Each endpoint excludes its own featured item from `items`, so whichever channel loses the
  // hero slot has to put its featured article back at the top of its own section — otherwise
  // that article would disappear from the page entirely.
  const featured = pickFeatured(featuredAchievement, featuredAlumni, selectedSort);
  const featuredCard = featured ? toCardShape(featured, cardFallbackImage) : null;
  const visibleAchievementArticles = featuredAchievement && featured?.channel !== 'achievement'
    ? [featuredAchievement, ...achievements].slice(0, HONORS_PREVIEW_SIZE)
    : achievements.slice(0, HONORS_PREVIEW_SIZE);
  const visibleAlumniArticles = featuredAlumni && featured?.channel !== 'alumni'
    ? [featuredAlumni, ...alumniArticles].slice(0, HONORS_PREVIEW_SIZE)
    : alumniArticles.slice(0, HONORS_PREVIEW_SIZE);
  const alumniCards = visibleAlumniArticles.map((article) => toCardShape(article, cardFallbackImage));
  const achievementCards = visibleAchievementArticles.map((article) => toCardShape(article, cardFallbackImage));

  const openArticle = (article) => {
    if (!article?.id) return;
    navigate(`/article/${article.channel}/${article.id}`);
  };

  const handleEdit = (article) => {
    const editPath = getArticleAdminEditPath(article, adminBase);
    if (editPath) navigate(editPath);
  };

  const handleDelete = (article) => setDeleteTarget(article);

  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteArticleByChannel(apiClient, deleteTarget);
      queryClient.invalidateQueries({ queryKey: ['publishedAlumniPosts'] });
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
      pageTitle={t('honors:page_title')}
      sidebarItems={getHonorsSidebarItems(t)}
      title={t('honors:heading')}
      description={t('honors:description')}
      actions={!isAdmin && isAuthenticated ? (
        <ContributeGuardTooltip>
          <Button
            variant="contained"
            disabled={!canContribute}
            startIcon={<EmojiEventsIcon />}
            onClick={(event) => setSubmitAnchorEl(event.currentTarget)}
          >
            {t('honors:submit_achievement_request')}
          </Button>
          <Menu
            anchorEl={submitAnchorEl}
            open={Boolean(submitAnchorEl)}
            onClose={() => setSubmitAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: submitAnchorEl?.offsetWidth || 240,
              },
            }}
          >
            <MenuItem onClick={() => { setSubmitAnchorEl(null); navigate('/post/alumni'); }}>
              <ListItemIcon><GroupsIcon fontSize="small" /></ListItemIcon>
              <ListItemText>{t('honors:sidebar_alumni')}</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { setSubmitAnchorEl(null); navigate('/post/achievement'); }}>
              <ListItemIcon><TrendingUpIcon fontSize="small" /></ListItemIcon>
              <ListItemText>{t('honors:sidebar_achievements')}</ListItemText>
            </MenuItem>
          </Menu>
        </ContributeGuardTooltip>
      ) : isAdmin ? (
        <Button
          variant="outlined"
          color="primary"
          startIcon={<EmojiEventsIcon />}
          onClick={() => navigate(`${adminBase}/article`)}
        >
          {t('honors:manage_honors')}
        </Button>
      ) : null}
      filters={{ config: filterConfig, value: filters, onChange: setFilters }}
      search={{ value: filters.search, onChange: (val) => setFilters((prev) => ({ ...prev, search: val })) }}
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
              {alumniCards.length > 0 && (
                <ScrollRevealGroup stagger={0.08}>
                  <ScrollRevealItem>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                      <Typography variant="h4" fontWeight={700}>{t('honors:section_alumni')}</Typography>
                      <Button variant="text" onClick={() => navigate('/honors/alumni')}>
                        {t('common:view_all')}
                      </Button>
                    </Stack>
                  </ScrollRevealItem>

                  <ScrollRevealGroup stagger={0.08}
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
                    {alumniCards.map((card, i) => (
                      <ScrollRevealItem key={card.id ?? i} sx={{ cursor: 'pointer' }} onClick={() => openArticle(visibleAlumniArticles[i])}>
                        <ArticleCard
                          article={card}
                          isAdmin={isAdmin}
                          onEdit={() => handleEdit(visibleAlumniArticles[i])}
                          onDelete={() => handleDelete(visibleAlumniArticles[i])}
                        />
                      </ScrollRevealItem>
                    ))}
                  </ScrollRevealGroup>
                </ScrollRevealGroup>
              )}

              {/* ACHIEVEMENTS SECTION */}
              {achievementCards.length > 0 && (
                <ScrollRevealGroup stagger={0.08}>
                  <ScrollRevealItem>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                      <Typography variant="h4" fontWeight={700}>{t('honors:section_achievements')}</Typography>
                      <Button variant="text" onClick={() => navigate('/honors/achievements')}>
                        {t('common:view_all')}
                      </Button>
                    </Stack>
                  </ScrollRevealItem>

                  <ScrollRevealGroup stagger={0.08}
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
                    {achievementCards.map((card, i) => (
                      <ScrollRevealItem key={card.id ?? i} sx={{ cursor: 'pointer' }} onClick={() => openArticle(visibleAchievementArticles[i])}>
                        <ArticleCard
                          article={card}
                          isAdmin={isAdmin}
                          onEdit={() => handleEdit(visibleAchievementArticles[i])}
                          onDelete={() => handleDelete(visibleAchievementArticles[i])}
                        />
                      </ScrollRevealItem>
                    ))}
                  </ScrollRevealGroup>
                </ScrollRevealGroup>
              )}

      <AdminConfirmDeleteDialog
        open={!!deleteTarget}
        title={t('honors:delete_dialog_title')}
        description={t('honors:delete_dialog_desc', { title: deleteTarget?.title })}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
      />
    </AlumniContentLayout>
  );
};

export default HonorsPage;
