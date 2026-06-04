import { Box, Chip, List, ListItem, ListItemText, Typography, Grid } from '@mui/material';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import StarOutlinedIcon from '@mui/icons-material/StarOutlined';
import Chart from '../Chart';
import AdminSectionPanel from './AdminSectionPanel';
import AdminDashboardMetricTile from './AdminDashboardMetricTile';

const chartBlockSx = {
  flex: '1 1 300px', minWidth: 280, display: 'flex', flexDirection: 'column',
};

const metricGridSx = {
  display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3,
  '& > *': {
    flex: {
      xs: '1 1 100%', sm: '1 1 calc(50% - 12px)',
      md: '1 1 calc(25% - 12px)', lg: '1 1 0',
    },
  },
};

const AdminDashboardSections = ({ aggregates, forumStats }) => {
  const { user, forum, organization } = aggregates;
  const stats = forumStats || {};

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <AdminSectionPanel
        title="Người dùng"
        subtitle="Tài khoản, xu hướng đăng ký và phân loại trạng thái."
      >
        <Box sx={{ ...metricGridSx }}>
          <AdminDashboardMetricTile label="Tổng người dùng" value={user.totalUsers} valueColor="primary.main" />
          <AdminDashboardMetricTile
            label="Tham gia tuần này"
            value={user.newUsersWeek}
            valueColor="info.main"
          />
          <AdminDashboardMetricTile
            label="Tham gia tháng này"
            value={user.newUsersMonth}
            valueColor="info.dark"
          />
          <AdminDashboardMetricTile label="Hoạt động" value={user.activeUsers} valueColor="success.main" />
          <AdminDashboardMetricTile label="Chưa kích hoạt" value={user.inactiveUsers} valueColor="warning.main" />
          <AdminDashboardMetricTile label="Đã khóa" value={user.bannedUsers} valueColor="error.main" />
        </Box>
        <Box sx={chartBlockSx}>
          <Chart
            type="line"
            title="Đăng ký mới theo ngày (14 ngày qua)"
            data={user.userGrowthSeries}
            dataKey="count"
            xAxisKey="date"
            height={280}
          />
        </Box>
      </AdminSectionPanel>

      <AdminSectionPanel
        title="Diễn đàn"
        subtitle="Khối lượng bài viết, tình trạng kiểm duyệt và thống kê trực tiếp từ API."
      >
        {/* Row 1: core metrics from local aggregates + API stats */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ ...metricGridSx }}>
            <AdminDashboardMetricTile label="Tổng bài viết" value={stats.totalPosts ?? forum.totalPosts} valueColor="primary.main" />
            <AdminDashboardMetricTile label="Tổng chủ đề" value={stats.totalTopics ?? 0} valueColor="info.main" />
            <AdminDashboardMetricTile label="Tổng danh mục" value={stats.totalCategories ?? 0} valueColor="info.dark" />
            <AdminDashboardMetricTile label="Chủ đề hôm nay" value={stats.newTopicsToday ?? 0} valueColor="success.main" />
            <AdminDashboardMetricTile label="Bài viết hôm nay" value={stats.newPostsToday ?? 0} valueColor="success.dark" />
          </Box>
          <Box sx={{ ...metricGridSx }}>
            <AdminDashboardMetricTile label="Chờ duyệt" value={forum.pending} valueColor="warning.main" />
            <AdminDashboardMetricTile label="Đã duyệt" value={forum.approved} valueColor="success.main" />
            <AdminDashboardMetricTile label="Đã từ chối" value={forum.rejected} valueColor="text.secondary" />
            <AdminDashboardMetricTile label="Bị báo cáo" value={forum.flagged} valueColor="error.light" />
            <AdminDashboardMetricTile label="Báo xấu" value={forum.totalFlags} valueColor="secondary.main" />
            <AdminDashboardMetricTile label="Đã khóa" value={stats.bannedPosts ?? 0} valueColor="error.main" />
          </Box>
        </Box>

        {/* Row 2: charts */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'stretch' }}>
          <Box sx={chartBlockSx}>
            <Chart
              type="line"
              title="Bài viết theo ngày (7 ngày qua)"
              data={forum.forumPostsByDay}
              dataKey="count"
              xAxisKey="date"
              height={260}
            />
          </Box>
          <Box sx={chartBlockSx}>
            <Chart
              type="bar"
              title="Bài viết theo trạng thái kiểm duyệt"
              data={forum.forumModerationBar}
              dataKey="count"
              xAxisKey="name"
              height={260}
            />
          </Box>
        </Box>

        {/* Row 3: Most Popular Topic & Category cards */}
        {(stats.mostPopularTopic || stats.mostPopularCategory) && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
            {stats.mostPopularTopic && (
              <Box
                sx={{
                  flex: '1 1 280px',
                  minWidth: 260,
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <StarOutlinedIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'warning.main' }}>
                    Chủ đề nổi bật nhất
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {stats.mostPopularTopic.title || stats.mostPopularTopic.topicTitle || '-'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Chip
                    label={`${stats.mostPopularTopic.postCount ?? 0} bài viết`}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                  <Chip
                    label={`${stats.mostPopularTopic.viewCount ?? 0} lượt xem`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Box>
            )}
            {stats.mostPopularCategory && (
              <Box
                sx={{
                  flex: '1 1 280px',
                  minWidth: 260,
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <StarOutlinedIcon sx={{ color: 'success.main', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'success.main' }}>
                    Danh mục nổi bật nhất
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {stats.mostPopularCategory.categoryName || stats.mostPopularCategory.name || '-'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Chip
                    label={`${stats.mostPopularCategory.topicCount ?? 0} chủ đề`}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                  <Chip
                    label={`${stats.mostPopularCategory.postCount ?? 0} bài viết`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* Row 4: Ghost Topics warning */}
        {stats.ghostTopics && stats.ghostTopics.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <WarningAmberOutlinedIcon sx={{ color: 'error.main', fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'error.main' }}>
                Chủ đề bị lãng quên ({stats.ghostTopics.length})
              </Typography>
              <Typography variant="caption" color="text.secondary">
                — Các chủ đề không có phản hồi trong 7 ngày qua
              </Typography>
            </Box>
            <List
              dense
              disablePadding
              sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden', maxHeight: 200, overflowY: 'auto' }}
            >
              {stats.ghostTopics.map((gt, i) => (
                <ListItem
                  key={gt.id || gt.topicId || i}
                  sx={{ borderBottom: 1, borderColor: 'divider', '&:last-of-type': { borderBottom: 'none' } }}
                >
                  <ListItemText
                    primary={gt.title || gt.topicTitle || `Chủ đề #${gt.id || gt.topicId}`}
                    secondary={`Lượt xem: ${gt.viewCount ?? 0} · Ngày tạo: ${gt.createdAt ? new Date(gt.createdAt).toLocaleDateString('vi-VN') : '-'}`}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </AdminSectionPanel>

      <AdminSectionPanel
        title="Tổ chức & Đơn vị"
        subtitle="Tổng quan về vòng đời và các cộng đồng hàng đầu theo số lượng thành viên."
      >
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            mb: 3,
            '& > *': {
              flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 0' },
            },
          }}
        >
          <AdminDashboardMetricTile
            label="Tổng số tổ chức"
            value={organization.totalOrganizations}
            valueColor="primary.main"
          />
          <AdminDashboardMetricTile
            label="Đang hoạt động"
            value={organization.activeOrganizations}
            valueColor="success.main"
          />
          <AdminDashboardMetricTile
            label="Ngừng hoạt động"
            value={organization.inactiveOrganizations}
            valueColor="warning.main"
          />
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            alignItems: 'flex-start',
          }}
        >
          <Box sx={{ flex: '1 1 280px', minWidth: 260 }}>
            <Typography variant="h6" sx={{ color: 'warning.main', pb: 2 }}>
              Top theo thành viên
            </Typography>
            <List disablePadding sx={{ border: 1, borderColor: 'divider', borderRadius: 3, overflow: 'hidden', bgcolor: 'background.default' }}>
              {organization.topOrganizationsByMembers.map((org, index) => (
                <ListItem
                  key={org.id}
                  sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    py: 1.5,
                    '&:last-of-type': { borderBottom: 'none' },
                  }}
                >
                  <ListItemText
                    primary={`${index + 1}. ${org.name}`}
                    secondary={`${org.members ?? 0} thành viên`}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 700 }}
                    secondaryTypographyProps={{ variant: 'caption', fontWeight: 600 }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
          <Box sx={{ flex: '1 1 280px', minWidth: 260 }}>
            <Typography variant="h6" sx={{ color: 'success.main', pb: 2 }}>
              Tổ chức đang hoạt động
            </Typography>
            <List disablePadding sx={{ border: 1, borderColor: 'divider', borderRadius: 3, overflow: 'hidden', bgcolor: 'background.default' }}>
              {organization.activeOrganizationsList.length === 0 ? (
                <ListItem sx={{ py: 3, justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                    Không có tổ chức nào đang hoạt động
                  </Typography>
                </ListItem>
              ) : (
                organization.activeOrganizationsList.map((org) => (
                  <ListItem
                    key={org.id}
                    sx={{
                      borderBottom: 1,
                      borderColor: 'divider',
                      py: 1.5,
                      '&:last-of-type': { borderBottom: 'none' },
                    }}
                  >
                    <ListItemText
                      primary={org.name}
                      secondary={`${org.members ?? 0} thành viên`}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 700 }}
                      secondaryTypographyProps={{ variant: 'caption', fontWeight: 600 }}
                    />
                  </ListItem>
                ))
              )}
            </List>
          </Box>
        </Box>
      </AdminSectionPanel>
    </Box>
  );
};

export default AdminDashboardSections;
