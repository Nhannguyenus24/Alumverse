export const getTopicsByChannel = (t) => ({
  news: [
    { value: 'school_announcement', label: t('article:topics.school_announcement') },
    { value: 'faculty_department', label: t('article:topics.faculty_department') },
    { value: 'student_activities', label: t('article:topics.student_activities') },
    { value: 'alumni_news', label: t('article:topics.alumni_news') },
    { value: 'enterprise_cooperation', label: t('article:topics.enterprise_cooperation') },
    { value: 'academic_research', label: t('article:topics.academic_research') },
    { value: 'admission_scholarship', label: t('article:topics.admission_scholarship') },
    { value: 'donation', label: t('article:topics.donation') },
  ],
  event: [
    { value: 'workshop', label: t('article:topics.workshop') },
    { value: 'talkshow', label: t('article:topics.talkshow') },
    { value: 'career_fair', label: t('article:topics.career_fair') },
    { value: 'networking', label: t('article:topics.networking') },
    { value: 'reunion', label: t('article:topics.reunion') },
    { value: 'academic_seminar', label: t('article:topics.academic_seminar') },
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
    { value: 'entrepreneur', label: t('article:topics.entrepreneur') },
    { value: 'technology', label: t('article:topics.technology') },
    { value: 'academic_research_alumni', label: t('article:topics.academic_research_alumni') },
    { value: 'study_abroad', label: t('article:topics.study_abroad') },
    { value: 'startup', label: t('article:topics.startup') },
    { value: 'leadership', label: t('article:topics.leadership') },
    { value: 'arts_creativity', label: t('article:topics.arts_creativity') },
  ],
  achievement: [
    { value: 'award', label: t('article:topics.award') },
    { value: 'achievement_scholarship', label: t('article:topics.achievement_scholarship') },
    { value: 'career_achievement', label: t('article:topics.career_achievement') },
    { value: 'science_research', label: t('article:topics.science_research') },
    { value: 'startup', label: t('article:topics.startup') },
    { value: 'international', label: t('article:topics.international') },
  ],
  learning: [
    { value: 'achievement_scholarship', label: t('article:topics.achievement_scholarship') },
    { value: 'masters', label: t('article:topics.masters') },
    { value: 'study_abroad', label: t('article:topics.study_abroad') },
    { value: 'online_course', label: t('article:topics.online_course') },
    { value: 'certificate', label: t('article:topics.certificate') },
    { value: 'student_exchange', label: t('article:topics.student_exchange') },
    { value: 'research', label: t('article:topics.research') },
  ],
  job: [
    { value: 'internship', label: t('article:topics.internship') },
    { value: 'full_time', label: t('article:topics.full_time') },
    { value: 'part_time', label: t('article:topics.part_time') },
    { value: 'freelance', label: t('article:topics.freelance') },
    { value: 'internal_referral', label: t('article:topics.internal_referral') },
    { value: 'remote', label: t('article:topics.remote') },
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
