import { useState, useCallback } from 'react';
import { Box, Button, Container, Stack, Typography, Paper } from '@mui/material';

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

const FEATURED_ARTICLE = {
  title: 'Cơ hội nghề nghiệp cho sinh viên: Thực tập, việc làm và hơn thế nữa',
  date: '12/12/2023',
  description:
    'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur.',
  image: 'https://d341ezm4iqaae0.cloudfront.net/hiringlaborg/2019/07/02115547/4-Lessons-the-Tech-Industry-Can-Teach-All-Recruiters.jpg',
};

const JOBS_ARTICLES = Array(3).fill({
  title: 'Cơ hội nghề nghiệp cho sinh viên: Thực tập, việc làm và hơn thế nữa',
  date: '12/12/2023',
  description:
    'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur.',
  image: 'https://d341ezm4iqaae0.cloudfront.net/hiringlaborg/2019/07/02115547/4-Lessons-the-Tech-Industry-Can-Teach-All-Recruiters.jpg',
});

const ACADEMICS_ARTICLES = Array(3).fill({
  title: 'Cơ hội học tập cho sinh viên: Học bổng, trao đổi, nghiên cứu và hơn thế nữa',
  date: '12/12/2023',
  description:
    'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur.',
  image: 'https://gihot.vn/wp-content/uploads/2023/04/3-1024x768.jpg',
});

const DevelopmentPage = () => {
  const navigate = useOrgNavigate();
  const { user } = useAuth();

  const [filters, setFilters] = useState({
    all: true,
  });

  return (
    <Page title="Phát triển">
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
                    PHÁT TRIỂN
                  </Typography>

                  <Button
                    variant="contained"
                    // onClick={() => navigate('/development/academics/create-article')}
                  >
                    Đăng bài
                  </Button>
                </Box>

                <Typography color="text.secondary">
                    Hàng trăm cơ hội phát triển về nhiều lĩnh vực cho sinh viên Khoa Công nghệ Thông tin -  Trường Đại học Khoa học tự nhiên, ĐHQG-HCM.
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
              {/* <FeaturedArticleCard article={FEATURED_ARTICLE} /> */}

              {/* MENTORSHIP SECTION */}
              <Box>
                <Typography variant="h4" fontWeight={700} mb={1}>
                  Cố vấn
                </Typography>
                <Paper 
                    elevation={0} 
                    sx={{ 
                        p: 4, 
                        bgcolor: 'primary.light',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                    }}
                    >
                    <Box sx={{ flex: 1}}>
                        <Typography variant="h3" mb={1}>Chương trình Cố vấn - Mentorship Program</Typography>
                        <Typography variant="body1">Chương trình cố vấn hoàn toàn mới dành cho các bạn Sinh viên muốn tìm các anh chị Cựu sinh viên để hỗ trợ mình trong học tập và trong công việc. Kết nối 1:1 cùng các tiền bối trong ngành!</Typography>
                    </Box>
    
                    <Button 
                        variant="contained" 
                        onClick={() => navigate('/development/mentorship')}
                    >
                        Tìm cố vấn ngay
                    </Button>
                </Paper>
              </Box>

              {/* ACADEMICS SECTION */}
              <Box>
                <Typography variant="h4" fontWeight={700} mb={1}>
                  Cơ hội học tập
                </Typography>
                <Typography color="text.secondary" mb={3}>
                    Cơ hội Cử nhân, Thạc sĩ, Tiến sĩ trong nước và ngoại quốc.
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
                  {ACADEMICS_ARTICLES.map((article, i) => (
                    <ArticleCard key={i} article={article} />
                  ))}
                </Box>
              </Box>

              {/* JOBS SECTION */}
              <Box>
                <Typography variant="h4" fontWeight={700} mb={1}>
                  Cơ hội việc làm
                </Typography>
                <Typography color="text.secondary" mb={3}>
                    Những việc làm từ nhiều công ty và tập đoàn hàng đầu vẫn đang chào đón các bạn!
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
                  {JOBS_ARTICLES.map((article, i) => (
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

export default DevelopmentPage;