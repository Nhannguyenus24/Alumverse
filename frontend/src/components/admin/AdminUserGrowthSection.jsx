import { Stack } from '@mui/material';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { useTranslation } from 'react-i18next';
import Chart from '../Chart';
import AdminSectionPanel from './AdminSectionPanel';
import AdminDashboardMetricTile from './AdminDashboardMetricTile';
import useAdminUserGrowthStats from '../../hooks/admin/useAdminUserGrowthStats';

const metricRowSx = {
  '& > *': { flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 0' } },
};

const AdminUserGrowthSection = () => {
  const { t } = useTranslation('admin');
  const { stats } = useAdminUserGrowthStats();

  const fmtDate = (str) => {
    const p = String(str ?? '').slice(0, 10).split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}` : str;
  };

  const dailyData = (stats.dailyRegistrations || []).map((d) => ({
    date: fmtDate(d.date), count: Number(d.count ?? 0),
  }));

  return (
    <AdminSectionPanel
      title={t('admin:user_growth_section_title')}
      subtitle={t('admin:user_growth_section_subtitle')}
    >
      <Stack spacing={3}>
        <Stack spacing={2}>
          <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
            <AdminDashboardMetricTile
              label={t('admin:user_growth_new_week')}
              value={Number(stats.newUsersLast7Days).toLocaleString()}
              caption={t('admin:user_growth_last_7_days')}
              icon={<PersonAddOutlinedIcon />}
            />
            <AdminDashboardMetricTile
              label={t('admin:user_growth_new_month')}
              value={Number(stats.newUsersLast30Days).toLocaleString()}
              caption={t('admin:user_growth_last_30_days')}
              icon={<CalendarMonthOutlinedIcon />}
            />
          </Stack>
          <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
            <AdminDashboardMetricTile
              label={t('admin:user_growth_active')}
              value={Number(stats.totalActiveUsers).toLocaleString()}
              icon={<CheckCircleOutlineOutlinedIcon />}
            />
            <AdminDashboardMetricTile
              label={t('admin:user_growth_banned')}
              value={Number(stats.totalBannedUsers).toLocaleString()}
              icon={<BlockOutlinedIcon />}
            />
            <AdminDashboardMetricTile
              label={t('admin:user_growth_deleted')}
              value={Number(stats.totalDeletedUsers).toLocaleString()}
              icon={<DeleteOutlineOutlinedIcon />}
            />
          </Stack>
        </Stack>

        <Chart
          type="line"
          title={t('admin:chart_new_registrations_30d')}
          data={dailyData}
          dataKey="count"
          xAxisKey="date"
          height={280}
        />
      </Stack>
    </AdminSectionPanel>
  );
};

export default AdminUserGrowthSection;
