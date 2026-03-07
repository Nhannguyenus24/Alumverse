import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import Page from '../components/Page';
import ForumFilterPanel from '../components/forum/ForumFilterPanel';
import ForumSponsoredCard from '../components/forum/ForumSponsoredCard';
import Breadcrumb from '../components/Breadcrumb';

const FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'alumni', label: 'Cựu sinh viên' },
  { id: 'jobs', label: 'Việc làm' },
  { id: 'events', label: 'Hoạt động' },
  { id: 'tech', label: 'Công nghệ' },
  { id: 'courses', label: 'Học phần' },
  { id: 'admissions', label: 'Tuyển sinh' },
];

const POSTS = Array.from({ length: 6 }).map((_, index) => ({
  id: index + 1,
  title: 'Ngành Hệ thống thông tin ra có thể có nghề nghiệp nào phù hợp?',
  authorName: 'Nguyễn Văn An',
  createdAt: '15 phút trước',
  views: 80,
  replies: 15,
}));

const ForumAlumniCareerPage = () => {
  const navigate = useNavigate();

  const handleFilterChange = useCallback(
    (id) => {
      if (id === 'all') {
        navigate('/forum');
        return;
      }
      if (id === 'alumni') {
        return;
      }
    },
    [navigate]
  );

  return (
    <Page
      title="Diễn đàn - Cựu sinh viên"
      meta={<meta name="description" content="Diễn đàn Cựu sinh viên - Hướng nghiệp" />}
    >
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          pt: { xs: '56px', md: '64px' },
          pb: { xs: 4, md: 6 },
          backgroundColor: '#F3F6FB',
          overflowX: 'hidden',
        }}
      >
        <Container maxWidth="xl" sx={{ pt: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3, lg: 6 } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'flex-start',
              gap: { xs: 2, md: 3 },
            }}
          >
            <Stack spacing={2} sx={{ width: { xs: '100%', md: 260 }, flexShrink: 0 }}>
              <ForumFilterPanel
                filters={FILTERS}
                selectedId="alumni"
                onChange={handleFilterChange}
              />
              <ForumSponsoredCard
                title="Sponsored"
                imageSrc="/forum/metro_station.png"
                imageAlt="HCMC Metro Opening"
                caption="HCMC Metro Opening"
              />
            </Stack>

            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                backgroundColor: '#fff',
                border: 1,
                borderColor: 'divider',
              }}
            >
              <Box
                sx={{
                  px: { xs: 1.5, sm: 2, md: 3 },
                  py: { xs: 1.5, md: 2 },
                  borderBottom: 1,
                  borderColor: 'divider',
                }}
              >
                <Breadcrumb
                  items={[
                    { label: 'Cựu sinh viên', path: '/forum/alumni/career' },
                    { label: 'Hướng nghiệp' },
                  ]}
                  uppercase
                  color="primary"
                />
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    justifyContent: 'space-between',
                    gap: 2,
                  }}
                >
                  <Typography
                    variant="h4"
                    component="h1"
                    fontWeight={800}
                    color="primary.main"
                    sx={{
                      fontSize: { xs: '1.35rem', sm: '1.5rem', md: '1.75rem' },
                      wordBreak: 'break-word',
                    }}
                  >
                    HƯỚNG NGHIỆP
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: 1,
                      width: { xs: '100%', sm: 'auto' },
                    }}
                  >
                    <Button variant="outlined" color="primary" fullWidth={false} sx={{ minWidth: { xs: '100%', sm: 'auto' } }}>
                      Theo dõi
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() =>
                        navigate('/forum/alumni/career/create-post')
                      }
                      sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
                    >
                      Tạo bài đăng
                    </Button>
                  </Box>
                </Box>
              </Box>

              <Box>
                {POSTS.map((post) => (
                  <Box
                    key={post.id}
                    onClick={() =>
                      navigate(`/forum/alumni/career/${post.id}`)
                    }
                    sx={{
                      px: { xs: 1.5, sm: 2, md: 3 },
                      py: { xs: 1.5, md: 2 },
                      display: 'flex',
                      flexDirection: { xs: 'column', md: 'row' },
                      alignItems: { xs: 'flex-start', md: 'center' },
                      gap: { xs: 1.5, md: 3 },
                      borderTop: 1,
                      borderColor: 'divider',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <Box
                        sx={{
                          position: 'relative',
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Typography variant="subtitle2" fontWeight={700}>
                          A
                        </Typography>
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: -1,
                            right: -1,
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: '#2ECC71',
                            border: '2px solid #fff',
                          }}
                        />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="subtitle1"
                          fontWeight={600}
                          sx={{
                            fontSize: { xs: '0.95rem', md: '1rem' },
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {post.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {post.authorName} • {post.createdAt}
                        </Typography>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: { xs: 2, md: 3 },
                        ml: { md: 'auto' },
                        flexShrink: 0,
                      }}
                    >
                      <Box sx={{ textAlign: 'center', minWidth: { xs: 56, sm: 72 } }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Lượt xem
                        </Typography>
                        <Typography variant="body2" fontWeight={800}>
                          {post.views}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center', minWidth: { xs: 56, sm: 72 } }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Thảo luận
                        </Typography>
                        <Typography variant="body2" fontWeight={800}>
                          {post.replies}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          minWidth: { xs: 120, sm: 160 },
                          justifyContent: 'flex-end',
                        }}
                      >
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <PersonIcon sx={{ fontSize: 18 }} />
                        </Box>
                        <Box sx={{ textAlign: 'left' }}>
                          <Typography variant="body2" fontWeight={600}>
                            {post.authorName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {post.createdAt}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Container>
      </Container>
    </Page>
  );
};

export default ForumAlumniCareerPage;

