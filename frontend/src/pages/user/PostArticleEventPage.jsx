import { useState } from 'react';
import PostArticleForm from '../../components/PostArticleForm';
import PostArticleShell from '../../components/PostArticleShell';
import useCoverUpload from '../../hooks/useCoverUpload';
import { useCreateEvent } from '../../hooks/news/useCreateEvent';
import { fileToBase64 } from '../../utils/imageUtils';
import { useNotification } from '../../hooks/useNotification';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';

const toIsoDateTime = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
};

const PostEventPage = () => {
  const navigate = useOrgNavigate();
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
      showError('Vui lòng nhập tiêu đề và nội dung');
      return;
    }
    if (!eventData.startDate || !eventData.endDate) {
      showError('Vui lòng nhập thời gian bắt đầu và kết thúc');
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
      showSuccess('Sự kiện đã được đăng thành công!');
      navigate(`/article/event/${result.id}`);
    } catch (err) {
      showError(err.response?.data?.message ?? 'Đăng sự kiện thất bại');
    }
  };

  return (
    <PostArticleShell
      pageTitle="Đăng sự kiện"
      coverPreview={coverPreview}
      onCoverChange={handleCoverUpload}
      onCancel={() => navigate(-1)}
      onSubmit={handleSubmit}
      isPending={isPending}
      submitLabel="Đăng sự kiện"
      pendingLabel="Đang đăng..."
    >
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
        registrationQuestions={registrationQuestions}
        setRegistrationQuestions={setRegistrationQuestions}
      />
    </PostArticleShell>
  );
};

export default PostEventPage;