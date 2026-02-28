import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ModeCommentOutlinedIcon from '@mui/icons-material/ModeCommentOutlined';
import ReplyOutlinedIcon from '@mui/icons-material/ReplyOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import SentimentSatisfiedAltOutlinedIcon from '@mui/icons-material/SentimentSatisfiedAltOutlined';
import Page from '../components/Page';
import Breadcrumb from '../components/Breadcrumb';
import ForumFilterPanel from '../components/forum/ForumFilterPanel';
import ForumSponsoredCard from '../components/forum/ForumSponsoredCard';
import WYSIWYG from '../components/WYSIWYG';

const FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'alumni', label: 'Cựu sinh viên' },
  { id: 'jobs', label: 'Việc làm' },
  { id: 'events', label: 'Hoạt động' },
  { id: 'tech', label: 'Công nghệ' },
  { id: 'courses', label: 'Học phần' },
  { id: 'admissions', label: 'Tuyển sinh' },
];

const MOCK_THREAD = {
  title: 'Ngành Hệ thống thông tin ra có thể có nghề nghiệp nào phù hợp?',
  authorName: 'Nguyễn Văn An',
  role: 'Alumni',
  createdAt: '15 phút trước',
};

const MOCK_REPLIES = Array.from({ length: 3 }).map((_, index) => ({
  id: index + 1,
  authorName: 'Nguyễn Văn An',
  role: 'Alumni',
  createdAt: '15:00, 03/07/2025',
  content:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.',
  reactionsSummary: 'Jessie Walsh, Dave Carson và 32 others',
}));

const ForumAlumniThreadPage = () => {
  const navigate = useNavigate();
  const [editorValue, setEditorValue] = useState('');

  const handleFilterChange = useCallback(
    (id) => {
      if (id === 'all') {
        navigate('/dien-dan');
        return;
      }
      if (id === 'alumni') {
        navigate('/dien-dan/cuu-sinh-vien/huong-nghiep');
        return;
      }
    },
    [navigate]
  );

  const thread = MOCK_THREAD;

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
        }}
      >
        <Container maxWidth="xl" sx={{ pt: { xs: 3, md: 4 }, px: { xs: 3, lg: 6 } }}>
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

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Breadcrumb
                items={[
                  { label: 'Cựu sinh viên', path: '/dien-dan/cuu-sinh-vien/huong-nghiep' },
                  { label: 'Hướng nghiệp', path: '/dien-dan/cuu-sinh-vien/huong-nghiep' },
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
                    px: { xs: 2, md: 3 },
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
                    sx={{ fontSize: { xs: '1.4rem', md: '1.6rem' } }}
                  >
                    {thread.title}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                      gap: 1,
                      maxWidth: 260,
                    }}
                  >
                    <Box sx={{ display: 'flex', flex: '0 0 calc(50% - 4px)' }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        color="primary"
                        size="small"
                        startIcon={<NotificationsNoneOutlinedIcon sx={{ fontSize: 18 }} />}
                      >
                        Theo dõi
                      </Button>
                    </Box>
                    <Box sx={{ display: 'flex', flex: '0 0 calc(50% - 4px)' }}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<ReplyOutlinedIcon sx={{ fontSize: 18 }} />}
                      >
                        Trả lời
                      </Button>
                    </Box>
                    <Box sx={{ display: 'flex', flex: '0 0 calc(50% - 4px)' }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        color="primary"
                        size="small"
                        startIcon={<EditOutlinedIcon sx={{ fontSize: 18 }} />}
                      >
                        Sửa
                      </Button>
                    </Box>
                    <Box sx={{ display: 'flex', flex: '0 0 calc(50% - 4px)' }}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="error"
                        size="small"
                        startIcon={<DeleteOutlineOutlinedIcon sx={{ fontSize: 18 }} />}
                      >
                        Xóa
                      </Button>
                    </Box>
                  </Box>
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
                {MOCK_REPLIES.map((reply, index) => {
                  const isOwn = index === 0;
                  return (
                  <Box
                    key={reply.id}
                    sx={{
                      px: { xs: 2, md: 3 },
                      py: 2.5,
                      display: 'flex',
                      gap: 2,
                      borderTop: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Box
                      sx={{
                        width: 110,
                        flexShrink: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
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
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 1,
                          gap: 1.5,
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {reply.createdAt}
                        </Typography>
                        {isOwn && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
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
                        )}
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
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 1.5,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                )})}
              </Box>

              {/* Reply editor */}
              <Box
                sx={{
                  px: { xs: 2, md: 3 },
                  py: 2.5,
                  borderTop: 1,
                  borderColor: 'divider',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 2,
                  }}
                >
                  {/* Left: avatar column */}
                  <Box
                    sx={{
                      width: 110,
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                      pt: 0.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
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
                    <Typography variant="body2" fontWeight={600}>
                      Nguyễn Văn An
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Alumni
                    </Typography>
                  </Box>

                  {/* Right: editor */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
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
