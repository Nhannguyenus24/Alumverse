import { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Container,
  Stack,
  TextField,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
} from '@mui/material';
import { useNavigate } from 'react-router';
import SearchIcon from '@mui/icons-material/Search';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupsIcon from '@mui/icons-material/Groups';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

import Page from '../components/Page';
import { useAuth } from '../hooks/useAuth';
import ForumFilterPanel from '../components/forum/ForumFilterPanel';
import ForumSponsoredCard from '../components/forum/ForumSponsoredCard';

const FILTERS = [
  { id: 'honors', label: 'Vinh danh', icon: <EmojiEventsIcon /> },
  { id: 'alumni', label: 'Cựu sinh viên', icon: <GroupsIcon /> },
  { id: 'achievements', label: 'Kênh thành tựu', icon: <TrendingUpIcon /> },
];

const FILTER_BUTTONS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'topic', label: 'Chủ đề' },
  { id: 'alumni', label: 'Cựu sinh viên' },
  { id: 'achievement', label: 'Thành tựu' },
  { id: 'hall', label: 'Bảng vàng' },
];

const TOPICS = [
  'Khởi nghiệp',
  'Công nghệ',
  'Kinh doanh',
  'Nghiên cứu',
  'Cộng đồng',
];

const FEATURED_ARTICLE = {
  title: 'Lê Yên Thanh và ứng dụng BusMap',
  date: '12/12/2023',
  description:
    'Từng có cơ hội làm việc cho Google nhưng Lê Yên Thanh từ chối để ở lại Việt Nam đầu quân cho một số startup, sau đó khởi nghiệp với BusMap. CEO sinh năm 1994 là ...',
  image: 'https://kenh14cdn.com/203336854389633024/2022/6/4/photo-4-16543508788131048796642.png',
};

const ALUMNI_ARTICLES = Array(6).fill({
  name: 'Lê Yên Thanh',
  university: 'Khoá 2014 - Khoa Công nghệ thông tin',
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
  const [selectedFilterId, setSelectedFilterId] = useState('honors');
  const [activeFilters, setActiveFilters] = useState(['all']);
  const [topics, setTopics] = useState([]);

  const navigate = useNavigate();
  const { user } = useAuth();

  const handleFilterChange = useCallback(
    (id) => {
      setSelectedFilterId(id);
      if (id === 'honors') {
        navigate('/honors');
      }
      else if (id === 'alumni') {
        navigate('/honors/alumni');
      }
      else if (id === 'achievements') {
        navigate('/honors/achievements');
      }
    },
    [navigate]
  );

  const toggleFilter = (id) => {
    if (id === 'all') {
      setActiveFilters(['all']);
      return;
    }

    setActiveFilters((prev) => {
      const filtered = prev.filter((f) => f !== 'all');

      if (filtered.includes(id)) {
        const newFilters = filtered.filter((f) => f !== id);
        return newFilters.length === 0 ? ['all'] : newFilters;
      }

      return [...filtered, id];
    });
  };

  return (
    <Page title="Vinh danh">
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          pb: 6,
          backgroundColor: '#F3F6FB',
        }}
      >
        <Container maxWidth="xl" sx={{ pt: 4, px: { xs: 2, lg: 6 } }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>

            {/* SIDEBAR */}
            <Stack spacing={2} sx={{ width: { xs: '100%', md: 260 } }}>
              <ForumFilterPanel
                filters={FILTERS}
                selectedId={selectedFilterId}
                onChange={handleFilterChange}
              />

              <ForumSponsoredCard
                title="Sponsored"
                imageSrc="/forum/metro_station.png"
                imageAlt="HCMC Metro Opening"
                caption="HCMC Metro Opening"
              />
            </Stack>

            {/* MAIN CONTENT */}
            <Stack spacing={4} sx={{ flex: 1 }}>

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
                Những thành tựu của sinh viên và cựu sinh viên Trường Đại học Khoa học tự nhiên, ĐHQG-HCM.
              </Typography>

              {/* FILTERS */}
              <Stack direction="row" spacing={1.5} flexWrap="wrap">

                {/* ALL BUTTON */}
                <Button
                  variant={activeFilters.includes('all') ? 'contained' : 'outlined'}
                  onClick={() => toggleFilter('all')}
                >
                  Tất cả
                </Button>

                {/* TOPIC DROPDOWN */}
                <Select
                  multiple
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  displayEmpty
                  renderValue={(selected) =>
                    selected.length === 0 ? 'Chủ đề' : selected.join(', ')
                  }
                  sx={{
                    minWidth: 120,
                    background: 'none',
                    borderRadius: '5px',
                    outline: '1px solid',
                    outlineColor: 'primary.main',
                    fontWeight: '700',
                    fontSize: '0.875rem'
                  }}
                >
                  {TOPICS.map((topic) => (
                    <MenuItem key={topic} value={topic}>
                      <Checkbox checked={topics.indexOf(topic) > -1} />
                      <ListItemText primary={topic} />
                    </MenuItem>
                  ))}
                </Select>

                {FILTER_BUTTONS.slice(2).map((filter) => {
                  const active = activeFilters.includes(filter.id);

                  return (
                    <Button
                      key={filter.id}
                      variant={active ? 'contained' : 'outlined'}
                      onClick={() => toggleFilter(filter.id)}
                    >
                      {filter.label}
                    </Button>
                  );
                })}
              </Stack>

              {/* SEARCH */}
              <TextField
                fullWidth
                placeholder="Tìm kiếm"
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{
                  borderRadius: 1,
                  py: 2,
                }}
              />

              {/* FEATURED ARTICLE */}
              <Card sx={{ display: 'flex', alignItems: 'center' }}>
                <CardMedia
                  component="img"
                  image={FEATURED_ARTICLE.image}
                  sx={{ width: '50%' }}
                />

                <CardContent sx={{ width: '50%' }}>
                  <Typography variant="h5" fontWeight={700}>
                    {FEATURED_ARTICLE.title}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    {FEATURED_ARTICLE.date}
                  </Typography>

                  <Typography sx={{ mt: 2 }}>
                    {FEATURED_ARTICLE.description}
                  </Typography>
                </CardContent>
              </Card>

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
                    gap: 3,
                  }}
                >
                  {ALUMNI_ARTICLES.map((article, i) => (
                    <Card key={i}>
                      <CardMedia component="img" height="200" image={article.image} />
                      <CardContent>
                        <Typography fontWeight={700}>{article.name}</Typography>

                        <Typography variant="body2" color="text.secondary">
                          {article.university}
                        </Typography>

                        <Typography variant="caption" color="text.secondary">
                          {article.date}
                        </Typography>

                        <Typography variant="body2" mt={1}>
                          {article.description}
                        </Typography>
                      </CardContent>
                    </Card>
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
                    gap: 3,
                  }}
                >
                  {ACHIEVEMENT_ARTICLES.map((article, i) => (
                    <Card key={i}>
                      <CardMedia component="img" height="200" image={article.image} />
                      <CardContent>
                        <Typography fontWeight={700}>{article.title}</Typography>

                        <Typography variant="caption" color="text.secondary">
                          {article.date}
                        </Typography>

                        <Typography variant="body2" mt={1}>
                          {article.description}
                        </Typography>
                      </CardContent>
                    </Card>
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