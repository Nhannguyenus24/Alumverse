import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useParams, useLocation } from 'react-router';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import Page from '../../components/Page';
import Breadcrumb from '../../components/Breadcrumb';
import ForumFilterPanel from '../../components/forum/ForumFilterPanel';
import ForumSponsoredCard from '../../components/forum/ForumSponsoredCard';
import { useAuth } from '../../hooks/useAuth';
import { useForumCategories } from '../../hooks/forum/useForumCategories';
import { useForumTopics } from '../../hooks/forum/useForumTopics';
import { useNotification } from '../../hooks/useNotification';

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

const ForumCategoryPage = () => {
  const { categoryId: categoryIdParam } = useParams();
  const navigate = useOrgNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showError } = useNotification();
  const hasShownTopicsErrorRef = useRef(false);
  const invalidCategoryShownRef = useRef(false);

  const organizationId = user?.organizationId ?? 1;
  const { categories, isPending: categoriesPending } = useForumCategories(organizationId);

  const categoryId = useMemo(() => {
    const n = Number(categoryIdParam);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [categoryIdParam]);

  const { topics, isPending: topicsPending, isError } = useForumTopics(categoryId, 0, 50);

  useEffect(() => {
    if (categoryId != null) {
      invalidCategoryShownRef.current = false;
      return;
    }
    if (!invalidCategoryShownRef.current) {
      showError('Danh mục không hợp lệ.');
      invalidCategoryShownRef.current = true;
    }
  }, [categoryId, showError]);

  useEffect(() => {
    if (categoryId == null) return;
    if (isError) {
      if (!hasShownTopicsErrorRef.current) {
        showError('Không thể tải danh sách chủ đề.');
        hasShownTopicsErrorRef.current = true;
      }
      return;
    }
    hasShownTopicsErrorRef.current = false;
  }, [categoryId, isError, showError]);

  const parentCategories = useMemo(() => {
    const list = (categories ?? []).filter((c) => c.parentId == null);
    list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'));
    return list;
  }, [categories]);

  const filters = useMemo(() => {
    if (categoriesPending && !categories?.length) {
      return [{ id: 'all', label: 'Tất cả' }];
    }
    return [{ id: 'all', label: 'Tất cả' }, ...parentCategories.map((p) => ({ id: `parent-${p.id}`, label: p.name }))];
  }, [categories, categoriesPending, parentCategories]);

  const activeCategory = useMemo(
    () => (categoryId != null ? categories?.find((c) => c.id === categoryId) : null),
    [categories, categoryId]
  );

  const parentCategory = useMemo(() => {
    if (!activeCategory?.parentId) return null;
    return categories?.find((c) => c.id === activeCategory.parentId) ?? null;
  }, [activeCategory, categories]);

  const selectedSidebarId = useMemo(() => {
    const fromNav = location.state?.selectedFilterId;
    if (fromNav === 'all' || (typeof fromNav === 'string' && fromNav.startsWith('parent-'))) {
      return fromNav;
    }
    if (!activeCategory) return 'all';
    if (activeCategory.parentId != null) return `parent-${activeCategory.parentId}`;
    return `parent-${activeCategory.id}`;
  }, [activeCategory, location.state?.selectedFilterId]);

  const handleFilterChange = useCallback(
    (id) => {
      if (id === 'all') {
        navigate('/forum');
        return;
      }
      if (typeof id === 'string' && id.startsWith('parent-')) {
        navigate('/forum', { state: { selectedFilterId: id } });
      }
    },
    [navigate]
  );

  const breadcrumbItems = useMemo(() => {
    const items = [];
    if (parentCategory) {
      items.push({
        label: parentCategory.name,
        path: '/forum',
        state: { selectedFilterId: `parent-${parentCategory.id}` },
      });
    }
    items.push({ label: activeCategory?.name ?? 'Danh mục' });
    return items;
  }, [activeCategory, parentCategory]);

  const pageTitle = activeCategory?.name ? `${activeCategory.name} — Diễn đàn` : 'Diễn đàn — Danh mục';

  if (categoryId == null) {
    return (
      <Page title="Không tìm thấy" meta={<meta name="description" content="Danh mục không hợp lệ" />}>
        <Container sx={{ py: 4 }}>
          <Typography color="text.secondary">Danh mục không hợp lệ.</Typography>
          <Button sx={{ mt: 2 }} onClick={() => navigate('/forum')} variant="contained">
            Về diễn đàn
          </Button>
        </Container>
      </Page>
    );
  }

  return (
    <Page
      title={pageTitle}
      meta={<meta name="description" content={`Chủ đề trong ${activeCategory?.name ?? 'danh mục'}`} />}
    >
      <Container
        maxWidth={false}
        disableGutters
        sx={{
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
              <ForumFilterPanel filters={filters} selectedId={selectedSidebarId} onChange={handleFilterChange} />
              <ForumSponsoredCard
                title="Sponsored"
                imageSrc="/forum/metro_station.png"
                imageAlt="HCMC Metro Opening"
                caption="HCMC Metro Opening"
              />
            </Stack>

            <Stack
              spacing={0}
              sx={{
                flex: 1,
                minWidth: 0,
                width: '100%',
                px: { xs: 1.5, sm: 2, md: 2.75 },
              }}
            >
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
                  <Breadcrumb items={breadcrumbItems} uppercase color="primary" />
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      justifyContent: 'space-between',
                      gap: 2,
                      mt: 1,
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
                      {(activeCategory?.name ?? 'Danh mục').toUpperCase()}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 1,
                        width: { xs: '100%', sm: 'auto' },
                      }}
                    >
                      <Button variant="outlined" color="primary" sx={{ minWidth: { xs: '100%', sm: 'auto' } }}>
                        Theo dõi
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate('/forum/alumni/career/create-topic')}
                        sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
                      >
                        Tạo bài đăng
                      </Button>
                    </Box>
                  </Box>
                </Box>

                <Box>
                  {topicsPending && !topics?.length ? (
                    <Box sx={{ px: 3, py: 4 }}>
                      <Typography color="text.secondary">Đang tải…</Typography>
                    </Box>
                  ) : !topics?.length ? (
                    <Box sx={{ px: 3, py: 4 }}>
                      <Typography color="text.secondary">Chưa có chủ đề trong danh mục này.</Typography>
                    </Box>
                  ) : (
                    topics.map((topic) => (
                      <Box
                        key={topic.id}
                        onClick={() =>
                          navigate(`/forum/alumni/career/${topic.id}`, {
                            state: {
                              topicTitle: topic.title,
                              topicSummary: {
                                id: topic.id,
                                title: topic.title,
                                createdByMemberId: topic.createdByMemberId ?? null,
                                createdAt: topic.createdAt ?? null,
                                viewCount: topic.viewCount ?? null,
                                categoryId: topic.categoryId ?? null,
                              },
                              selectedFilterId:
                                activeCategory?.parentId != null
                                  ? `parent-${activeCategory.parentId}`
                                  : `parent-${categoryId}`,
                            },
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
                          '&:hover': { backgroundColor: 'action.hover' },
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
                              {topic.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Được tạo lúc · {formatTopicDate(topic.createdAt)}
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
                              {topic.postCount ?? 0}
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
                                Thành viên #{topic.createdByMemberId ?? '—'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatTopicDate(topic.updatedAt)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    ))
                  )}
                </Box>
              </Box>
            </Stack>
          </Box>
        </Container>
      </Container>
    </Page>
  );
};

export default ForumCategoryPage;
