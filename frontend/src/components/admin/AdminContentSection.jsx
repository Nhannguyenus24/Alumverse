import { Box, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import RecordVoiceOverOutlinedIcon from '@mui/icons-material/RecordVoiceOverOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import Chart from '../Chart';
import AdminSectionPanel from './AdminSectionPanel';
import AdminDashboardMetricTile from './AdminDashboardMetricTile';
import useAdminContentStats from '../../hooks/admin/useAdminContentStats';

const metricRowSx = {
  '& > *': { flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 0' } },
};

const AdminContentSection = ({ from, to }) => {
  const { t } = useTranslation(['admin']);
  const { stats } = useAdminContentStats(from, to);

  const contentTypeData = [
    { name: t('admin:chart_legend_news'), count: Number(stats.totalNews) },
    { name: t('admin:chart_legend_alumni_posts'), count: Number(stats.totalAlumniPosts) },
    { name: t('admin:chart_legend_jobs'), count: Number(stats.totalJobs) },
    { name: t('admin:chart_legend_documents'), count: Number(stats.totalLearningResources) },
    { name: t('admin:chart_legend_achievements'), count: Number(stats.totalAchievements) },
  ];

  return (
    <AdminSectionPanel
      title={t('admin:content_section_title')}
      subtitle={t('admin:content_section_subtitle')}
    >
      <Stack spacing={3}>
        <Stack spacing={2}>
          <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
            <AdminDashboardMetricTile
              label={t('admin:metric_news')}
              value={Number(stats.totalNews).toLocaleString()}
              icon={<ArticleOutlinedIcon />}
            />
            <AdminDashboardMetricTile
              label={t('admin:metric_alumni_posts')}
              value={Number(stats.totalAlumniPosts).toLocaleString()}
              icon={<RecordVoiceOverOutlinedIcon />}
            />
            <AdminDashboardMetricTile
              label={t('admin:metric_achievements')}
              value={Number(stats.totalAchievements).toLocaleString()}
              icon={<EmojiEventsOutlinedIcon />}
            />
          </Stack>
          <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
            <AdminDashboardMetricTile
              label={t('admin:metric_job_opportunities')}
              value={Number(stats.totalJobs).toLocaleString()}
              icon={<WorkOutlineOutlinedIcon />}
            />
            <AdminDashboardMetricTile
              label={t('admin:metric_active_jobs')}
              value={Number(stats.activeJobs).toLocaleString()}
              icon={<BusinessCenterOutlinedIcon />}
            />
            <AdminDashboardMetricTile
              label={t('admin:metric_learning_resources')}
              value={Number(stats.totalLearningResources).toLocaleString()}
              icon={<MenuBookOutlinedIcon />}
            />
          </Stack>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="stretch">
          <Box flex={2} minWidth={0}>
            <Chart
              type="bar"
              title={t('admin:chart_content_by_type')}
              data={contentTypeData}
              dataKey="count"
              xAxisKey="name"
              height={260}
            />
          </Box>
          <Stack flex={1} minWidth={0} spacing={2} sx={{ alignSelf: 'stretch' }}>
            <AdminDashboardMetricTile
              label={t('admin:metric_new_content_this_week')}
              value={Number(stats.newContentThisWeek).toLocaleString()}
              caption={t('admin:metric_caption_all_types')}
              icon={<ArticleOutlinedIcon />}
              sx={{ flex: '1 1 0', minHeight: 0 }}
            />
            <AdminDashboardMetricTile
              label={t('admin:metric_new_content_this_month')}
              value={Number(stats.newContentThisMonth).toLocaleString()}
              caption={t('admin:metric_caption_all_types')}
              icon={<CalendarMonthOutlinedIcon />}
              sx={{ flex: '1 1 0', minHeight: 0 }}
            />
          </Stack>
        </Stack>
      </Stack>
    </AdminSectionPanel>
  );
};

export default AdminContentSection;
