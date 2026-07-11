// Survey question types. Values MUST match backend QuestionType enum.
export const SURVEY_QUESTION_TYPES = [
  { value: 'SHORT_TEXT', labelKey: 'survey:qtype_short_text' },
  { value: 'SINGLE_CHOICE', labelKey: 'survey:qtype_single_choice' },
  { value: 'MULTI_CHOICE', labelKey: 'survey:qtype_multi_choice' },
  { value: 'DATE', labelKey: 'survey:qtype_date' },
  { value: 'NUMBER', labelKey: 'survey:qtype_number' },
  { value: 'RATING', labelKey: 'survey:qtype_rating' },
];

export const isChoiceType = (type) => type === 'SINGLE_CHOICE' || type === 'MULTI_CHOICE';

export const SURVEY_STATUS = {
  DRAFT: 'DRAFT',
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
};
