import { useEffect, useState } from 'react';
import { useParams, useOutletContext } from 'react-router';
import { useTranslation } from 'react-i18next';


import { useArticleById } from '../../hooks/articles/useArticleById';
import { useUpdateArticle } from '../../hooks/articles/useUpdateArticle';
import {
  fileToCroppedCoverBase64,
  getJsonPayloadByteSize,
  MAX_JSON_PAYLOAD_BYTES,
  validateImageFile,
} from '../../utils/imageUtils';
import { extractMainImageCaption, withMainImageCaption } from '../../utils/articleContentCaption';
import { useNotification } from '../../hooks/useNotification';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';

const getChannelLabels = (t) => ({
  news: t('admin:channel_news'),
  alumni: t('admin:channel_alumni'),
  achievement: t('admin:channel_achievement'),
  job: t('admin:channel_job'),
  learning: t('admin:channel_learning'),
  event: t('admin:channel_event'),
  donation: t('admin:channel_donation'),
});

const articleContent = (a) =>
  a?.content ?? a?.description ?? a?.descriptionFull ?? '';

const articleThumbnail = (a) =>
  a?.thumbnailUrl ?? a?.imageUrl ?? a?.bannerUrl ?? a?.logoUrl ?? null;

const CAPTION_REQUIRED_CHANNELS = new Set(['news', 'alumni', 'achievement', 'job', 'learning']);

const AdminEditArticlePage = () => {
  const { t } = useTranslation(['admin', 'article']);
  const CHANNEL_LABELS = getChannelLabels(t);
  const { channel, id } = useParams();
  const navigate = useOrgNavigate();
  const { setBreadcrumbs, adminBase } = useOutletContext();
  const { showSuccess, showError } = useNotification();
  const { article, isPending: isLoading } = useArticleById(channel, id);
  const { updateArticle, isPending: isSaving } = useUpdateArticle(channel);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [coverCroppedPreview, setCoverCroppedPreview] = useState(null);
  const [coverPositionY, setCoverPositionY] = useState(50);
  const [url, setUrl] = useState('');
  const [mainImageCaption, setMainImageCaption] = useState('');

  useEffect(() => {
    if (!article) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTitle(article.title ?? '');
    const parsedContent = extractMainImageCaption(articleContent(article));
    setContent(parsedContent.content);
    setMainImageCaption(parsedContent.caption);
    setCoverPreview(articleThumbnail(article));
    setTopic(article.topic ?? article.type ?? '');
    setUrl(article.url || article.linkUrl || '');
  }, [article]);

  useEffect(() => {
    if (!article) return;
    setBreadcrumbs?.([
      { label: t('admin:articles'), path: `${adminBase}/articles` },
      { label: t('admin:edit_article_breadcrumb'), active: true },
    ]);
  }, [article, setBreadcrumbs, t, adminBase]);

  useEffect(() => {
    if (!coverFile) {
      setCoverCroppedPreview(null);
      return undefined;
    }

    let isCancelled = false;
    const timeout = window.setTimeout(async () => {
      try {
        const nextPreview = await fileToCroppedCoverBase64(coverFile, coverPositionY);
        if (!isCancelled) setCoverCroppedPreview(nextPreview);
      } catch {
        if (!isCancelled) setCoverCroppedPreview(coverPreview);
      }
    }, 80);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeout);
    };
  }, [coverFile, coverPositionY, coverPreview]);

  const handleCoverUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setCoverPositionY(50);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || content === '<p><br></p>') {
      showError(t('admin:edit_article_missing_fields'));
      return;
    }
    if (coverFile) {
      const imageValidation = validateImageFile(coverFile);
      if (!imageValidation.valid) {
        showError(imageValidation.message);
        return;
      }
    }
    if (CAPTION_REQUIRED_CHANNELS.has(channel) && (coverFile || articleThumbnail(article)) && !mainImageCaption.trim()) {
      showError(t('article:main_image_caption_required'));
      return;
    }

    try {
      const thumbnailBase64 = coverFile ? await fileToCroppedCoverBase64(coverFile, coverPositionY) : null;
      if (thumbnailBase64 && getJsonPayloadByteSize({ base64String: thumbnailBase64 }) > MAX_JSON_PAYLOAD_BYTES) {
        showError('Ảnh chính quá lớn để tải lên. Vui lòng chọn ảnh nhỏ hơn.');
        return;
      }
      const payload = {
        title: title.trim(),
        content: withMainImageCaption(content.trim(), mainImageCaption),
        // Send the raw image inline; the backend converts it to WebP and stores it. When no new
        // image is picked (thumbnailBase64 is null), the backend keeps the existing thumbnail.
        thumbnailBase64,
        topic: topic || null,
        url: url.trim() || null,
      };
      if (getJsonPayloadByteSize(payload) > MAX_JSON_PAYLOAD_BYTES) {
        showError('Bài viết quá lớn để cập nhật. Tổng dung lượng nội dung và ảnh chính cần dưới 19MB.');
        return;
      }
      await updateArticle(id, payload);
      showSuccess(t('admin:edit_article_success'));
      navigate(`/article/${channel}/${id}`);
    } catch (err) {
      showError(err?.response?.data?.message ?? t('admin:edit_article_failed'));
    }
  };

  if (isLoading) {
    return (
      <Stack alignItems="center" sx={{ py: 8 }}>
        <LoadingSkeleton />
      </Stack>
    );
  }

  if (!article) {
    return (
      <Stack alignItems="center" spacing={2} sx={{ py: 8 }}>
        <Typography color="text.secondary">{t('admin:article_not_found')}</Typography>
        <Button variant="outlined" onClick={() => navigate(`${adminBase}/articles`)}>
          Back to article list
        </Button>
      </Stack>
    );
  }

  return (
    <Page title={t('admin:edit_article_page_title')}>
      <Box sx={{ minHeight: '100vh' }}>
        <CoverUpload
          value={coverPreview}
          onChange={handleCoverUpload}
          positionY={coverPositionY}
          onPositionYChange={setCoverPositionY}
        />
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
              {t('admin:edit_article_heading')}
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
              url={url}
              setUrl={setUrl}
              mainImagePreview={coverCroppedPreview ?? coverPreview}
              mainImageCaption={mainImageCaption}
              setMainImageCaption={setMainImageCaption}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2, mt: 3 }}>
              <Button
                variant="outlined"
                onClick={() => navigate(`${adminBase}/articles`)}
                sx={{ textTransform: 'none', px: 3, fontWeight: 700 }}
              >
                {t('admin:cancel')}
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={isSaving}
                sx={{ px: 4 }}
              >
                {isSaving ? t('admin:saving') : t('admin:save_changes')}
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </Page>
  );
};

export default AdminEditArticlePage;
