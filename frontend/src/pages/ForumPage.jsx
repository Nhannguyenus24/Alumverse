import { useMemo, useState, useCallback } from 'react';
import {
  Box,
  Button,
  Container,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router';
import AddIcon from '@mui/icons-material/Add';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import SaveIcon from '@mui/icons-material/Save';
import Page from '../components/Page';
import { useAuth } from '../hooks/useAuth';
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
    boards: [
      {
        id: 'announcements',
        name: 'Thông báo',
        description: 'Kênh thông báo chính thức của diễn đàn.',
        threadCount: 20,
        discussionCount: 47,
        lastPost: {
          title: 'Kiểm tra tài khoản c...',
          authorName: 'Nguyễn Văn A',
          createdAt: '15 phút trước',
        },
      },
      {
        id: 'suggestions',
        name: 'Góp ý',
        description: 'Đóng góp ý kiến tại đây.',
        threadCount: '2.4K',
        discussionCount: '40K',
        lastPost: {
          title: 'Kiểm tra tài khoản c...',
          authorName: 'Nguyễn Văn A',
          createdAt: '10 phút trước',
        },
      },
      {
        id: 'general-knowledge',
        name: 'Kiến thức chung',
        description: 'Kiến thức chung về diễn đàn.',
        threadCount: 400,
        discussionCount: '1.5K',
        lastPost: {
          title: 'Kiểm tra tài khoản c...',
          authorName: 'Nguyễn Văn A',
          createdAt: '5 phút trước',
        },
      },
    ],
  },
  {
    id: 'alumni',
    title: 'CỰU SINH VIÊN',
    filterIds: ['all', 'alumni', 'jobs', 'events', 'tech', 'courses', 'admissions'],
    boards: [
      {
        id: 'meetups',
        name: 'Gặp gỡ',
        description: 'Gặp gỡ các Alumni.',
        threadCount: '2.4K',
        discussionCount: '40K',
        lastPost: {
          title: 'Kiểm tra tài khoản c...',
          authorName: 'Nguyễn Văn A',
          createdAt: '15 phút trước',
        },
      },
      {
        id: 'inspiration',
        name: 'Truyền cảm hứng',
        description: 'Những người đi trước truyền cho người đi sau.',
        threadCount: 400,
        discussionCount: '1.5K',
        lastPost: {
          title: 'Kiểm tra tài khoản c...',
          authorName: 'Nguyễn Văn A',
          createdAt: '15 phút trước',
        },
      },
      {
        id: 'scholarships',
        name: 'Học bổng',
        description: 'Quảng bá học bổng tại đây.',
        threadCount: '2.4K',
        discussionCount: '40K',
        lastPost: {
          title: 'Kiểm tra tài khoản c...',
          authorName: 'Nguyễn Văn A',
          createdAt: '15 phút trước',
        },
      },
      {
        id: 'sponsorship',
        name: 'Tài trợ & Quyên góp',
        description: 'Những hoạt động tài trợ và quyên góp.',
        threadCount: 400,
        discussionCount: '1.5K',
        lastPost: {
          title: 'Kiểm tra tài khoản c...',
          authorName: 'Nguyễn Văn A',
          createdAt: '15 phút trước',
        },
      },
      {
        id: 'career',
        name: 'Hướng nghiệp',
        description: 'Cơ hội nghề nghiệp và phát triển.',
        threadCount: 400,
        discussionCount: '1.5K',
        lastPost: {
          title: 'Kiểm tra tài khoản c...',
          authorName: 'Nguyễn Văn A',
          createdAt: '15 phút trước',
        },
      },
    ],
  },
];

const sectionsToManageTopics = (sections) =>
  sections.map((s) => ({
    id: s.id,
    title: s.title,
    boards: s.boards.map((b) => ({ id: b.id, name: b.name, description: b.description ?? '' })),
  }));

const ForumPage = () => {
  const [selectedFilterId, setSelectedFilterId] = useState('all');
  const [isManageMode, setIsManageMode] = useState(false);
  const [manageTopics, setManageTopics] = useState(() => sectionsToManageTopics(SECTIONS));
  const [newMainTopic, setNewMainTopic] = useState('');
  const [newSubTopics, setNewSubTopics] = useState({});
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const handleFilterChange = useCallback(
    (id) => {
      if (id === 'alumni') {
        navigate('/dien-dan/cuu-sinh-vien/huong-nghiep');
        return;
      }
      setSelectedFilterId(id);
    },
    [navigate]
  );

  const visibleSections = useMemo(() => {
    if (selectedFilterId === 'all') return SECTIONS;
    return SECTIONS.filter((s) => (s.filterIds ?? []).includes(selectedFilterId));
  }, [selectedFilterId]);

  const handleOpenManageMode = () => {
    setManageTopics(sectionsToManageTopics(SECTIONS));
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
    // TODO: call API to persist
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
              ) : (
                visibleSections.map((section) => (
                  <ForumSection key={section.id} title={section.title} boards={section.boards} />
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

