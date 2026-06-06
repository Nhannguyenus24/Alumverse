import { useState } from 'react';
import { Box, Button, Container, Stack, Typography } from '@mui/material';

import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import EventIcon from '@mui/icons-material/Event';
import ArticleIcon from '@mui/icons-material/Article';

import Page from '../../components/Page';

import ForumSponsoredCard from '../../components/forum/ForumSponsoredCard';
import DynamicFilterBar from '../../components/DynamicFilterBar';
import SearchBar from '../../components/SearchBar';
import ArticleEventCard from '../../components/articles/ArticleEventCard';
import FeaturedArticleEventCard from '../../components/articles/FeaturedArticleEventCard';
import Sidebar from '../../components/Sidebar';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { usePublishedEvents } from '../../hooks/articles/usePublishedEvents';
import { toEventCardShape } from '../../hooks/articles/toEventCardShape';
import { useAuth } from '../../hooks/useAuth';

const SIDEBAR = [
  { id: '/activities', label: 'Hoạt động', icon: <LocalActivityIcon /> },
  { id: '/activities/events', label: 'Sự kiện', icon: <EventIcon /> },
  { id: '/activities/news', label: 'Tin tức', icon: <ArticleIcon /> },
];

const FILTERS = [
  {
    type: 'dropdown',
    key: 'type',
    label: 'Chủ đề',
    multiple: true,
    options: [
      'Học thuật',
      'Sinh viên',
      'Sự kiện trường',
      'Cộng đồng',
      'Thông báo',
    ],
  },
  {
    type: 'dropdown',
    key: 'format',
    label: 'Hình thức',
    multiple: true,
    options: ['Online', 'Offline'],
  },
  {
    type: 'date',
    key: 'date',
    label: 'Ngày',
  },
  {
    type: 'dropdown',
    key: 'status',
    label: 'Trạng thái',
    multiple: true,
    options: [
      'Sắp diễn ra',
      'Đang diễn ra',
      'Đã kết thúc'
    ],
  },
  {
    type: 'topics',
    key: 'topics',
    label: 'Chủ đề',
    options: ['Thịnh hành', 'Mới nhất', 'Quan tâm'],
  },
];


const ActivitiesPage = () => {
  const navigate = useOrgNavigate();

  const { events: upcomingEvents } = usePublishedEvents('upcoming', 0, 9);
  const { events: pastEvents } = usePublishedEvents('past', 0, 6);

  const [filters, setFilters] = useState({
    all: true,
  });

  const [featured, ...upcomingRest] = upcomingEvents;
  const featuredCard = featured ? toEventCardShape(featured) : null;
  const upcomingCards = upcomingRest.slice(0, 6).map(toEventCardShape);
  const pastCards = pastEvents.slice(0, 6).map(toEventCardShape);

  const openArticle = (article) => {
    if (!article?.id) return;
    navigate(`/article/${article.channel}/${article.id}`);
  };

  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && user?.role === 'ADMIN';

  const handleEdit = (event) => {
    navigate(`/activities/events/${event.id}/edit`);
  };

  const handleDelete = (event) => {
    console.log('Delete event', event.id);
  };

  return (
    <Page title="Sự kiện">
      <Container
        maxWidth={false}
        disableGutters
        sx={{ pb: 6 }}
      >
        <Container maxWidth="xl" sx={{ pt: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3, lg: 6 } }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 3 } }}>
            {/* SIDEBAR */}
            <Stack spacing={2} sx={{ width: { xs: '100%', md: 260 } }}>
              <Sidebar items={SIDEBAR} />
              <ForumSponsoredCard
                title="Sponsored"
                imageSrc="/forum/metro_station.png"
                imageAlt="HCMC Metro Opening"
                caption="HCMC Metro Opening"
              />
            </Stack>

            {/* MAIN CONTENT */}
            <Stack spacing={5}
                   sx={{ flex: 1, minWidth: 0, width: '100%', px: { xs: 1.5, sm: 2, md: 2.75 }}}
            >
              <Stack gap={2}>
                {/* HEADER */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography
                    variant="h1"
                    fontWeight={800}
                    color="primary.main"
                    sx={{ fontSize: { xs: '1.8rem', md: '2.3rem' } }}
                    >
                    SỰ KIỆN
                  </Typography>
                </Box>

                {/* FILTERS */}
                <DynamicFilterBar
                  config={FILTERS}
                  value={filters}
                  onChange={setFilters}
                />

                {/* SEARCH */}
                <SearchBar
                  value={filters.search}
                  onChange={(val) =>
                    setFilters((prev) => ({ ...prev, search: val }))
                  }
                />
              </Stack>

              {/* FEATURED ARTICLE */}
              {featuredCard && (
                <Box sx={{ cursor: 'pointer' }} onClick={() => openArticle(featured)}>
                  <FeaturedArticleEventCard
                    article={featuredCard}
                    isAdmin={isAdmin}
                    onEdit={() => handleEdit(featured)}
                    onDelete={() => handleDelete(featured)}
                  />
                </Box>
              )}

              {/* UPCOMING */}
              {upcomingCards.length > 0 && (
                <Box>
                  <Typography variant="h4" fontWeight={700} mb={3}>
                    Sắp diễn ra
                  </Typography>

                  <Box
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
                    {upcomingCards.map((card, i) => (
                      <Box key={card.id ?? i} sx={{ cursor: 'pointer' }} onClick={() => openArticle(upcomingRest[i])}>
                        <ArticleEventCard
                          article={card}
                          isAdmin={isAdmin}
                          onEdit={() => handleEdit(upcomingRest[i])}
                          onDelete={() => handleDelete(upcomingRest[i])}
                        />
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* PAST */}
              {pastCards.length > 0 && (
                <Box>
                  <Typography variant="h4" fontWeight={700} mb={3}>
                    Đã diễn ra
                  </Typography>

                  <Box
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
                    {pastCards.map((card, i) => (
                      <Box key={card.id ?? i} sx={{ cursor: 'pointer' }} onClick={() => openArticle(pastEvents[i])}>
                        <ArticleEventCard article={card} />
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Stack>
          </Box>
        </Container>
      </Container>
    </Page>
  );
};

export default ActivitiesPage;