export const getTopicsByChannel = (t) => ({
  news: [
    { value: 'school_announcement', label: t('article:topics.school_announcement') },
    { value: 'faculty_department', label: t('article:topics.faculty_department') },
    { value: 'student_activities', label: t('article:topics.student_activities') },
    { value: 'faculty_activities', label: t('article:topics.faculty_activities') },
    { value: 'school_activities', label: t('article:topics.school_activities') },
    { value: 'ceremony_news', label: t('article:topics.ceremony_news') },
    { value: 'alumni_news', label: t('article:topics.alumni_news') },
    { value: 'enterprise_cooperation', label: t('article:topics.enterprise_cooperation') },
    { value: 'academic_research', label: t('article:topics.academic_research') },
    { value: 'admission_scholarship', label: t('article:topics.admission_scholarship') },
    { value: 'donation', label: t('article:topics.donation') },
  ],
  event: [
    { value: 'workshop', label: t('article:topics.workshop') },
    { value: 'talkshow', label: t('article:topics.talkshow') },
    { value: 'conference', label: t('article:topics.conference') },
    { value: 'academic_seminar', label: t('article:topics.academic_seminar') },
    { value: 'fair_exhibition', label: t('article:topics.fair_exhibition') },
    { value: 'reunion', label: t('article:topics.reunion') },
    { value: 'ceremony', label: t('article:topics.ceremony') },
    { value: 'competition_event', label: t('article:topics.competition_event') },
    { value: 'concert_art', label: t('article:topics.concert_art') },
    { value: 'club_activities', label: t('article:topics.club_activities') },
  ],
  donation: [
    { value: 'student_scholarship', label: t('article:topics.student_scholarship') },
    { value: 'hardship_support', label: t('article:topics.hardship_support') },
    { value: 'research', label: t('article:topics.research') },
    { value: 'facilities', label: t('article:topics.facilities') },
    { value: 'community_activities', label: t('article:topics.community_activities') },
    { value: 'emergency', label: t('article:topics.emergency') },
  ],
  alumni: [
    { value: 'alumni_profile', label: t('article:topics.alumni_profile') },
    { value: 'entrepreneur', label: t('article:topics.entrepreneur') },
    { value: 'startup', label: t('article:topics.startup') },
    { value: 'arts_creativity', label: t('article:topics.arts_creativity') },
    { value: 'global_life', label: t('article:topics.global_life') },
    { value: 'travel_lifestyle', label: t('article:topics.travel_lifestyle') },
    { value: 'community_giving', label: t('article:topics.community_giving') },
    { value: 'alumni_reunion', label: t('article:topics.alumni_reunion') },
    { value: 'academic_research_alumni', label: t('article:topics.academic_research_alumni') },
    { value: 'faculty_honor', label: t('article:topics.faculty_honor') },
    { value: 'study_abroad', label: t('article:topics.study_abroad') },
  ],
  achievement: [
    { value: 'faculty_honor', label: t('article:topics.faculty_honor') },
    { value: 'student_honor', label: t('article:topics.student_honor') },
    { value: 'research', label: t('article:topics.research') },
    { value: 'research_publication', label: t('article:topics.research_publication') },
    { value: 'competition_award', label: t('article:topics.competition_award') },
    { value: 'prestigious_scholarship', label: t('article:topics.prestigious_scholarship') },
    { value: 'career_milestone', label: t('article:topics.career_milestone') },
    { value: 'startup_investment', label: t('article:topics.startup_investment') },
    { value: 'international_honor', label: t('article:topics.international_honor') },
    { value: 'social_contribution_award', label: t('article:topics.social_contribution_award') },
    { value: 'achievement_hall_of_fame', label: t('article:topics.achievement_hall_of_fame') },
  ],
  learning: [
    { value: 'scholarships', label: t('article:topics.scholarships') },
    { value: 'bachelor', label: t('article:topics.bachelor') },
    { value: 'masters_doctorate', label: t('article:topics.masters_doctorate') },
    { value: 'study_abroad', label: t('article:topics.study_abroad') },
    { value: 'student_exchange', label: t('article:topics.student_exchange') },
    { value: 'special_session', label: t('article:topics.special_session') },
    { value: 'online_course', label: t('article:topics.online_course') },
    { value: 'certificate', label: t('article:topics.certificate') },
    { value: 'research', label: t('article:topics.research') },
  ],
  job: [
    { value: 'internship', label: t('article:topics.internship') },
    { value: 'management_trainee', label: t('article:topics.management_trainee') },
    { value: 'full_time', label: t('article:topics.full_time') },
    { value: 'part_time', label: t('article:topics.part_time') },
    { value: 'freelance', label: t('article:topics.freelance') },
    { value: 'internal_referral', label: t('article:topics.internal_referral') },
    { value: 'remote', label: t('article:topics.remote') },
    { value: 'lab_opportunity', label: t('article:topics.lab_opportunity') },
    { value: 'practical_experience', label: t('article:topics.practical_experience') },
  ],
});

export const getTopicOptionsForChannels = (t, channels = []) => {
  const topicsByChannel = getTopicsByChannel(t);
  const seen = new Set();

  return channels.flatMap((channel) => topicsByChannel[channel] ?? []).filter((option) => {
    if (seen.has(option.value)) return false;
    seen.add(option.value);
    return true;
  });
};

const LEGACY_TYPE_TO_TOPIC = {
  job: {
    FULL_TIME: 'full_time',
    PART_TIME: 'part_time',
    INTERNSHIP: 'internship',
    FREELANCE: 'freelance',
    CONTRACT: 'remote',
  },
  learning: {
    COURSE: 'online_course',
    EBOOK: 'online_course',
    VIDEO: 'online_course',
    OTHER: 'achievement_scholarship',
  },
};

export const normalizeArticleTopicForChannel = (channel, value) => {
  if (!value) return '';
  const raw = String(value).trim();
  const legacy = LEGACY_TYPE_TO_TOPIC[channel]?.[raw.toUpperCase()];
  return legacy ?? raw.toLowerCase().replace(/-/g, '_');
};
