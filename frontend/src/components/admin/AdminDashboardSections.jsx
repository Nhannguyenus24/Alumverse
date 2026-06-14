import { Box, Chip, List, ListItem, ListItemText, Stack, Typography } from '@mui/material';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import StarOutlinedIcon from '@mui/icons-material/StarOutlined';
import Chart from '../Chart';
import AdminSectionPanel from './AdminSectionPanel';
import AdminDashboardMetricTile from './AdminDashboardMetricTile';
import AdminEventSection from './AdminEventSection';
import AdminMentorshipSection from './AdminMentorshipSection';
import AdminSecuritySection from './AdminSecuritySection';
import AdminFundraisingSection from './AdminFundraisingSection';
import AdminUserGrowthSection from './AdminUserGrowthSection';
import AdminVerificationSection from './AdminVerificationSection';
import AdminContentSection from './AdminContentSection';
import AdminFeedbackSection from './AdminFeedbackSection';

const metricRowSx = {
  '& > *': {
    flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(25% - 8px)', lg: '1 1 0' },
  },
};

const AdminDashboardSections = ({ aggregates, forumStats }) => {
  const { user, forum, organization } = aggregates;
  const stats = forumStats || {};

  return (
    <Box>
      {/* Users */}
      <AdminSectionPanel
        title="Người dùng"
        subtitle="Tài khoản, xu hướng đăng ký và phân loại trạng thái."
      >
        <Stack spacing={3}>
          <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
            <AdminDashboardMetricTile label="Tổng người dùng" value={user.totalUsers} />
            <AdminDashboardMetricTile label="Tham gia tuần này" value={user.newUsersWeek} />
            <AdminDashboardMetricTile label="Tham gia tháng này" value={user.newUsersMonth} />
            <AdminDashboardMetricTile label="Hoạt động" value={user.activeUsers} />
            <AdminDashboardMetricTile label="Chưa kích hoạt" value={user.inactiveUsers} />
            <AdminDashboardMetricTile label="Đã khóa" value={user.bannedUsers} />
          </Stack>
          <Chart
            type="line"
            title="Đăng ký mới theo ngày (14 ngày qua)"
            data={user.userGrowthSeries}
            dataKey="count"
            xAxisKey="date"
            height={280}
          />
        </Stack>
      </AdminSectionPanel>

      {/* Forum */}
      <AdminSectionPanel
        title="Diễn đàn"
        subtitle="Khối lượng bài viết, tình trạng kiểm duyệt và thống kê trực tiếp từ API."
      >
        <Stack spacing={3}>
          <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
            <AdminDashboardMetricTile label="Tổng bài viết" value={stats.totalPosts ?? forum.totalPosts} />
            <AdminDashboardMetricTile label="Tổng chủ đề" value={stats.totalTopics ?? 0} />
            <AdminDashboardMetricTile label="Tổng danh mục" value={stats.totalCategories ?? 0} />
            <AdminDashboardMetricTile label="Chủ đề hôm nay" value={stats.newTopicsToday ?? 0} />
            <AdminDashboardMetricTile label="Bài viết hôm nay" value={stats.newPostsToday ?? 0} />
          </Stack>
          <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
            <AdminDashboardMetricTile label="Chờ duyệt" value={forum.pending} />
            <AdminDashboardMetricTile label="Đã duyệt" value={forum.approved} />
            <AdminDashboardMetricTile label="Đã từ chối" value={forum.rejected} />
            <AdminDashboardMetricTile label="Bị báo cáo" value={forum.flagged} />
            <AdminDashboardMetricTile label="Báo xấu" value={forum.totalFlags} />
            <AdminDashboardMetricTile label="Đã khóa" value={stats.bannedPosts ?? 0} />
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Box flex={1} minWidth={0}>
              <Chart
                type="line"
                title="Bài viết theo ngày (7 ngày qua)"
                data={forum.forumPostsByDay}
                dataKey="count"
                xAxisKey="date"
                height={260}
              />
            </Box>
            <Box flex={1} minWidth={0}>
              <Chart
                type="bar"
                title="Bài viết theo trạng thái kiểm duyệt"
                data={forum.forumModerationBar}
                dataKey="count"
                xAxisKey="name"
                height={260}
              />
            </Box>
          </Stack>

          {(stats.mostPopularTopic || stats.mostPopularCategory) && (
            <Stack direction={{ xs: 'column', sm: 'row' }} flexWrap="wrap" spacing={2} useFlexGap>
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
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip label={`${stats.mostPopularTopic.postCount ?? 0} bài viết`} size="small" variant="outlined" color="primary" />
                    <Chip label={`${stats.mostPopularTopic.viewCount ?? 0} lượt xem`} size="small" variant="outlined" />
                  </Stack>
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
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip label={`${stats.mostPopularCategory.topicCount ?? 0} chủ đề`} size="small" variant="outlined" color="primary" />
                    <Chip label={`${stats.mostPopularCategory.postCount ?? 0} bài viết`} size="small" variant="outlined" />
                  </Stack>
                </Box>
              )}
            </Stack>
          )}

          {stats.ghostTopics && stats.ghostTopics.length > 0 && (
            <Box>
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
        </Stack>
      </AdminSectionPanel>

      {/* Organizations */}
      <AdminSectionPanel
        title="Tổ chức & Đơn vị"
        subtitle="Tổng quan về vòng đời và các cộng đồng hàng đầu theo số lượng thành viên."
      >
        <Stack spacing={3}>
          <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={{ '& > *': { flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 0' } } }}>
            <AdminDashboardMetricTile label="Tổng số tổ chức" value={organization.totalOrganizations} />
            <AdminDashboardMetricTile label="Đang hoạt động" value={organization.activeOrganizations} />
            <AdminDashboardMetricTile label="Ngừng hoạt động" value={organization.inactiveOrganizations} />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="flex-start">
            <Box flex={1} minWidth={260}>
              <Typography variant="h6" sx={{ color: 'warning.main', pb: 2 }}>Top theo thành viên</Typography>
              <List disablePadding sx={{ border: 1, borderColor: 'divider', borderRadius: 3, overflow: 'hidden', bgcolor: 'background.default' }}>
                {organization.topOrganizationsByMembers.map((org, index) => (
                  <ListItem
                    key={org.id}
                    sx={{ borderBottom: 1, borderColor: 'divider', py: 1.5, '&:last-of-type': { borderBottom: 'none' } }}
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
            <Box flex={1} minWidth={260}>
              <Typography variant="h6" sx={{ color: 'success.main', pb: 2 }}>Tổ chức đang hoạt động</Typography>
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
                      sx={{ borderBottom: 1, borderColor: 'divider', py: 1.5, '&:last-of-type': { borderBottom: 'none' } }}
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
          </Stack>
        </Stack>
      </AdminSectionPanel>

      {/* User Growth */}
      <AdminUserGrowthSection />

      {/* Verification */}
      <AdminVerificationSection />

      {/* Events */}
      <AdminEventSection />

      {/* Mentorship */}
      <AdminMentorshipSection />

      {/* Fundraising */}
      <AdminFundraisingSection />

      {/* Content & Articles */}
      <AdminContentSection />

      {/* Feedback */}
      <AdminFeedbackSection />

      {/* Security & Audit */}
      <AdminSecuritySection />
    </Box>
  );
};

export default AdminDashboardSections;
