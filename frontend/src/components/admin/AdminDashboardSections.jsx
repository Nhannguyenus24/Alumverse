import { Box, List, ListItem, ListItemText, Typography } from '@mui/material';
import Chart from '../Chart';
import AdminSectionPanel from './AdminSectionPanel';
import AdminDashboardMetricTile from './AdminDashboardMetricTile';

const chartBlockSx = {
  flex: '1 1 300px',
  minWidth: 280,
  display: 'flex',
  flexDirection: 'column',
};

const AdminDashboardSections = ({ aggregates }) => {
  const { user, forum, organization } = aggregates;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <AdminSectionPanel
        title="Users"
        subtitle="Accounts, registration trend, and status breakdown (local demo data)."
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
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
        subtitle="Post volume, moderation mix, and reports (flags) from local demo posts."
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
          <AdminDashboardMetricTile label="Total posts" value={forum.totalPosts} valueColor="primary.main" />
          <AdminDashboardMetricTile label="Pending" value={forum.pending} valueColor="warning.main" />
          <AdminDashboardMetricTile label="Flagged" value={forum.flagged} valueColor="error.main" />
          <AdminDashboardMetricTile label="Approved" value={forum.approved} valueColor="success.main" />
          <AdminDashboardMetricTile label="Rejected" value={forum.rejected} valueColor="text.secondary" />
          <AdminDashboardMetricTile label="Total reports (flags)" value={forum.totalFlags} valueColor="secondary.main" />
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            alignItems: 'stretch',
          }}
        >
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
      </AdminSectionPanel>

      <AdminSectionPanel
        title="Organizations"
        subtitle="Lifecycle snapshot and top communities by membership (mock / API fallback)."
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
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
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
              Top by members
            </Typography>
            <List dense disablePadding sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
              {organization.topOrganizationsByMembers.map((org, index) => (
                <ListItem
                  key={org.id}
                  sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    '&:last-of-type': { borderBottom: 'none' },
                  }}
                >
                  <ListItemText
                    primary={`${index + 1}. ${org.name}`}
                    secondary={`${org.members ?? 0} members`}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
          <Box sx={{ flex: '1 1 280px', minWidth: 260 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
              Active organizations
            </Typography>
            <List dense disablePadding sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
              {organization.activeOrganizationsList.length === 0 ? (
                <ListItem>
                  <ListItemText primary="No active organizations" />
                </ListItem>
              ) : (
                organization.activeOrganizationsList.map((org) => (
                  <ListItem
                    key={org.id}
                    sx={{
                      borderBottom: 1,
                      borderColor: 'divider',
                      '&:last-of-type': { borderBottom: 'none' },
                    }}
                  >
                    <ListItemText
                      primary={org.name}
                      secondary={`${org.members ?? 0} members`}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
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
