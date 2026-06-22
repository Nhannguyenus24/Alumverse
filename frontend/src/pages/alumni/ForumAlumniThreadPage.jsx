import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router';
import { Box, Button, Container, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Menu, MenuItem, Pagination, Stack, TextField, Tooltip, Typography } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ReplyOutlinedIcon from '@mui/icons-material/ReplyOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import Page from '../../components/Page';
import { useAuth } from '../../hooks/useAuth';
import Breadcrumb from '../../components/Breadcrumb';
import { useForumCategories } from '../../hooks/forum/useForumCategories';
import { useForumPosts } from '../../hooks/forum/useForumPosts';
import { useCreateForumPost } from '../../hooks/forum/useCreateForumPost';
import { useAnswerToForumPost } from '../../hooks/forum/useAnswerToForumPost';
import { useUpdateForumPost } from '../../hooks/forum/useUpdateForumPost';
import ForumFilterPanel from '../../components/forum/ForumFilterPanel';
import ForumSponsoredCard from '../../components/forum/ForumSponsoredCard';
import { useForumPostReactionCount } from '../../hooks/forum/useForumPostReactionCount';
import { useForumPostUserReaction } from '../../hooks/forum/useForumPostUserReaction';
import { useReactToForumPost } from '../../hooks/forum/useReactToForumPost';
import { useDeleteForumPost } from '../../hooks/forum/useDeleteForumPost';
import { useDeleteForumTopic } from '../../hooks/forum/useDeleteForumTopic';
import { useUpdateForumTopic } from '../../hooks/forum/useUpdateForumTopic';
import { useSubscribeToTopic } from '../../hooks/forum/useSubscribeToTopic';
import { useForumTopicSubscriptionStatus } from '../../hooks/forum/useForumTopicSubscriptionStatus';
import { useReportForumPost } from '../../hooks/forum/useReportForumPost';
import { useNotification } from '../../hooks/useNotification';
import { useOrganization } from '../../hooks/useOrganization';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import EditPostDialog from '../../components/forum/EditPostDialog';
import ConfirmDialog from '../../components/ConfirmDialog';
import WYSIWYG from '../../components/WYSIWYG';
import { formatDateTime } from '../../utils/dateFormatter';
import { toPlainText } from '../../utils/stringUtils';
import ReportPostDialog from '../../components/forum/ReportPostDialog';

const ForumReply = ({ reply, isAdmin, memberId, isGuest, onReply, parentPost, onDelete, isDeleting, onEdit, onReport }) => {
  const { showError, showSuccess } = useNotification();
  const reactErrShownRef = useRef(false);
  const [actionAnchorEl, setActionAnchorEl] = useState(null);
  const { likes, isPending: likesPending, isError: likesError } = useForumPostReactionCount(reply.id);
  const { hasReaction } = useForumPostUserReaction(reply.id, memberId);
  const {
    toggleReaction,
    isPending: reactPending,
    isError: reactIsError,
    errorMessage: reactErrorMessage,
  } = useReactToForumPost(reply.id, memberId);

  useEffect(() => {
    if (reactIsError) {
      if (!reactErrShownRef.current) {
        showError(reactErrorMessage ?? 'Không thể cập nhật cảm xúc.');
        reactErrShownRef.current = true;
      }
    } else {
      reactErrShownRef.current = false;
    }
  }, [reactIsError, reactErrorMessage, showError]);

  const isOwn = reply.authorMemberId === memberId;

  const isLiked = !!hasReaction;
  const likesDisplay = likesPending
    ? '...'
    : likesError
    ? '—'
    : likes;

  const hasParent = !!parentPost;
  const isActionMenuOpen = Boolean(actionAnchorEl);

  const handleOpenActionMenu = (event) => {
    setActionAnchorEl(event.currentTarget);
  };

  const handleCloseActionMenu = () => {
    setActionAnchorEl(null);
  };

  const canDelete = isAdmin || isOwn;
  const canEdit = !isAdmin && isOwn;

  return (
    <Box
      sx={{
        px: { xs: 1.5, sm: 2, md: 3 },
        py: { xs: 2, md: 2.5 },
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'center', sm: 'flex-start' },
        gap: 2,
        borderTop: 1,
        borderColor: 'divider',
        ...(hasParent ? { bgcolor: 'grey.50' } : null),
      }}
    >
      <Box
        sx={{
          width: { xs: 'auto', sm: 110 },
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Box
          sx={{
            width: { xs: 48, sm: 64 },
            height: { xs: 48, sm: 64 },
            borderRadius: '50%',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PersonIcon sx={{ fontSize: 36 }} />
        </Box>
        <Typography variant="body2" fontWeight={600}>
          {reply.authorName}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {reply.role}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            mb: 1,
            gap: 1.5,
            width: '100%',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {reply.createdAt}
          </Typography>
          <>
            <IconButton size="small" onClick={handleOpenActionMenu}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
            <Menu
              anchorEl={actionAnchorEl}
              open={isActionMenuOpen}
              onClose={handleCloseActionMenu}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <Tooltip title={isGuest ? "Vui lòng xác thực tài khoản để thực hiện chức năng này" : ""} placement="left" arrow>
                <span>
                  <MenuItem
                    disabled={isGuest}
                    onClick={() => {
                      handleCloseActionMenu();
                      onReply?.(reply);
                    }}
                  >
                    <ReplyOutlinedIcon sx={{ fontSize: 18, mr: 1 }} />
                    Trả lời
                  </MenuItem>
                </span>
              </Tooltip>
          {canEdit && (
                <MenuItem
                  onClick={() => {
                    handleCloseActionMenu();
                    onEdit?.(reply);
                  }}
                >
                  <EditOutlinedIcon sx={{ fontSize: 18, mr: 1 }} />
                  Sửa
                </MenuItem>
              )}
              {canDelete && (
                <MenuItem
                  onClick={() => {
                    handleCloseActionMenu();
                    onDelete?.(reply);
                  }}
                  disabled={isDeleting}
                  sx={{ color: 'error.main' }}
                >
                  <DeleteOutlineOutlinedIcon sx={{ fontSize: 18, mr: 1 }} />
                  Xóa
                </MenuItem>
              )}
              {!isOwn && (
                <MenuItem
                  onClick={() => {
                    handleCloseActionMenu();
                    onReport?.(reply);
                  }}
                  sx={{ color: 'warning.main' }}
                >
                  <FlagOutlinedIcon sx={{ fontSize: 18, mr: 1 }} />
                  Báo cáo
                </MenuItem>
              )}
            </Menu>
          </>
        </Box>
        <Box
          className="ql-editor"
          sx={{
            mb: 1.5,
            px: 0,
            py: 0,
            lineHeight: 1.7,
            '& p': { my: 0.75 },
          }}
          dangerouslySetInnerHTML={{ __html: reply.content || '' }}
        />
        {hasParent ? (
          <Box
            sx={{
              mb: 1.5,
              px: 1.25,
              py: 1,
              borderLeft: 3,
              borderLeftColor: 'primary.main',
              bgcolor: 'common.white',
              border: 1,
              borderColor: 'divider',
              maxWidth: '100%',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Trả lời {parentPost.authorName ?? `bài viết #${parentPost.id}`}
            </Typography>
            <Typography
              variant="body2"
              color="text.primary"
              sx={{
                mt: 0.25,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {toPlainText(parentPost.content) || '—'}
            </Typography>
          </Box>
        ) : null}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="text"
              onClick={() => toggleReaction()}
              disabled={reactPending || !memberId}
              sx={{
                minWidth: 0,
                p: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                color: isLiked ? 'error.main' : 'text.secondary',
              }}
            >
              {isLiked ? (
                <FavoriteIcon
                  sx={{
                    fontSize: 18,
                    color: 'error.main',
                  }}
                />
              ) : (
                <FavoriteBorderIcon
                  sx={{
                    fontSize: 18,
                  }}
                />
              )}
              <Typography variant="caption">
                {likesDisplay}
              </Typography>
            </Button>
            <Button
              size="small"
              variant="text"
              onClick={() => {
                const url = window.location.href;
                navigator.clipboard.writeText(url).then(() => {
                  showSuccess('Đã sao chép liên kết');
                });
              }}
              sx={{ minWidth: 0, p: 0, color: 'text.secondary', textTransform: 'none' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ReplyOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  Chia sẻ
                </Typography>
              </Box>
            </Button>
          </Box>
          <Box />
        </Box>
      </Box>
    </Box>
  );
};

const FALLBACK_THREAD = {
  title: 'Chủ đề',
  authorName: '—',
  role: 'Alumni',
  createdAt: '—',
};

const ForumAlumniThreadPage = () => {
  const location = useLocation();
  const navigate = useOrgNavigate();
  const { threadId, pageId } = useParams();
  const topicId = useMemo(() => {
    const id = parseInt(threadId, 10);
    return Number.isNaN(id) ? null : id;
  }, [threadId]);

  const { isAuthenticated, user } = useAuth();
  const { organization } = useOrganization();
  const isAdmin = user?.role === 'ADMIN';
  const isGuest = !isAuthenticated || user?.role === 'GUEST';
  const [editorValue, setEditorValue] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const editorRef = useRef(null);
  const [isEditTopicOpen, setIsEditTopicOpen] = useState(false);
  const [editTopicTitle, setEditTopicTitle] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [threadTitleOverride, setThreadTitleOverride] = useState('');
  const [isEditPostOpen, setIsEditPostOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [postToReport, setPostToReport] = useState(null);
  const [currentPage, setCurrentPage] = useState(() => {
    const p = parseInt(pageId, 10);
    return !isNaN(p) && p > 0 ? p - 1 : 0;
  });

  const organizationId = organization?.id ?? null;
  const { categories } = useForumCategories(organizationId);
  const selectedFilterIdFromState = location.state?.selectedFilterId ?? 'all';
  const openingPostErrorFromState =
    typeof location.state?.openingPostError === 'string'
      ? location.state.openingPostError.trim()
      : '';

  const memberId = user?.id ?? null;
  const { posts, pageInfo, isPending: postsPending, isError: postsError } = useForumPosts(topicId, memberId, currentPage, 10);
  const { createPost, isPending: createPending } = useCreateForumPost();
  const { answerToPost, isPending: answerPending } = useAnswerToForumPost();
  const {
    deletePost,
    isPending: deletePending,
    errorMessage: deleteErrorMessage,
  } = useDeleteForumPost();
  const {
    updatePost,
    isPending: updatePostPending,
    isError: updatePostIsError,
    errorMessage: updatePostErrorMessage,
  } = useUpdateForumPost();
  const {
    deleteTopic,
    isPending: deleteTopicPending,
    errorMessage: deleteTopicErrorMessage,
  } = useDeleteForumTopic();
  const {
    updateTopic,
    isPending: updateTopicPending,
    errorMessage: updateTopicErrorMessage,
  } = useUpdateForumTopic();
  const { isSubscribed, isPending: subStatusPending } = useForumTopicSubscriptionStatus(topicId, memberId);
  const { toggleSubscription, isPending: subTogglePending } = useSubscribeToTopic();
  const { reportPost, isPending: reportPending } = useReportForumPost();
  const { showSuccess, showError, showWarning } = useNotification();
  const hasShownPostsErrorRef = useRef(false);
  const hasShownOpeningErrorRef = useRef(false);

  useEffect(() => {
    const p = parseInt(pageId, 10);
    if (!isNaN(p) && p > 0) {
      setCurrentPage(p - 1);
    } else {
      setCurrentPage(0);
    }
  }, [pageId]);

  useEffect(() => {
    if (!pageInfo?.totalPage || pageInfo.totalPage <= 0) return;
    if (currentPage >= pageInfo.totalPage) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentPage(pageInfo.totalPage - 1);
    }
  }, [currentPage, pageInfo?.totalPage]);

  const stripHtml = useCallback((value) => {
    return toPlainText(value);
  }, []);

  const thread = useMemo(() => {
    const topicSummary = location.state?.topicSummary;
    const titleFromSummary =
      typeof topicSummary?.title === 'string' && topicSummary.title.trim() ? topicSummary.title.trim() : null;
    const topicTitleFromState = location.state?.topicTitle;
    const titleFromLegacy =
      typeof topicTitleFromState === 'string' && topicTitleFromState.trim() ? topicTitleFromState.trim() : null;
    const title = threadTitleOverride || titleFromSummary || titleFromLegacy || FALLBACK_THREAD.title;

    const firstPost = posts?.[0] ?? null;

    const authorFromPost = firstPost?.authorMemberId
      ? (String(firstPost.authorMemberId) === String(user?.id) ? 'Tôi' : `Thành viên #${firstPost.authorMemberId}`)
      : null;
    const authorFromTopic =
      topicSummary?.createdByMemberId != null
        ? (String(topicSummary.createdByMemberId) === String(user?.id) ? 'Tôi' : `Thành viên #${topicSummary.createdByMemberId}`)
        : null;

    const createdFromPost = firstPost?.createdAt ? formatDateTime(firstPost.createdAt, '—') : null;
    const createdFromTopic = topicSummary?.createdAt ? formatDateTime(topicSummary.createdAt, '—') : null;

    return {
      title,
      authorName: authorFromPost ?? authorFromTopic ?? FALLBACK_THREAD.authorName,
      role: 'Alumni',
      createdAt: createdFromPost ?? createdFromTopic ?? FALLBACK_THREAD.createdAt,
    };
  }, [location.state?.topicTitle, location.state?.topicSummary, posts, threadTitleOverride, user?.id]);

  const replies = useMemo(
    () =>
      (posts ?? []).map((post) => {
        const isOwn = post.authorMemberId != null && String(post.authorMemberId) === String(user?.id);
        return {
          id: post.id,
          answerToPostId: post.answerToPostId ?? null,
          authorMemberId: post.authorMemberId ?? null,
          authorName: isOwn ? 'Tôi' : `Thành viên #${post.authorMemberId ?? '—'}`,
          role: 'Alumni',
          createdAt: formatDateTime(post.createdAt, '—'),
          content: post.content ?? '',
        };
      }),
    [posts, user?.id]
  );

  const replyMap = useMemo(() => {
    const m = new Map();
    for (const r of replies) m.set(r.id, r);
    return m;
  }, [replies]);

  const handleReply = useCallback((reply) => {
    if (!reply?.id) return;
    setReplyTo({
      postId: reply.id,
      authorName: reply.authorName ?? '',
      content: reply.content ?? '',
    });

    window.setTimeout(() => {
      editorRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
      const input = editorRef.current?.querySelector?.('textarea');
      input?.focus?.();
    }, 0);
  }, []);

  const handleCancelReply = useCallback(() => setReplyTo(null), []);
  
  const handleDeletePost = useCallback((reply) => {
    if (!reply?.id) return;
    setPostToDelete(reply);
    setIsConfirmDeleteOpen(true);
  }, []);

  const handleConfirmDeletePost = async () => {
      if (!postToDelete?.id) return;
      try {
        await deletePost(postToDelete.id);
        if (replyTo?.postId === postToDelete.id) {
          setReplyTo(null);
        }
        setIsConfirmDeleteOpen(false);
        setPostToDelete(null);
        showSuccess('Xóa bài viết thành công.');
      } catch (_) {
        const message =
          err?.response?.data?.message ??
          deleteErrorMessage ??
          err?.message ??
          'Không thể xóa bài viết.';
        showError(message);
      }
    };

  const handleCloseConfirmDelete = useCallback(() => {
    if (deletePending) return;
    setIsConfirmDeleteOpen(false);
    setPostToDelete(null);
  }, [deletePending]);

  const handleReportPost = useCallback((reply) => {
    if (!reply?.id) return;
    setPostToReport(reply);
    setIsReportOpen(true);
  }, []);

  const handleCloseReport = useCallback(() => {
    if (reportPending) return;
    setIsReportOpen(false);
    setPostToReport(null);
  }, [reportPending]);

  const handleConfirmReport = async ({ reason }) => {
    if (!postToReport?.id || !user?.id) return;
    try {
      await reportPost({
        id: postToReport.id,
        reporterMemberId: user.id,
        reason,
      });
      showSuccess('Gửi báo cáo thành công.');
      setIsReportOpen(false);
      setPostToReport(null);
    } catch (err) {
      showError(err?.response?.data?.message ?? err?.message ?? 'Không thể gửi báo cáo.');
    }
  };

  const handleEditPost = useCallback((reply) => {
    if (!reply?.id) return;
    setEditingPost(reply);
    setIsEditPostOpen(true);
  }, []);

  const handleCloseEditPost = useCallback(() => {
    if (updatePostPending) return;
    setIsEditPostOpen(false);
    setEditingPost(null);
  }, [updatePostPending]);

  const handleSaveEditPost = async (newContent) => {
      if (!editingPost?.id || !stripHtml(newContent)) return;
      try {
        await updatePost({
          postId: editingPost.id,
          payload: {
            content: newContent,
          },
        });
        setIsEditPostOpen(false);
        setEditingPost(null);
        showSuccess('Cập nhật bài viết thành công.');
      } catch (_) {
        const message =
          err?.response?.data?.message ??
          updatePostErrorMessage ??
          err?.message ??
          'Không thể cập nhật bài viết.';
        showError(message);
      }
    };

  const handleDeleteTopic = useCallback(async () => {
    if (!topicId) return;
    try {
      await deleteTopic(topicId);
      showSuccess('Xóa chủ đề thành công.');
      if (selectedFilterIdFromState?.startsWith?.('category-')) {
        navigate('/forum', { state: { selectedFilterId: selectedFilterIdFromState } });
        return;
      }
      if (selectedFilterIdFromState === 'alumni') {
        navigate('/forum/alumni/career');
        return;
      }
      navigate('/forum');
    } catch (_) {
      const message =
        err?.response?.data?.message ??
        deleteTopicErrorMessage ??
        err?.message ??
        'Không thể xóa chủ đề.';
      showError(message);
    }
  }, [deleteTopic, deleteTopicErrorMessage, navigate, selectedFilterIdFromState, showError, showSuccess, topicId]);

  const handleOpenEditTopic = useCallback(() => {
    const topicSummary = location.state?.topicSummary;
    setEditTopicTitle((thread.title ?? '').trim());
    setEditCategoryId(String(topicSummary?.categoryId ?? categories?.[0]?.id ?? ''));
    setIsEditTopicOpen(true);
  }, [categories, location.state?.topicSummary, thread.title]);

  const handleCloseEditTopic = useCallback(() => {
    if (updateTopicPending) return;
    setIsEditTopicOpen(false);
  }, [updateTopicPending]);

  const handleSaveEditTopic = useCallback(async () => {
    const trimmedTitle = (editTopicTitle ?? '').trim();
    const parsedCategoryId = parseInt(editCategoryId, 10);
    if (!topicId || !trimmedTitle || Number.isNaN(parsedCategoryId) || parsedCategoryId <= 0) {
      showWarning('Vui lòng nhập tiêu đề và chọn chủ đề phụ hợp lệ.');
      return;
    }

    try {
      const updatedTopic = await updateTopic({
        topicId,
        payload: {
          title: trimmedTitle,
          categoryId: parsedCategoryId,
        },
      });
      setThreadTitleOverride(updatedTopic?.title ?? trimmedTitle);
      setIsEditTopicOpen(false);
      showSuccess('Cập nhật chủ đề thành công.');
    } catch (_) {
      const message =
        err?.response?.data?.message ??
        updateTopicErrorMessage ??
        err?.message ??
        'Không thể cập nhật chủ đề.';
      showError(message);
    }
  }, [editCategoryId, editTopicTitle, showError, showSuccess, showWarning, topicId, updateTopic, updateTopicErrorMessage]);

  const handleToggleSubscription = async () => {
    if (!topicId || isGuest) {
      showWarning('Vui lòng xác thực tài khoản để thực hiện chức năng này.');
      return;
    }
    try {
      await toggleSubscription({ topicId, memberId });
      showSuccess(isSubscribed ? 'Đã hủy theo dõi chủ đề.' : 'Đã theo dõi chủ đề.');
    } catch (_) {
      showError('Không thể thực hiện yêu cầu.');
    }
  };

  const filters = useMemo(() => {
    const parentCategories = (categories ?? []).filter((c) => c.parentId == null);
    return [
      { id: 'all', label: 'Tất cả' },
      ...parentCategories.map((c) => ({ id: `parent-${c.id}`, label: c.name })),
    ];
  }, [categories]);

  const handleSubmit = async () => {
    const plainContent = stripHtml(editorValue ?? '');
    if (!plainContent || !topicId || !user?.id) return;

    const payload = {
      topicId,
      authorMemberId: user.id,
      content: editorValue,
      answerToPostId: replyTo?.postId ?? null,
    };

    try {
      if (replyTo?.postId) {
        await answerToPost({ postId: replyTo.postId, payload });
        setReplyTo(null);
        showSuccess('Trả lời thành công.');
      } else {
        await createPost(payload);
        showSuccess('Đăng bài viết thành công.');
      }
      setEditorValue('');
      
      // Jump to the last page to see the new post
      if (pageInfo) {
        const newTotal = pageInfo.totalItem + 1;
        const newLastPage = Math.max(0, Math.ceil(newTotal / pageInfo.pageSize) - 1);
        if (currentPage !== newLastPage) {
          navigate(`/forum/alumni/career/${threadId}/page/${newLastPage + 1}`, { state: location.state });
        }
      }
    } catch (_) {
      const message =
        err?.response?.data?.message ??
        err?.message ??
        (replyTo?.postId ? 'Không thể gửi trả lời.' : 'Không thể đăng bài viết.');
      showError(message);
    }
  };

  useEffect(() => {
    if (postsError) {
      if (!hasShownPostsErrorRef.current) {
        showError('Không thể tải bài viết.');
        hasShownPostsErrorRef.current = true;
      }
      return;
    }
    hasShownPostsErrorRef.current = false;
  }, [postsError, showError]);

  useEffect(() => {
    if (openingPostErrorFromState) {
      if (!hasShownOpeningErrorRef.current) {
        showWarning(`Nội dung mở đầu chưa đăng được: ${openingPostErrorFromState}`);
        hasShownOpeningErrorRef.current = true;
      }
      return;
    }
    hasShownOpeningErrorRef.current = false;
  }, [openingPostErrorFromState, showWarning]);

  const handleFilterChange = useCallback(
    (id) => {
      if (id === 'all') {
        navigate('/forum');
        return;
      }
      if (typeof id === 'string' && id.startsWith('parent-')) {
        navigate('/forum', { state: { selectedFilterId: id } });
        return;
      }
    },
    [navigate]
  );

  const handlePaginationChange = useCallback((_, nextPage) => {
    setReplyTo(null);
    navigate(`/forum/alumni/career/${threadId}/page/${nextPage}`, { state: location.state });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [navigate, threadId, location.state]);

  const selectedFilterId = useMemo(() => {
    const allFilterIds = filters.map((f) => f.id);
    return allFilterIds.includes(selectedFilterIdFromState) ? selectedFilterIdFromState : 'all';
  }, [filters, selectedFilterIdFromState]);

  const activeCategory = useMemo(() => {
    const categoryId = location.state?.topicSummary?.categoryId;
    if (categoryId != null) {
      return categories?.find((c) => c.id === categoryId) ?? null;
    }
    return null;
  }, [categories, location.state?.topicSummary?.categoryId]);

  const parentCategory = useMemo(() => {
    if (!activeCategory?.parentId) return null;
    return categories?.find((c) => c.id === activeCategory.parentId) ?? null;
  }, [activeCategory, categories]);

  const breadcrumbItems = useMemo(() => {
    const items = [];
    if (parentCategory) {
      items.push({
        label: parentCategory.name,
        path: '/forum',
        state: { selectedFilterId: `parent-${parentCategory.id}` },
      });
    }
    if (activeCategory) {
      items.push({
        label: activeCategory.name,
        path: `/forum/category/${activeCategory.id}`,
        state: { selectedFilterId: activeCategory.parentId ? `parent-${activeCategory.parentId}` : `parent-${activeCategory.id}` },
      });
    }
    items.push({ label: thread.title });
    return items;
  }, [activeCategory, parentCategory, thread.title]);

  return (
    <Page
      title={`${thread.title}`}
      meta={<meta name="description" content="Chi tiết chủ đề Hướng nghiệp" />}
    >
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          pb: { xs: 4, md: 6 },
          overflowX: 'hidden',
        }}
      >
        <Container maxWidth="xl" sx={{ pt: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3, lg: 6 } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'flex-start',
              gap: { xs: 2, md: 3 },
            }}
          >
            <Stack spacing={2} sx={{ width: { xs: '100%', md: 260 }, flexShrink: 0 }}>
              <ForumFilterPanel
                filters={filters}
                selectedId={selectedFilterId}
                onChange={handleFilterChange}
              />
              <ForumSponsoredCard
                title="Sponsored"
                imageSrc="/forum/metro_station.png"
                imageAlt="HCMC Metro Opening"
                caption="HCMC Metro Opening"
              />
            </Stack>

            <Stack
              spacing={0}
              sx={{
                flex: 1,
                minWidth: 0,
                width: '100%',
                px: { xs: 1.5, sm: 2, md: 2.75 },
              }}
            >
              <Breadcrumb items={breadcrumbItems} uppercase color="primary" />
              <Box
                sx={{
                  backgroundColor: '#fff',
                  border: 1,
                  borderColor: 'divider',
                }}
              >
                {/* Header + main thread */}
                <Box
                  sx={{
                    px: { xs: 1.5, sm: 2, md: 3 },
                    py: { xs: 1.5, md: 2 },
                    borderBottom: 1,
                    borderColor: 'divider',
                  }}
                >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    justifyContent: 'space-between',
                    gap: 2,
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="h5"
                    component="h1"
                    fontWeight={800}
                    sx={{
                      fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' },
                      wordBreak: 'break-word',
                    }}
                  >
                    {thread.title}
                  </Typography>
                  {isAdmin ? (
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                        gap: 1,
                        width: '100%',
                        maxWidth: { xs: 300, sm: 360 },
                        minWidth: { xs: 240, sm: 320 },
                      }}
                    >
                      <Button
                        fullWidth
                        variant="contained"
                        size="small"
                        startIcon={<NotificationsNoneOutlinedIcon sx={{ fontSize: 18 }} />}
                        onClick={handleToggleSubscription}
                        disabled={subStatusPending || subTogglePending}
                        sx={{
                          bgcolor: isSubscribed ? 'primary.main' : '#374151',
                          color: 'white',
                          '&:hover': { bgcolor: isSubscribed ? 'primary.dark' : '#4B5563' },
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isSubscribed ? 'Đang theo dõi' : 'Theo dõi'}
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        size="small"
                        startIcon={<EditOutlinedIcon sx={{ fontSize: 18 }} />}
                        onClick={handleOpenEditTopic}
                        sx={{
                          borderColor: 'black',
                          color: 'black',
                          bgcolor: 'white',
                          '&:hover': { borderColor: 'black', bgcolor: 'grey.50' },
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Sửa
                      </Button>
                      <Tooltip title={isGuest ? "Vui lòng xác thực tài khoản để thực hiện chức năng này" : ""} arrow>
                        <span>
                          <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            size="small"
                            startIcon={<ReplyOutlinedIcon sx={{ fontSize: 18 }} />}
                            onClick={() => {
                              editorRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
                              const input = editorRef.current?.querySelector?.('textarea');
                              input?.focus?.();
                            }}
                            disabled={isGuest}
                            sx={{ whiteSpace: 'nowrap' }}
                          >
                            Trả lời
                          </Button>
                        </span>
                      </Tooltip>
                      <Button
                        fullWidth
                        variant="contained"
                        color="error"
                        size="small"
                        startIcon={<DeleteOutlineOutlinedIcon sx={{ fontSize: 18 }} />}
                        onClick={handleDeleteTopic}
                        disabled={deleteTopicPending}
                        sx={{ whiteSpace: 'nowrap' }}
                      >
                        {deleteTopicPending ? 'Đang xóa...' : 'Xóa'}
                      </Button>
                      <Button
                        fullWidth
                        variant="contained"
                        size="small"
                        startIcon={<LockOutlinedIcon sx={{ fontSize: 18 }} />}
                        sx={{
                          bgcolor: '#EAB308',
                          color: 'white',
                          '&:hover': { bgcolor: '#CA8A04' },
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Khóa
                      </Button>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1,
                        justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                      }}
                    >
                      <Button
                        variant={isSubscribed ? 'contained' : 'outlined'}
                        color="primary"
                        size="small"
                        startIcon={<NotificationsNoneOutlinedIcon sx={{ fontSize: 18 }} />}
                        onClick={handleToggleSubscription}
                        disabled={subStatusPending || subTogglePending}
                      >
                        {isSubscribed ? 'Đang theo dõi' : 'Theo dõi'}
                      </Button>
                      <Tooltip title={isGuest ? "Vui lòng xác thực tài khoản để thực hiện chức năng này" : ""} arrow>
                        <span>
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            startIcon={<ReplyOutlinedIcon sx={{ fontSize: 18 }} />}
                            onClick={() => {
                              editorRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
                              const input = editorRef.current?.querySelector?.('textarea');
                              input?.focus?.();
                            }}
                            disabled={isGuest}
                          >
                            Trả lời
                          </Button>
                        </span>
                      </Tooltip>
                    </Box>
                  )}
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 26 }} />
                  </Box>
                  <Box>
                    {postsPending && !location.state?.topicSummary ? (
                      <Typography variant="body2" color="text.secondary">
                        Đang tải thông tin chủ đề...
                      </Typography>
                    ) : (
                      <>
                        <Typography variant="body2" fontWeight={600}>
                          {thread.authorName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {thread.createdAt}
                        </Typography>
                      </>
                    )}
                  </Box>
                </Box>
              </Box>

              {/* Replies */}
              <Box>
                {postsPending ? (
                  <Box sx={{ px: { xs: 1.5, sm: 2, md: 3 }, py: 3 }}>
                    <Typography color="text.secondary">Đang tải bài viết...</Typography>
                  </Box>
                ) : postsError ? (
                  <Box sx={{ px: { xs: 1.5, sm: 2, md: 3 }, py: 3 }}>
                    <Typography color="text.secondary">Không thể tải bài viết.</Typography>
                  </Box>
                ) : (
                  replies.map((reply) => (
                    <ForumReply
                      key={reply.id}
                      reply={reply}
                      isAdmin={isAdmin}
                      memberId={memberId}
                      isGuest={isGuest}
                      onReply={handleReply}
                      onDelete={handleDeletePost}
                      onEdit={handleEditPost}
                      onReport={handleReportPost}
                      isDeleting={deletePending}
                      parentPost={reply.answerToPostId ? replyMap.get(reply.answerToPostId) : null}
                    />
                  ))
                )}
              </Box>

              {!!pageInfo?.totalPage && pageInfo.totalPage > 1 && (
                <Box
                  sx={{
                    px: { xs: 1.5, sm: 2, md: 3 },
                    py: { xs: 1.5, md: 2 },
                    borderTop: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <Pagination
                    color="primary"
                    shape="rounded"
                    page={currentPage + 1}
                    count={pageInfo.totalPage}
                    onChange={handlePaginationChange}
                    siblingCount={0}
                    boundaryCount={1}
                  />
                </Box>
              )}

              {/* Reply editor */}
              <Box
                sx={{
                  px: { xs: 1.5, sm: 2, md: 3 },
                  py: { xs: 2, md: 2.5 },
                  borderTop: 1,
                  borderColor: 'divider',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'center', sm: 'flex-start' },
                    gap: 2,
                  }}
                >
                  {/* Left: avatar column */}
                  <Box
                    sx={{
                      width: { xs: 'auto', sm: 110 },
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: { xs: 'row', sm: 'column' },
                      alignItems: { xs: 'center', sm: 'center' },
                      gap: 1,
                      pt: { sm: 0.5 },
                    }}
                  >
                    <Box
                      sx={{
                        width: { xs: 40, sm: 56 },
                        height: { xs: 40, sm: 56 },
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <PersonIcon sx={{ fontSize: 30 }} />
                    </Box>
                    <Box sx={{ textAlign: { xs: 'left', sm: 'center' } }}>
                      <Typography variant="body2" fontWeight={600}>
                        Tôi
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(user?.role ?? 'Student').toString().toLowerCase()}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Right: editor */}
                  <Box ref={editorRef} sx={{ flex: 1, minWidth: 0, width: '100%' }}>
                    {replyTo ? (
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1,
                          mb: 1,
                          borderLeft: 3,
                          borderLeftColor: 'primary.main',
                          bgcolor: 'grey.50',
                          border: 1,
                          borderColor: 'divider',
                          p: 1.25,
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            justifyContent: 'space-between',
                            gap: 1,
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Đang trả lời {replyTo.authorName || `bài viết #${replyTo.postId}`}
                          </Typography>
                          <Button size="small" variant="text" onClick={handleCancelReply}>
                            Huỷ
                          </Button>
                        </Box>
                        <Typography
                          variant="body2"
                          color="text.primary"
                          sx={{
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {stripHtml(replyTo.content) || '—'}
                        </Typography>
                      </Box>
                    ) : null}
                    <Tooltip title={isGuest ? "Vui lòng xác thực tài khoản để thực hiện chức năng này" : ""} arrow placement="top">
                      <Box>
                        <WYSIWYG
                          value={editorValue}
                          onChange={setEditorValue}
                          readOnly={isGuest}
                        />
                      </Box>
                    </Tooltip>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
                      <Tooltip title={isGuest ? "Vui lòng xác thực tài khoản để thực hiện chức năng này" : ""} arrow>
                        <span>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSubmit}
                            disabled={
                              createPending ||
                              answerPending ||
                              !topicId ||
                              isGuest ||
                              !stripHtml(editorValue ?? '')
                            }
                          >
                            {createPending || answerPending ? 'Đang đăng...' : 'Đăng'}
                          </Button>
                        </span>
                      </Tooltip>
                    </Box>
                  </Box>
                </Box>
              </Box>
              </Box>
            </Stack>
          </Box>
        </Container>
      </Container>
      <Dialog open={isEditTopicOpen} onClose={handleCloseEditTopic} fullWidth maxWidth="sm">
        <DialogTitle>Chỉnh sửa chủ đề</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1.5 }}>
          <TextField
            variant="standard"
            size="small"
            label="Tiêu đề"
            value={editTopicTitle}
            onChange={(e) => setEditTopicTitle(e.target.value)}
            fullWidth
            autoFocus
          />
          <TextField
            select
            variant="standard"
            size="small"
            label="Chủ đề phụ"
            value={editCategoryId}
            onChange={(e) => setEditCategoryId(e.target.value)}
            fullWidth
            disabled={!categories?.length}
          >
            {(categories ?? []).map((category) => (
              <MenuItem key={category.id} value={String(category.id)}>
                {category.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditTopic} disabled={updateTopicPending}>
            Hủy
          </Button>
          <Button onClick={handleSaveEditTopic} variant="contained" disabled={updateTopicPending}>
            {updateTopicPending ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>
      <EditPostDialog
        open={isEditPostOpen}
        post={editingPost}
        onClose={handleCloseEditPost}
        onSave={handleSaveEditPost}
        isPending={updatePostPending}
        isError={updatePostIsError}
        errorMessage={updatePostErrorMessage}
      />
      <ConfirmDialog
        open={isConfirmDeleteOpen}
        title="Xác nhận xóa bài viết"
        message="Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        confirmColor="error"
        loading={deletePending}
        onConfirm={handleConfirmDeletePost}
        onCancel={handleCloseConfirmDelete}
      />
      <ReportPostDialog
        open={isReportOpen}
        onClose={handleCloseReport}
        onConfirm={handleConfirmReport}
        isPending={reportPending}
      />
    </Page>
  );
};

export default ForumAlumniThreadPage;
