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
import { useOrgNavigate } from '../../hooks/useOrgNavigate';

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
    options: ['Bảng vàng'],
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
  title: 'Lê Yên Thanh',
  date: '12/12/2023',
  description:
    'Từng có cơ hội làm việc cho Google nhưng Lê Yên Thanh từ chối để ở lại Việt Nam đầu quân cho một số startup, sau đó khởi nghiệp với BusMap. CEO sinh năm 1994 là ...',
  image: 'https://vcdn1-vnexpress.vnecdn.net/2025/07/28/ai-1753664373-1753664398-5310-1753664411.jpg?w=680&h=0&q=100&dpr=1&fit=crop&s=L9Jh3NGehMlCpb4bdZ8xzA',
};

const ALUMNI_ARTICLES = Array(9).fill({
  title: 'Lê Yên Thanh',
  date: '12/12/2023',
  description:
    'Từng có cơ hội làm việc cho Google nhưng Lê Yên Thanh từ chối để ở lại Việt Nam đầu quân cho một số startup...',
  image: 'https://forbes.vn/wp-content/uploads/2021/09/under30_2022_Le-Yen-Thanh.jpg',
});


const HonorsAlumniPage = () => {
  const navigate = useOrgNavigate();
  const { user } = useAuth();

  const [filters, setFilters] = useState({
    all: true,
  });

  return (
    <Page title="Cựu sinh viên">
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
                    CỰU SINH VIÊN
                  </Typography>

                  <Button
                    variant="contained"
                    onClick={() => navigate('/honors/request-achievements')}
                  >
                    Gửi đơn xét thành tựu
                  </Button>
                </Box>

                <Typography color="text.secondary">
                  Những cựu sinh viên tiêu biểu của Trường Đại học Khoa học tự nhiên, ĐHQG-HCM.
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

            </Stack>
          </Box>
        </Container>
      </Container>
    </Page>
  );
};

export default HonorsAlumniPage;