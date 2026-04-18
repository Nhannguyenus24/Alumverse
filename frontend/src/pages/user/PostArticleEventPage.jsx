import { useState } from 'react';

import { Box, Button, Container, Typography } from '@mui/material';
import CoverUpload from '../../components/CoverUpload';
import Page from '../../components/Page';
import PostArticleForm from '../../components/PostArticleForm';
import { useCreateEvent } from '../../hooks/news/useCreateEvent';
import { useNotification } from '../../hooks/useNotification';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';

const PostEventPage = () => {
  const navigate = useOrgNavigate();
  const { showSuccess, showError } = useNotification();
  const { createEvent, isPending } = useCreateEvent();

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('');
  const [coverImage, setCoverImage] = useState('');

  // Event-specific fields
  const [eventData, setEventData] = useState({
    eventName: '',
    organizer: '',
    location: '',
    type: '',
    maxParticipants: '',
    deadline: '',
    startDate: '',
    endDate: '',
  });

  const handleCoverUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCoverImage(URL.createObjectURL(file));
    }
  };

  const handleEventInputChange = (e) => {
    const { name, value } = e.target;
    setEventData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || content === '<p><br></p>') {
      showError('Vui lòng nhập tiêu đề và nội dung');
      return;
    }

    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        thumbnailUrl: coverImage || null,
        topic,
        eventInfo: eventData,
      };

      const result = await createEvent(payload);
      showSuccess('Sự kiện đã được đăng thành công!');
      navigate(`/event/${result.id}`);
    } catch (err) {
      showError(err.response?.data?.message ?? 'Đăng sự kiện thất bại');
    }
  };

  return (
    <Page title="Đăng sự kiện" meta={<meta name="description" content="Đăng sự kiện - AlumVerse" />}>
      <Box sx={{ minHeight: '100vh' }}>
        {/* Cover Upload Section */}
        <CoverUpload value={coverImage} onChange={handleCoverUpload} />

        {/* Form Container */}
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
              borderColor: 'divider',
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

            {/* Event Form */}
            <PostArticleForm
              channel="event"
              channelLabel="Sự kiện"
              title={title}
              setTitle={setTitle}
              content={content}
              setContent={setContent}
              topic={topic}
              setTopic={setTopic}
              eventData={eventData}
              handleEventInputChange={handleEventInputChange}
            />

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2, mt: 3 }}>
              <Button variant="outlined" color="inherit" onClick={() => navigate(-1)} sx={{ px: 4 }}>
                Huỷ
              </Button>
              <Button variant="contained" color="primary" onClick={handleSubmit} disabled={isPending} sx={{ px: 4 }}>
                {isPending ? 'Đang đăng...' : 'Đăng sự kiện'}
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </Page>
  );
};

export default PostEventPage;