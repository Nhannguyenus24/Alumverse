import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import Page from '../components/Page';
import ForumFilterPanel from '../components/forum/ForumFilterPanel';
import ForumSponsoredCard from '../components/forum/ForumSponsoredCard';
import Breadcrumb from '../components/Breadcrumb';
import { useAuth } from '../hooks/useAuth';
import { useForumCategories } from '../hooks/forum/useForumCategories';
import { useForumTopics } from '../hooks/forum/useForumTopics';

const CAREER_CATEGORY_ID = 1;

const formatTopicDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const ForumAlumniCareerPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const organizationId = user?.organizationId ?? 1;
  const { categories } = useForumCategories(organizationId);

  const filters = useMemo(() => {
    if (!categories?.length) {
      return [{ id: 'all', label: 'Tất cả' }];
    }
    return [
      { id: 'all', label: 'Tất cả' },
      ...categories.map((c) => ({ id: `category-${c.id}`, label: c.name })),
    ];
  }, [categories]);

  const { topics, isPending, isError } = useForumTopics(CAREER_CATEGORY_ID, 0, 20);

  const handleFilterChange = useCallback(
    (id) => {
      if (id === 'all') {
        navigate('/forum');
        return;
      }
      if (id?.startsWith('category-')) {
        navigate('/forum', { state: { selectedFilterId: id } });
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
                filters={filters}
                selectedId="all"
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
                        navigate('/forum/alumni/career/create-topic')
                      }
                      sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
                    >
                      Tạo bài đăng
                    </Button>
                  </Box>
                </Box>
              </Box>

              <Box>
                {isPending && !topics.length && (
                  <Box
                    sx={{
                      px: { xs: 1.5, sm: 2, md: 3 },
                      py: { xs: 1.5, md: 2 },
                      borderTop: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Typography color="text.secondary">Đang tải chủ đề...</Typography>
                  </Box>
                )}
                {isError && !isPending && !topics.length && (
                  <Box
                    sx={{
                      px: { xs: 1.5, sm: 2, md: 3 },
                      py: { xs: 1.5, md: 2 },
                      borderTop: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Typography color="error">Không thể tải danh sách chủ đề.</Typography>
                  </Box>
                )}
                {topics.map((topic) => (
                  <Box
                    key={topic.id}
                    onClick={() =>
                      navigate(`/forum/alumni/career/${topic.id}`, {
                        state: { topicTitle: topic.title, selectedFilterId: 'alumni' },
                      })
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
                          {`Thành viên #${topic.createdByMemberId ?? '—'}`} • {formatTopicDate(topic.createdAt)}
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
                          {topic.viewCount ?? 0}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center', minWidth: { xs: 56, sm: 72 } }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Thảo luận
                        </Typography>
                        <Typography variant="body2" fontWeight={800}>
                          —
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
                            {`Thành viên #${topic.createdByMemberId ?? '—'}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatTopicDate(topic.updatedAt ?? topic.createdAt)}
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

