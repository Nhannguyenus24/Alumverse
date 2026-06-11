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
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import GppBadOutlinedIcon from '@mui/icons-material/GppBadOutlined';

import AdminStatusChip from '../../components/admin/AdminStatusChip';
import AdminForumPostDetailDialog from '../../components/admin/AdminForumPostDetailDialog';
import AdminConfirmDeleteDialog from '../../components/admin/AdminConfirmDeleteDialog';
import AdminDataTable from '../../components/admin/AdminDataTable';
import AdminDashboardMetricTile from '../../components/admin/AdminDashboardMetricTile';
import { FORUM_STATUS_FILTER_OPTIONS } from '../../constants/adminDefaultForumPosts';
import { useAdminForumContext } from '../../stores/AdminStore';
import { useAuth } from '../../hooks/useAuth';
import { formatDateTime } from '../../utils/dateFormatter';
import { forumModerationLabel, truncateText } from '../../utils/stringUtils';

const FORUM_STATUS_MENU_ORDER = ['PENDING', 'FLAGGED', 'APPROVED', 'REJECTED'];

const AdminForumPostsPage = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
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
      'Tác giả': p.authorName,
      'Chủ đề': p.topicTitle,
      'Nội dung': p.content,
      'Trạng thái': forumModerationLabel(p.moderationStatus),
      'Tổ chức': p.organizationName || '-',
      'Ngày đăng': formatDateTime(p.postedAt)
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
      enqueueSnackbar(ok ? 'Đã chặn bài viết.' : 'Lỗi khi chặn bài viết.', { variant: ok ? 'success' : 'error' });
    }
  };

  const handleUnban = async (post) => {
    if (unbanPostApi) {
      const ok = await unbanPostApi(post.id);
      enqueueSnackbar(ok ? 'Đã bỏ chặn bài viết.' : 'Lỗi khi bỏ chặn.', { variant: ok ? 'success' : 'error' });
    }
  };

  const handleDeletePost = async (post) => {
    if (deletePostApi) {
      const ok = await deletePostApi(post.id);
      enqueueSnackbar(ok ? 'Đã xóa bài viết.' : 'Lỗi khi xóa.', { variant: ok ? 'success' : 'error' });
    }
  };

  const columns = useMemo(() => [
    { id: 'id', label: 'ID', width: 60 },
    {
      id: 'author',
      label: 'Tác giả',
      render: (_, p) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Avatar sx={{ width: 24, height: 24, fontSize: 10, bgcolor: 'primary.main' }}>
            {(p.authorName || '?')[0].toUpperCase()}
          </Avatar>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.authorName || 'Ẩn danh'}</Typography>
        </Stack>
      )
    },
    { id: 'topicTitle', label: 'Chủ đề', render: (val) => truncateText(val, 30) },
    { id: 'content', label: 'Nội dung', render: (val) => truncateText(val, 50) },
    {
      id: 'moderationStatus',
      label: 'Trạng thái',
      render: (st, p) => (
        <AdminStatusChip
          status={st}
          category="forum"
          label={forumModerationLabel(st)}
          onClick={(e) => {
            e.stopPropagation();
            setForumStatusMenu({ anchorEl: e.currentTarget, post: p });
          }}
          sx={{ cursor: 'pointer' }}
        />
      )
    },
    { id: 'postedAt', label: 'Ngày đăng', render: (val) => formatDateTime(val) },
    {
      id: 'actions',
      label: '',
      align: 'right',
      render: (_, p) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end" onClick={(e) => e.stopPropagation()}>
          <Tooltip title="Chặn">
            <IconButton size="small" color="warning" onClick={() => handleBan(p)}>
              <BlockOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Xóa">
            <IconButton size="small" color="error" onClick={() => setForumDeletePost(p)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ], [handleBan, setForumDeletePost, setForumStatusMenu]);

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
            Kiểm duyệt diễn đàn
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
            Theo dõi, xử lý báo cáo và kiểm duyệt các bài viết trên cộng đồng.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<FileDownloadOutlinedIcon />}
          onClick={handleExport}
        >
          Xuất dữ liệu
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
          label="Tổng bài viết"
          value={stats.total}
          icon={<ArticleOutlinedIcon />}
        />
        <AdminDashboardMetricTile
          label="Chờ duyệt"
          value={stats.pending}
          icon={<HistoryOutlinedIcon />}
          valueColor="info.main"
        />
        <AdminDashboardMetricTile
          label="Báo cáo vi phạm"
          value={stats.reported}
          icon={<ReportProblemOutlinedIcon />}
          valueColor="error.main"
        />
        <AdminDashboardMetricTile
          label="Bài viết bị chặn"
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
        <Tab label="Tất cả bài viết" />
        <Tab label={`Đã chặn (${bannedPosts?.totalElements ?? 0})`} />
        <Tab label={`Mới hôm qua (${yesterdayPosts?.totalElements ?? 0})`} />
        <Tab label={`Báo cáo (${reports?.totalElements ?? 0})`} />
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
          searchPlaceholder="Tìm kiếm nội dung bài viết..."
          filters={
            <Stack direction="row" spacing={2}>
              <TextField
                select
                size="small"
                label="Trạng thái"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ minWidth: 160 }}
              >
                {FORUM_STATUS_FILTER_OPTIONS.map((opt) => (
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
          columns={columns}
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
            { id: 'reason', label: 'Lý do' },
            { id: 'description', label: 'Chi tiết', render: (v) => truncateText(v, 40) },
            { id: 'status', label: 'Trạng thái', render: (v) => <AdminStatusChip status={v} category="forum" label={v} /> },
            {
              id: 'actions',
              label: '',
              align: 'right',
              render: (_, r) => (
                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                  <Tooltip title="Ẩn bài viết">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={async () => {
                        const ok = await reviewReport(r.id, { decision: 'APPROVED', action: 'HIDE_POST', adminUserId });
                        if (ok) await updatePostVisibility(r.postId, true, adminUserId);
                      }}
                    >
                      <VisibilityOffOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Chặn bài">
                    <IconButton size="small" color="warning" onClick={() => reviewReport(r.id, { decision: 'APPROVED', action: 'BAN_POST', adminUserId })}>
                      <BlockOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Từ chối">
                    <IconButton size="small" onClick={() => reviewReport(r.id, { decision: 'REJECTED', action: 'WARN', adminUserId })}>
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
            {forumModerationLabel(st)}
          </MenuItem>
        ))}
      </Menu>

      {/* Dialogs */}
      <AdminForumPostDetailDialog
        open={Boolean(forumDetailPost)}
        post={forumDetailPost}
        statusLabel={forumDetailPost ? forumModerationLabel(forumDetailPost.moderationStatus) : ''}
        onClose={() => setForumDetailPost(null)}
        onBan={handleBan}
        onUnban={handleUnban}
      />

      <AdminConfirmDeleteDialog
        open={Boolean(forumDeletePost)}
        title="Xóa bài viết"
        description={forumDeletePost ? `Bạn có chắc chắn muốn xóa bài viết #${forumDeletePost.id}?` : ''}
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
