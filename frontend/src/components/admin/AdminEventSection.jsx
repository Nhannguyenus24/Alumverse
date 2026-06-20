import { Box, Stack, Typography } from '@mui/material';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import UpcomingOutlinedIcon from '@mui/icons-material/UpcomingOutlined';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined';
import TodayOutlinedIcon from '@mui/icons-material/TodayOutlined';
import Chart from '../Chart';
import AdminSectionPanel from './AdminSectionPanel';
import AdminDashboardMetricTile from './AdminDashboardMetricTile';
import useAdminEventStats from '../../hooks/admin/useAdminEventStats';

const metricRowSx = {
  '& > *': { flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 0' } },
};

const AdminEventSection = () => {
  const { stats } = useAdminEventStats();

  const ticketStatusData = [
    { name: 'Đã đăng ký', count: Number(stats.registeredTickets) },
    { name: 'Đã check-in', count: Number(stats.checkedInTickets) },
    { name: 'Đã hủy', count: Number(stats.cancelledTickets) },
  ];

  return (
    <AdminSectionPanel
      title="Sự kiện"
      subtitle="Tổng quan về sự kiện, đăng ký vé và tỷ lệ check-in."
    >
      <Stack spacing={3}>
        <Stack spacing={2}>
          <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
            <AdminDashboardMetricTile label="Tổng sự kiện" value={Number(stats.totalEvents).toLocaleString()} icon={<EventNoteOutlinedIcon />} />
            <AdminDashboardMetricTile label="Đã công bố" value={Number(stats.publishedEvents).toLocaleString()} icon={<CampaignOutlinedIcon />} />
            <AdminDashboardMetricTile label="Sắp diễn ra" value={Number(stats.upcomingEvents).toLocaleString()} icon={<UpcomingOutlinedIcon />} />
          </Stack>
          <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
            <AdminDashboardMetricTile label="Tổng số vé" value={Number(stats.totalTickets).toLocaleString()} icon={<ConfirmationNumberOutlinedIcon />} />
            <AdminDashboardMetricTile label="Vé đã check-in" value={Number(stats.checkedInTickets).toLocaleString()} icon={<HowToRegOutlinedIcon />} />
            <AdminDashboardMetricTile label="Sự kiện hôm nay" value={Number(stats.newEventsToday).toLocaleString()} icon={<TodayOutlinedIcon />} />
          </Stack>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          <Box flex={1} minWidth={0}>
            <Chart
              type="bar"
              title="Vé theo trạng thái"
              data={ticketStatusData}
              dataKey="count"
              xAxisKey="name"
              height={260}
            />
          </Box>
          <Box flex={1} minWidth={0}>
            <Box
              sx={{
                p: 2.5,
                border: 1,
                borderColor: 'divider',
                borderRadius: 2,
                bgcolor: 'background.paper',
                height: '100%',
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                Top sự kiện theo đăng ký
              </Typography>
              {stats.topEventsByRegistration.length === 0 ? (
                <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', py: 2, textAlign: 'center' }}>
                  Chưa có dữ liệu
                </Typography>
              ) : (
                stats.topEventsByRegistration.slice(0, 5).map((evt, i) => (
                  <Box
                    key={evt.eventId ?? i}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 1,
                      borderBottom: i < Math.min(stats.topEventsByRegistration.length, 5) - 1 ? 1 : 0,
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="body2" sx={{ flex: 1, mr: 1, fontWeight: 600 }} noWrap>
                      {i + 1}. {evt.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ flexShrink: 0 }}>
                      {Number(evt.registeredCount ?? 0).toLocaleString()} vé
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </Box>
        </Stack>
      </Stack>
    </AdminSectionPanel>
  );
};

export default AdminEventSection;
