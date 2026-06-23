import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import PostArticleForm from '../../components/PostArticleForm';
import PostArticleShell from '../../components/PostArticleShell';
import useCoverUpload from '../../hooks/useCoverUpload';
import { useCreateNews } from '../../hooks/news/useCreateNews';
import { useCreateAlumniPost } from '../../hooks/news/useCreateAlumniPost';
import { useCreateAchievement } from '../../hooks/news/useCreateAchievement';
import { useCreateJob } from '../../hooks/news/useCreateJob';
import { useCreateLearningResource } from '../../hooks/news/useCreateLearningResource';
import { fileToBase64 } from '../../utils/imageUtils';
import { useNotification } from '../../hooks/useNotification';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useState } from 'react';

/**
 * Per-channel static configuration (no translated strings here).
 * useHook: a React hook — called unconditionally in the component below.
 * payloadBuilder: (title, content, coverFile) => Promise<object>
 * redirect: (id) => string
 * channelKey: article namespace key for channelLabel
 * pageTitleKey: article namespace key for pageTitle
 * successMsgKey: article namespace key for success snackbar
 */
const CHANNEL_CONFIG = {
  news: {
    channelKey: 'channel_news',
    pageTitleKey: 'page_title_news',
    successMsgKey: 'success_news',
    redirect: (id) => `/article/news/${id}`,
    useHook: useCreateNews,
    payloadKey: 'thumbnailBase64',
    useBase64: true,
    contentKey: 'content',
  },
  alumni: {
    channelKey: 'channel_alumni',
    pageTitleKey: 'page_title_alumni',
    successMsgKey: 'success_alumni',
    redirect: (id) => `/article/alumni/${id}`,
    useHook: useCreateAlumniPost,
    payloadKey: 'thumbnailBase64',
    useBase64: true,
    contentKey: 'content',
  },
  achievement: {
    channelKey: 'channel_achievement',
    pageTitleKey: 'page_title_achievement',
    successMsgKey: 'success_achievement',
    redirect: (id) => `/article/achievement/${id}`,
    useHook: useCreateAchievement,
    payloadKey: 'imageBase64',
    useBase64: true,
    contentKey: 'description',
  },
  job: {
    channelKey: 'channel_job',
    pageTitleKey: 'page_title_job',
    successMsgKey: 'success_job',
    redirect: (id) => `/article/job/${id}`,
    useHook: useCreateJob,
    payloadKey: null,
    useBase64: false,
    contentKey: 'description',
  },
  learning: {
    channelKey: 'channel_learning',
    pageTitleKey: 'page_title_learning',
    successMsgKey: 'success_learning',
    redirect: (id) => `/article/learning/${id}`,
    useHook: useCreateLearningResource,
    payloadKey: null,
    useBase64: false,
    contentKey: 'description',
  },
};

// Hooks must be called unconditionally — call all, use the right one.
const useAllHooks = () => ({
  news:        useCreateNews(),
  alumni:      useCreateAlumniPost(),
  achievement: useCreateAchievement(),
  job:         useCreateJob(),
  learning:    useCreateLearningResource(),
});

const PostArticleGenericPage = () => {
  const { channel } = useParams();
  const navigate = useOrgNavigate();
  const { t } = useTranslation('article');
  const { showSuccess, showError } = useNotification();
  const { coverFile, coverPreview, handleCoverUpload } = useCoverUpload();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('');

  const allHooks = useAllHooks();
  const config = CHANNEL_CONFIG[channel];

  // If channel not found, render nothing (router should handle 404)
  if (!config) return null;

  const hookResult = allHooks[channel];
  // Resolve the create function name dynamically from hook result
  const createFn = hookResult[
    Object.keys(hookResult).find((k) => k.startsWith('create'))
  ];
  const { isPending } = hookResult;

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || content === '<p><br></p>') {
      showError(t('error_title_content_required'));
      return;
    }
    try {
      const imageBase64 = config.useBase64 && coverFile ? await fileToBase64(coverFile) : undefined;

      const payload = {
        title: title.trim(),
        [config.contentKey]: content.trim(),
        ...(config.payloadKey && imageBase64 !== undefined ? { [config.payloadKey]: imageBase64 } : {}),
      };

      const result = await createFn(payload);
      showSuccess(t(config.successMsgKey));
      navigate(config.redirect(result.id));
    } catch (err) {
      showError(err.response?.data?.message ?? t('error_post_failed'));
    }
  };

  return (
    <PostArticleShell
      pageTitle={t(config.pageTitleKey)}
      coverPreview={coverPreview}
      onCoverChange={handleCoverUpload}
      onCancel={() => navigate(-1)}
      onSubmit={handleSubmit}
      isPending={isPending}
    >
      <PostArticleForm
        channel={channel}
        channelLabel={t(config.channelKey)}
        title={title}
        setTitle={setTitle}
        content={content}
        setContent={setContent}
        topic={topic}
        setTopic={setTopic}
      />
    </PostArticleShell>
  );
};

export default PostArticleGenericPage;
