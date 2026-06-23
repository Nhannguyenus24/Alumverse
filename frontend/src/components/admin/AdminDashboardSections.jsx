import { useTranslation } from 'react-i18next';
import { Box, Chip, List, ListItem, ListItemText, Stack, Typography } from '@mui/material';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import StarOutlinedIcon from '@mui/icons-material/StarOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import PersonOffOutlinedIcon from '@mui/icons-material/PersonOffOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import TopicOutlinedIcon from '@mui/icons-material/TopicOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import TodayOutlinedIcon from '@mui/icons-material/TodayOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import ReportGmailerrorredOutlinedIcon from '@mui/icons-material/ReportGmailerrorredOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';
import DomainVerificationOutlinedIcon from '@mui/icons-material/DomainVerificationOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
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
    flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 0' },
  },
};

const AdminDashboardSections = ({ aggregates, forumStats }) => {
  const { t } = useTranslation(['admin', 'forum']);
  const { user, forum, organization } = aggregates;
  const stats = forumStats || {};

  return (
    <Box>
      {/* Users */}
      <AdminSectionPanel
        title={t('admin:section_users_title')}
        subtitle={t('admin:section_users_subtitle')}
      >
        <Stack spacing={3}>
          <Stack spacing={2}>
            <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
              <AdminDashboardMetricTile label={t('admin:metric_total_users')} value={user.totalUsers} icon={<PeopleAltOutlinedIcon />} />
              <AdminDashboardMetricTile label={t('admin:metric_joined_this_week')} value={user.newUsersWeek} icon={<PersonAddAltOutlinedIcon />} />
              <AdminDashboardMetricTile label={t('admin:metric_joined_this_month')} value={user.newUsersMonth} icon={<CalendarMonthOutlinedIcon />} />
            </Stack>
            <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
              <AdminDashboardMetricTile label={t('admin:metric_active_users')} value={user.activeUsers} icon={<CheckCircleOutlineOutlinedIcon />} />
              <AdminDashboardMetricTile label={t('admin:metric_inactive_users')} value={user.inactiveUsers} icon={<PersonOffOutlinedIcon />} />
              <AdminDashboardMetricTile label={t('admin:metric_banned_users')} value={user.bannedUsers} icon={<BlockOutlinedIcon />} />
            </Stack>
          </Stack>
          <Chart
            type="line"
            title={t('admin:chart_new_registrations')}
            data={user.userGrowthSeries}
            dataKey="count"
            xAxisKey="date"
            height={280}
          />
        </Stack>
      </AdminSectionPanel>

      {/* Forum */}
      <AdminSectionPanel
        title={t('admin:section_forum_title')}
        subtitle={t('admin:section_forum_subtitle')}
      >
        <Stack spacing={3}>
          <Stack spacing={2}>
            <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
              <AdminDashboardMetricTile label={t('admin:metric_total_posts')} value={stats.totalPosts ?? forum.totalPosts} icon={<ArticleOutlinedIcon />} />
              <AdminDashboardMetricTile label={t('admin:metric_total_topics')} value={stats.totalTopics ?? 0} icon={<TopicOutlinedIcon />} />
              <AdminDashboardMetricTile label={t('admin:metric_total_categories')} value={stats.totalCategories ?? 0} icon={<CategoryOutlinedIcon />} />
            </Stack>
            <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
              <AdminDashboardMetricTile label={t('admin:metric_topics_today')} value={stats.newTopicsToday ?? 0} icon={<TodayOutlinedIcon />} />
              <AdminDashboardMetricTile label={t('admin:metric_posts_today')} value={stats.newPostsToday ?? 0} icon={<ArticleOutlinedIcon />} />
              <AdminDashboardMetricTile label={t('admin:metric_pending_posts')} value={forum.pending} icon={<WarningAmberOutlinedIcon />} />
              <AdminDashboardMetricTile label={t('admin:metric_approved_posts')} value={forum.approved} icon={<TaskAltOutlinedIcon />} />
            </Stack>
            <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={metricRowSx}>
              <AdminDashboardMetricTile label={t('admin:metric_flagged_posts')} value={forum.flagged} icon={<ReportGmailerrorredOutlinedIcon />} />
              <AdminDashboardMetricTile label={t('admin:metric_total_flags')} value={forum.totalFlags} icon={<FlagOutlinedIcon />} />
              <AdminDashboardMetricTile label={t('admin:metric_banned_posts')} value={stats.bannedPosts ?? 0} icon={<LockOutlinedIcon />} />
            </Stack>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Box flex={1} minWidth={0}>
              <Chart
                type="line"
                title={t('admin:chart_posts_by_day')}
                data={forum.forumPostsByDay}
                dataKey="count"
                xAxisKey="date"
                height={260}
              />
            </Box>
            <Box flex={1} minWidth={0}>
              <Chart
                type="bar"
                title={t('admin:chart_posts_by_moderation_status')}
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
                      {t('admin:most_popular_topic')}
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {stats.mostPopularTopic.title || stats.mostPopularTopic.topicTitle || '-'}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip label={t('admin:chip_posts_count', { count: stats.mostPopularTopic.postCount ?? 0 })} size="small" variant="outlined" color="primary" />
                    <Chip label={t('admin:chip_views_count', { count: stats.mostPopularTopic.viewCount ?? 0 })} size="small" variant="outlined" />
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
                      {t('admin:most_popular_category')}
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {stats.mostPopularCategory.categoryName || stats.mostPopularCategory.name || '-'}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip label={t('admin:chip_topics_count', { count: stats.mostPopularCategory.topicCount ?? 0 })} size="small" variant="outlined" color="primary" />
                    <Chip label={t('admin:chip_posts_count', { count: stats.mostPopularCategory.postCount ?? 0 })} size="small" variant="outlined" />
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
                  {t('admin:ghost_topics_title', { count: stats.ghostTopics.length })}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  — {t('admin:ghost_topics_subtitle')}
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
                      primary={gt.title || gt.topicTitle || t('admin:ghost_topic_fallback', { id: gt.id || gt.topicId })}
                      secondary={t('admin:ghost_topic_secondary', {
                        views: gt.viewCount ?? 0,
                        date: gt.createdAt ? new Date(gt.createdAt).toLocaleDateString('vi-VN') : '-',
                      })}
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
        title={t('admin:section_orgs_title')}
        subtitle={t('admin:section_orgs_subtitle')}
      >
        <Stack spacing={3}>
          <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={{ '& > *': { flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 0' } } }}>
            <AdminDashboardMetricTile label={t('admin:metric_total_orgs')} value={organization.totalOrganizations} icon={<BusinessCenterOutlinedIcon />} />
            <AdminDashboardMetricTile label={t('admin:metric_active_orgs')} value={organization.activeOrganizations} icon={<DomainVerificationOutlinedIcon />} />
            <AdminDashboardMetricTile label={t('admin:metric_inactive_orgs')} value={organization.inactiveOrganizations} icon={<BusinessOutlinedIcon />} />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="flex-start">
            <Box flex={1} minWidth={260}>
              <Typography variant="h6" sx={{ color: 'warning.main', pb: 2 }}>{t('admin:top_by_members')}</Typography>
              <List disablePadding sx={{ border: 1, borderColor: 'divider', borderRadius: 3, overflow: 'hidden', bgcolor: 'background.default' }}>
                {organization.topOrganizationsByMembers.map((org, index) => (
                  <ListItem
                    key={org.id}
                    sx={{ borderBottom: 1, borderColor: 'divider', py: 1.5, '&:last-of-type': { borderBottom: 'none' } }}
                  >
                    <ListItemText
                      primary={`${index + 1}. ${org.name}`}
                      secondary={t('admin:org_members_count', { count: org.members ?? 0 })}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 700 }}
                      secondaryTypographyProps={{ variant: 'caption', fontWeight: 600 }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
            <Box flex={1} minWidth={260}>
              <Typography variant="h6" sx={{ color: 'success.main', pb: 2 }}>{t('admin:active_organizations')}</Typography>
              <List disablePadding sx={{ border: 1, borderColor: 'divider', borderRadius: 3, overflow: 'hidden', bgcolor: 'background.default' }}>
                {organization.activeOrganizationsList.length === 0 ? (
                  <ListItem sx={{ py: 3, justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                      {t('admin:no_active_orgs')}
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
                        secondary={t('admin:org_members_count', { count: org.members ?? 0 })}
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
