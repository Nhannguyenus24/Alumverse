import LoadingSkeleton from '../../components/LoadingSkeleton';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Box, Button, Typography } from '@mui/material';
import PostArticleForm from '../../components/PostArticleForm';
import PostArticleShell from '../../components/PostArticleShell';
import useCoverUpload from '../../hooks/useCoverUpload';
import { useCreateEvent } from '../../hooks/news/useCreateEvent';
import { fileToBase64 } from '../../utils/imageUtils';
import { useNotification } from '../../hooks/useNotification';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { eventApi } from '../../utils/api';
import useOrganizationStore from '../../stores/organizationStore';
import { useEventQuestions, mapQuestionToApi } from '../../hooks/events/useEventQuestions';
import { extractMainImageCaption, withMainImageCaption } from '../../utils/articleContentCaption';

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

const getQuestionValidationError = (questions = [], t) => {
  for (const q of questions) {
    if (!q?.label?.trim()) {
      return t('question_content_required', { defaultValue: 'Vui lòng nhập nội dung câu hỏi.' });
    }
    if ((q.type === 'singleChoice' || q.type === 'multiChoice')
      && !(q.options || []).some((option) => option?.trim())) {
      return t('question_options_required', { defaultValue: 'Vui lòng nhập ít nhất một lựa chọn cho câu hỏi lựa chọn.' });
    }
  }
  return null;
};

const unwrapCreatedEvent = (result) => result?.data?.data ?? result?.data ?? result ?? null;

// Diff the edited question list against what was originally loaded from the
// server so each row is routed to create/update/delete individually — the
// backend has no bulk-replace endpoint for event questions.
const syncQuestions = async (eventId, originalQuestions, currentQuestions) => {
  const originalIds = new Set(originalQuestions.map((q) => q.id));
  const cleaned = currentQuestions.filter((q) => q?.label && q.label.trim());
  const currentIds = new Set(cleaned.map((q) => q.id));

  for (const original of originalQuestions) {
    if (!currentIds.has(original.id)) {
      await eventApi.deleteEventQuestion(eventId, original.id);
    }
  }

  for (let index = 0; index < cleaned.length; index++) {
    const q = cleaned[index];
    const cleanOptions =
      q.type === 'shortText' ? null : (q.options || []).map((o) => (o ?? '').trim()).filter(Boolean);
    const payload = mapQuestionToApi({ ...q, label: q.label.trim(), options: cleanOptions }, index);

    if (originalIds.has(q.id)) {
      await eventApi.updateEventQuestion(eventId, q.id, payload);
    } else {
      await eventApi.createEventQuestion(eventId, payload);
    }
  }
};

const toIsoDateTime = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return value.length === 16 ? `${value}:00` : value;
};

const toDateInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const datePart = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const timePart = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  return `${datePart}T${timePart}`;
};

const emptyEventData = {
  location: '',
  maxParticipants: '',
  registrationStartAt: '',
  deadline: '',
  startDate: '',
  endDate: '',
};

const PostEventPage = () => {
  const { slug, id: eventIdParam } = useParams();
  const eventId = eventIdParam ? Number(eventIdParam) : null;
  const isEditMode = Boolean(eventId && !Number.isNaN(eventId));
  const adminBase = slug ? `/${slug}/admin` : '/admin';

  const navigate = useOrgNavigate();
  const { t } = useTranslation(['event', 'article']);
  const { showSuccess, showError } = useNotification();
  const { createEvent, isPending: isCreating } = useCreateEvent();
  const organizationId = useOrganizationStore((state) => state.organization?.id ?? null);
  const {
    coverFile,
    coverPreview,
    coverPositionY,
    handleCoverUpload,
    setCoverPreview,
    setCoverPositionY,
  } = useCoverUpload();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mainImageCaption, setMainImageCaption] = useState('');
  const [topic, setTopic] = useState('');
  const [registrationQuestions, setRegistrationQuestions] = useState([]);
  const [eventData, setEventData] = useState(emptyEventData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: existingEvent, isLoading: isLoadingEvent } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventApi.getEventById(eventId),
    enabled: isEditMode,
  });

  const { data: existingQuestions = [], isLoading: isLoadingQuestions } = useEventQuestions(eventId, isEditMode);

  const existingOrgId = existingEvent?.organizationId ?? existingEvent?.organization_id ?? existingEvent?.organization?.id;
  const isOrgMismatch = Boolean(
    isEditMode &&
    existingEvent &&
    organizationId &&
    existingOrgId &&
    String(existingOrgId) !== String(organizationId)
  );

  useEffect(() => {
    if (!isEditMode) return;
    setRegistrationQuestions(existingQuestions);
  }, [isEditMode, existingQuestions]);

  useEffect(() => {
    if (!existingEvent || isOrgMismatch) return;
    const parsedContent = extractMainImageCaption(existingEvent.description || '');
    setTitle(existingEvent.title || '');
    setContent(parsedContent.content);
    setMainImageCaption(parsedContent.caption);
    setTopic(existingEvent.topic || '');
    setEventData({
      location: existingEvent.location || '',
      maxParticipants: existingEvent.maxCapacity != null ? String(existingEvent.maxCapacity) : '',
      registrationStartAt: toDateInput(existingEvent.registrationStartAt),
      deadline: toDateInput(existingEvent.registrationEndAt),
      startDate: toDateInput(existingEvent.startTime),
      endDate: toDateInput(existingEvent.endTime),
    });
    if (existingEvent.bannerUrl) {
      setCoverPreview(existingEvent.bannerUrl);
    }
  }, [existingEvent, setCoverPreview, isOrgMismatch]);

  const handleEventInputChange = (e) => {
    const { name, value } = e.target;
    setEventData((prev) => ({ ...prev, [name]: value }));
  };

  const buildPayload = async () => {
    const bannerBase64 = coverFile ? await fileToBase64(coverFile) : null;
    const targetOrgId = isEditMode && existingOrgId ? existingOrgId : organizationId;
    return {
      title: title.trim(),
      description: withMainImageCaption(content.trim(), mainImageCaption),
      topic: topic || null,
      bannerBase64,
      location: eventData.location || null,
      startTime: toIsoDateTime(eventData.startDate),
      endTime: toIsoDateTime(eventData.endDate),
      registrationStartAt: toIsoDateTime(eventData.registrationStartAt),
      registrationEndAt: toIsoDateTime(eventData.deadline),
      maxCapacity: eventData.maxParticipants ? Number(eventData.maxParticipants) : null,
      organizationId: targetOrgId != null ? Number(targetOrgId) : null,
    };
  };

  const handleSubmit = async () => {
    if (isOrgMismatch) {
      showError(t('event_not_in_org_desc', { defaultValue: 'Sự kiện này thuộc về một tổ chức khác và không thể chỉnh sửa từ đường dẫn này.' }));
      return;
    }
    if (!title.trim() || !content.trim() || content === '<p><br></p>') {
      showError(t('error_title_content_required'));
      return;
    }
    if (!eventData.startDate || !eventData.endDate) {
      showError(t('error_time_required'));
      return;
    }
    if ((coverFile || coverPreview) && !mainImageCaption.trim()) {
      showError(t('article:main_image_caption_required'));
      return;
    }
    const questionValidationError = getQuestionValidationError(registrationQuestions, t);
    if (questionValidationError) {
      showError(questionValidationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = await buildPayload();

      if (isEditMode) {
        await eventApi.updateAdminEvent(eventId, payload);
        try {
          await syncQuestions(eventId, existingQuestions, registrationQuestions);
        } catch (qErr) {
          showError(qErr.response?.data?.message ?? t('post_questions_failed'));
        }
        showSuccess(t('update_success'));
        navigate(`${adminBase}/events/${eventId}`);
        return;
      }

      const result = unwrapCreatedEvent(await createEvent(payload));
      const questionsPayload = normalizeQuestions(registrationQuestions);
      if (result?.id && questionsPayload.length > 0) {
        for (const q of questionsPayload) {
          try {
            await eventApi.createEventQuestion(result.id, q);
          } catch (qErr) {
            throw new Error(qErr.response?.data?.message ?? t('post_questions_failed'));
          }
        }
      }

      showSuccess(t('post_success'));
      navigate(result?.id ? `${adminBase}/events/${result.id}` : `${adminBase}/events`);
    } catch (err) {
      showError(err.response?.data?.message ?? err.message ?? (isEditMode ? t('update_failed') : t('post_failed')));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditMode && (isLoadingEvent || isLoadingQuestions)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <LoadingSkeleton />
      </Box>
    );
  }

  if (isEditMode && isOrgMismatch) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10, px: 3, textAlign: 'center' }}>
        <Box sx={{ fontSize: 48, mb: 2 }}>⚠️</Box>
        <Typography variant="h5" color="error.main" fontWeight={800} sx={{ mb: 1 }}>
          {t('event_not_in_org_title', { defaultValue: 'Sự kiện không thuộc về tổ chức này' })}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 500 }}>
          {t('event_not_in_org_desc', { defaultValue: 'Sự kiện này thuộc về một tổ chức khác và không thể chỉnh sửa từ đường dẫn này.' })}
        </Typography>
        <Button variant="outlined" onClick={() => navigate(`${adminBase}/events`)}>
          {t('back_to_events', { defaultValue: 'Quay lại danh sách sự kiện' })}
        </Button>
      </Box>
    );
  }

  const isPending = isCreating || isSubmitting;

  return (
    <PostArticleShell
      pageTitle={isEditMode ? t('edit_page_title') : t('post_page_title')}
      coverPreview={coverPreview}
      onCoverChange={handleCoverUpload}
      coverPositionY={coverPositionY}
      onCoverPositionYChange={setCoverPositionY}
      onCancel={() => navigate(isEditMode ? `${adminBase}/events/${eventId}` : -1)}
      onSubmit={handleSubmit}
      isPending={isPending}
      submitLabel={isEditMode ? t('update_submit_label') : t('post_submit_label')}
      pendingLabel={isEditMode ? t('update_pending_label') : t('post_pending_label')}
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
        mainImagePreview={coverPreview}
        mainImageCaption={mainImageCaption}
        setMainImageCaption={setMainImageCaption}
        showSourceUrl={false}
      />
    </PostArticleShell>
  );
};

export default PostEventPage;
