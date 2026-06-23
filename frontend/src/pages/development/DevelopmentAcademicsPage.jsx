import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';

import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import WorkIcon from '@mui/icons-material/Work';

import Page from '../../components/Page';

import ForumSponsoredCard from '../../components/forum/ForumSponsoredCard';
import DynamicFilterBar from '../../components/DynamicFilterBar';
import SearchBar from '../../components/SearchBar';
import FeaturedArticleCard from '../../components/articles/FeaturedArticleCard';
import ArticleCard from '../../components/articles/ArticleCard';
import Sidebar from '../../components/Sidebar';
import AdminConfirmDeleteDialog from '../../components/admin/AdminConfirmDeleteDialog';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useAuth } from '../../hooks/useAuth';
import { usePublishedLearning } from '../../hooks/articles/usePublishedLearning';
import { toCardShape } from '../../hooks/articles/toCardShape';
import apiClient from '../../utils/axios';

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

const DevelopmentAcademicsPage = () => {
  const { t } = useTranslation(['dev', 'mentorship', 'common']);
  const navigate = useOrgNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && user?.role === 'ADMIN';
  const sidebar = getSidebar(t);
  const filters = getFilters(t);

  const { resources } = usePublishedLearning(0, 12);

  const [filterValues, setFilterValues] = useState({ all: true });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [featured, ...rest] = resources;
  const featuredCard = featured ? toCardShape(featured) : null;
  const cards = rest.slice(0, 9).map(toCardShape);

  const openArticle = (article) => {
    if (!article?.id) return;
    navigate(`/article/${article.channel}/${article.id}`);
  };

  const handleEdit = (article) => {
    navigate(`/article/${article.channel}/${article.id}/edit`);
  };

  const handleDelete = (article) => setDeleteTarget(article);

  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/admin/articles/learning-resources/${deleteTarget.id}`);
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
    <Page title={t('dev:academics')}>
      <Container maxWidth={false} disableGutters sx={{ pb: 6 }}>
        <Container maxWidth="xl" sx={{ pt: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3, lg: 6 } }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 3 } }}>
            {/* SIDEBAR */}
            <Stack spacing={2} sx={{ width: { xs: '100%', md: 260 } }}>
              <Sidebar items={sidebar} />
              <ForumSponsoredCard
                title="Sponsored"
                imageSrc="/forum/metro_station.png"
                imageAlt="HCMC Metro Opening"
                caption="HCMC Metro Opening"
              />
            </Stack>

            {/* MAIN CONTENT */}
            <Stack spacing={5} sx={{ flex: 1, minWidth: 0, width: '100%', px: { xs: 1.5, sm: 2, md: 2.75 } }}>
              <Stack gap={2}>
                {/* HEADER */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography
                    variant="h1"
                    fontWeight={800}
                    color="primary.main"
                    sx={{ fontSize: { xs: '1.8rem', md: '2.3rem' } }}
                  >
                    {t('dev:academics').toUpperCase()}
                  </Typography>

                  {isAdmin ? (
                    <Button variant="outlined" color="primary" onClick={() => navigate('/admin/article')}>
                      {t('dev:manage_opportunities')}
                    </Button>
                  ) : (
                    <Button variant="contained" onClick={() => navigate('/post/learning')}>
                      {t('common:create')}
                    </Button>
                  )}
                </Box>

                <Typography color="text.secondary">
                  {t('dev:academics_desc')}
                </Typography>

                <DynamicFilterBar config={filters} value={filterValues} onChange={setFilterValues} />

                <SearchBar
                  value={filterValues.search}
                  onChange={(val) => setFilterValues((prev) => ({ ...prev, search: val }))}
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

              {/* ACADEMICS SECTION */}
              {cards.length > 0 && (
                <Box>
                  <Typography variant="h4" fontWeight={700} mb={3}>
                    {t('dev:academics')}
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
            </Stack>
          </Box>
        </Container>
      </Container>

      <AdminConfirmDeleteDialog
        open={!!deleteTarget}
        title={t('dev:delete_article_title')}
        description={t('dev:delete_article_desc', { title: deleteTarget?.title ?? '' })}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
      />
    </Page>
  );
};

export default DevelopmentAcademicsPage;
