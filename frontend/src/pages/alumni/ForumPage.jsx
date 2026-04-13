import { useMemo, useState, useCallback, useEffect } from 'react';
import { Box, Button, Container, IconButton, Paper, Stack, TextField, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router';
import AddIcon from '@mui/icons-material/Add';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import SaveIcon from '@mui/icons-material/Save';
import Page from '../../components/Page';
import { useAuth } from '../../hooks/useAuth';
import { useForumCategories } from '../../hooks/forum/useForumCategories';
import { useNotification } from '../../hooks/useNotification';
import ForumFilterPanel from '../../components/forum/ForumFilterPanel';
import ForumSponsoredCard from '../../components/forum/ForumSponsoredCard';
import ForumSection from '../../components/forum/ForumSection';

const sectionsToManageTopics = (sections) =>
  sections.map((s) => ({
    id: s.id,
    title: s.title,
    boards: s.boards.map((b) => ({
      id: b.id,
      name: b.name,
      description: b.description ?? '',
    })),
  }));

const ForumPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showSuccess, showWarning, showInfo } = useNotification();

  const selectedFilterId = useMemo(() => {
    const sid = location.state?.selectedFilterId;
    if (sid === 'all' || (typeof sid === 'string' && sid.startsWith('parent-'))) {
      return sid;
    }
    return 'all';
  }, [location.state?.selectedFilterId]);

  const [isManageMode, setIsManageMode] = useState(false);
  const [manageTopics, setManageTopics] = useState(() => sectionsToManageTopics([]));
  const [newMainTopic, setNewMainTopic] = useState('');
  const [newSubTopics, setNewSubTopics] = useState({});
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const organizationId = user?.organizationId ?? 1;
  const { categories, isPending } = useForumCategories(organizationId);

  useEffect(() => {
    const sid = location.state?.selectedFilterId;
    if (typeof sid === 'string' && sid.startsWith('category-')) {
      const cid = parseInt(sid.replace('category-', ''), 10);
      if (!Number.isNaN(cid) && cid > 0) {
        navigate(`/forum/category/${cid}`, {
          replace: true,
          state: { ...location.state, selectedFilterId: undefined },
        });
      }
    }
  }, [location.state, navigate]);

  const parentCategories = useMemo(() => {
    const list = (categories ?? []).filter((c) => c.parentId == null);
    list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'));
    return list;
  }, [categories]);

  const childrenByParentId = useMemo(() => {
    const map = new Map();
    for (const c of categories ?? []) {
      if (c.parentId != null) {
        const arr = map.get(c.parentId) ?? [];
        arr.push(c);
        map.set(c.parentId, arr);
      }
    }
    for (const [, arr] of map) {
      arr.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'));
    }
    return map;
  }, [categories]);

  const filters = useMemo(() => {
    if (isPending && !categories?.length) {
      return [{ id: 'all', label: 'Tất cả' }];
    }
    return [{ id: 'all', label: 'Tất cả' }, ...parentCategories.map((p) => ({ id: `parent-${p.id}`, label: p.name }))];
  }, [categories, isPending, parentCategories]);

  const sections = useMemo(() => {
    return parentCategories.map((parent) => ({
      id: `section-${parent.id}`,
      title: (parent.name || '').toUpperCase(),
      parentId: parent.id,
      boards: (childrenByParentId.get(parent.id) ?? []).map((sub) => ({
        id: `cat-${sub.id}`,
        categoryId: sub.id,
        name: sub.name,
        description: sub.description ?? '',
        topicCount: sub.topicCount ?? 0,
        participantCount: sub.participantCount ?? 0,
        lastPost: null,
      })),
    }));
  }, [parentCategories, childrenByParentId]);

  const visibleSections = useMemo(() => {
    if (selectedFilterId === 'all') return sections;
    if (selectedFilterId.startsWith('parent-')) {
      const pid = parseInt(selectedFilterId.replace('parent-', ''), 10);
      if (Number.isNaN(pid)) return sections;
      return sections.filter((s) => s.parentId === pid);
    }
    return sections;
  }, [selectedFilterId, sections]);

  const handleFilterChange = useCallback(
    (id) => {
      navigate('.', { replace: true, state: { ...(location.state ?? {}), selectedFilterId: id } });
    },
    [navigate, location.state]
  );

  const handleBoardClick = useCallback(
    (board) => {
      const cid = board?.categoryId;
      if (cid == null) return;
      navigate(`/forum/category/${cid}`, {
        state: {
          selectedFilterId:
            board.parentSectionId != null ? `parent-${board.parentSectionId}` : selectedFilterId,
        },
      });
    },
    [navigate, selectedFilterId]
  );

  const boardsForSection = useCallback(
    (section) =>
      section.boards.map((b) => ({
        ...b,
        parentSectionId: section.parentId,
      })),
    []
  );

  const handleOpenManageMode = () => {
    setManageTopics(sectionsToManageTopics(visibleSections));
    setNewMainTopic('');
    setNewSubTopics({});
    setIsManageMode(true);
  };

  const handleCloseManageMode = () => setIsManageMode(false);

  const handleAddMainTopic = () => {
    const trimmed = newMainTopic.trim();
    if (!trimmed) {
      showWarning('Vui lòng nhập tên chủ đề chính.');
      return;
    }
    setManageTopics((prev) => [
      ...prev,
      { id: `topic-${Date.now()}`, title: trimmed.toUpperCase(), boards: [] },
    ]);
    setNewMainTopic('');
    showSuccess('Đã thêm chủ đề chính.');
  };

  const handleAddSubTopic = (topicId) => {
    const value = newSubTopics[topicId]?.trim() ?? '';
    if (!value) {
      showWarning('Vui lòng nhập tên chủ đề con.');
      return;
    }
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
    showSuccess('Đã thêm chủ đề con.');
  };

  const handleDeleteTopic = (topicId) => {
    setManageTopics((prev) => prev.filter((t) => t.id !== topicId));
    showInfo('Đã xóa chủ đề.');
  };

  const handleDeleteBoard = (topicId, boardId) => {
    setManageTopics((prev) =>
      prev.map((t) =>
        t.id === topicId ? { ...t, boards: t.boards.filter((b) => b.id !== boardId) } : t
      )
    );
    showInfo('Đã xóa chủ đề con.');
  };

  const handleSaveTopics = () => {
    handleCloseManageMode();
    showSuccess('Đã lưu thay đổi chủ đề.');
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
                {isAdmin &&
                  (isManageMode ? (
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
                  ))}
              </Box>
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
                          <IconButton size="small" sx={{ color: '#fff' }} aria-label="Sửa chủ đề">
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
                              <IconButton size="small" sx={{ color: 'text.primary' }} aria-label="Sửa chủ đề con">
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
              ) : (
                visibleSections.map((section) => (
                  <ForumSection
                    key={section.id}
                    title={section.title}
                    boards={boardsForSection(section)}
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
