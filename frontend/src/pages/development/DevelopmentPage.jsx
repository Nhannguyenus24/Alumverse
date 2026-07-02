import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useSnackbar } from 'notistack';

import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import WorkIcon from '@mui/icons-material/Work';

import ArticleCard from '../../components/articles/ArticleCard';
import AdminConfirmDeleteDialog from '../../components/admin/AdminConfirmDeleteDialog';
import AlumniContentLayout from '../../layouts/AlumniContentLayout';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useAuth } from '../../hooks/useAuth';
import { usePublishedJobs } from '../../hooks/articles/usePublishedJobs';
import { usePublishedLearning } from '../../hooks/articles/usePublishedLearning';
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

const PreviewSection = ({
  title,
  description,
  isPending,
  errorMessage,
  articles,
  onOpenArticle,
  onSeeMore,
  seeMoreLabel,
  emptyLabel,
  isAdmin = false,
  onEdit,
  onDelete,
}) => (
  <Box>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
      <Typography variant="h4" fontWeight={700}>
        {title}
      </Typography>

      <Button variant="text" onClick={onSeeMore}>
        {seeMoreLabel}
      </Button>
    </Box>

    <Typography color="text.secondary" mb={3}>
      {description}
    </Typography>

    {isPending && (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    )}

    {!isPending && errorMessage && (
      <Typography color="error">{errorMessage}</Typography>
    )}

    {!isPending && !errorMessage && articles.length === 0 && (
      <Typography color="text.secondary">{emptyLabel}</Typography>
    )}

    {!isPending && !errorMessage && articles.length > 0 && (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
          gap: 4,
        }}
      >
        {articles.map((article, i) => {
          const card = toCardShape(article);
          return (
            <Box
              key={article.id ?? i}
              sx={{ cursor: 'pointer' }}
              onClick={() => onOpenArticle(article)}
            >
              <ArticleCard
                article={card}
                isAdmin={isAdmin}
                onEdit={() => onEdit?.(article)}
                onDelete={() => onDelete?.(article)}
              />
            </Box>
          );
        })}
      </Box>
    )}
  </Box>
);

const DevelopmentPage = () => {
  const { t } = useTranslation(['dev', 'mentorship', 'common']);
  const navigate = useOrgNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && user?.role === 'ADMIN';
  const sidebar = getSidebar(t);
  const filters = getFilters(t);

  const {
    resources: academics,
    isPending: academicsPending,
    errorMessage: academicsError,
  } = usePublishedLearning(0, 3);

  const {
    jobs,
    isPending: jobsPending,
    errorMessage: jobsError,
  } = usePublishedJobs(0, 3);

  const [filterValues, setFilterValues] = useState({ all: true });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
      pageTitle={t('dev:title')}
      sidebarItems={sidebar}
      title={t('dev:title')}
      description={t('dev:subtitle')}
      uppercaseTitle
      actions={isAdmin && (
        <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end" useFlexGap>
          <Button
            variant="outlined"
            color="accent"
            startIcon={<SchoolIcon />}
            onClick={() => navigate('/admin/mentorship')}
          >
            {t('dev:manage_mentorship')}
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<WorkIcon />}
            onClick={() => navigate('/admin/article')}
          >
            {t('dev:manage_opportunities')}
          </Button>
        </Stack>
      )}
      filters={{ config: filters, value: filterValues, onChange: setFilterValues }}
      search={{ value: filterValues.search, onChange: (val) => setFilterValues((prev) => ({ ...prev, search: val })) }}
    >

              {/* MENTORSHIP SECTION */}
              <Box>
                <Typography variant="h4" fontWeight={700} mb={1}>
                  {t('mentorship:title')}
                </Typography>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    bgcolor: (theme) => theme.palette.mode === 'dark'
                      ? alpha(theme.palette.primary.main, 0.18)
                      : 'primary.light',
                    color: (theme) => theme.palette.mode === 'dark' ? 'common.white' : 'text.primary',
                    border: '1px solid',
                    borderColor: (theme) => theme.palette.mode === 'dark'
                      ? alpha(theme.palette.primary.main, 0.32)
                      : alpha(theme.palette.primary.main, 0.18),
                    boxShadow: (theme) => theme.palette.mode === 'dark'
                      ? `0 0 34px ${alpha(theme.palette.primary.main, 0.16)}`
                      : 'none',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h3" mb={1}>
                      {t('dev:mentorship_program_title')}
                    </Typography>
                    <Typography variant="body1">
                      {t('dev:mentorship_program_desc')}
                    </Typography>
                  </Box>

                  <Button variant="contained" onClick={() => navigate('/development/mentorship')}>
                    {t('dev:find_mentor_now')}
                  </Button>
                </Paper>
              </Box>

              {/* ACADEMICS SECTION */}
              <PreviewSection
                title={t('dev:academics')}
                description={t('dev:academics_desc')}
                isPending={academicsPending}
                errorMessage={academicsError}
                articles={academics.slice(0, 3)}
                onOpenArticle={openArticle}
                onSeeMore={() => navigate('/development/academics')}
                seeMoreLabel={t('common:view_all')}
                emptyLabel={t('dev:no_academics')}
                isAdmin={isAdmin}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />

              {/* JOBS SECTION */}
              <PreviewSection
                title={t('dev:jobs')}
                description={t('dev:jobs_desc')}
                isPending={jobsPending}
                errorMessage={jobsError}
                articles={jobs.slice(0, 3)}
                onOpenArticle={openArticle}
                onSeeMore={() => navigate('/development/jobs')}
                seeMoreLabel={t('common:view_all')}
                emptyLabel={t('dev:no_jobs')}
                isAdmin={isAdmin}
                onEdit={handleEdit}
                onDelete={handleDelete}
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

export default DevelopmentPage;
