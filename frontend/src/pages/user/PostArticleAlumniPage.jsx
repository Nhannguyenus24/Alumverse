import { useState } from 'react';

import { Box, Button, Container, Typography } from '@mui/material';

import Page from '../../components/Page';
import PostArticleForm from '../../components/PostArticleForm';
import CoverUpload from '../../components/CoverUpload';
import { useCreateAlumniPost } from '../../hooks/news/useCreateAlumniPost';
import { fileToBase64 } from '../../utils/imageUtils';
import { useNotification } from '../../hooks/useNotification';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';

const PostAlumniPage = () => {
  const navigate = useOrgNavigate();
  const { showSuccess, showError } = useNotification();
  const { createAlumniPost, isPending } = useCreateAlumniPost();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('');
  const [url, setUrl] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const handleCoverUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || content === '<p><br></p>') {
      showError('Vui lòng nhập tiêu đề và nội dung');
      return;
    }

    try {
      const thumbnailBase64 = coverFile ? await fileToBase64(coverFile) : null;

      const payload = {
        title: title.trim(),
        content: content.trim(),
        thumbnailBase64,
        url: url.trim() || null,
      };

      const result = await createAlumniPost(payload);
      showSuccess('Bài viết cựu sinh viên đã được đăng thành công!');
      navigate(`/article/alumni/${result.id}`);
    } catch (err) {
      showError(err.response?.data?.message ?? 'Đăng bài thất bại');
    }
  };

  return (
    <Page title="Đăng bài cựu sinh viên" meta={<meta name="description" content="Đăng bài cựu sinh viên - AlumVerse" />}>
      <Box sx={{ minHeight: '100vh' }}>
        {/* Cover Upload Section */}
        <CoverUpload
          value={coverPreview}
          onChange={handleCoverUpload}
        />

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

            {/* PostArticleForm */}
            <PostArticleForm
              channel="alumni"
              channelLabel="Cựu sinh viên"
              title={title}
              setTitle={setTitle}
              content={content}
              setContent={setContent}
              topic={topic}
              setTopic={setTopic}
              url={url}
              setUrl={setUrl}
            />

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2, mt: 3 }}>
              <Button variant="outlined" color="inherit" onClick={() => navigate(-1)} sx={{ px: 4 }}>
                Huỷ
              </Button>
              <Button variant="contained" color="primary" onClick={handleSubmit} disabled={isPending} sx={{ px: 4 }}>
                {isPending ? 'Đang đăng...' : 'Đăng bài'}
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </Page>
  );
};

export default PostAlumniPage;