import { useState, useCallback } from 'react';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import EventIcon from '@mui/icons-material/Event';
import ArticleIcon from '@mui/icons-material/Article';

import Page from '../../components/Page';
import { useAuth } from '../../hooks/useAuth';
import ForumSponsoredCard from '../../components/forum/ForumSponsoredCard';
import DynamicFilterBar from '../../components/DynamicFilterBar';
import SearchBar from '../../components/SearchBar';
import ArticleEventCard from '../../components/articles/ArticleEventCard';
import FeaturedArticleEventCard from '../../components/articles/FeaturedArticleEventCard';
import Sidebar from '../../components/Sidebar';


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


const FEATURED_EVENT_ARTICLE = {
  title: 'Visit HITSZ',
  date: '01/03/2026 - 05/03/2026',
  organizer: 'HITSZ',
  participants: 200,
  interested: 1500,
  description:
    'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur.',
  image:
    'https://www.a234.fr/wp-content/uploads/2019/10/ateliers234-shenzhen-designschool_ateliers-234_2023-10-2500x1406.jpg',
};

const EVENT_ARTICLES = Array(3).fill({
  title: 'Visit HITSZ',
  date: '01/03/2026 - 05/03/2026',
  organizer: 'HITSZ',
  participants: 200,
  interested: 1500,
  description:
    'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur.',
  image:
    'https://www.a234.fr/wp-content/uploads/2019/10/ateliers234-shenzhen-designschool_ateliers-234_2023-10-2500x1406.jpg',
});


const ActivitiesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [filters, setFilters] = useState({
    all: true,
  });

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
              <FeaturedArticleEventCard article={FEATURED_EVENT_ARTICLE} />

              {/* EVENTS SECTION */}
              <Box>
                <Typography variant="h4" fontWeight={700} mb={3}>
                  Gợi ý
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
                  {EVENT_ARTICLES.map((article, i) => (
                    <ArticleEventCard key={i} article={article} />
                  ))}
                </Box>
              </Box>

              {/* EVENTS SECTION */}
              <Box>
                <Typography variant="h4" fontWeight={700} mb={3}>
                  Gần đây
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
                  {EVENT_ARTICLES.map((article, i) => (
                    <ArticleEventCard key={i} article={article} />
                  ))}
                </Box>
              </Box>
            </Stack>
          </Box>
        </Container>
      </Container>
    </Page>
  );
};

export default ActivitiesPage;