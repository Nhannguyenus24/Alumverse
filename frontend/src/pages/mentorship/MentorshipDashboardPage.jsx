import { useMemo, useState } from 'react';
import { Box, Button, Stack, Typography, Card, Avatar } from '@mui/material';

import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarIcon from '@mui/icons-material/Star';

import Page from '../../components/Page';
import MentorshipProfileLayout from '../../layouts/MentorshipProfileLayout';
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
  { value: '4.9', label: 'đánh giá' },
  { value: '128', label: 'buổi họp' },
  { value: '3', label: 'cuộc họp trong tuần' },
];

const MOCK_REVIEWS = Array(10).fill({
  name: 'Winter Falls',
  date: '2 ngày trước',
  avatar: '',
  rating: 5,
  content: 'Mentor rất nhiệt tình, hướng dẫn chi tiết về lộ trình học Frontend.'
});

/* ================= COMPONENT ================= */

const MentorshipDashboardPage = () => {
  const navigate = useOrgNavigate();

  // Pagination
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 3;
  const totalPages = Math.ceil(MOCK_REVIEWS.length / ITEMS_PER_PAGE);

  const paginatedReviews = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return MOCK_REVIEWS.slice(start, start + ITEMS_PER_PAGE);
  }, [page]);

  return (
    <Page title="Cố vấn - Dashboard">
      <MentorshipProfileLayout
        user={USER}
        cover={USER.cover}
        tabs={TOP_TABS}
        onNavigate={navigate}
        mode="mentor"
      >
        <Stack spacing={4}>
          <Typography variant="h2" fontWeight={800} color="primary.main">
            DASHBOARD
          </Typography>

          {/* STATS */}
          <Box sx={{ backgroundColor: 'primary.main', borderRadius: 1, px: { xs: 3, md: 6 }, py: { xs: 3, md: 4 }, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 3, textAlign: 'center' }}>
            {STATS.map((item, i) => (
              <Box key={i}>
                <Typography variant="h2" fontWeight={700} color="common.white">
                  {item.value}
                </Typography>
                <Typography variant="body2" color="common.white">
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* YÊU CẦU - FULL WIDTH */}
          <Box>
            <Header title="Yêu cầu chờ duyệt" />
            <Box sx={{ maxHeight: 320, overflowY: 'auto', pr: 1 }}>
              <Stack spacing={2}>
                {[1, 2, 3, 4].map((i) => (
                  <RequestCard key={i} />
                ))}
              </Stack>
            </Box>
          </Box>

          {/* LỊCH - 2 COLUMNS */}
          <Box>
            <Header title="Lịch" />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <ScheduleCard key={i} />
              ))}
            </Box>
          </Box>

          {/* ĐÁNH GIÁ - 2 COLUMNS */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4" fontWeight={700} color="primary.main">
                Đánh giá
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <StarIcon sx={{ color: "warning.main" }} />
                <Typography fontWeight={700}>{USER.rating}</Typography>
                <Typography color="text.secondary">
                  ({USER.reviews} reviews)
                </Typography>
              </Box>
            </Box>

            {/* GRID REVIEWS */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              {paginatedReviews.map((review, i) => (
                <MentorshipReviewCard key={i} {...review} />
              ))}
            </Box>

            {/* PAGINATION */}
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

        </Stack>
      </MentorshipProfileLayout>
    </Page>
  );
};

/* ================= REUSABLE ================= */

const Header = ({ title }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
    <Typography variant="h4" fontWeight={700}>{title}</Typography>
    <Button size="small">Xem thêm</Button>
  </Box>
);

const RequestCard = () => (
  <Card sx={{ p: 2, border: '1px solid', borderColor: 'divider' }} elevation={0}>
    <Stack spacing={1}>
      <Stack direction="row" justifyContent="space-between">
        <Stack direction="row" spacing={2}>
          <Avatar />
          <Box>
            <Typography fontWeight={700}>Winter Falls</Typography>
            <Typography variant="body2">Junior in Computer Science</Typography>
          </Box>
        </Stack>
        <Typography variant="caption">2 ngày trước</Typography>
      </Stack>

      <Typography fontWeight={600}>Lịch: Thứ 5, 17h00 - 18h00</Typography>
      <Typography>Muốn học thêm về android.</Typography>

      <Stack direction="row" justifyContent="flex-end" spacing={1}>
        <Button variant="contained" color="secondary">Từ chối</Button>
        <Button variant="contained">Chấp nhận</Button>
      </Stack>
    </Stack>
  </Card>
);

const ScheduleCard = () => (
  <Card sx={{ p: 2, border: '1px solid', borderColor: 'divider' }} elevation={0}>
    <Stack direction="row" spacing={2} alignItems="center">
      <Box sx={{ width: 80, height: 80, background: '#eee', borderRadius: 1 }} />
      <Box sx={{ flex: 1 }}>
        <Typography fontWeight={700}>Mock Interview</Typography>
        <Typography>Tran Viet Bao Hoang</Typography>
        <Typography variant="caption">Thứ 5, 17h00 - 18h00</Typography>
      </Box>
      <Button variant="contained">Vào cuộc họp</Button>
    </Stack>
  </Card>
);

export default MentorshipDashboardPage;