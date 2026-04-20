import { Box, Button, Container, Stack, Typography, Avatar } from '@mui/material';

import StarBorderIcon from '@mui/icons-material/StarBorder';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';

import Page from '../../components/Page';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';

/* ================= MOCK DATA ================= */

const USER = {
  name: 'Nguyễn Lê Hoàng Dũng',
  role: 'Senior Software Engineer @ Google',
  avatar: 'https://i.pravatar.cc/150?img=3',
  cover:
    'https://ethnasia.com/cdn/shop/articles/sean-o-KMn4VEeEPR8-unsplash_edited.jpg?v=1621585619',
};

const STATS = [
  { value: '8', label: 'năm kinh nghiệm' },
  { value: '120+', label: 'mentee' },
  { value: '4.9', label: 'đánh giá' },
  { value: '129', label: 'buổi họp' },
];

const TAGS = [
  'Frontend',
  'React',
  'System Design',
  'Career',
  'Interview',
  'Backend',
  'NodeJS',
  'Mentorship',
  'Startup',
  'Leadership',
];

/* ================= COMPONENT ================= */

const MentorshipProfilePage = () => {
  const navigate = useOrgNavigate();

  return (
    <Page title="Profile Cố vấn">
      <Box sx={{ pb: 6 }}>

        {/* ================= COVER ================= */}
        <Box sx={{ position: 'relative' }}>
          <Box
            sx={{
              height: { xs: 200, md: 300 },
              backgroundImage: `url(${USER.cover})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />

          <Container maxWidth="lg">
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: -12, // deeper pull
                flexWrap: 'wrap',
                gap: 3,
              }}
            >

              {/* LEFT */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>

                <Avatar
                  src={USER.avatar}
                  sx={{
                    width: 140,
                    height: 140,
                    border: '6px solid white',
                  }}
                />

                <Box>
                  <Typography variant="h2" fontWeight={800}>
                    {USER.name}
                  </Typography>

                  <Typography color="primary.main" fontWeight={600}>
                    {USER.role}
                  </Typography>
                </Box>
              </Box>

              {/* BUTTONS */}
              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/chances/mentorship')}
                >
                  Về Mentorship
                </Button>

                <Button variant="contained" color="inherit">
                  Sửa profile
                </Button>

                <Button
                  variant="contained"
                  onClick={() => navigate('/chances/mentorship/calendar')}
                >
                  Lịch cá nhân
                </Button>
              </Stack>

            </Box>
          </Container>
        </Box>

        {/* ================= MAIN ================= */}
        <Container maxWidth="lg" sx={{ mt: 6 }}>

          {/* ================= STATS ================= */}
          <Box
            sx={{
              backgroundColor: 'primary.main',
              borderRadius: 2,
              px: { xs: 3, md: 6 },
              py: { xs: 3, md: 4 },
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr 1fr',
                md: '1fr 1fr 1fr 1fr',
              },
              gap: 3,
              textAlign: 'center',
              mb: 4,
            }}
          >
            {STATS.map((item, i) => (
              <Box key={i}>
                <Typography
                  variant="h3"
                  fontWeight={700}
                  color="common.white"
                >
                  {item.value}
                </Typography>

                <Typography
                  variant="body2"
                  color="common.white"
                >
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* ================= INTRO ================= */}
          <Stack spacing={4}>

            <Box>
              <Typography
                variant="h4"
                fontWeight={700}
                color="primary.main"
                mb={1}
              >
                Giới thiệu
              </Typography>

              <Typography color="text.primary">
                This is a simple bio written in simple words, portraying a bio.
                This is a simple bio written in simple words, portraying a bio.
                This is a simple bio written in simple words, portraying a bio.
                This is a simple bio written in simple words, portraying a bio.
                This is a simple bio written in simple words, portraying a bio.
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                gap: 4,
                flexDirection: { xs: 'column', md: 'row' },
              }}
            >

              {/* LEFT COLUMN (FIXED WIDTH) */}
              <Box sx={{ width: { md: 320 } }}>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  color="primary.main"
                  mb={2}
                >
                  Cá nhân
                </Typography>

                <Stack spacing={2}>
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
                </Stack>
              </Box>

              {/* RIGHT COLUMN (FLEX 1) */}
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  color="primary.main"
                  mb={2}
                >
                  Kỹ năng
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                  }}
                >
                  {TAGS.map((tag, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 999,
                        backgroundColor: 'primary.lighter',
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="primary.main"
                        fontWeight={600}
                      >
                        #{tag}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>

            {/* ================= REVIEWS ================= */}
            <Box mt={4}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h4" fontWeight={700}>
                  Đánh giá
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StarBorderIcon />
                  <Typography fontWeight={700} color="primary.main">
                    4.9
                  </Typography>
                  <Typography color="text.secondary">(124 reviews)</Typography>
                </Box>
              </Box>

              <Stack spacing={3}>
                {[1, 2, 3].map((_, i) => (
                  <Box
                    key={i}
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      backgroundColor: '#fff',
                    }}
                  >

                    {/* HEADER */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      {/* LEFT */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>

                        <Avatar sx={{ width: 48, height: 48 }} />

                        <Box>
                          <Typography fontWeight={700}>
                            Winter Falls
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            2 ngày trước
                          </Typography>
                        </Box>
                      </Box>

                      {/* RIGHT STARS */}
                      <Box sx={{ display: 'flex' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarBorderIcon key={star} />
                        ))}
                      </Box>
                    </Box>

                    {/* DESCRIPTION */}
                    <Typography mt={2} color="text.primary">
                      Lorem ipsum dolor sit amet, consectetuer adipiscing elit.
                      Aenean commodo ligula eget dolor. Aenean massa.
                      Cum sociis natoque penatibus et magnis dis parturient montes,
                      nascetur ridiculus mus.
                    </Typography>

                  </Box>
                ))}
              </Stack>
            </Box>

          </Stack>

        </Container>
      </Box>
    </Page>
  );
};

export default MentorshipProfilePage;