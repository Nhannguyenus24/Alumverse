import { useMemo, useState } from "react";
import { Box, Button, Stack, Typography, Container } from '@mui/material';

import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';

import Page from '../../components/Page';
import MentorshipProfileLayout from '../../layouts/MentorshipProfileLayout';
import MentorshipTag from '../../components/mentorship/MentorshipTag';
import MentorshipReviewCard from '../../components/mentorship/MentorshipReviewCard';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';

/* ================= DATA ================= */

const TOP_TABS = [
  { label: 'Trang cá nhân', path: '/development/mentorship/profile' },
  { label: 'Dashboard', path: '/development/mentorship/dashboard' },
  { label: 'Lịch cá nhân', path: '/development/mentorship/calendar' },
];

const USER = {
  name: 'Nguyễn Lê Hoàng Dũng',
  role: 'Senior Software Engineer @ Google',
  rating: 4.9,
  reviews: 124,
  avatar: 'https://i.pravatar.cc/150?img=3',
  cover: 'https://ethnasia.com/cdn/shop/articles/sean-o-KMn4VEeEPR8-unsplash_edited.jpg?v=1621585619',
};

const STATS = [
  { value: '8', label: 'năm kinh nghiệm' },
  { value: '120+', label: 'mentee' },
  { value: '4.9', label: 'đánh giá' },
  { value: '129', label: 'buổi họp' },
];

const TAGS = ['Frontend', 'React', 'System Design', 'Career', 'Interview', 'Backend', 'NodeJS', 'Mentorship', 'Startup', 'Leadership'];

const MOCK_REVIEWS = Array(10).fill({
  name: 'Winter Falls',
  date: '2 ngày trước',
  avatar: '',
  rating: 5,
  content: 'Mentor rất nhiệt tình, hướng dẫn chi tiết về lộ trình học Frontend và cách tối ưu code React. Rất đáng để đăng ký!'
});


const MentorshipProfilePage = () => {
  const navigate = useOrgNavigate();

  // Pagination Logic
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 3;
  const totalPages = Math.ceil(MOCK_REVIEWS.length / ITEMS_PER_PAGE);

  const paginatedReviews = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return MOCK_REVIEWS.slice(start, start + ITEMS_PER_PAGE);
  }, [page]);

  return (
    <Page title="Profile Cố vấn">
      <MentorshipProfileLayout
        user={USER}
        cover={USER.cover}
        tabs={TOP_TABS}
        onNavigate={navigate}
        mode="mentor" // 🔁 change to 'edit' or 'view'
      >
        <Stack spacing={4}>
          <Typography variant="h2" fontWeight={800} color="primary.main">TRANG CÁ NHÂN</Typography>
          {/* STATS GRID */}
          <Box
            sx={{
              backgroundColor: 'primary.main',
              borderRadius: 2,
              px: { xs: 3, md: 6 },
              py: { xs: 3, md: 4 },
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',           // 1 column on mobile
                sm: '1fr 1fr',       // 2 columns on tablet
                md: '1fr 1fr 1fr 1fr', // 4 columns on desktop
              },
              gap: 3,
              textAlign: 'center',
            }}
          >
            {STATS.map((item, i) => (
              <Box key={i}>
                <Typography variant="h2" fontWeight={700} color="common.white">
                  {item.value}
                </Typography>
                <Typography variant="body2" color="common.white" sx={{ opacity: 0.9 }}>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Stack>

        {/* INTRO SECTION */}
        <Box>
          <Typography variant="h4" fontWeight={700} color="primary.main" mb={1}>
            Giới thiệu
          </Typography>
          <Typography color="text.primary">
            This is a simple bio written in simple words, portraying a bio.
            This is a simple bio written in simple words, portraying a bio.
            This is a simple bio written in simple words, portraying a bio.
          </Typography>
        </Box>

        {/* INFO & SKILLS GRID */}
        <Box
          sx={{
            display: 'flex',
            gap: { xs: 6, md: 8 },
            flexDirection: { xs: 'column', md: 'row' },
          }}
        >
          {/* LEFT COLUMN: Cá nhân */}
          <Box sx={{ width: { md: 375 } }}>
            <Typography variant="h4" fontWeight={700} color="primary.main" mb={2}>
              Cá nhân
            </Typography>
            <Box 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, 
                gap: 2 
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <StarBorderIcon />
                <Typography>Chất lượng cao</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <DescriptionOutlinedIcon />
                <Typography>Hệ thống thông tin</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <MenuBookOutlinedIcon />
                <Typography>Enrolled 2022</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CheckBoxOutlinedIcon />
                <Typography>Graduated 2026</Typography>
              </Stack>
            </Box>
          </Box>

          {/* RIGHT COLUMN: Kỹ năng */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontWeight={700} color="primary.main" mb={2}>
              Kỹ năng
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {TAGS.map((tag, idx) => (
                <MentorshipTag key={idx} label={tag} />
              ))}
            </Box>
          </Box>
        </Box>

        {/* REVIEWS SECTION */}
        <Box>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1, mb: 2 }}>
            <Typography variant="h4" fontWeight={700} color="primary.main">Đánh giá</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <StarIcon sx={{ color: "warning.main", fontSize: 24 }} />
              <Typography variant="h5" fontWeight={700} color="primary.main">{USER.rating}</Typography>
              <Typography color="text.secondary">({USER.reviews} reviews)</Typography>
            </Box>
          </Box>

          <Stack spacing={3}>
            {paginatedReviews.map((review, i) => (
              <MentorshipReviewCard key={i} {...review} />
            ))}
          </Stack>

          {/* PAGINATION CONTROLS */}
          <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mt: 4 }}>
            <Button variant="outlined" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Trước
            </Button>
            <Typography sx={{ display: "flex", alignItems: "center", px: 2 }}>
              {page} / {totalPages}
            </Typography>
            <Button variant="outlined" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
              Sau
            </Button>
          </Box>
        </Box>
      </MentorshipProfileLayout>
    </Page>
  );
};

export default MentorshipProfilePage;