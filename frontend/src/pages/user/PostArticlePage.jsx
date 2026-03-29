import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Button,
  Container,
  Stack,
  TextField,
  Typography,
  MenuItem,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

import Page from '../../components/Page';
import { useCreateNews } from '../../hooks/news/useCreateNews';
import { useCreateAchievement } from '../../hooks/news/useCreateAchievement';
import { useCreateJob } from '../../hooks/news/useCreateJob';
import { useCreateLearningResource } from '../../hooks/news/useCreateLearningResource';
import { useCreateEvent } from '../../hooks/news/useCreateEvent';
import { useNotification } from '../../hooks/useNotification';

const CHANNELS = [
  { value: 'news', label: 'Tin tức' },
  { value: 'event', label: 'Sự kiện' },
  { value: 'alumni', label: 'Cựu sinh viên' },
  { value: 'achievement', label: 'Kênh thành tựu' },
  { value: 'learning', label: 'Cơ hội học tập' },
  { value: 'job', label: 'Cơ hội việc làm' },
];

const TOPICS_BY_CHANNEL = {
  news: ['Thông báo trường', 'Khoa/Bộ môn', 'Hoạt động sinh viên', 'Alumni news', 'Hợp tác doanh nghiệp', 'Học thuật - nghiên cứu', 'Tuyển sinh - học bổng'],
  event: ['Workshop', 'Talkshow', 'Career Fair', 'Networking', 'Reunion', 'Seminar học thuật', 'Hoạt động CLB'],
  alumni: ['Doanh nhân', 'Công nghệ', 'Nghiên cứu học thuật', 'Du học', 'Startup', 'Lãnh đạo', 'Nghệ thuật - sáng tạo'],
  achievement: ['Giải thưởng', 'Học bổng', 'Thành tựu nghề nghiệp', 'Nghiên cứu khoa học', 'Startup', 'Quốc tế'],
  learning: ['Học bổng', 'Thạc sĩ', 'Du học', 'Khóa học online', 'Chứng chỉ', 'Trao đổi sinh viên', 'Nghiên cứu'],
  job: ['Internship', 'Full-time', 'Part-time', 'Freelance', 'Referral nội bộ', 'Remote'],
};

const PostArticlePage = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const { createNews, isPending: pendingNews } = useCreateNews();
  const { createAchievement, isPending: pendingAchievement } = useCreateAchievement();
  const { createJob, isPending: pendingJob } = useCreateJob();
  const { createLearningResource, isPending: pendingLearning } = useCreateLearningResource();
  const { createEvent, isPending: pendingEvent } = useCreateEvent();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [channel, setChannel] = useState('news');
  const [topic, setTopic] = useState(TOPICS_BY_CHANNEL.news[0]);
  const [coverImage, setCoverImage] = useState(null);

  const isPending = pendingNews || pendingAchievement || pendingJob || pendingLearning || pendingEvent;

  const handleChannelChange = (e) => {
    const newChannel = e.target.value;
    setChannel(newChannel);
    setTopic(TOPICS_BY_CHANNEL[newChannel][0]);
  };

  const handleCancel = () => navigate(-1);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      showError('Vui lòng nhập tiêu đề và nội dung');
      return;
    }

    try {
      let result;
      const trimmedTitle = title.trim();
      const trimmedContent = content.trim();

      switch (channel) {
        case 'news':
          result = await createNews({ title: trimmedTitle, content: trimmedContent, thumbnailUrl: coverImage || null });
          navigate(`/article/${result.id}`);
          break;
        case 'event':
          result = await createEvent({ title: trimmedTitle, description: trimmedContent, bannerUrl: coverImage || null });
          navigate('/honors');
          break;
        case 'alumni':
          result = await createAchievement({ title: trimmedTitle, description: trimmedContent, imageUrl: coverImage || null });
          navigate('/honors');
          break;
        case 'achievement':
          result = await createAchievement({ title: trimmedTitle, description: trimmedContent, imageUrl: coverImage || null });
          navigate('/honors');
          break;
        case 'learning':
          result = await createLearningResource({ title: trimmedTitle, description: trimmedContent });
          navigate('/honors');
          break;
        case 'job':
          result = await createJob({ title: trimmedTitle, description: trimmedContent });
          navigate('/honors');
          break;
        default:
          break;
      }
      showSuccess('Đăng bài thành công!');
    } catch (err) {
      showError(err.response?.data?.message ?? 'Đăng bài thất bại');
    }
  };

  const handleCoverUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setCoverImage(imageUrl);
    }
  };

  return (
    <Page
      title="Đăng bài"
      meta={<meta name="description" content="Đăng bài - AlumVerse" />}
    >
      <Box sx={{ minHeight: '100vh'}}>

        {/* COVER SECTION */}
        <Box
          sx={{
            height: 280,
            backgroundColor: 'primary.dark',
            backgroundImage: coverImage ? `url(${coverImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
            p: 2
          }}
        >
          <Button
            variant="outlined"
            component="label"
            startIcon={<PhotoCameraIcon />}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: 'text.primary',
              '&:hover': { backgroundColor: '#fff' },
              textTransform: 'none',
              fontWeight: 600,
              position: 'absolute',
              top: 80, right: 20,
            }}
          >
            Sửa ảnh bìa
            <input
              hidden
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
            />
          </Button>
        </Box>

        {/* MAIN WRAPPER */}
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 10 }}>
          <Box
            sx={{
              width: { xs: '100%', md: '85%', lg: '75%' },
              mx: 'auto',
              mt: -10,
              mb: 6,
              backgroundColor: 'background.paper',
              borderRadius: 2,
              boxShadow: (theme) => theme.customShadows?.z24 || 10,
              p: { xs: 3, md: 5 },
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography
                variant="h1"
                fontWeight={800}
                color="primary.main"
                sx={{ fontSize: { xs: '1.8rem', md: '2.3rem' }, textAlign: 'center', mb: 3 }}
            >
              ĐĂNG BÀI
            </Typography>

            <Stack spacing={3}>
              {/* TWO DROPDOWNS */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  flexDirection: { xs: 'column', sm: 'row' }
                }}
              >
                <TextField
                  select
                  fullWidth
                  label="Kênh"
                  value={channel}
                  onChange={handleChannelChange}
                >
                  {CHANNELS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  fullWidth
                  label="Chủ đề"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                >
                  {TOPICS_BY_CHANNEL[channel].map((opt) => (
                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                  ))}
                </TextField>
              </Box>

              {/* TITLE INPUT */}
              <TextField
                fullWidth
                variant="standard"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                InputProps={{
                  disableUnderline: true,
                  sx: {
                    fontSize: '1.15rem',
                    fontWeight: 600,
                    pb: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  },
                }}
              />

              {/* CONTENT INPUT */}
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={10}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Bắt đầu viết nội dung tại đây..."
                />
              </Box>

              {/* ACTION BUTTONS */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 2,
                  pt: 2
                }}
              >
                <Button variant="outlined" color="inherit" onClick={handleCancel} sx={{ px: 4 }}>
                  Huỷ
                </Button>
                <Button variant="contained" color="primary" onClick={handleSubmit} disabled={isPending} sx={{ px: 4 }}>
                  {isPending ? 'Đang đăng...' : 'Đăng bài'}
                </Button>
              </Box>
            </Stack>
          </Box>
        </Container>
      </Box>
    </Page>
  );
};

export default PostArticlePage;
