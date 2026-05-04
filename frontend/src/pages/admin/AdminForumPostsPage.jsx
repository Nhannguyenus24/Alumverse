import { useState } from 'react';
import { useSnackbar } from 'notistack';
import {
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import AdminSectionPanel from '../../components/admin/AdminSectionPanel';
import AdminForumPostDetailDialog from '../../components/admin/AdminForumPostDetailDialog';
import AdminConfirmDeleteDialog from '../../components/admin/AdminConfirmDeleteDialog';
import { FORUM_STATUS_FILTER_OPTIONS } from '../../constants/adminDefaultForumPosts';
import { useAdminForumContext } from '../../contexts/AdminForumContext';
import { useAuth } from '../../hooks/useAuth';
import { formatDateTime } from '../../utils/dateFormatter';
import { forumModerationLabel, truncateText } from '../../utils/stringUtils';

const FORUM_STATUS_MENU_ORDER = ['PENDING', 'FLAGGED', 'APPROVED', 'REJECTED'];

const forumModerationChipColor = (status) => {
  const key = String(status || '').toUpperCase();
  if (key === 'APPROVED') return 'success';
  if (key === 'REJECTED') return 'default';
  if (key === 'FLAGGED') return 'error';
  if (key === 'PENDING') return 'warning';
  return 'default';
};

/* ─── Reusable posts table ─── */
const PostsTable = ({
  rows,
  onRowClick,
  onDeleteClick,
  onBanClick,
  onUnbanClick,
  showBanActions = false,
  emptyMessage = 'No posts match your filters.',
}) => (
  <Table size="small">
    <TableHead>
      <TableRow>
        <TableCell>ID</TableCell>
        <TableCell>Author</TableCell>
        <TableCell>Topic</TableCell>
        <TableCell sx={{ maxWidth: 280 }}>Content preview</TableCell>
        <TableCell>Banned</TableCell>
        <TableCell>Reply to</TableCell>
        <TableCell>Created</TableCell>
        <TableCell>Updated</TableCell>
        <TableCell align="right">Actions</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {rows.length === 0 ? (
        <TableRow>
          <TableCell colSpan={9}>
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              {emptyMessage}
            </Typography>
          </TableCell>
        </TableRow>
      ) : (
        rows.map((post) => {
          const isBanned = post.isBanned === true || post.isBanned === 'true';
          return (
            <TableRow key={post.id} hover onClick={() => onRowClick?.(post)} sx={{ cursor: 'pointer' }}>
              <TableCell>{post.id}</TableCell>
              <TableCell>{post.authorName || post.createdByMemberId || '-'}</TableCell>
              <TableCell sx={{ maxWidth: 200 }}>{post.topicTitle || post.topicId || '-'}</TableCell>
              <TableCell sx={{ maxWidth: 280 }}>{truncateText(post.content)}</TableCell>
              <TableCell>
                {isBanned ? (
                  <Chip label="Banned" color="error" size="small" variant="filled" />
                ) : (
                  <Chip label="Active" color="success" size="small" variant="outlined" />
                )}
              </TableCell>
              <TableCell>{post.answerToPostId ? `#${post.answerToPostId}` : '-'}</TableCell>
              <TableCell>{formatDateTime(post.postedAt || post.createdAt)}</TableCell>
              <TableCell>{formatDateTime(post.updatedAt)}</TableCell>
              <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                  {showBanActions && (
                    isBanned ? (
                      <Tooltip title="Unban post">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => onUnbanClick?.(post)}
                          aria-label="Unban post"
                        >
                          <CheckCircleOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Ban post">
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => onBanClick?.(post)}
                          aria-label="Ban post"
                        >
                          <BlockOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )
                  )}
                  <Tooltip title="Delete post">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onDeleteClick?.(post)}
                      aria-label="Delete post"
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          );
        })
      )}
    </TableBody>
  </Table>
);

/* ─── Main page ─── */
const AdminForumPostsPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const {
    posts,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    updatePostStatus,
    // API-driven data
    bannedPosts,
    bannedPage,
    setBannedPage,
    yesterdayPosts,
    yesterdayPage,
    setYesterdayPage,
    banPost: banPostApi,
    unbanPost: unbanPostApi,
    deletePostApi,
    reports,
    reportsPage,
    setReportsPage,
    reviewReport,
    updatePostVisibility,
  } = useAdminForumContext();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState(0);
  const [forumDetailPost, setForumDetailPost] = useState(null);
  const [forumDeletePost, setForumDeletePost] = useState(null);
  const [forumStatusMenu, setForumStatusMenu] = useState(null);
  const [reportActionLoading, setReportActionLoading] = useState(false);

  const bannedContent = bannedPosts?.content ?? [];
  const yesterdayContent = yesterdayPosts?.content ?? [];
  const reportContent = reports?.content ?? [];
  const adminUserId = Number(user?.id);

  const handleBan = async (post) => {
    if (banPostApi) {
      const ok = await banPostApi(post.id);
      enqueueSnackbar(ok ? 'Post banned.' : 'Failed to ban post.', { variant: ok ? 'success' : 'error' });
    }
  };

  const handleUnban = async (post) => {
    if (unbanPostApi) {
      const ok = await unbanPostApi(post.id);
      enqueueSnackbar(ok ? 'Post unbanned.' : 'Failed to unban post.', { variant: ok ? 'success' : 'error' });
    }
  };

  const handleDeleteApi = async (post) => {
    if (deletePostApi) {
      const ok = await deletePostApi(post.id);
      enqueueSnackbar(ok ? 'Post deleted.' : 'Failed to delete post.', { variant: ok ? 'success' : 'error' });
    }
  };

  return (
    <>
      <AdminSectionPanel
        title="Forum posts moderation"
        subtitle="All posts lists yesterday’s new posts plus banned posts from the API. Other tabs are paginated from the server."
      >
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All posts" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab
            label={`Banned (${bannedPosts?.totalElements ?? 0})`}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
          <Tab
            label={`New yesterday (${yesterdayPosts?.totalElements ?? 0})`}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
          <Tab
            label={`Reports (${reports?.totalElements ?? 0})`}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
        </Tabs>

        {/* ─── Tab 0: All posts (local) ─── */}
        {activeTab === 0 && (
          <>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                flexWrap: 'wrap',
                gap: 2,
                mb: 2,
                alignItems: { xs: 'stretch', md: 'center' },
                justifyContent: 'space-between',
              }}
            >
              <TextField
                size="small"
                label="Search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Content, author, topic…"
                sx={{ flex: '1 1 220px', minWidth: 200, maxWidth: { md: '100%' } }}
              />
              <TextField
                select
                size="small"
                label="Status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                sx={{ minWidth: 200 }}
              >
                {FORUM_STATUS_FILTER_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Author</TableCell>
                  <TableCell>Topic</TableCell>
                  <TableCell sx={{ maxWidth: 280 }}>Content preview</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Reports</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {posts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        No posts match your filters.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  posts.map((post) => {
                    const mod = post.moderationStatus || 'PENDING';
                    const isRejected = mod === 'REJECTED';
                    return (
                      <TableRow
                        key={post.id}
                        hover
                        onClick={() => setForumDetailPost(post)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{post.id}</TableCell>
                        <TableCell>{post.authorName || '-'}</TableCell>
                        <TableCell sx={{ maxWidth: 200 }}>{post.topicTitle || '-'}</TableCell>
                        <TableCell sx={{ maxWidth: 280 }}>{truncateText(post.content)}</TableCell>
                        <TableCell>{post.categoryName || '-'}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Chip
                            variant="filled"
                            size="small"
                            color={isRejected ? 'default' : forumModerationChipColor(mod)}
                            label={
                              <Box
                                component="span"
                                sx={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 0.25,
                                  pr: 0.25,
                                }}
                              >
                                {forumModerationLabel(mod)}
                                <ArrowDropDownIcon sx={{ fontSize: 18, opacity: 0.9 }} />
                              </Box>
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              setForumStatusMenu({ anchorEl: e.currentTarget, post });
                            }}
                            sx={{
                              cursor: 'pointer',
                              fontWeight: 600,
                              maxWidth: '100%',
                              ...(isRejected && {
                                bgcolor: 'grey.700',
                                color: 'common.white',
                                '&:hover': { bgcolor: 'grey.800' },
                              }),
                            }}
                          />
                        </TableCell>
                        <TableCell>{post.flagsCount ?? 0}</TableCell>
                        <TableCell>{formatDateTime(post.postedAt)}</TableCell>
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                            <Tooltip title="Ban post">
                              <IconButton
                                size="small"
                                color="warning"
                                onClick={() => handleBan(post)}
                                aria-label="Ban post"
                              >
                                <BlockOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete post">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setForumDeletePost(post)}
                                aria-label="Delete post"
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            <Menu
              anchorEl={forumStatusMenu?.anchorEl}
              open={Boolean(forumStatusMenu)}
              onClose={() => setForumStatusMenu(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              disableScrollLock
              slotProps={{ paper: { sx: { minWidth: 200 } } }}
            >
              {forumStatusMenu
                ? FORUM_STATUS_MENU_ORDER.map((st) => {
                    const active = (forumStatusMenu.post.moderationStatus || 'PENDING') === st;
                    return (
                      <MenuItem
                        key={st}
                        selected={active}
                        onClick={async () => {
                          try {
                            await updatePostStatus(forumStatusMenu.post.id, st);
                          } finally {
                            setForumStatusMenu(null);
                          }
                        }}
                      >
                        {forumModerationLabel(st)}
                      </MenuItem>
                    );
                  })
                : null}
            </Menu>
          </>
        )}

        {/* ─── Tab 1: Banned posts (API) ─── */}
        {activeTab === 1 && (
          <>
            <PostsTable
              rows={bannedContent}
              onRowClick={setForumDetailPost}
              onDeleteClick={(p) => handleDeleteApi(p)}
              onUnbanClick={(p) => handleUnban(p)}
              showBanActions
              emptyMessage="No banned posts."
            />
            <TablePagination
              component="div"
              count={bannedPosts?.totalElements ?? 0}
              page={bannedPage ?? 0}
              rowsPerPage={bannedPosts?.size ?? 10}
              onPageChange={(_, p) => setBannedPage?.(p)}
              rowsPerPageOptions={[10]}
            />
          </>
        )}

        {/* ─── Tab 2: Yesterday posts (API) ─── */}
        {activeTab === 2 && (
          <>
            <PostsTable
              rows={yesterdayContent}
              onRowClick={setForumDetailPost}
              onDeleteClick={(p) => handleDeleteApi(p)}
              onBanClick={(p) => handleBan(p)}
              showBanActions
              emptyMessage="No new posts from yesterday."
            />
            <TablePagination
              component="div"
              count={yesterdayPosts?.totalElements ?? 0}
              page={yesterdayPage ?? 0}
              rowsPerPage={yesterdayPosts?.size ?? 10}
              onPageChange={(_, p) => setYesterdayPage?.(p)}
              rowsPerPageOptions={[10]}
            />
          </>
        )}

        {activeTab === 3 && (
          <>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Report ID</TableCell>
                  <TableCell>Post ID</TableCell>
                  <TableCell>Reporter</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell sx={{ maxWidth: 280 }}>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportContent.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        No pending reports.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  reportContent.map((report) => (
                    <TableRow key={report.id} hover>
                      <TableCell>{report.id}</TableCell>
                      <TableCell>#{report.postId}</TableCell>
                      <TableCell>{report.reporterMemberId ?? '-'}</TableCell>
                      <TableCell>{report.reason || '-'}</TableCell>
                      <TableCell sx={{ maxWidth: 280 }}>{truncateText(report.description || '-')}</TableCell>
                      <TableCell>
                        <Chip label={report.status || 'PENDING'} size="small" color="warning" />
                      </TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          <Tooltip title="Hide post">
                            <span>
                              <IconButton
                                size="small"
                                color="primary"
                                disabled={reportActionLoading || !adminUserId}
                                aria-label="Hide post from report"
                                onClick={async () => {
                                  setReportActionLoading(true);
                                  const ok = await reviewReport?.(report.id, {
                                    decision: 'APPROVED',
                                    action: 'HIDE_POST',
                                    reviewNote: 'Hidden from moderation queue',
                                    adminUserId,
                                  });
                                  if (ok) {
                                    await updatePostVisibility?.(report.postId, true, adminUserId);
                                  }
                                  enqueueSnackbar(ok ? 'Report approved and post hidden.' : 'Failed to process report.', {
                                    variant: ok ? 'success' : 'error',
                                  });
                                  setReportActionLoading(false);
                                }}
                              >
                                <VisibilityOffOutlinedIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Ban post">
                            <span>
                              <IconButton
                                size="small"
                                color="warning"
                                disabled={reportActionLoading || !adminUserId}
                                aria-label="Ban post from report"
                                onClick={async () => {
                                  setReportActionLoading(true);
                                  const ok = await reviewReport?.(report.id, {
                                    decision: 'APPROVED',
                                    action: 'BAN_POST',
                                    reviewNote: 'Banned by moderator',
                                    adminUserId,
                                  });
                                  enqueueSnackbar(ok ? 'Report approved and post banned.' : 'Failed to ban post.', {
                                    variant: ok ? 'success' : 'error',
                                  });
                                  setReportActionLoading(false);
                                }}
                              >
                                <BlockOutlinedIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Warn only">
                            <span>
                              <IconButton
                                size="small"
                                color="info"
                                disabled={reportActionLoading || !adminUserId}
                                aria-label="Mark report as warning"
                                onClick={async () => {
                                  setReportActionLoading(true);
                                  const ok = await reviewReport?.(report.id, {
                                    decision: 'APPROVED',
                                    action: 'WARN',
                                    reviewNote: 'Warning action only',
                                    adminUserId,
                                  });
                                  enqueueSnackbar(ok ? 'Report marked as warning.' : 'Failed to warn.', {
                                    variant: ok ? 'success' : 'error',
                                  });
                                  setReportActionLoading(false);
                                }}
                              >
                                <WarningAmberOutlinedIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Reject report">
                            <span>
                              <IconButton
                                size="small"
                                color="inherit"
                                disabled={reportActionLoading || !adminUserId}
                                aria-label="Reject report"
                                onClick={async () => {
                                  setReportActionLoading(true);
                                  const ok = await reviewReport?.(report.id, {
                                    decision: 'REJECTED',
                                    action: 'WARN',
                                    reviewNote: 'Rejected report',
                                    adminUserId,
                                  });
                                  enqueueSnackbar(ok ? 'Report rejected.' : 'Failed to reject report.', {
                                    variant: ok ? 'success' : 'error',
                                  });
                                  setReportActionLoading(false);
                                }}
                              >
                                <CancelOutlinedIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={reports?.totalElements ?? 0}
              page={reportsPage ?? 0}
              rowsPerPage={reports?.size ?? 10}
              onPageChange={(_, p) => setReportsPage?.(p)}
              rowsPerPageOptions={[10]}
            />
          </>
        )}
      </AdminSectionPanel>

      <AdminForumPostDetailDialog
        open={Boolean(forumDetailPost)}
        post={forumDetailPost}
        statusLabel={forumDetailPost ? forumModerationLabel(forumDetailPost.moderationStatus) : ''}
        statusColor={forumDetailPost ? forumModerationChipColor(forumDetailPost.moderationStatus) : 'default'}
        onClose={() => setForumDetailPost(null)}
        onBan={async (id) => {
          if (banPostApi) {
            const ok = await banPostApi(id);
            enqueueSnackbar(ok ? 'Post banned.' : 'Ban failed.', { variant: ok ? 'success' : 'error' });
            if (ok) setForumDetailPost(null);
          }
        }}
        onUnban={async (id) => {
          if (unbanPostApi) {
            const ok = await unbanPostApi(id);
            enqueueSnackbar(ok ? 'Post unbanned.' : 'Unban failed.', { variant: ok ? 'success' : 'error' });
            if (ok) setForumDetailPost(null);
          }
        }}
      />

      <AdminConfirmDeleteDialog
        open={Boolean(forumDeletePost)}
        title="Delete post"
        description={
          forumDeletePost
            ? `Remove post #${forumDeletePost.id} ("${forumDeletePost.topicTitle || 'Untitled'}")? This action calls the backend API.`
            : ''
        }
        onClose={() => setForumDeletePost(null)}
        onConfirm={async () => {
          if (forumDeletePost) {
            const ok = await deletePostApi(forumDeletePost.id);
            enqueueSnackbar(ok ? 'Post deleted.' : 'Failed to delete post.', { variant: ok ? 'success' : 'error' });
            if (ok && forumDetailPost?.id === forumDeletePost.id) {
              setForumDetailPost(null);
            }
          }
          setForumDeletePost(null);
        }}
      />
    </>
  );
};

export default AdminForumPostsPage;
