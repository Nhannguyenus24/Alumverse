import { useState } from 'react';

import {
  Box,
  Button,
  Container,
  Stack,
  TextField,
  Typography,
  MenuItem
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

import Page from '../components/Page';
import WYSIWYG from '../components/WYSIWYG';
import { useOrgNavigate } from '../hooks/useOrgNavigate';

const CHANNEL_OPTIONS = ['Cựu sinh viên', 'Kênh thành tựu'];
const TOPIC_OPTIONS = ['Education', 'Jobs', 'Chances'];

const PostArticlePage = () => {
  const navigate = useOrgNavigate();


  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [channel, setChannel] = useState('Cựu sinh viên');
  const [topic, setTopic] = useState('Education');
  const [coverImage, setCoverImage] = useState(null);

  const handleCancel = () => navigate('/honors');
  const handleSubmit = () => navigate('/honors');

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
          {/* Upload Button - Positioned Top Right inside Cover */}
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
          {/* FLOATING CARD */}
          <Box
            sx={{
              width: { xs: '100%', md: '85%', lg: '75%' },
              mx: 'auto',
              mt: -10, // Pulls the card up into the cover area
              mb: 6,
              backgroundColor: 'background.paper',
              borderRadius: 2,
              boxShadow: (theme) => theme.customShadows?.z24 || 10,
              p: { xs: 3, md: 5 },
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            {/* TITLE */}
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
                  onChange={(e) => setChannel(e.target.value)}
                >
                  {CHANNEL_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  fullWidth
                  label="Chủ đề"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                >
                  {TOPIC_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
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

              {/* WYSIWYG EDITOR */}
              <Box sx={{ mt: 2 }}>
                <WYSIWYG
                  value={content}
                  onChange={setContent}
                  placeholder="Bắt đầu viết nội dung tại đây..."
                  height={400}
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
                <Button variant="contained" color="primary" onClick={handleSubmit} sx={{ px: 4 }}>
                  Đăng bài
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