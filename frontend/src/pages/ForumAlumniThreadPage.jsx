import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ModeCommentOutlinedIcon from '@mui/icons-material/ModeCommentOutlined';
import ReplyOutlinedIcon from '@mui/icons-material/ReplyOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import SentimentSatisfiedAltOutlinedIcon from '@mui/icons-material/SentimentSatisfiedAltOutlined';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Page from '../components/Page';
import { useAuth } from '../hooks/useAuth';
import { useForumPosts } from '../hooks/forum/useForumPosts';
import { useForumCategories } from '../hooks/forum/useForumCategories';
import Breadcrumb from '../components/Breadcrumb';
import ForumFilterPanel from '../components/forum/ForumFilterPanel';
import ForumSponsoredCard from '../components/forum/ForumSponsoredCard';
import WYSIWYG from '../components/WYSIWYG';

const formatPostDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const FALLBACK_THREAD = {
  title: 'Chủ đề',
  authorName: '—',
  role: 'Alumni',
  createdAt: '—',
};

const ForumAlumniThreadPage = () => {
  const navigate = useNavigate();
  const { threadId } = useParams();
  const topicId = useMemo(() => {
    const id = parseInt(threadId, 10);
    return Number.isNaN(id) ? null : id;
  }, [threadId]);

  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [editorValue, setEditorValue] = useState('');

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

  const { posts, isPending: postsPending, isError: postsError } = useForumPosts(topicId, 0, 20);

  const thread = useMemo(() => {
    const first = posts.find((p) => !p.answerToPostId) ?? posts[0];
    if (!first) return FALLBACK_THREAD;
    const title =
      first.content?.length > 60 ? `${first.content.slice(0, 60)}...` : first.content || FALLBACK_THREAD.title;
    return {
      title,
      authorName: `Thành viên #${first.authorMemberId ?? '—'}`,
      role: 'Alumni',
      createdAt: formatPostDate(first.createdAt),
    };
  }, [posts]);

  const replies = useMemo(
    () =>
      posts.map((p) => ({
        id: p.id,
        authorName: `Thành viên #${p.authorMemberId ?? '—'}`,
        role: 'Alumni',
        createdAt: formatPostDate(p.createdAt),
        content: p.content ?? '',
        reactionsSummary: '',
      })),
    [posts]
  );

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
      title={`Diễn đàn - ${thread.title}`}
      meta={<meta name="description" content="Chi tiết chủ đề Hướng nghiệp" />}
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

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Breadcrumb
                items={[
                  { label: 'Diễn đàn', path: '/forum' },
                  { label: thread.title },
                ]}
                uppercase
                color="primary"
                fontSize="0.8rem"
              />
              <Box
                sx={{
                  backgroundColor: '#fff',
                  border: 1,
                  borderColor: 'divider',
                }}
              >
                {/* Header + main thread */}
                <Box
                  sx={{
                    px: { xs: 1.5, sm: 2, md: 3 },
                    py: { xs: 1.5, md: 2 },
                    borderBottom: 1,
                    borderColor: 'divider',
                  }}
                >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    justifyContent: 'space-between',
                    gap: 2,
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="h5"
                    component="h1"
                    fontWeight={800}
                    sx={{
                      fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' },
                      wordBreak: 'break-word',
                    }}
                  >
                    {thread.title}
                  </Typography>
                  {isAdmin ? (
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                        gap: 1,
                        width: '100%',
                        maxWidth: { xs: 300, sm: 360 },
                        minWidth: { xs: 240, sm: 320 },
                      }}
                    >
                      <Button
                        fullWidth
                        variant="contained"
                        size="small"
                        startIcon={<NotificationsNoneOutlinedIcon sx={{ fontSize: 18 }} />}
                        sx={{
                          bgcolor: '#374151',
                          color: 'white',
                          '&:hover': { bgcolor: '#4B5563' },
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Theo dõi
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        size="small"
                        startIcon={<EditOutlinedIcon sx={{ fontSize: 18 }} />}
                        sx={{
                          borderColor: 'black',
                          color: 'black',
                          bgcolor: 'white',
                          '&:hover': { borderColor: 'black', bgcolor: 'grey.50' },
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Sửa
                      </Button>
                      <Button
                        fullWidth
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<PushPinOutlinedIcon sx={{ fontSize: 18, color: 'white' }} />}
                        sx={{ whiteSpace: 'nowrap', color: 'white' }}
                      >
                        Ghim
                      </Button>
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<ReplyOutlinedIcon sx={{ fontSize: 18 }} />}
                        sx={{ whiteSpace: 'nowrap' }}
                      >
                        Trả lời
                      </Button>
                      <Button
                        fullWidth
                        variant="contained"
                        color="error"
                        size="small"
                        startIcon={<DeleteOutlineOutlinedIcon sx={{ fontSize: 18 }} />}
                        sx={{ whiteSpace: 'nowrap' }}
                      >
                        Xóa
                      </Button>
                      <Button
                        fullWidth
                        variant="contained"
                        size="small"
                        startIcon={<LockOutlinedIcon sx={{ fontSize: 18 }} />}
                        sx={{
                          bgcolor: '#EAB308',
                          color: 'white',
                          '&:hover': { bgcolor: '#CA8A04' },
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Khóa
                      </Button>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1,
                        justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                      }}
                    >
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        startIcon={<NotificationsNoneOutlinedIcon sx={{ fontSize: 18 }} />}
                      >
                        Theo dõi
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<ReplyOutlinedIcon sx={{ fontSize: 18 }} />}
                      >
                        Trả lời
                      </Button>
                    </Box>
                  )}
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 26 }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {thread.authorName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {thread.createdAt}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Replies */}
              <Box>
                {postsPending ? (
                  <Box sx={{ px: { xs: 1.5, sm: 2, md: 3 }, py: 3 }}>
                    <Typography color="text.secondary">Đang tải bài viết...</Typography>
                  </Box>
                ) : postsError ? (
                  <Box sx={{ px: { xs: 1.5, sm: 2, md: 3 }, py: 3 }}>
                    <Typography color="error">Không thể tải bài viết.</Typography>
                  </Box>
                ) : (
                replies.map((reply, index) => {
                  const isOwn = index === 0;
                  return (
                  <Box
                    key={reply.id}
                    sx={{
                      px: { xs: 1.5, sm: 2, md: 3 },
                      py: { xs: 2, md: 2.5 },
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'center', sm: 'flex-start' },
                      gap: 2,
                      borderTop: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Box
                      sx={{
                        width: { xs: 'auto', sm: 110 },
                        flexShrink: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: { xs: 48, sm: 64 },
                          height: { xs: 48, sm: 64 },
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <PersonIcon sx={{ fontSize: 36 }} />
                      </Box>
                      <Typography variant="body2" fontWeight={600}>
                        {reply.authorName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {reply.role}
                      </Typography>
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          justifyContent: 'space-between',
                          mb: 1,
                          gap: 1.5,
                          width: '100%',
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {reply.createdAt}
                        </Typography>
                        {isAdmin ? (
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Button
                              size="small"
                              variant="contained"
                              color="error"
                              startIcon={<DeleteOutlineOutlinedIcon sx={{ fontSize: 18 }} />}
                            >
                              Xóa
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<PushPinOutlinedIcon sx={{ fontSize: 18, color: 'white' }} />}
                              sx={{ color: 'white' }}
                            >
                              Ghim
                            </Button>
                          </Box>
                        ) : isOwn ? (
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              startIcon={<EditOutlinedIcon sx={{ fontSize: 18 }} />}
                            >
                              Sửa
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              color="error"
                              startIcon={<DeleteOutlineOutlinedIcon sx={{ fontSize: 18 }} />}
                            >
                              Xóa
                            </Button>
                          </Box>
                        ) : null}
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.primary"
                        sx={{ mb: 1.5, lineHeight: 1.7 }}
                      >
                        {reply.content}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mb: 1.5 }}
                      >
                        {reply.reactionsSummary}
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 1.5,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <FavoriteBorderIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              32
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ModeCommentOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              8
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ReplyOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              Chia sẻ
                            </Typography>
                          </Box>
                        </Box>
                        <Box
                          sx={{
                            display: 'flex',
                            gap: 1,
                            flexWrap: 'wrap',
                            justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                          }}
                        >
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            startIcon={<ReplyOutlinedIcon sx={{ fontSize: 18 }} />}
                          >
                            Trả lời
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            startIcon={<SentimentSatisfiedAltOutlinedIcon sx={{ fontSize: 18 }} />}
                          >
                            Cảm xúc
                          </Button>
                        </Box>
                        </Box>
                      </Box>
                  </Box>
                );
                }) )}
              </Box>

              {/* Reply editor */}
              <Box
                sx={{
                  px: { xs: 1.5, sm: 2, md: 3 },
                  py: { xs: 2, md: 2.5 },
                  borderTop: 1,
                  borderColor: 'divider',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'center', sm: 'flex-start' },
                    gap: 2,
                  }}
                >
                  {/* Left: avatar column */}
                  <Box
                    sx={{
                      width: { xs: 'auto', sm: 110 },
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: { xs: 'row', sm: 'column' },
                      alignItems: { xs: 'center', sm: 'center' },
                      gap: 1,
                      pt: { sm: 0.5 },
                    }}
                  >
                    <Box
                      sx={{
                        width: { xs: 40, sm: 56 },
                        height: { xs: 40, sm: 56 },
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <PersonIcon sx={{ fontSize: 30 }} />
                    </Box>
                    <Box sx={{ textAlign: { xs: 'left', sm: 'center' } }}>
                      <Typography variant="body2" fontWeight={600}>
                        {user?.userName ?? 'User'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(user?.role ?? 'Student').toString().toLowerCase()}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Right: editor */}
                  <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
                    <WYSIWYG
                      value={editorValue}
                      onChange={setEditorValue}
                      placeholder="Write something"
                      height={180}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
                      <Button variant="contained" color="primary">
                        Đăng
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Box>
              </Box>
            </Box>
          </Box>
        </Container>
      </Container>
    </Page>
  );
};

export default ForumAlumniThreadPage;
