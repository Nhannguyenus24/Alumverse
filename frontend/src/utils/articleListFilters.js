import { getTopicOptionsForChannels } from './articleTopics';

export const ARTICLE_FETCH_LIMIT = 200;
export const ARTICLE_PAGE_SIZE = 10;

const normalizeComparable = (value) => String(value ?? '')
  .trim()
  .toLowerCase()
  .replace(/[-\s]+/g, '_');

const getArticleDate = (article) => article?.publishedAt
  ?? article?.createdAt
  ?? article?.created_at
  ?? article?.eventDate
  ?? article?.donationDate
  ?? null;

const getArticleTopicCandidates = (article) => {
  const directTopic = normalizeComparable(article?.topic);
  const type = normalizeComparable(article?.type);
  const candidates = [directTopic, type].filter(Boolean);

  if (article?.channel === 'job') {
    if (article?.isReferral || article?.isReferral === true) candidates.push('internal_referral');
    if (type === 'contract') candidates.push('remote');
  }

  if (article?.channel === 'learning') {
    if (type === 'course') candidates.push('online_course', 'certificate');
    if (type === 'other') {
      candidates.push('study_abroad', 'masters', 'student_exchange', 'research', 'achievement_scholarship');
    }
  }

  return [...new Set(candidates)];
};

const toTime = (value) => {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const toDayRange = (dateValue, isEnd = false) => {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(isEnd ? 23 : 0, isEnd ? 59 : 0, isEnd ? 59 : 0, isEnd ? 999 : 0);
  return date.getTime();
};

export const getArticleFilterConfig = (t, channels = []) => [
  {
    type: 'dropdown',
    key: 'topic',
    label: t('article:topic', { defaultValue: 'Chủ đề' }),
    multiple: true,
    options: getTopicOptionsForChannels(t, channels),
  },
  {
    type: 'topics',
    key: 'sort',
    single: true,
    label: t('article:sort', { defaultValue: 'Sắp xếp' }),
    options: [
      { value: 'newest', label: t('article:sort_newest', { defaultValue: 'Mới nhất' }) },
      { value: 'oldest', label: t('article:sort_oldest', { defaultValue: 'Cũ nhất' }) },
    ],
  },
  {
    type: 'date',
    key: 'fromDate',
    label: t('article:from_date', { defaultValue: 'Từ ngày' }),
  },
  {
    type: 'date',
    key: 'toDate',
    label: t('article:to_date', { defaultValue: 'Đến ngày' }),
  },
];

export const applyArticleFilters = (articles = [], filters = {}) => {
  const search = String(filters.search ?? '').trim().toLowerCase();
  const selectedTopics = Array.isArray(filters.topic) ? filters.topic.map(normalizeComparable) : [];
  const sortValue = Array.isArray(filters.sort) ? filters.sort[0] : filters.sort;
  const fromTime = toDayRange(filters.fromDate);
  const toEndTime = toDayRange(filters.toDate, true);

  const filtered = articles.filter((article) => {
    if (!article) return false;

    if (search) {
      const haystack = [
        article.title,
        article.content,
        article.organizer,
        article.companyName,
        article.location,
      ].filter(Boolean).join(' ').toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    if (selectedTopics.length > 0) {
      const articleTopics = getArticleTopicCandidates(article);
      if (!articleTopics.some((topic) => selectedTopics.includes(topic))) return false;
    }

    const articleTime = toTime(getArticleDate(article));
    if (fromTime && articleTime < fromTime) return false;
    if (toEndTime && articleTime > toEndTime) return false;

    return true;
  });

  return filtered.sort((a, b) => {
    const aTime = toTime(getArticleDate(a));
    const bTime = toTime(getArticleDate(b));
    return sortValue === 'oldest' ? aTime - bTime : bTime - aTime;
  });
};

export const paginateArticles = (articles = [], page = 0, pageSize = ARTICLE_PAGE_SIZE) => {
  const totalElements = articles.length;
  const totalPage = Math.ceil(totalElements / pageSize);
  const safePage = totalPage === 0 ? 0 : Math.min(Math.max(page, 0), totalPage - 1);
  const start = safePage * pageSize;

  return {
    items: articles.slice(start, start + pageSize),
    pageInfo: {
      page: safePage,
      limit: pageSize,
      totalElements,
      totalPage,
    },
  };
};
