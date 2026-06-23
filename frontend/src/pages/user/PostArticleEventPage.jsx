import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PostArticleForm from '../../components/PostArticleForm';
import PostArticleShell from '../../components/PostArticleShell';
import useCoverUpload from '../../hooks/useCoverUpload';
import { useCreateEvent } from '../../hooks/news/useCreateEvent';
import { fileToBase64 } from '../../utils/imageUtils';
import { useNotification } from '../../hooks/useNotification';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { eventApi } from '../../utils/api';
import { mapQuestionToApi } from '../../hooks/events/useEventQuestions';

// Chuẩn hoá câu hỏi trước khi gửi: bỏ câu trống, lọc lựa chọn rỗng, map sang shape API
const normalizeQuestions = (questions = []) =>
  questions
    .filter((q) => q?.label && q.label.trim())
    .map((q, index) => {
      const cleanOptions =
        q.type === 'shortText'
          ? null
          : (q.options || []).map((o) => (o ?? '').trim()).filter(Boolean);
      return mapQuestionToApi(
        { ...q, label: q.label.trim(), options: cleanOptions },
        index,
      );
    });

const toIsoDateTime = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
};

const PostEventPage = () => {
  const navigate = useOrgNavigate();
  const { t } = useTranslation('event');
  const { showSuccess, showError } = useNotification();
  const { createEvent, isPending } = useCreateEvent();
  const { coverFile, coverPreview, handleCoverUpload } = useCoverUpload();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('');
  const [registrationQuestions, setRegistrationQuestions] = useState([]);

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

  const handleEventInputChange = (e) => {
    const { name, value } = e.target;
    setEventData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || content === '<p><br></p>') {
      showError(t('error_title_content_required'));
      return;
    }
    if (!eventData.startDate || !eventData.endDate) {
      showError(t('error_time_required'));
      return;
    }
    try {
      const bannerBase64 = coverFile ? await fileToBase64(coverFile) : null;
      const result = await createEvent({
        title: title.trim(),
        description: content.trim(),
        bannerBase64,
        location: eventData.location || null,
        startTime: toIsoDateTime(eventData.startDate),
        endTime: toIsoDateTime(eventData.endDate),
        registrationEndAt: toIsoDateTime(eventData.deadline),
        maxCapacity: eventData.maxParticipants ? Number(eventData.maxParticipants) : null,
      });

      // Lưu các câu hỏi đăng ký (nếu có) sau khi đã tạo event
      const questionsPayload = normalizeQuestions(registrationQuestions);
      if (result?.id && questionsPayload.length > 0) {
        try {
          for (const payload of questionsPayload) {
            await eventApi.createEventQuestion(result.id, payload);
          }
        } catch (qErr) {
          showError(
            qErr.response?.data?.message ?? t('post_questions_failed'),
          );
        }
      }

      showSuccess(t('post_success'));
      navigate(`/article/event/${result.id}`);
    } catch (err) {
      showError(err.response?.data?.message ?? t('post_failed'));
    }
  };

  return (
    <PostArticleShell
      pageTitle={t('post_page_title')}
      coverPreview={coverPreview}
      onCoverChange={handleCoverUpload}
      onCancel={() => navigate(-1)}
      onSubmit={handleSubmit}
      isPending={isPending}
      submitLabel={t('post_submit_label')}
      pendingLabel={t('post_pending_label')}
    >
      <PostArticleForm
        channel="event"
        channelLabel={t('channel_label')}
        title={title}
        setTitle={setTitle}
        content={content}
        setContent={setContent}
        topic={topic}
        setTopic={setTopic}
        eventData={eventData}
        handleEventInputChange={handleEventInputChange}
        registrationQuestions={registrationQuestions}
        setRegistrationQuestions={setRegistrationQuestions}
      />
    </PostArticleShell>
  );
};

export default PostEventPage;
