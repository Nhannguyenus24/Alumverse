import { Box, Chip, List, ListItem, ListItemText, Typography, Grid } from '@mui/material';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import StarOutlinedIcon from '@mui/icons-material/StarOutlined';
import Chart from '../Chart';
import AdminSectionPanel from './AdminSectionPanel';
import AdminDashboardMetricTile from './AdminDashboardMetricTile';

const chartBlockSx = {
  flex: '1 1 300px',
  minWidth: 280,
  display: 'flex',
  flexDirection: 'column',
};

const AdminDashboardSections = ({ aggregates, forumStats }) => {
  const { user, forum, organization } = aggregates;
  const stats = forumStats || {};

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <AdminSectionPanel
        title="Users"
        subtitle="Accounts, registration trend, and status breakdown (local demo data)."
      >
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            mb: 3,
            '& > *': {
              flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(33.333% - 12px)', lg: '1 1 0' },
            },
          }}
        >
          <AdminDashboardMetricTile label="Total users" value={user.totalUsers} valueColor="primary.main" />
          <AdminDashboardMetricTile
            label="New (7 days)"
            value={user.newUsersWeek}
            caption="Rolling week"
            valueColor="info.main"
          />
          <AdminDashboardMetricTile
            label="New (30 days)"
            value={user.newUsersMonth}
            caption="Rolling month"
            valueColor="info.dark"
          />
          <AdminDashboardMetricTile label="Active" value={user.activeUsers} valueColor="success.main" />
          <AdminDashboardMetricTile label="Inactive" value={user.inactiveUsers} valueColor="warning.main" />
          <AdminDashboardMetricTile label="Banned" value={user.bannedUsers} valueColor="error.main" />
        </Box>
        <Box sx={chartBlockSx}>
          <Chart
            type="line"
            title="New registrations per day (last 14 days)"
            data={user.userGrowthSeries}
            dataKey="count"
            xAxisKey="date"
            height={280}
          />
        </Box>
      </AdminSectionPanel>

      <AdminSectionPanel
        title="Forum"
        subtitle="Post volume, moderation mix, and live statistics from backend API."
      >
        {/* Row 1: core metrics from local aggregates + API stats */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            mb: 3,
            '& > *': {
              flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 12px)', lg: '1 1 0' },
            },
          }}
        >
          <AdminDashboardMetricTile label="Total posts" value={stats.totalPosts ?? forum.totalPosts} valueColor="primary.main" />
          <AdminDashboardMetricTile label="Total topics" value={stats.totalTopics ?? 0} valueColor="info.main" />
          <AdminDashboardMetricTile label="Total categories" value={stats.totalCategories ?? 0} valueColor="info.dark" />
          <AdminDashboardMetricTile label="Banned" value={stats.bannedPosts ?? 0} valueColor="error.main" />
          <AdminDashboardMetricTile label="Today Topics" value={stats.newTopicsToday ?? 0} valueColor="success.main" />
          <AdminDashboardMetricTile label="Today Posts" value={stats.newPostsToday ?? 0} valueColor="success.dark" />
          <AdminDashboardMetricTile label="Pending" value={forum.pending} valueColor="warning.main" />
          <AdminDashboardMetricTile label="Flagged" value={forum.flagged} valueColor="error.light" />
          <AdminDashboardMetricTile label="Approved" value={forum.approved} valueColor="success.main" />
          <AdminDashboardMetricTile label="Rejected" value={forum.rejected} valueColor="text.secondary" />
          <AdminDashboardMetricTile label="Reports" value={forum.totalFlags} valueColor="secondary.main" />
        </Box>

        {/* Row 2: charts */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'stretch' }}>
          <Box sx={chartBlockSx}>
            <Chart
              type="line"
              title="Posts per day (last 7 days)"
              data={forum.forumPostsByDay}
              dataKey="count"
              xAxisKey="date"
              height={260}
            />
          </Box>
          <Box sx={chartBlockSx}>
            <Chart
              type="bar"
              title="Posts by moderation status"
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
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    Most Popular Topic
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {stats.mostPopularTopic.title || stats.mostPopularTopic.topicTitle || '-'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Chip
                    label={`${stats.mostPopularTopic.postCount ?? 0} posts`}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                  <Chip
                    label={`${stats.mostPopularTopic.viewCount ?? 0} views`}
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
                  <StarOutlinedIcon sx={{ color: 'info.main', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    Most Popular Category
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {stats.mostPopularCategory.categoryName || stats.mostPopularCategory.name || '-'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Chip
                    label={`${stats.mostPopularCategory.topicCount ?? 0} topics`}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                  <Chip
                    label={`${stats.mostPopularCategory.postCount ?? 0} posts`}
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
              <WarningAmberOutlinedIcon sx={{ color: 'warning.main', fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'warning.dark' }}>
                Ghost Topics ({stats.ghostTopics.length})
              </Typography>
              <Typography variant="caption" color="text.secondary">
                — Topics with no replies for 7+ days
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
                    primary={gt.title || gt.topicTitle || `Topic #${gt.id || gt.topicId}`}
                    secondary={`Views: ${gt.viewCount ?? 0} · Created: ${gt.createdAt ? new Date(gt.createdAt).toLocaleDateString('vi-VN') : '-'}`}
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
        title="Organizations"
        subtitle="Lifecycle snapshot and top communities by membership (mock / API fallback)."
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
            label="Total organizations"
            value={organization.totalOrganizations}
            valueColor="primary.main"
          />
          <AdminDashboardMetricTile
            label="Active"
            value={organization.activeOrganizations}
            valueColor="success.main"
          />
          <AdminDashboardMetricTile
            label="Inactive"
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
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 1 }}>
              Top by members
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
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <ListItemText
                    primary={`${index + 1}. ${org.name}`}
                    secondary={`${org.members ?? 0} members`}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 700 }}
                    secondaryTypographyProps={{ variant: 'caption', fontWeight: 600 }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
          <Box sx={{ flex: '1 1 280px', minWidth: 260 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: 'success.main', textTransform: 'uppercase', letterSpacing: 1 }}>
              Active organizations
            </Typography>
            <List disablePadding sx={{ border: 1, borderColor: 'divider', borderRadius: 3, overflow: 'hidden', bgcolor: 'background.default' }}>
              {organization.activeOrganizationsList.length === 0 ? (
                <ListItem sx={{ py: 3, justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                    No active organizations
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
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    <ListItemText
                      primary={org.name}
                      secondary={`${org.members ?? 0} members`}
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
