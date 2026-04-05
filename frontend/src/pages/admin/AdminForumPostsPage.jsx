import { useState } from 'react';
import { useSnackbar } from 'notistack';
import {
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AdminSectionPanel from '../../components/admin/AdminSectionPanel';
import AdminForumPostDetailDialog from '../../components/admin/AdminForumPostDetailDialog';
import AdminConfirmDeleteDialog from '../../components/admin/AdminConfirmDeleteDialog';
import { FORUM_STATUS_FILTER_OPTIONS } from '../../constants/adminDefaultForumPosts';
import { useAdminForumContext } from '../../contexts/AdminForumContext';

const FORUM_STATUS_MENU_ORDER = ['PENDING', 'FLAGGED', 'APPROVED', 'REJECTED'];

const forumModerationLabel = (status) => {
  const key = String(status || '').toUpperCase();
  const map = {
    PENDING: 'Pending',
    FLAGGED: 'Flagged',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
  };
  return map[key] || key || '-';
};

const forumModerationChipColor = (status) => {
  const key = String(status || '').toUpperCase();
  if (key === 'APPROVED') {
    return 'success';
  }
  if (key === 'REJECTED') {
    return 'default';
  }
  if (key === 'FLAGGED') {
    return 'error';
  }
  if (key === 'PENDING') {
    return 'warning';
  }
  return 'default';
};

const truncateText = (text, maxLen = 72) => {
  if (text == null || text === '') {
    return '-';
  }
  const s = String(text);
  if (s.length <= maxLen) {
    return s;
  }
  return `${s.slice(0, maxLen)}…`;
};

const formatDate = (value) => {
  if (!value) {
    return '-';
  }
  try {
    return new Date(value).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(value);
  }
};

const AdminForumPostsPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const {
    posts,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    updatePostStatus,
    deletePost,
  } = useAdminForumContext();

  const [forumDetailPost, setForumDetailPost] = useState(null);
  const [forumDeletePost, setForumDeletePost] = useState(null);
  const [forumStatusMenu, setForumStatusMenu] = useState(null);

  return (
    <>
      <AdminSectionPanel
        title="Forum posts moderation"
        subtitle="Review posts, change moderation status, open row for full content (design §3.1)."
      >
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
              <TableCell>Flags</TableCell>
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
                    <TableCell>{formatDate(post.postedAt)}</TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
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
                    onClick={() => {
                      updatePostStatus(forumStatusMenu.post.id, st);
                      enqueueSnackbar(`Status set to ${forumModerationLabel(st)}.`, { variant: 'success' });
                      setForumStatusMenu(null);
                    }}
                  >
                    {forumModerationLabel(st)}
                  </MenuItem>
                );
              })
            : null}
        </Menu>
      </AdminSectionPanel>

      <AdminForumPostDetailDialog
        open={Boolean(forumDetailPost)}
        post={forumDetailPost}
        statusLabel={forumDetailPost ? forumModerationLabel(forumDetailPost.moderationStatus) : ''}
        statusColor={forumDetailPost ? forumModerationChipColor(forumDetailPost.moderationStatus) : 'default'}
        onClose={() => setForumDetailPost(null)}
      />

      <AdminConfirmDeleteDialog
        open={Boolean(forumDeletePost)}
        title="Delete post"
        description={
          forumDeletePost
            ? `Remove post #${forumDeletePost.id} (“${forumDeletePost.topicTitle || 'Untitled'}”)? Demo: local state only.`
            : ''
        }
        onClose={() => setForumDeletePost(null)}
        onConfirm={() => {
          if (forumDeletePost) {
            deletePost(forumDeletePost.id);
            enqueueSnackbar('Post deleted.', { variant: 'success' });
            if (forumDetailPost?.id === forumDeletePost.id) {
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
