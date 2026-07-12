import { useTranslation } from 'react-i18next';
import useAdminMentorshipStats from '../../hooks/admin/useAdminMentorshipStats';

const metricRowSx = {
  '& > *': { flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 0' } },
};

const AdminMentorshipSection = () => {
  const { t } = useTranslation(['admin', 'mentorship']);
  const { stats } = useAdminMentorshipStats();

  const sessionStatusData = [
    { name: t('mentorship:session_status_pending'), count: Number(stats.pendingSessions) },
    { name: t('mentorship:session_status_confirmed'), count: Number(stats.confirmedSessions) },
    { name: t('mentorship:session_status_completed'), count: Number(stats.completedSessions) },
    { name: t('mentorship:session_status_cancelled'), count: Number(stats.cancelledSessions) },
    { name: t('mentorship:session_status_rejected'), count: Number(stats.rejectedSessions) },
  ];

  return (
    <AdminSectionPanel
      title={t('admin:nav_mentorship')}
      subtitle={t('admin:mentorship_section_subtitle')}
    >
      <Stack spacing={3}>
        <Stack spacing={2}>
          <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
            <AdminDashboardMetricTile label={t('admin:metric_total_mentors')} value={Number(stats.totalMentors).toLocaleString()} icon={<SchoolOutlinedIcon />} />
            <AdminDashboardMetricTile label={t('admin:metric_approved_mentors')} value={Number(stats.approvedMentors).toLocaleString()} icon={<VerifiedUserOutlinedIcon />} />
            <AdminDashboardMetricTile label={t('admin:metric_pending_mentors')} value={Number(stats.pendingMentors).toLocaleString()} icon={<PendingActionsOutlinedIcon />} />
          </Stack>
          <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
            <AdminDashboardMetricTile label={t('admin:metric_total_sessions')} value={Number(stats.totalSessions).toLocaleString()} icon={<EventNoteOutlinedIcon />} />
            <AdminDashboardMetricTile label={t('admin:metric_completed_sessions')} value={Number(stats.completedSessions).toLocaleString()} icon={<TaskAltOutlinedIcon />} />
            <AdminDashboardMetricTile label={t('admin:metric_feedbacks')} value={Number(stats.totalFeedbacks).toLocaleString()} icon={<RateReviewOutlinedIcon />} />
          </Stack>
        </Stack>

        <Chart
          type="bar"
          title={t('admin:chart_sessions_by_status_title')}
          data={sessionStatusData}
          dataKey="count"
          xAxisKey="name"
          height={260}
        />
      </Stack>
    </AdminSectionPanel>
  );
};

export default AdminMentorshipSection;
