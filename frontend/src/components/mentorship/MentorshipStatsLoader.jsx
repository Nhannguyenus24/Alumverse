import { useTranslation } from 'react-i18next';
import StatsBanner from '../StatsBanner';
import { useMentorshipHubStats } from '../../hooks/mentorship/useMentorshipHubStats';

const MentorshipStatsLoader = () => {
  const { t } = useTranslation(['mentorship']);
  const { data } = useMentorshipHubStats();

  if (!data) {
    // Fallback to mock data if API not ready
    return (
      <StatsBanner items={[
        { value: '500+', label: t('mentorship:stats_mentors') },
        { value: '2,000+', label: t('mentorship:stats_sessions') },
        { value: '100%', label: t('mentorship:stats_alumni_confirmed') },
      ]} />
    );
  }

  const items = [
    {
      value: `${data.totalMentorsCount || 0}+`,
      label: t('mentorship:stats_mentors'),
    },
    {
      value: `${data.totalSessionsCount || 0}+`,
      label: t('mentorship:stats_sessions'),
    },
    {
      value: data.confirmedAlumniCount ? `${data.confirmedAlumniCount}+` : '0+',
      label: t('mentorship:stats_alumni_confirmed'),
    },
  ];

  return <StatsBanner items={items} />;
};

export default MentorshipStatsLoader;
