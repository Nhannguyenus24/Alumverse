import { Box, Stack } from '@mui/material';
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

const AdminContentSection = () => {
  const { stats } = useAdminContentStats();

  const contentTypeData = [
    { name: 'Tin tức', count: Number(stats.totalNews) },
    { name: 'Bài alumni', count: Number(stats.totalAlumniPosts) },
    { name: 'Việc làm', count: Number(stats.totalJobs) },
    { name: 'Tài liệu', count: Number(stats.totalLearningResources) },
    { name: 'Thành tích', count: Number(stats.totalAchievements) },
  ];

  return (
    <AdminSectionPanel
      title="Nội dung & Bài viết"
      subtitle="Tổng quan tin tức, bài alumni, việc làm, tài liệu và thành tích."
    >
      <Stack spacing={3}>
        <Stack spacing={2}>
          <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
            <AdminDashboardMetricTile
              label="Tin tức"
              value={Number(stats.totalNews).toLocaleString()}
              icon={<ArticleOutlinedIcon />}
            />
            <AdminDashboardMetricTile
              label="Bài đăng từ cựu sinh viên"
              value={Number(stats.totalAlumniPosts).toLocaleString()}
              icon={<RecordVoiceOverOutlinedIcon />}
            />
            <AdminDashboardMetricTile
              label="Thành tích"
              value={Number(stats.totalAchievements).toLocaleString()}
              icon={<EmojiEventsOutlinedIcon />}
            />
          </Stack>
          <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
            <AdminDashboardMetricTile
              label="Cơ hội việc làm"
              value={Number(stats.totalJobs).toLocaleString()}
              icon={<WorkOutlineOutlinedIcon />}
            />
            <AdminDashboardMetricTile
              label="Đang tuyển dụng"
              value={Number(stats.activeJobs).toLocaleString()}
              icon={<BusinessCenterOutlinedIcon />}
            />
            <AdminDashboardMetricTile
              label="Tài liệu học tập"
              value={Number(stats.totalLearningResources).toLocaleString()}
              icon={<MenuBookOutlinedIcon />}
            />
          </Stack>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="stretch">
          <Box flex={2} minWidth={0}>
            <Chart
              type="bar"
              title="Phân bổ nội dung theo loại"
              data={contentTypeData}
              dataKey="count"
              xAxisKey="name"
              height={260}
            />
          </Box>
          <Stack flex={1} minWidth={0} spacing={2} sx={{ alignSelf: 'stretch' }}>
            <AdminDashboardMetricTile
              label="Nội dung mới tuần này"
              value={Number(stats.newContentThisWeek).toLocaleString()}
              caption="Tất cả các loại"
              icon={<ArticleOutlinedIcon />}
              sx={{ flex: '1 1 0', minHeight: 0 }}
            />
            <AdminDashboardMetricTile
              label="Nội dung mới tháng này"
              value={Number(stats.newContentThisMonth).toLocaleString()}
              caption="Tất cả các loại"
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
