import { useState } from 'react';
import { Box, Button, Container, Stack, Typography } from '@mui/material';

import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import EventIcon from '@mui/icons-material/Event';
import ArticleIcon from '@mui/icons-material/Article';

import Page from '../../components/Page';

import ForumSponsoredCard from '../../components/forum/ForumSponsoredCard';
import DynamicFilterBar from '../../components/DynamicFilterBar';
import SearchBar from '../../components/SearchBar';
import FeaturedArticleCard from '../../components/articles/FeaturedArticleCard';
import ArticleCard from '../../components/articles/ArticleCard';
import ArticleEventCard from '../../components/articles/ArticleEventCard';
import Sidebar from '../../components/Sidebar';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { usePublishedNews } from '../../hooks/news/usePublishedNews';
import { normalizeNews } from '../../hooks/articles/normalizeArticle';
import { toCardShape } from '../../hooks/articles/toCardShape';
import { usePublishedEvents } from '../../hooks/articles/usePublishedEvents';
import { toEventCardShape } from '../../hooks/articles/toEventCardShape';


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
    type: 'date',
    key: 'date',
    label: 'Ngày',
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

  const { news: rawNews } = usePublishedNews(0, 7);
  const { events: upcomingEvents } = usePublishedEvents('upcoming', 0, 3);

  const [filters, setFilters] = useState({
    all: true,
  });

  const newsItems = rawNews.map(normalizeNews);

  const [featuredNews, ...newsRest] = newsItems;
  const featuredCard = featuredNews ? toCardShape(featuredNews) : null;
  const newsCards = newsRest.slice(0, 3).map(toCardShape);
  const eventCards = upcomingEvents.slice(0, 3).map(toEventCardShape);

  const openArticle = (article) => {
    if (!article?.id) return;
    navigate(`/article/${article.channel}/${article.id}`);
  };

  return (
    <Page title="Hoạt động">
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
                    HOẠT ĐỘNG
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
                <Box sx={{ cursor: 'pointer' }} onClick={() => openArticle(featuredNews)}>
                  <FeaturedArticleCard article={featuredCard} />
                </Box>
              )}

              {/* NEWS SECTION */}
              {newsCards.length > 0 && (
                <Box>
                  <Typography variant="h4" fontWeight={700} mb={3}>
                    Tin tức hàng ngày
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
                    {newsCards.map((card, i) => (
                      <Box key={card.id ?? i} sx={{ cursor: 'pointer' }} onClick={() => openArticle(newsRest[i])}>
                        <ArticleCard article={card} />
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* EVENTS SECTION */}
              {eventCards.length > 0 && (
                <Box>
                  <Typography variant="h4" fontWeight={700} mb={3}>
                    Sự kiện sắp diễn ra
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
                    {eventCards.map((card, i) => (
                      <Box key={card.id ?? i} sx={{ cursor: 'pointer' }} onClick={() => openArticle(upcomingEvents[i])}>
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