import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import Page from '../../components/Page';
import PostArticleForm from '../../components/PostArticleForm';
import CoverUpload from '../../components/CoverUpload';
import { useArticleById } from '../../hooks/articles/useArticleById';
import { useUpdateArticle } from '../../hooks/articles/useUpdateArticle';
import { fileToBase64 } from '../../hooks/images/fileToBase64';
import { useNotification } from '../../hooks/useNotification';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';

const CHANNEL_LABELS = {
  news: 'Tin tức',
  alumni: 'Cựu sinh viên',
  achievement: 'Thành tựu',
  job: 'Cơ hội việc làm',
  learning: 'Cơ hội học tập',
  event: 'Sự kiện',
  donation: 'Quyên góp',
};

const articleContent = (a) =>
  a?.content ?? a?.description ?? a?.descriptionFull ?? '';

const articleThumbnail = (a) =>
  a?.thumbnailUrl ?? a?.imageUrl ?? a?.bannerUrl ?? a?.logoUrl ?? null;

const AdminEditArticlePage = () => {
  const { channel, id } = useParams();
  const navigate = useOrgNavigate();
  const { showSuccess, showError } = useNotification();
  const { article, isPending: isLoading } = useArticleById(channel, id);
  const { updateArticle, isPending: isSaving } = useUpdateArticle(channel);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  useEffect(() => {
    if (!article) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTitle(article.title ?? '');
    setContent(articleContent(article));
    setCoverPreview(articleThumbnail(article));
    setTopic(article.topic ?? article.type ?? '');
  }, [article]);

  const handleCoverUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
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
        thumbnailUrl: thumbnailBase64 ? null : articleThumbnail(article),
        topic: topic || null,
      };
      await updateArticle(id, payload);
      showSuccess('Cập nhật bài viết thành công!');
      navigate(`/admin/article`);
    } catch (err) {
      showError(err?.response?.data?.message ?? 'Cập nhật thất bại');
    }
  };

  if (isLoading) {
    return (
      <Stack alignItems="center" sx={{ py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (!article) {
    return (
      <Stack alignItems="center" spacing={2} sx={{ py: 8 }}>
        <Typography color="text.secondary">Không tìm thấy bài viết.</Typography>
        <Button variant="outlined" onClick={() => navigate('/admin/article')}>
          Back to article list
        </Button>
      </Stack>
    );
  }

  return (
    <Page title="Sửa bài viết (Admin)">
      <Box sx={{ minHeight: '100vh' }}>
        <CoverUpload value={coverPreview} onChange={handleCoverUpload} />
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
              SỬA BÀI VIẾT
            </Typography>

            <PostArticleForm
              channel={channel}
              channelLabel={CHANNEL_LABELS[channel] ?? channel}
              title={title}
              setTitle={setTitle}
              content={content}
              setContent={setContent}
              topic={topic}
              setTopic={setTopic}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2, mt: 3 }}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => navigate('/admin/article')}
                sx={{ px: 4 }}
              >
                Huỷ
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={isSaving}
                sx={{ px: 4 }}
              >
                {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </Page>
  );
};

export default AdminEditArticlePage;
