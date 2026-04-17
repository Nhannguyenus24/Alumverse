import { useState, useCallback } from 'react';
import { Box, Button, Container, Stack, Typography } from '@mui/material';

import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupsIcon from '@mui/icons-material/Groups';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

import Page from '../../components/Page';
import { useAuth } from '../../hooks/useAuth';
import ForumSponsoredCard from '../../components/forum/ForumSponsoredCard';
import DynamicFilterBar from '../../components/DynamicFilterBar';
import SearchBar from '../../components/SearchBar';
import FeaturedArticleCard from '../../components/articles/FeaturedArticleCard';
import ArticleCard from '../../components/articles/ArticleCard';
import Sidebar from '../../components/Sidebar';

const SIDEBAR = [
  { id: '/honors', label: 'Vinh danh', icon: <EmojiEventsIcon /> },
  { id: '/honors/alumni', label: 'Cựu sinh viên', icon: <GroupsIcon /> },
  { id: '/honors/achievements', label: 'Kênh thành tựu', icon: <TrendingUpIcon /> },
];

const FILTERS = [
  {
    type: 'topics',
    key: 'topics',
    label: 'Chủ đề',
    options: ['Cựu sinh viên', 'Thành tựu', 'Bảng vàng'],
  },
  {
    type: 'dropdown',
    key: 'type',
    label: 'Phân loại',
    multiple: true,
    options: ['Khởi nghiệp', 'Công nghệ', 'Kinh doanh', 'Nghiên cứu', 'Cộng đồng'],
  },
  {
    type: 'date',
    key: 'date',
    label: 'Ngày đăng',
  },
];

const FEATURED_ARTICLE = {
  title: 'Lê Yên Thanh và ứng dụng BusMap',
  date: '12/12/2023',
  description:
    'Từng có cơ hội làm việc cho Google nhưng Lê Yên Thanh từ chối để ở lại Việt Nam đầu quân cho một số startup, sau đó khởi nghiệp với BusMap. CEO sinh năm 1994 là ...',
  image: 'https://kenh14cdn.com/203336854389633024/2022/6/4/photo-4-16543508788131048796642.png',
};

const ALUMNI_ARTICLES = Array(6).fill({
  title: 'Lê Yên Thanh',
  date: '12/12/2023',
  description:
    'Từng có cơ hội làm việc cho Google nhưng Lê Yên Thanh từ chối để ở lại Việt Nam đầu quân cho một số startup...',
  image: 'https://forbes.vn/wp-content/uploads/2021/09/under30_2022_Le-Yen-Thanh.jpg',
});

const ACHIEVEMENT_ARTICLES = Array(6).fill({
  title: 'Lê Yên Thanh và ứng dụng BusMap',
  date: '12/12/2023',
  description:
    'Từng có cơ hội làm việc cho Google nhưng Lê Yên Thanh từ chối để ở lại Việt Nam đầu quân cho một số startup...',
  image: 'https://kenh14cdn.com/203336854389633024/2022/6/4/photo-3-1654350878654296223124.jpg',
});


const HonorsPage = () => {
  const navigate = useOrgNavigate();
  const { user } = useAuth();

  const [filters, setFilters] = useState({
    all: true,
  });

  return (
    <Page title="Vinh danh">
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
                    VINH DANH
                  </Typography>

                  <Button
                    variant="contained"
                    onClick={() => navigate('/honors/request-achievements')}
                  >
                    Gửi đơn xét thành tựu
                  </Button>
                </Box>

                <Typography color="text.secondary">
                  Vinh danh những cựu sinh viên và sinh viên có thành tựu và đóng góp quan trọng.
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
              <FeaturedArticleCard article={FEATURED_ARTICLE} />

              {/* ALUMNI SECTION */}
              <Box>
                <Typography variant="h4" fontWeight={700} mb={3}>
                  Cựu sinh viên tiêu biểu
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
                  {ALUMNI_ARTICLES.map((article, i) => (
                    <ArticleCard key={i} article={article} />
                  ))}
                </Box>
              </Box>

              {/* ACHIEVEMENTS SECTION */}
              <Box>
                <Typography variant="h4" fontWeight={700} mb={3}>
                  Thành tựu gần đây
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
                  {ACHIEVEMENT_ARTICLES.map((article, i) => (
                    <ArticleCard key={i} article={article} />
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

export default HonorsPage;