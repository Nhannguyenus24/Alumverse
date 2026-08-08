import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { Button, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';

import WorkIcon from '@mui/icons-material/Work';

import FeaturedArticleCard from '../../components/articles/FeaturedArticleCard';
import ArticleCard from '../../components/articles/ArticleCard';
import AppPagination from '../../components/AppPagination';
import AdminConfirmDeleteDialog from '../../components/admin/AdminConfirmDeleteDialog';
import AlumniContentLayout from '../../layouts/AlumniContentLayout';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useAuth } from '../../hooks/useAuth';
import { useCanContribute } from '../../hooks/useCanContribute';
import { ContributeGuardTooltip } from '../../components/ContributeGuard';
import { usePublishedJobs } from '../../hooks/articles/usePublishedJobs';
import { useDebounce } from '../../hooks/useDebounce';
import { toCardShape } from '../../hooks/articles/toCardShape';
import { useOrganization } from '../../hooks/useOrganization';
import apiClient from '../../utils/axios';
import { deleteArticleByChannel, getArticleAdminEditPath } from '../../utils/articleAdminActions';
import { getArticleFilterConfig } from '../../utils/articleListFilters';
import { getDevelopmentSidebarItems } from '../../constants/developmentNav';
import { getOrganizationHeroBannerUrl } from '../../utils/organizationBrand';
import {
  ScrollReveal,
  ScrollRevealGroup,
  ScrollRevealItem,
} from '../../components/animations/ScrollReveal';

const DEVELOPMENT_LIST_PAGE_SIZE = 12;

const DevelopmentJobsPage = () => {
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
  const filters = useMemo(() => getArticleFilterConfig(t, ['job']), [t]);

  const [page, setPage] = useState(0);
  const [filterValues, setFilterValues] = useState({ all: true });
  const debouncedSearch = useDebounce(filterValues.search ?? '', 400);
  const selectedSort = Array.isArray(filterValues.sort) ? filterValues.sort[0] : filterValues.sort;
  const { featured, jobs: pagedJobs, pageInfo } = usePublishedJobs(
    page,
    DEVELOPMENT_LIST_PAGE_SIZE,
    {
      q: debouncedSearch,
      topics: filterValues.topic,
      fromDate: filterValues.fromDate,
      toDate: filterValues.toDate,
      direction: selectedSort,
    },
  );
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!pageInfo) return;
    const lastPage = Math.max((pageInfo.totalPage ?? 0) - 1, 0);
    if (page > lastPage) setPage(lastPage);
  }, [page, pageInfo]);

  const featuredCard = featured ? toCardShape(featured, cardFallbackImage) : null;
  const cards = pagedJobs.map((article) => toCardShape(article, cardFallbackImage));

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
      queryClient.invalidateQueries({ queryKey: ['publishedJobs'] });
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
      pageTitle={t('dev:jobs')}
      sidebarItems={sidebar}
      title={t('dev:jobs')}
      description={t('dev:jobs_desc')}
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
            startIcon={<WorkIcon />}
            onClick={() => navigate('/post/job')}
          >
            {t('dev:create_job_opportunity')}
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

              {/* JOBS SECTION */}
              {cards.length > 0 && (
                <ScrollRevealGroup stagger={0.08}>
                  <ScrollRevealItem>
                    <Typography variant="h4" fontWeight={700} mb={3}>
                      {t('dev:jobs')}
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
                      <ScrollRevealItem key={card.id ?? i} sx={{ cursor: 'pointer' }} onClick={() => openArticle(pagedJobs[i])}>
                        <ArticleCard
                          article={card}
                          isAdmin={isAdmin}
                          onEdit={() => handleEdit(pagedJobs[i])}
                          onDelete={() => handleDelete(pagedJobs[i])}
                        />
                      </ScrollRevealItem>
                    ))}
                  </ScrollRevealGroup>
                </ScrollRevealGroup>
              )}

              <AppPagination
                count={Math.max(pageInfo?.totalPage ?? 0, 1)}
                page={page + 1}
                onChange={(_, value) => setPage(value - 1)}
              />

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

export default DevelopmentJobsPage;
