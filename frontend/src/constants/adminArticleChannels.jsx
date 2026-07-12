
const CHANNEL_KEYS = {
  all: 'admin:channel_all',
  news: 'admin:channel_news',
  alumni: 'admin:channel_alumni',
  achievement: 'admin:channel_achievement',
  job: 'admin:channel_job',
  learning: 'admin:channel_learning',
};

const ARTICLE_CHANNELS = ['news', 'alumni', 'achievement', 'job', 'learning'];

export const getAdminArticleChannelOptions = (t) => [
  { value: 'all', label: t(CHANNEL_KEYS.all) },
  ...ARTICLE_CHANNELS.map((value) => ({ value, label: t(CHANNEL_KEYS[value]) })),
];

export const getAdminArticleCreateChannelOptions = (t) => [
  { value: 'news', label: t(CHANNEL_KEYS.news), icon: <ArticleOutlinedIcon fontSize="small" /> },
  { value: 'alumni', label: t(CHANNEL_KEYS.alumni), icon: <GroupsOutlinedIcon fontSize="small" /> },
  { value: 'achievement', label: t(CHANNEL_KEYS.achievement), icon: <EmojiEventsOutlinedIcon fontSize="small" /> },
  { value: 'job', label: t(CHANNEL_KEYS.job), icon: <WorkOutlineOutlinedIcon fontSize="small" /> },
  { value: 'learning', label: t(CHANNEL_KEYS.learning), icon: <SchoolOutlinedIcon fontSize="small" /> },
];

export const getAdminArticleChannelLabel = (t, value) => (
  CHANNEL_KEYS[value] ? t(CHANNEL_KEYS[value]) : value ?? '-'
);
