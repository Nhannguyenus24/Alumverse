import { useEffect, useState, useMemo } from 'react';
import { useSnackbar } from 'notistack';
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  Stack,
  useTheme,
  Avatar,
  Button,
} from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { useDebounce } from '../../hooks/useDebounce';
import { exportToCSV } from '../../utils/exportUtils';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import GppBadOutlinedIcon from '@mui/icons-material/GppBadOutlined';
import { useTranslation } from 'react-i18next';

import AdminStatusChip from '../../components/admin/AdminStatusChip';
import AdminForumPostDetailDialog from '../../components/admin/AdminForumPostDetailDialog';
import AdminConfirmDeleteDialog from '../../components/admin/AdminConfirmDeleteDialog';
import AdminDataTable from '../../components/admin/AdminDataTable';
import AdminDashboardMetricTile from '../../components/admin/AdminDashboardMetricTile';
import { FORUM_STATUS_MENU_ORDER, getForumStatusFilterOptions } from '../../constants/adminDefaultForumPosts';
import { useAdminForumContext } from '../../stores/AdminStore';
import { useAuth } from '../../hooks/useAuth';
import { formatDateTime } from '../../utils/dateFormatter';
import { forumModerationLabel, truncateText, toPlainText } from '../../utils/stringUtils';

const AdminForumPostsPage = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation('admin');
  const forumStatusFilterOptions = useMemo(() => getForumStatusFilterOptions(t), [t]);
  const {
    posts,
    postsPage,
    setPostsPage,
    postsSize,
    setPostsSize,
    allPosts,
    postsSearch,
    setPostsSearch,
    statusFilter,
    setStatusFilter,
    organizationFilter,
    updatePostStatus,
    deletePostApi,
    banPost: banPostApi,
    unbanPost: unbanPostApi,
    bannedPosts,
    bannedPage,
    setBannedPage,
    yesterdayPosts,
    yesterdayPage,
    setYesterdayPage,
    reports,
    reportsPage,
    setReportsPage,
    reviewReport,
    updatePostVisibility,
  } = useAdminForumContext();
  const [searchTerm, setSearchTerm] = useState(postsSearch);
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    setPostsSearch(debouncedSearch);
    setPostsPage(0); // reset về trang đầu khi keyword thay đổi
  }, [debouncedSearch, setPostsSearch]);

  const handleExport = () => {
    const exportData = posts.map(p => ({
      ID: p.id,
      [t('forum_col_author')]: p.authorName,
      [t('forum_col_topic')]: p.topicTitle,
      [t('forum_col_content')]: toPlainText(p.content),
      [t('forum_col_status')]: forumModerationLabel(p.moderationStatus, t),
      [t('forum_col_organization')]: p.organizationName || '-',
      [t('forum_col_posted_at')]: formatDateTime(p.postedAt)
    }));
    exportToCSV(exportData, `forum_posts_export_${new Date().getTime()}.csv`);
  };
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState(0);
  const [forumDetailPost, setForumDetailPost] = useState(null);
  const [forumDeletePost, setForumDeletePost] = useState(null);
  const [forumStatusMenu, setForumStatusMenu] = useState(null);

  const adminUserId = Number(user?.id);

  const handleBan = async (post) => {
    if (banPostApi) {
      const ok = await banPostApi(post.id);
      enqueueSnackbar(ok ? t('forum_post_banned') : t('forum_post_ban_failed'), { variant: ok ? 'success' : 'error' });
    }
  };

  const handleUnban = async (post) => {
    if (unbanPostApi) {
      const ok = await unbanPostApi(post.id);
      enqueueSnackbar(ok ? t('forum_post_unbanned') : t('forum_post_unban_failed'), { variant: ok ? 'success' : 'error' });
    }
  };

  const handleDeletePost = async (post) => {
    if (deletePostApi) {
      const ok = await deletePostApi(post.id);
      enqueueSnackbar(ok ? t('forum_post_deleted') : t('forum_post_delete_failed'), { variant: ok ? 'success' : 'error' });
    }
  };

  const authorCell = (_, p) => (
    <Stack direction="row" spacing={1} alignItems="center">
      <Avatar sx={{ width: 24, height: 24, fontSize: 10, bgcolor: 'primary.main' }}>
        {(p.authorName || '?')[0].toUpperCase()}
      </Avatar>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.authorName || t('forum_post_anonymous')}</Typography>
    </Stack>
  );

  const columns = useMemo(() => [
    { id: 'id', label: 'ID', width: 60 },
    { id: 'author', label: t('forum_col_author'), render: authorCell },
    { id: 'topicTitle', label: t('forum_col_topic'), render: (val) => truncateText(val, 30) },
    { id: 'content', label: t('forum_col_content'), render: (val) => truncateText(toPlainText(val), 50) },
    {
      id: 'moderationStatus',
      label: t('forum_col_status'),
      render: (st, p) => (
        <AdminStatusChip
          status={st}
          category="forum"
          label={forumModerationLabel(st, t)}
          onClick={(e) => {
            e.stopPropagation();
            setForumStatusMenu({ anchorEl: e.currentTarget, post: p });
          }}
          sx={{ cursor: 'pointer' }}
        />
      )
    },
    { id: 'postedAt', label: t('forum_col_posted_at'), render: (val) => formatDateTime(val) },
    {
      id: 'actions',
      label: t('actions'),
      align: 'right',
      width: 96,
      render: (_, p) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end" onClick={(e) => e.stopPropagation()}>
          <Tooltip title={t('forum_action_ban')}>
            <IconButton size="small" color="warning" onClick={() => handleBan(p)}>
              <BlockOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('forum_action_delete')}>
            <IconButton size="small" color="error" onClick={() => setForumDeletePost(p)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ], [handleBan, setForumDeletePost, setForumStatusMenu, t]);

  const bannedColumns = useMemo(() => [
    { id: 'id', label: 'ID', width: 60 },
    { id: 'author', label: t('forum_col_author'), render: authorCell },
    { id: 'topicTitle', label: t('forum_col_topic'), render: (val) => truncateText(val, 30) },
    { id: 'content', label: t('forum_col_content'), render: (val) => truncateText(toPlainText(val), 50) },
    { id: 'updatedAt', label: t('forum_col_banned_at'), render: (val) => formatDateTime(val) },
    {
      id: 'actions',
      label: t('actions'),
      align: 'right',
      width: 96,
      render: (_, p) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end" onClick={(e) => e.stopPropagation()}>
          <Tooltip title={t('forum_action_restore')}>
            <IconButton size="small" color="success" onClick={() => handleUnban(p)}>
              <LockOpenOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('forum_action_delete_permanent')}>
            <IconButton size="small" color="error" onClick={() => setForumDeletePost(p)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ], [handleUnban, setForumDeletePost, t]);

  const stats = {
    total: allPosts?.totalElements ?? 0,
    pending: posts.filter(p => p.moderationStatus === 'PENDING').length,
    reported: reports?.totalElements ?? 0,
    banned: bannedPosts?.totalElements ?? 0,
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main' }}>
            {t('forum_moderation_title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
            {t('forum_moderation_subtitle')}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<FileDownloadOutlinedIcon />}
          onClick={handleExport}
        >
          {t('export_data')}
        </Button>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 3,
          mb: 4,
          '& > *': {
            flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 0' },
          },
        }}
      >
        <AdminDashboardMetricTile
          label={t('forum_stat_total_posts')}
          value={stats.total}
          icon={<ArticleOutlinedIcon />}
        />
        <AdminDashboardMetricTile
          label={t('forum_stat_pending')}
          value={stats.pending}
          icon={<HistoryOutlinedIcon />}
          valueColor="info.main"
        />
        <AdminDashboardMetricTile
          label={t('forum_stat_reported')}
          value={stats.reported}
          icon={<ReportProblemOutlinedIcon />}
          valueColor="error.main"
        />
        <AdminDashboardMetricTile
          label={t('forum_stat_banned')}
          value={stats.banned}
          icon={<GppBadOutlinedIcon />}
          valueColor="warning.main"
        />
      </Box>

      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{
          mb: 3,
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: 15, minWidth: 100, py: 1.5 },
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Tab label={t('forum_tab_all_posts')} />
        <Tab label={t('forum_tab_banned', { count: bannedPosts?.totalElements ?? 0 })} />
        <Tab label={t('forum_tab_yesterday', { count: yesterdayPosts?.totalElements ?? 0 })} />
        <Tab label={t('forum_tab_reports', { count: reports?.totalElements ?? 0 })} />
      </Tabs>

      {activeTab === 0 && (
        <AdminDataTable
          columns={columns}
          rows={posts}
          totalCount={
            (statusFilter !== 'ALL' || organizationFilter !== 'ALL')
              ? posts.length  // filter phía client → chỉ hiển thị số dòng hiện tại
              : allPosts?.totalElements || 0
          }
          page={postsPage}
          rowsPerPage={postsSize}
          onPageChange={(_, p) => setPostsPage(p)}
          onRowsPerPageChange={(e) => {
            setPostsSize(Number(e.target.value));
            setPostsPage(0);
          }}
          onSearchChange={(v) => {
            setSearchTerm(v);
            setPostsPage(0);
          }}
          searchValue={searchTerm}
          searchPlaceholder={t('forum_search_placeholder')}
          filters={
            <Stack direction="row" spacing={2}>
              <TextField
                select
                size="small"
                label={t('forum_filter_status')}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ minWidth: 160 }}
              >
                {forumStatusFilterOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </TextField>
            </Stack>
          }
          onRowClick={(p) => setForumDetailPost(p)}
        />
      )}

      {activeTab === 1 && (
        <AdminDataTable
          columns={bannedColumns}
          rows={bannedPosts?.content ?? []}
          totalCount={bannedPosts?.totalElements ?? 0}
          page={bannedPage}
          onPageChange={(_, p) => setBannedPage(p)}
          onRowClick={(p) => setForumDetailPost(p)}
        />
      )}

      {activeTab === 2 && (
        <AdminDataTable
          columns={columns}
          rows={yesterdayPosts?.content ?? []}
          totalCount={yesterdayPosts?.totalElements ?? 0}
          page={yesterdayPage}
          onPageChange={(_, p) => setYesterdayPage(p)}
          onRowClick={(p) => setForumDetailPost(p)}
        />
      )}

      {activeTab === 3 && (
        <AdminDataTable
          columns={[
            { id: 'id', label: 'ID' },
            { id: 'postId', label: 'Post ID', render: (v) => `#${v}` },
            { id: 'reason', label: t('forum_col_reason') },
            { id: 'status', label: t('forum_col_status'), render: (v) => <AdminStatusChip status={v} category="forum" /> },
            {
              id: 'actions',
              label: t('actions'),
              align: 'right',
              width: 140,
              render: (_, r) => (
                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                  <Tooltip title={t('forum_action_hide_post')}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => reviewReport(r.id, { decision: 'APPROVED', action: 'HIDE_POST' })}
                    >
                      <VisibilityOffOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('forum_action_ban_post')}>
                    <IconButton size="small" color="warning" onClick={() => reviewReport(r.id, { decision: 'APPROVED', action: 'BAN_POST', adminUserId })}>
                      <BlockOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('forum_action_reject')}>
                    <IconButton size="small" onClick={() => reviewReport(r.id, { decision: 'REJECTED', reviewNote: '' })}>
                      <CancelOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              )
            }
          ]}
          rows={reports?.content ?? []}
          totalCount={reports?.totalElements ?? 0}
          page={reportsPage}
          onPageChange={(_, p) => setReportsPage(p)}
        />
      )}

      {/* Status Menu */}
      <Menu
        anchorEl={forumStatusMenu?.anchorEl}
        open={Boolean(forumStatusMenu)}
        onClose={() => setForumStatusMenu(null)}
        PaperProps={{ sx: { borderRadius: 2, mt: 1, minWidth: 160, boxShadow: theme.shadows[10] } }}
      >
        {FORUM_STATUS_MENU_ORDER.map((st) => (
          <MenuItem
            key={st}
            selected={forumStatusMenu?.post.moderationStatus === st}
            onClick={async () => {
              await updatePostStatus(forumStatusMenu.post.id, st);
              setForumStatusMenu(null);
            }}
            sx={{ fontSize: 14, fontWeight: 500 }}
          >
            {forumModerationLabel(st, t)}
          </MenuItem>
        ))}
      </Menu>

      {/* Dialogs */}
      <AdminForumPostDetailDialog
        open={Boolean(forumDetailPost)}
        post={forumDetailPost}
        statusLabel={forumDetailPost ? forumModerationLabel(forumDetailPost.moderationStatus, t) : ''}
        onClose={() => setForumDetailPost(null)}
        onBan={handleBan}
        onUnban={handleUnban}
      />

      <AdminConfirmDeleteDialog
        open={Boolean(forumDeletePost)}
        title={t('forum_delete_post_title')}
        description={forumDeletePost ? t('forum_delete_post_desc', { id: forumDeletePost.id }) : ''}
        onClose={() => setForumDeletePost(null)}
        onConfirm={async () => {
          if (forumDeletePost) await handleDeletePost(forumDeletePost);
          setForumDeletePost(null);
        }}
      />
    </Box>
  );
};

export default AdminForumPostsPage;
