import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { Box, Button, CircularProgress, ListItemIcon, ListItemText, Menu, MenuItem, Paper, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useSnackbar } from 'notistack';

import MenuBookIcon from '@mui/icons-material/MenuBook';
import WorkIcon from '@mui/icons-material/Work';

import ArticleCard from '../../components/articles/ArticleCard';
import AdminConfirmDeleteDialog from '../../components/admin/AdminConfirmDeleteDialog';
import AlumniContentLayout from '../../layouts/AlumniContentLayout';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useAuth } from '../../hooks/useAuth';
import { useCanContribute } from '../../hooks/useCanContribute';
import { ContributeGuardTooltip } from '../../components/ContributeGuard';
import { usePublishedJobs } from '../../hooks/articles/usePublishedJobs';
import { usePublishedLearning } from '../../hooks/articles/usePublishedLearning';
import { toCardShape } from '../../hooks/articles/toCardShape';
import { useOrganization } from '../../hooks/useOrganization';
import apiClient from '../../utils/axios';
import { deleteArticleByChannel, getArticleAdminEditPath } from '../../utils/articleAdminActions';
import {
  ARTICLE_FETCH_LIMIT,
  applyArticleFilters,
  getArticleFilterConfig,
} from '../../utils/articleListFilters';
import { getDevelopmentSidebarItems } from '../../constants/developmentNav';
import { getOrganizationHeroBannerUrl } from '../../utils/organizationBrand';
import {
  ScrollRevealGroup,
  ScrollRevealItem,
} from '../../components/animations/ScrollReveal';

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
  fallbackImage = null,
}) => (
  <ScrollRevealGroup stagger={0.08}>
    <ScrollRevealItem sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
      <Typography variant="h4" fontWeight={700}>
        {title}
      </Typography>

      <Button variant="text" onClick={onSeeMore}>
        {seeMoreLabel}
      </Button>
    </ScrollRevealItem>

    <ScrollRevealItem>
      <Typography color="text.secondary" mb={3}>
        {description}
      </Typography>
    </ScrollRevealItem>

    {isPending && (
      <ScrollRevealItem sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </ScrollRevealItem>
    )}

    {!isPending && errorMessage && (
      <ScrollRevealItem><Typography color="error">{errorMessage}</Typography></ScrollRevealItem>
    )}

    {!isPending && !errorMessage && articles.length === 0 && (
      <ScrollRevealItem><Typography color="text.secondary">{emptyLabel}</Typography></ScrollRevealItem>
    )}

    {!isPending && !errorMessage && articles.length > 0 && (
      <ScrollRevealGroup
        stagger={0.08}
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
          gap: 4,
        }}
      >
        {articles.map((article, i) => {
          const card = toCardShape(article, fallbackImage);
          return (
            <ScrollRevealItem
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
            </ScrollRevealItem>
          );
        })}
      </ScrollRevealGroup>
    )}
  </ScrollRevealGroup>
);

const DevelopmentPage = () => {
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
  const filters = useMemo(() => getArticleFilterConfig(t, ['learning', 'job']), [t]);

  const {
    resources: academics,
    isPending: academicsPending,
    errorMessage: academicsError,
  } = usePublishedLearning(0, ARTICLE_FETCH_LIMIT);

  const {
    jobs,
    isPending: jobsPending,
    errorMessage: jobsError,
  } = usePublishedJobs(0, ARTICLE_FETCH_LIMIT);

  const [filterValues, setFilterValues] = useState({ all: true });
  const [submitAnchorEl, setSubmitAnchorEl] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filteredDevelopmentArticles = useMemo(
    () => applyArticleFilters([...academics, ...jobs], filterValues),
    [academics, jobs, filterValues],
  );
  const visibleAcademics = filteredDevelopmentArticles
    .filter((article) => article.channel === 'learning')
    .slice(0, 9);
  const visibleJobs = filteredDevelopmentArticles
    .filter((article) => article.channel === 'job')
    .slice(0, 9);

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
      actions={isAdmin ? (
        <Button
          variant="outlined"
          color="primary"
          startIcon={<WorkIcon />}
          onClick={() => navigate(`${adminBase}/article`)}
        >
          {t('dev:manage_opportunities')}
        </Button>
      ) : isAuthenticated ? (
        <ContributeGuardTooltip>
          <Button
            variant="contained"
            disabled={!canContribute}
            startIcon={<WorkIcon />}
            onClick={(event) => setSubmitAnchorEl(event.currentTarget)}
          >
            {t('dev:create_opportunity')}
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
            <MenuItem onClick={() => { setSubmitAnchorEl(null); navigate('/post/learning'); }}>
              <ListItemIcon><MenuBookIcon fontSize="small" /></ListItemIcon>
              <ListItemText>{t('dev:create_academic_opportunity')}</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { setSubmitAnchorEl(null); navigate('/post/job'); }}>
              <ListItemIcon><WorkIcon fontSize="small" /></ListItemIcon>
              <ListItemText>{t('dev:create_job_opportunity')}</ListItemText>
            </MenuItem>
          </Menu>
        </ContributeGuardTooltip>
      ) : null}
      filters={{ config: filters, value: filterValues, onChange: setFilterValues }}
      search={{ value: filterValues.search, onChange: (val) => setFilterValues((prev) => ({ ...prev, search: val })) }}
    >

              {/* MENTORSHIP SECTION */}
              <ScrollRevealGroup stagger={0.1}>
                <ScrollRevealItem>
                  <Typography variant="h4" fontWeight={700} color="primary.main" mb={1}>
                    {t('mentorship:title')}
                  </Typography>
                </ScrollRevealItem>
                <ScrollRevealItem>
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 2.5, sm: 3.5, md: 4 },
                      bgcolor: (theme) => theme.palette.mode === 'dark'
                        ? alpha(theme.palette.primary.main, 0.18)
                        : 'primary.lighter',
                      color: (theme) => theme.palette.mode === 'dark' ? 'common.white' : 'text.primary',
                      border: '1px solid',
                      borderColor: (theme) => theme.palette.mode === 'dark'
                        ? alpha(theme.palette.primary.main, 0.32)
                        : alpha(theme.palette.primary.main, 0.2),
                      boxShadow: (theme) => theme.palette.mode === 'dark'
                        ? `0 0 34px ${alpha(theme.palette.primary.main, 0.16)}`
                        : 'none',
                      borderRadius: 1,
                      display: 'flex',
                      flexDirection: { xs: 'column', md: 'row' },
                      alignItems: { xs: 'stretch', md: 'center' },
                      gap: { xs: 2.5, md: 5 },
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="h3"
                        color="primary.main"
                        mb={1}
                        sx={{ fontSize: { xs: '1.35rem', sm: '1.6rem', md: '1.85rem' }, fontWeight: 700 }}
                      >
                        {t('dev:mentorship_program_title')}
                      </Typography>
                      <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}>
                        {t('dev:mentorship_program_desc')}
                      </Typography>
                    </Box>

                    <Button
                      variant="contained"
                      onClick={() => navigate('/mentorship')}
                      sx={{
                        width: { xs: '100%', sm: 'auto' },
                        alignSelf: { xs: 'stretch', sm: 'flex-start', md: 'center' },
                        py: { xs: 1.2, md: 1 },
                      }}
                    >
                      {t('dev:find_mentor_now')}
                    </Button>
                  </Paper>
                </ScrollRevealItem>
              </ScrollRevealGroup>

              {/* ACADEMICS SECTION */}
              <PreviewSection
                title={t('dev:academics')}
                description={t('dev:academics_desc')}
                isPending={academicsPending}
                errorMessage={academicsError}
                articles={visibleAcademics}
                onOpenArticle={openArticle}
                onSeeMore={() => navigate('/development/academics')}
                seeMoreLabel={t('common:view_all')}
                emptyLabel={t('dev:no_academics')}
                isAdmin={isAdmin}
                onEdit={handleEdit}
                onDelete={handleDelete}
                fallbackImage={cardFallbackImage}
              />

              {/* JOBS SECTION */}
              <PreviewSection
                title={t('dev:jobs')}
                description={t('dev:jobs_desc')}
                isPending={jobsPending}
                errorMessage={jobsError}
                articles={visibleJobs}
                onOpenArticle={openArticle}
                onSeeMore={() => navigate('/development/jobs')}
                seeMoreLabel={t('common:view_all')}
                emptyLabel={t('dev:no_jobs')}
                isAdmin={isAdmin}
                onEdit={handleEdit}
                onDelete={handleDelete}
                fallbackImage={cardFallbackImage}
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
