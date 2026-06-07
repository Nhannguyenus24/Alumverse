import { Stack } from '@mui/material';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
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
        <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
          <AdminDashboardMetricTile
            label="Tin tức"
            value={Number(stats.totalNews).toLocaleString()}
            icon={<ArticleOutlinedIcon />}
          />
          <AdminDashboardMetricTile label="Bài alumni" value={Number(stats.totalAlumniPosts).toLocaleString()} />
          <AdminDashboardMetricTile label="Việc làm (tổng)" value={Number(stats.totalJobs).toLocaleString()} />
          <AdminDashboardMetricTile label="Việc làm (đang tuyển)" value={Number(stats.activeJobs).toLocaleString()} />
          <AdminDashboardMetricTile label="Tài liệu học tập" value={Number(stats.totalLearningResources).toLocaleString()} />
          <AdminDashboardMetricTile label="Thành tích" value={Number(stats.totalAchievements).toLocaleString()} />
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          <Chart
            type="bar"
            title="Phân bổ nội dung theo loại"
            data={contentTypeData}
            dataKey="count"
            xAxisKey="name"
            height={260}
          />
          <Stack flex={1} spacing={2} justifyContent="center">
            <AdminDashboardMetricTile
              label="Nội dung mới tuần này"
              value={Number(stats.newContentThisWeek).toLocaleString()}
              caption="Tất cả các loại"
            />
            <AdminDashboardMetricTile
              label="Nội dung mới tháng này"
              value={Number(stats.newContentThisMonth).toLocaleString()}
              caption="Tất cả các loại"
            />
          </Stack>
        </Stack>
      </Stack>
    </AdminSectionPanel>
  );
};

export default AdminContentSection;
