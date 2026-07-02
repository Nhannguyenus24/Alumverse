import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Box, Button, Pagination, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';

import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';
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
import { usePublishedJobs } from '../../hooks/articles/usePublishedJobs';
import { toCardShape } from '../../hooks/articles/toCardShape';
import apiClient from '../../utils/axios';
import { deleteArticleByChannel, getArticleAdminEditPath } from '../../utils/articleAdminActions';

const getSidebar = (t) => [
  { id: '/development', label: t('dev:title'), icon: <TrendingUpIcon /> },
  { id: '/development/mentorship', label: t('mentorship:title'), icon: <SchoolIcon /> },
  { id: '/development/academics', label: t('dev:academics'), icon: <MenuBookIcon /> },
  { id: '/development/jobs', label: t('dev:jobs'), icon: <WorkIcon /> },
];

const getFilters = (t) => [
  {
    type: 'dropdown',
    key: 'type',
    label: t('dev:filter_topic'),
    multiple: true,
    options: [t('dev:topic_scholarship'), t('dev:topic_exchange'), t('dev:topic_research'), 'Workshop', t('dev:topic_course')],
  },
  {
    type: 'dropdown',
    key: 'format',
    label: t('dev:filter_format'),
    options: ['Online', 'Offline', 'Hybrid'],
  },
  {
    type: 'dropdown',
    key: 'location',
    label: t('dev:filter_location'),
    multiple: true,
    options: [t('dev:location_hcm'), t('dev:location_domestic'), t('dev:location_abroad')],
  },
  {
    type: 'date',
    key: 'date',
    label: t('dev:filter_deadline'),
  },
  {
    type: 'dropdown',
    key: 'level',
    label: t('dev:filter_level'),
    multiple: true,
    options: [t('dev:level_bachelor'), t('dev:level_master'), t('dev:level_phd')],
  },
];

const DevelopmentJobsPage = () => {
  const { t } = useTranslation(['dev', 'mentorship', 'common']);
  const navigate = useOrgNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const { canContribute } = useCanContribute();
  const isAdmin = isAuthenticated && user?.role === 'ADMIN';
  const sidebar = getSidebar(t);
  const filters = getFilters(t);

  const [page, setPage] = useState(0);
  const { jobs, pageInfo } = usePublishedJobs(page, 10);

  const [filterValues, setFilterValues] = useState({ all: true });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [featured, ...rest] = jobs;
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
        <Button variant="outlined" color="primary" startIcon={<WorkIcon />} onClick={() => navigate('/admin/article')}>
          {t('dev:manage_opportunities')}
        </Button>
      ) : (
        <ContributeGuardTooltip>
          <Button variant="contained" disabled={!canContribute} onClick={() => navigate('/post/job')}>
            {t('common:create')}
          </Button>
        </ContributeGuardTooltip>
      )}
      filters={{ config: filters, value: filterValues, onChange: setFilterValues }}
      search={{ value: filterValues.search, onChange: (val) => setFilterValues((prev) => ({ ...prev, search: val })) }}
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

              {/* JOBS SECTION */}
              {cards.length > 0 && (
                <Box>
                  <Typography variant="h4" fontWeight={700} mb={3}>
                    {t('dev:jobs')}
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
