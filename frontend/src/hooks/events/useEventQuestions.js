import { useQuery, useQueryClient } from '@tanstack/react-query';
import { eventApi } from '../../utils/api';

const mapQuestionToUi = (q) => {
  const typeMap = {
    SHORT_TEXT: 'shortText',
    SINGLE_CHOICE: 'singleChoice',
    MULTI_CHOICE: 'multiChoice',
  };
  return {
    id: q.id,
    label: q.label,
    type: typeMap[q.type] || q.type,
    options: q.options || [],
    required: Boolean(q.required),
    orderIndex: q.orderIndex ?? 0,
  };
};

export const mapQuestionToApi = (q, orderIndex = 0) => {
  const typeMap = {
    shortText: 'SHORT_TEXT',
    singleChoice: 'SINGLE_CHOICE',
    multiChoice: 'MULTI_CHOICE',
  };
  return {
    type: typeMap[q.type] || q.type,
    label: q.label,
    options: q.type === 'shortText' ? null : (q.options || []),
    required: Boolean(q.required),
    orderIndex: q.orderIndex ?? orderIndex,
  };
};

export const formatAnswersForApi = (answers, questions) => {
  return questions.map((q) => ({
    questionId: q.id,
    value: answers[q.id] ?? (q.type === 'multiChoice' ? [] : ''),
  })).filter((item) => {
    const val = item.value;
    if (Array.isArray(val)) return val.length > 0;
    return val != null && String(val).trim() !== '';
  });
};

export const useEventQuestions = (eventId, enabled = true) => {
  return useQuery({
    queryKey: ['eventQuestions', eventId],
    queryFn: () => eventApi.getEventQuestions(eventId),
    enabled: Boolean(eventId) && enabled,
    select: (data) => (Array.isArray(data) ? data.map(mapQuestionToUi) : []),
  });
};


