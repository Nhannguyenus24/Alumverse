import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';

import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupsIcon from '@mui/icons-material/Groups';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

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
import { usePublishedAlumniPosts } from '../../hooks/articles/usePublishedAlumniPosts';
import { toCardShape } from '../../hooks/articles/toCardShape';
import apiClient from '../../utils/axios';

const getSidebar = (t) => [
  { id: '/honors', label: t('honors:sidebar_honors'), icon: <EmojiEventsIcon /> },
  { id: '/honors/alumni', label: t('honors:sidebar_alumni'), icon: <GroupsIcon /> },
  { id: '/honors/achievements', label: t('honors:sidebar_achievements'), icon: <TrendingUpIcon /> },
];

const getFilters = (t) => [
  {
    type: 'topics',
    key: 'topics',
    label: t('honors:filter_topics_label'),
    options: [t('honors:filter_topics_option_board')],
  },
  {
    type: 'dropdown',
    key: 'type',
    label: t('honors:filter_type_label'),
    multiple: true,
    options: [
      t('honors:filter_type_startup'),
      t('honors:filter_type_technology'),
      t('honors:filter_type_business'),
      t('honors:filter_type_research'),
      t('honors:filter_type_community'),
    ],
  },
  {
    type: 'date',
    key: 'date',
    label: t('honors:filter_date_label'),
  },
];

const HonorsAlumniPage = () => {
  const { t } = useTranslation(['honors', 'common']);
  const navigate = useOrgNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && user?.role === 'ADMIN';
  const sidebar = getSidebar(t);
  const filters = getFilters(t);

  const { articles } = usePublishedAlumniPosts(0, 12);

  const [filterValues, setFilterValues] = useState({ all: true });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [featured, ...rest] = articles;
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
      await apiClient.delete(`/admin/articles/alumni-posts/${deleteTarget.id}`);
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
    <Page title={t('honors:alumni_page_title')}>
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
                    {t('honors:alumni_heading')}
                  </Typography>

                  {!isAdmin && isAuthenticated && (
                    <Button variant="contained" onClick={() => navigate('/honors/request-achievements')}>
                      {t('honors:submit_achievement_request')}
                    </Button>
                  )}
                  {isAdmin && (
                    <Button variant="outlined" color="primary" onClick={() => navigate('/admin/article')}>
                      {t('honors:manage_honors')}
                    </Button>
                  )}
                </Box>

                <Typography color="text.secondary">
                  {t('honors:alumni_description')}
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

              {/* ALUMNI SECTION */}
              {cards.length > 0 && (
                <Box>
                  <Typography variant="h4" fontWeight={700} mb={3}>
                    {t('honors:section_alumni')}
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
        title={t('honors:delete_dialog_title')}
        description={t('honors:delete_dialog_desc', { title: deleteTarget?.title ?? '' })}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
      />
    </Page>
  );
};

export default HonorsAlumniPage;
