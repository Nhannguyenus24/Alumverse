import { useState } from 'react';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import PostArticleForm from '../../components/PostArticleForm';
import PostArticleShell from '../../components/PostArticleShell';
import useCoverUpload from '../../hooks/useCoverUpload';
import { useCreateNews } from '../../hooks/news/useCreateNews';
import {
  fileToBase64,
  getJsonPayloadByteSize,
  MAX_JSON_PAYLOAD_BYTES,
  validateImageFile,
} from '../../utils/imageUtils';
import { useNotification } from '../../hooks/useNotification';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import useOrganizationStore from '../../stores/organizationStore';
import { useCanContribute } from '../../hooks/useCanContribute';

const unwrapCreatedArticle = (result) => result?.data?.data ?? result?.data ?? result ?? null;

const PostArticlePage = () => {
  const { slug } = useParams();
  const navigate = useOrgNavigate();
  const { t } = useTranslation('article');
  const { showSuccess, showError } = useNotification();
  const { createNews, isPending } = useCreateNews();
  const { isOrgManager } = useCanContribute();
  const organizationId = useOrganizationStore((state) => state.organization?.id ?? null);
  const isAdminLike = isOrgManager;
  const adminBase = slug ? `/${slug}/admin` : '/admin';
  const {
    coverFile,
    coverPreview,
    coverPositionY,
    handleCoverUpload,
    setCoverPositionY,
  } = useCoverUpload();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('');
  const [url, setUrl] = useState('');

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || content === '<p><br></p>') {
      showError(t('error_title_content_required'));
      return;
    }
    if (coverFile) {
      const imageValidation = validateImageFile(coverFile);
      if (!imageValidation.valid) {
        showError(imageValidation.message);
        return;
      }
    }
    try {
      const thumbnailBase64 = coverFile ? await fileToBase64(coverFile) : null;
      const payload = {
        organizationId: organizationId != null ? Number(organizationId) : null,
        title: title.trim(),
        content: content.trim(),
        thumbnailBase64,
        url: url.trim() || null,
      };
      if (getJsonPayloadByteSize(payload) > MAX_JSON_PAYLOAD_BYTES) {
        showError(t('article_too_large_post'));
        return;
      }

      const result = unwrapCreatedArticle(await createNews(payload));
      showSuccess(t('success_news'));
      navigate(isAdminLike ? `${adminBase}/article` : (result?.id ? `/article/news/${result.id}` : '/news'));
    } catch (err) {
      showError(err.response?.data?.message ?? t('error_post_failed'));
    }
  };

  return (
    <PostArticleShell
      pageTitle={t('page_title_news')}
      coverPreview={coverPreview}
      onCoverChange={handleCoverUpload}
      coverPositionY={coverPositionY}
      onCoverPositionYChange={setCoverPositionY}
      onCancel={() => navigate(isAdminLike ? `${adminBase}/article` : -1)}
      onSubmit={handleSubmit}
      isPending={isPending}
    >
      <PostArticleForm
        channel="news"
        channelLabel={t('channel_news')}
        title={title}
        setTitle={setTitle}
        content={content}
        setContent={setContent}
        topic={topic}
        setTopic={setTopic}
        url={url}
        setUrl={setUrl}
        mainImagePreview={coverPreview}
      />
    </PostArticleShell>
  );
};

export default PostArticlePage;
