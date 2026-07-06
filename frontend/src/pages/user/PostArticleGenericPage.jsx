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
import {
  fileToCroppedCoverBase64,
  getJsonPayloadByteSize,
  MAX_JSON_PAYLOAD_BYTES,
  validateImageFile,
} from '../../utils/imageUtils';
import { useNotification } from '../../hooks/useNotification';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

const JOB_TYPE_BY_TOPIC = {
  internship: 'INTERNSHIP',
  full_time: 'FULL_TIME',
  part_time: 'PART_TIME',
  freelance: 'FREELANCE',
  internal_referral: 'FULL_TIME',
  remote: 'CONTRACT',
};

const LEARNING_TYPE_BY_TOPIC = {
  online_course: 'COURSE',
  certificate: 'COURSE',
  study_abroad: 'OTHER',
  masters: 'OTHER',
  student_exchange: 'OTHER',
  research: 'OTHER',
  achievement_scholarship: 'OTHER',
};

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
    buildPayload: ({ title, content, topic, url, imageBase64 }) => ({
      title,
      content,
      topic,
      url: url || null,
      ...(imageBase64 ? { thumbnailBase64: imageBase64 } : {}),
    }),
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
    buildPayload: ({ title, content, topic, url, imageBase64 }) => ({
      title,
      content,
      topic,
      url: url || null,
      ...(imageBase64 ? { thumbnailBase64: imageBase64 } : {}),
    }),
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
    buildPayload: ({ title, content, topic, imageBase64, isAdminLike }) => ({
      title,
      description: content,
      topic,
      status: isAdminLike ? 'APPROVED' : 'PENDING',
      awardedDate: new Date().toISOString().slice(0, 10),
      ...(imageBase64 ? { imageBase64 } : {}),
    }),
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
    buildPayload: ({ title, content, topic }) => ({
      title,
      description: content,
      type: JOB_TYPE_BY_TOPIC[topic],
      isReferral: topic === 'internal_referral',
    }),
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
    buildPayload: ({ title, content, topic, url }) => ({
      title,
      description: content,
      type: LEARNING_TYPE_BY_TOPIC[topic],
      linkUrl: url || null,
    }),
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
  const { user } = useAuth();
  const isAdminLike = ['ADMIN', 'STAFF', 'MODERATOR'].includes(user?.role);
  const {
    coverFile,
    coverPreview,
    coverCroppedPreview,
    coverPositionY,
    handleCoverUpload,
    setCoverPositionY,
  } = useCoverUpload();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('');
  const [url, setUrl] = useState('');

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
    if (!topic) {
      showError(t('error_topic_required', { defaultValue: 'Vui lòng chọn chủ đề' }));
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
      const imageBase64 = config.useBase64 && coverFile
        ? await fileToCroppedCoverBase64(coverFile, coverPositionY)
        : undefined;
      const payload = config.buildPayload({
        title: title.trim(),
        content: content.trim(),
        topic,
        url: url.trim(),
        imageBase64,
        isAdminLike,
      });
      if ((channel === 'job' || channel === 'learning') && !payload.type) {
        showError(t('error_topic_required', { defaultValue: 'Vui lòng chọn chủ đề' }));
        return;
      }
      if (getJsonPayloadByteSize(payload) > MAX_JSON_PAYLOAD_BYTES) {
        showError('Bài viết quá lớn để đăng. Tổng dung lượng nội dung và ảnh chính cần dưới 19MB.');
        return;
      }

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
      coverPositionY={coverPositionY}
      onCoverPositionYChange={setCoverPositionY}
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
        url={url}
        setUrl={setUrl}
        mainImagePreview={coverCroppedPreview ?? coverPreview}
        showSourceUrl={!isAdminLike}
      />
    </PostArticleShell>
  );
};

export default PostArticleGenericPage;
