import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { Box, Button, Pagination, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';

import MenuBookIcon from '@mui/icons-material/MenuBook';
import WorkIcon from '@mui/icons-material/Work';

import FeaturedArticleCard from '../../components/articles/FeaturedArticleCard';
import ArticleCard from '../../components/articles/ArticleCard';
import AdminConfirmDeleteDialog from '../../components/admin/AdminConfirmDeleteDialog';
import AlumniContentLayout from '../../layouts/AlumniContentLayout';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useAuth } from '../../hooks/useAuth';
import { useCanContribute } from '../../hooks/useCanContribute';
import { ContributeGuardTooltip } from '../../components/ContributeGuard';
import { usePublishedLearning } from '../../hooks/articles/usePublishedLearning';
import { toCardShape } from '../../hooks/articles/toCardShape';
import { useOrganization } from '../../hooks/useOrganization';
import apiClient from '../../utils/axios';
import { deleteArticleByChannel, getArticleAdminEditPath } from '../../utils/articleAdminActions';
import {
  ARTICLE_FETCH_LIMIT,
  applyArticleFilters,
  getArticleFilterConfig,
  paginateArticles,
} from '../../utils/articleListFilters';
import { getDevelopmentSidebarItems } from '../../constants/developmentNav';
import { getOrganizationHeroBannerUrl } from '../../utils/organizationBrand';
import {
  ScrollReveal,
  ScrollRevealGroup,
  ScrollRevealItem,
} from '../../components/animations/ScrollReveal';

const DEVELOPMENT_LIST_PAGE_SIZE = 12;

const DevelopmentAcademicsPage = () => {
  const { t } = useTranslation(['dev', 'mentorship', 'common']);
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
  const sidebar = getDevelopmentSidebarItems(t);
  const filters = useMemo(() => getArticleFilterConfig(t, ['learning']), [t]);

  const [page, setPage] = useState(0);
  const { resources } = usePublishedLearning(0, ARTICLE_FETCH_LIMIT);

  const [filterValues, setFilterValues] = useState({ all: true });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filteredResources = useMemo(
    () => applyArticleFilters(resources, filterValues),
    [resources, filterValues],
  );
  const [featured, ...rest] = filteredResources;
  const { items: pagedResources, pageInfo } = useMemo(
    () => paginateArticles(rest, page, DEVELOPMENT_LIST_PAGE_SIZE),
    [rest, page],
  );

  const featuredCard = featured ? toCardShape(featured, cardFallbackImage) : null;
  const cards = pagedResources.map((article) => toCardShape(article, cardFallbackImage));

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
      queryClient.invalidateQueries({ queryKey: ['publishedLearning'] });
      enqueueSnackbar(t('common:success'), { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || t('common:error'), { variant: 'error' });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <AlumniContentLayout
      variant="two"
      pageTitle={t('dev:academics')}
      sidebarItems={sidebar}
      title={t('dev:academics')}
      description={t('dev:academics_desc')}
      uppercaseTitle
      actions={isAdmin ? (
        <Button variant="outlined" color="primary" startIcon={<WorkIcon />} onClick={() => navigate(`${adminBase}/article`)}>
          {t('dev:manage_opportunities')}
        </Button>
      ) : (
        <ContributeGuardTooltip>
          <Button
            variant="contained"
            disabled={!canContribute}
            startIcon={<MenuBookIcon />}
            onClick={() => navigate('/post/learning')}
          >
            {t('dev:create_academic_opportunity')}
          </Button>
        </ContributeGuardTooltip>
      )}
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

              {/* ACADEMICS SECTION */}
              {cards.length > 0 && (
                <ScrollRevealGroup stagger={0.08}>
                  <ScrollRevealItem>
                    <Typography variant="h4" fontWeight={700} mb={3}>
                      {t('dev:academics')}
                    </Typography>
                  </ScrollRevealItem>

                  <ScrollRevealGroup
                    stagger={0.08}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                      gap: 4,
                    }}
                  >
                    {cards.map((card, i) => (
                      <ScrollRevealItem key={card.id ?? i} sx={{ cursor: 'pointer' }} onClick={() => openArticle(pagedResources[i])}>
                        <ArticleCard
                          article={card}
                          isAdmin={isAdmin}
                          onEdit={() => handleEdit(pagedResources[i])}
                          onDelete={() => handleDelete(pagedResources[i])}
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
        title={t('dev:delete_article_title')}
        description={t('dev:delete_article_desc', { title: deleteTarget?.title ?? '' })}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
      />
    </AlumniContentLayout>
  );
};

export default DevelopmentAcademicsPage;
