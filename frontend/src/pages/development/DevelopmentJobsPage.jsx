import { useState, useCallback } from 'react';
import { Box, Button, Container, Stack, Typography } from '@mui/material';

import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import WorkIcon from '@mui/icons-material/Work';

import Page from '../../components/Page';
import { useAuth } from '../../hooks/useAuth';
import ForumSponsoredCard from '../../components/forum/ForumSponsoredCard';
import DynamicFilterBar from '../../components/DynamicFilterBar';
import SearchBar from '../../components/SearchBar';
import FeaturedArticleCard from '../../components/articles/FeaturedArticleCard';
import ArticleCard from '../../components/articles/ArticleCard';
import Sidebar from '../../components/Sidebar';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { usePublishedJobs } from '../../hooks/articles/usePublishedJobs';
import { toCardShape } from '../../hooks/articles/toCardShape';

const SIDEBAR = [
  { id: '/development', label: 'Phát triển', icon: <TrendingUpIcon /> },
  { id: '/development/mentorship', label: 'Cố vấn', icon: <SchoolIcon /> },
  { id: '/development/academics', label: 'Cơ hội học tập', icon: <MenuBookIcon /> },
  { id: '/development/jobs', label: 'Cơ hội việc làm', icon: <WorkIcon /> },
];

const FILTERS = [
  {
    type: 'dropdown',
    key: 'type',
    label: 'Chủ đề',
    multiple: true,
    options: [
      'Học bổng',
      'Trao đổi',
      'Nghiên cứu',
      'Workshop',
      'Khóa học',
    ],
  },
  {
    type: 'dropdown',
    key: 'format',
    label: 'Hình thức',
    options: ['Online', 'Offline', 'Hybrid'],
  },
  {
    type: 'dropdown',
    key: 'location',
    label: 'Địa điểm',
    multiple: true,
    options: ['TP.HCM', 'Trong nước', 'Nước ngoài'],
  },
  {
    type: 'date',
    key: 'date',
    label: 'Hạn chót',
  },
  {
    type: 'dropdown',
    key: 'level',
    label: 'Trình độ',
    multiple: true,
    options: ['Đại học', 'Thạc sĩ', 'Tiến sĩ']
  },
];

const DevelopmentJobsPage = () => {
  const navigate = useOrgNavigate();
  const { user } = useAuth();
  const { jobs } = usePublishedJobs(0, 12);

  const [filters, setFilters] = useState({
    all: true,
  });

  const [featured, ...rest] = jobs;
  const featuredCard = featured ? toCardShape(featured) : null;
  const cards = rest.slice(0, 9).map(toCardShape);

  const openArticle = (article) => {
    if (!article?.id) return;
    navigate(`/article/${article.channel}/${article.id}`);
  };

  return (
    <Page title="Cơ hội việc làm">
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
                    CƠ HỘI VIỆC LÀM
                  </Typography>

                  <Button
                    variant="contained"
                    onClick={() => navigate('/post/job')}
                  >
                    Đăng bài
                  </Button>
                </Box>

                <Typography color="text.secondary">
                    Những việc làm từ nhiều công ty và tập đoàn hàng đầu vẫn đang chào đón các bạn!
                </Typography>

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
                  <FeaturedArticleCard article={featuredCard} />
                </Box>
              )}

              {/* JOBS SECTION */}
              {cards.length > 0 && (
                <Box>
                  <Typography variant="h4" fontWeight={700} mb={3}>
                    Tất cả việc làm
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
                    {cards.map((card, i) => (
                      <Box key={card.id ?? i} sx={{ cursor: 'pointer' }} onClick={() => openArticle(rest[i])}>
                        <ArticleCard article={card} />
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

export default DevelopmentJobsPage;