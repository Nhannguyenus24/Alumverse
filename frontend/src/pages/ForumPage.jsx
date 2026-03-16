import { useEffect, useMemo, useState, useCallback } from 'react';
import { Box, Button, Container, IconButton, Paper, Stack, TextField, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router';
import AddIcon from '@mui/icons-material/Add';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import SaveIcon from '@mui/icons-material/Save';
import PersonIcon from '@mui/icons-material/Person';
import Page from '../components/Page';
import Breadcrumb from '../components/Breadcrumb';
import { useAuth } from '../hooks/useAuth';
import { useForumCategories } from '../hooks/forum/useForumCategories';
import { useForumTopics, useForumTopicsForCategories } from '../hooks/forum/useForumTopics';
import ForumFilterPanel from '../components/forum/ForumFilterPanel';
import ForumSponsoredCard from '../components/forum/ForumSponsoredCard';
import ForumSection from '../components/forum/ForumSection';

const FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'alumni', label: 'Cựu sinh viên' },
  { id: 'jobs', label: 'Việc làm' },
  { id: 'events', label: 'Hoạt động' },
  { id: 'tech', label: 'Công nghệ' },
  { id: 'courses', label: 'Học phần' },
  { id: 'admissions', label: 'Tuyển sinh' },
];

const SECTIONS = [
  {
    id: 'main',
    title: 'CHÍNH',
    filterIds: ['all'],
    boards: [],
  },
  {
    id: 'alumni',
    title: 'CỰU SINH VIÊN',
    filterIds: ['all', 'alumni', 'jobs', 'events', 'tech', 'courses', 'admissions'],
    boards: [],
  },
];

const sectionsToManageTopics = (sections) =>
  sections.map((s) => ({
    id: s.id,
    title: s.title,
    boards: s.boards.map((b) => ({ id: b.id, name: b.name, description: b.description ?? '' })),
  }));

const ForumPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedFilterId, setSelectedFilterId] = useState('all');
  const [isManageMode, setIsManageMode] = useState(false);

  useEffect(() => {
    const fromState = location.state?.selectedFilterId;
    if (!fromState || !(fromState === 'all' || fromState.startsWith('category-'))) {
      return;
    }

    // Sử dụng transition để tránh cascade render mạnh
    const id = window.requestIdleCallback
      ? window.requestIdleCallback(() => {
          setSelectedFilterId(fromState);
          navigate(location.pathname, { replace: true, state: {} });
        })
      : window.setTimeout(() => {
          setSelectedFilterId(fromState);
          navigate(location.pathname, { replace: true, state: {} });
        }, 0);

    return () => {
      if (window.cancelIdleCallback && typeof id === 'number') {
        window.cancelIdleCallback(id);
      } else {
        window.clearTimeout(id);
      }
    };
  }, [location.pathname, location.state?.selectedFilterId, navigate]);
  const [manageTopics, setManageTopics] = useState(() => sectionsToManageTopics(SECTIONS));
  const [newMainTopic, setNewMainTopic] = useState('');
  const [newSubTopics, setNewSubTopics] = useState({});
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const organizationId = user?.organizationId ?? 1;
  const { categories, isPending } = useForumCategories(organizationId);

  const isAllSelected = selectedFilterId === 'all';
  const categoryId = useMemo(() => {
    if (selectedFilterId.startsWith('category-')) {
      const id = parseInt(selectedFilterId.replace('category-', ''), 10);
      return Number.isNaN(id) ? null : id;
    }
    return null;
  }, [selectedFilterId]);

  const categoryIds = useMemo(
    () => (isAllSelected && categories?.length ? categories.map((c) => c.id) : []),
    [isAllSelected, categories]
  );

  const { topics: topicsSingle } = useForumTopics(categoryId, 0, 10);
  const { topics: topicsAll } = useForumTopicsForCategories(categoryIds, 0, 10);

  const topics = isAllSelected ? topicsAll : topicsSingle;

  const sections = useMemo(() => {
    if (!topics?.length) return SECTIONS;

    const topicBoards = topics.map((t) => ({
      id: `topic-${t.id}`,
      topicId: t.id,
      name: t.title,
      description: '',
      threadCount: t.viewCount ?? '-',
      discussionCount: '-',
      lastPost: null,
    }));

    return SECTIONS.map((s) => {
      if (s.id === 'main' || s.id === 'alumni') {
        return {
          ...s,
          boards: topicBoards,
        };
      }
      return s;
    });
  }, [topics]);

  const filters = useMemo(() => {
    if (isPending && !categories?.length) {
      return FILTERS;
    }
    if (!categories?.length) return FILTERS;
    return [
      { id: 'all', label: 'Tất cả' },
      ...categories.map((c) => ({ id: `category-${c.id}`, label: c.name })),
    ];
  }, [categories, isPending]);

  const handleFilterChange = useCallback(
    (id) => {
      if (id === 'alumni') {
        navigate('/forum/alumni/career');
        return;
      }
      setSelectedFilterId(id);
    },
    [navigate]
  );

  const isCategoryView = selectedFilterId.startsWith('category-');
  const selectedCategory = useMemo(
    () => categories?.find((c) => c.id === categoryId) ?? null,
    [categories, categoryId]
  );

  const formatTopicDate = useCallback((iso) => {
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
  }, []);

  const visibleSections = useMemo(() => {
    if (categories?.length) return sections;
    if (selectedFilterId === 'all') return sections;
    return sections.filter((s) => (s.filterIds ?? []).includes(selectedFilterId));
  }, [selectedFilterId, sections, categories]);

  const handleBoardClick = useCallback(
    (board) => {
      if (!board?.topicId) return;
      navigate(`/forum/alumni/career/${board.topicId}`, {
        state: {
          topicTitle: board.name,
          selectedFilterId,
        },
      });
    },
    [navigate, selectedFilterId]
  );

  const handleOpenManageMode = () => {
    setManageTopics(sectionsToManageTopics(sections));
    setNewMainTopic('');
    setNewSubTopics({});
    setIsManageMode(true);
  };

  const handleCloseManageMode = () => setIsManageMode(false);

  const handleAddMainTopic = () => {
    const trimmed = newMainTopic.trim();
    if (!trimmed) return;
    setManageTopics((prev) => [
      ...prev,
      { id: `topic-${Date.now()}`, title: trimmed.toUpperCase(), boards: [] },
    ]);
    setNewMainTopic('');
  };

  const handleAddSubTopic = (topicId) => {
    const value = newSubTopics[topicId]?.trim() ?? '';
    if (!value) return;
    setManageTopics((prev) =>
      prev.map((t) =>
        t.id === topicId
          ? {
              ...t,
              boards: [...t.boards, { id: `board-${Date.now()}`, name: value, description: '' }],
            }
          : t
      )
    );
    setNewSubTopics((prev) => ({ ...prev, [topicId]: '' }));
  };

  const handleDeleteTopic = (topicId) => {
    setManageTopics((prev) => prev.filter((t) => t.id !== topicId));
  };

  const handleDeleteBoard = (topicId, boardId) => {
    setManageTopics((prev) =>
      prev.map((t) =>
        t.id === topicId ? { ...t, boards: t.boards.filter((b) => b.id !== boardId) } : t
      )
    );
  };

  const handleSaveTopics = () => {
    handleCloseManageMode();
  };

  return (
    <Page
      title="Diễn đàn"
      meta={<meta name="description" content="Diễn đàn AlumVerse" />}
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
              <ForumFilterPanel filters={filters} selectedId={selectedFilterId} onChange={handleFilterChange} />
              <ForumSponsoredCard
                title="Sponsored"
                imageSrc="/forum/metro_station.png"
                imageAlt="HCMC Metro Opening"
                caption="HCMC Metro Opening"
              />
            </Stack>

            <Stack
              spacing={3}
              sx={{
                flex: 1,
                minWidth: 0,
                width: '100%',
                px: { xs: 1.5, sm: 2, md: 2.75 },
              }}
            >
              {!isCategoryView && (
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
                  variant="h1"
                  component="h2"
                  fontWeight={800}
                  color="primary.main"
                  sx={{
                    fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
                    letterSpacing: 1,
                  }}
                >
                  DIỄN ĐÀN
                </Typography>
                {isAdmin && (
                  isManageMode ? (
                    <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                      <Button variant="outlined" color="primary" onClick={handleCloseManageMode}>
                        Huỷ
                      </Button>
                      <Button variant="contained" color="primary" onClick={handleSaveTopics}>
                        Lưu
                      </Button>
                    </Box>
                  ) : (
                    <Button
                      variant="outlined"
                      color="primary"
                      sx={{ flexShrink: 0 }}
                      onClick={handleOpenManageMode}
                    >
                      Thay đổi chủ đề
                    </Button>
                  )
                )}
              </Box>
              )}
              {isManageMode ? (
                <>
                  <Paper
                    elevation={0}
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 0,
                      p: { xs: 1.5, sm: 2 },
                      backgroundColor: '#fff',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'stretch', sm: 'center' },
                        gap: 2,
                      }}
                    >
                      <AddIcon sx={{ fontSize: 36, color: 'primary.main', flexShrink: 0 }} />
                      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <TextField
                          fullWidth
                          placeholder="Thêm chủ đề chính"
                          value={newMainTopic}
                          onChange={(e) => setNewMainTopic(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddMainTopic()}
                          size="small"
                          InputProps={{ sx: { backgroundColor: 'grey.50' } }}
                        />
                        <TextField
                          fullWidth
                          placeholder="Mô tả chủ đề chính"
                          size="small"
                          InputProps={{ sx: { backgroundColor: 'grey.50' } }}
                        />
                      </Box>
                      <IconButton
                        size="small"
                        onClick={handleAddMainTopic}
                        sx={{ color: 'success.main', flexShrink: 0 }}
                        aria-label="Lưu chủ đề chính"
                      >
                        <SaveIcon sx={{ fontSize: 28 }} />
                      </IconButton>
                    </Box>
                  </Paper>
                  {manageTopics.map((topic) => (
                    <Paper
                      key={topic.id}
                      elevation={0}
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 0,
                        overflow: 'hidden',
                        backgroundColor: '#fff',
                      }}
                    >
                      <Box
                        sx={{
                          px: { xs: 1.5, sm: 2, md: 2.75 },
                          py: { xs: 1.2, sm: 1.4, md: 1.7 },
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          justifyContent: 'space-between',
                          gap: 1,
                          backgroundColor: '#0B4D8D',
                          color: '#fff',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ChatBubbleOutlineOutlinedIcon
                            sx={{
                              fontSize: 22,
                              color: '#fff',
                              '& path': { fill: 'none', stroke: '#fff', strokeWidth: 1.5 },
                            }}
                          />
                          <Typography
                            variant="subtitle1"
                            fontWeight={900}
                            sx={{ letterSpacing: 0.8, fontSize: { xs: '0.9rem', md: '1rem' } }}
                          >
                            {topic.title}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            sx={{ color: '#fff' }}
                            aria-label="Sửa chủ đề"
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            sx={{ color: '#fff' }}
                            onClick={() => handleDeleteTopic(topic.id)}
                            aria-label="Xóa chủ đề"
                          >
                            <DeleteOutlineOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                      <Box>
                        {topic.boards.map((board, idx) => (
                          <Box
                            key={board.id}
                            sx={{
                              px: { xs: 1.5, sm: 2, md: 2.75 },
                              py: 1.5,
                              display: 'flex',
                              flexDirection: { xs: 'column', sm: 'row' },
                              alignItems: { xs: 'flex-start', sm: 'center' },
                              justifyContent: 'space-between',
                              gap: 1,
                              borderBottom: idx === topic.boards.length - 1 ? 0 : 1,
                              borderColor: 'divider',
                            }}
                          >
                            <Box>
                              <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                                {board.name}
                              </Typography>
                              {board.description && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                                  {board.description}
                                </Typography>
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton
                                size="small"
                                sx={{ color: 'text.primary' }}
                                aria-label="Sửa chủ đề con"
                              >
                                <EditOutlinedIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                sx={{ color: 'error.main' }}
                                onClick={() => handleDeleteBoard(topic.id, board.id)}
                                aria-label="Xóa chủ đề con"
                              >
                                <DeleteOutlineOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                        ))}
                        <Box
                          sx={{
                            px: { xs: 1.5, sm: 2, md: 2.75 },
                            py: 2,
                            borderTop: 1,
                            borderColor: 'divider',
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: { xs: 'column', sm: 'row' },
                              alignItems: { xs: 'stretch', sm: 'center' },
                              gap: 2,
                            }}
                          >
                            <AddIcon sx={{ fontSize: 36, color: 'primary.main', flexShrink: 0 }} />
                            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <TextField
                                fullWidth
                                placeholder="Thêm chủ đề con"
                                value={newSubTopics[topic.id] ?? ''}
                                onChange={(e) =>
                                  setNewSubTopics((prev) => ({ ...prev, [topic.id]: e.target.value }))
                                }
                                onKeyDown={(e) => e.key === 'Enter' && handleAddSubTopic(topic.id)}
                                size="small"
                                InputProps={{ sx: { backgroundColor: 'grey.50' } }}
                              />
                              <TextField
                                fullWidth
                                placeholder="Mô tả chủ đề con"
                                size="small"
                                InputProps={{ sx: { backgroundColor: 'grey.50' } }}
                              />
                            </Box>
                            <IconButton
                              size="small"
                              onClick={() => handleAddSubTopic(topic.id)}
                              sx={{ color: 'success.main', flexShrink: 0 }}
                              aria-label="Lưu chủ đề con"
                            >
                              <SaveIcon sx={{ fontSize: 28 }} />
                            </IconButton>
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </>
              ) : isCategoryView ? (
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
                        { label: 'Diễn đàn', path: '/forum' },
                        { label: selectedCategory?.name ?? 'Chủ đề' },
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
                        {(selectedCategory?.name ?? 'Chủ đề').toUpperCase()}
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
                          onClick={() => navigate('/forum/alumni/career/create-post')}
                          sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
                        >
                          Tạo bài đăng
                        </Button>
                      </Box>
                    </Box>
                  </Box>

                  <Box>
                    {topicsSingle.map((topic) => (
                  <Box
                    key={topic.id}
                    onClick={() =>
                      navigate(`/forum/alumni/career/${topic.id}`, {
                        state: {
                          topicTitle: topic.title,
                          selectedFilterId: `category-${selectedCategory?.id ?? topic.categoryId}`,
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
                          <Box
                            sx={{
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
                              {topic.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Thành viên #{topic.createdByMemberId ?? '—'} • {formatTopicDate(topic.createdAt)}
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
                                Thành viên #{topic.createdByMemberId ?? '—'}
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
              ) : (
                visibleSections.map((section) => (
                  <ForumSection
                    key={section.id}
                    title={section.title}
                    boards={section.boards}
                    onBoardClick={handleBoardClick}
                  />
                ))
              )}
            </Stack>
          </Box>
        </Container>
      </Container>
    </Page>
  );
};

export default ForumPage;

