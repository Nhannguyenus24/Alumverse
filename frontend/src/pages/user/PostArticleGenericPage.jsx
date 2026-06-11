import { useParams } from 'react-router';
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
 * Per-channel configuration.
 * useHook: a React hook — called unconditionally in the component below.
 * payloadBuilder: (title, content, coverFile) => Promise<object>
 * redirect: (id) => string
 * channelLabel: label shown in PostArticleForm
 * pageTitle: browser/page title
 * successMsg: snackbar success message
 */
const CHANNEL_CONFIG = {
  news: {
    channelLabel: 'Tin tức',
    pageTitle: 'Đăng bài tin tức',
    successMsg: 'Bài viết đã được đăng thành công!',
    redirect: (id) => `/article/news/${id}`,
    useHook: useCreateNews,
    payloadKey: 'thumbnailBase64',
    useBase64: true,
    contentKey: 'content',
  },
  alumni: {
    channelLabel: 'Cựu sinh viên',
    pageTitle: 'Đăng bài cựu sinh viên',
    successMsg: 'Bài viết cựu sinh viên đã được đăng thành công!',
    redirect: (id) => `/article/alumni/${id}`,
    useHook: useCreateAlumniPost,
    payloadKey: 'thumbnailBase64',
    useBase64: true,
    contentKey: 'content',
  },
  achievement: {
    channelLabel: 'Thành tựu',
    pageTitle: 'Đăng bài thành tựu',
    successMsg: 'Bài viết thành tựu đã được đăng thành công!',
    redirect: (id) => `/article/achievement/${id}`,
    useHook: useCreateAchievement,
    payloadKey: 'imageBase64',
    useBase64: true,
    contentKey: 'description',
  },
  job: {
    channelLabel: 'Cơ hội việc làm',
    pageTitle: 'Đăng bài việc làm',
    successMsg: 'Bài đăng việc làm đã được đăng thành công!',
    redirect: (id) => `/article/job/${id}`,
    useHook: useCreateJob,
    payloadKey: null,
    useBase64: false,
    contentKey: 'description',
  },
  learning: {
    channelLabel: 'Cơ hội học tập',
    pageTitle: 'Đăng bài học tập',
    successMsg: 'Bài viết học tập đã được đăng thành công!',
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
      showError('Vui lòng nhập tiêu đề và nội dung');
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
      showSuccess(config.successMsg);
      navigate(config.redirect(result.id));
    } catch (err) {
      showError(err.response?.data?.message ?? 'Đăng bài thất bại');
    }
  };

  return (
    <PostArticleShell
      pageTitle={config.pageTitle}
      coverPreview={coverPreview}
      onCoverChange={handleCoverUpload}
      onCancel={() => navigate(-1)}
      onSubmit={handleSubmit}
      isPending={isPending}
    >
      <PostArticleForm
        channel={channel}
        channelLabel={config.channelLabel}
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
