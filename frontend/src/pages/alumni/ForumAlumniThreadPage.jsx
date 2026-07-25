import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { useTranslation } from "react-i18next";
import { useLocation, useParams } from "react-router";
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Pagination,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ReplyOutlinedIcon from "@mui/icons-material/ReplyOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import { useAuth } from "../../hooks/useAuth";
import { useCanContribute } from "../../hooks/useCanContribute";
import Breadcrumb from "../../components/Breadcrumb";
import { useForumCategories } from "../../hooks/forum/useForumCategories";
import { useForumPosts } from "../../hooks/forum/useForumPosts";
import { useCreateForumPost } from "../../hooks/forum/useCreateForumPost";
import { useAnswerToForumPost } from "../../hooks/forum/useAnswerToForumPost";
import { useUpdateForumPost } from "../../hooks/forum/useUpdateForumPost";
import ForumFilterPanel from "../../components/forum/ForumFilterPanel";
import AlumniContentLayout from "../../layouts/AlumniContentLayout";
import { useForumPostReactionCount } from "../../hooks/forum/useForumPostReactionCount";
import { useForumPostUserReaction } from "../../hooks/forum/useForumPostUserReaction";
import { useReactToForumPost } from "../../hooks/forum/useReactToForumPost";
import { useDeleteForumPost } from "../../hooks/forum/useDeleteForumPost";
import { useDeleteForumTopic } from "../../hooks/forum/useDeleteForumTopic";
import { useUpdateForumTopic } from "../../hooks/forum/useUpdateForumTopic";
import { useUpdateForumTopicStatus } from "../../hooks/forum/useUpdateForumTopicStatus";
import { useSubscribeToTopic } from "../../hooks/forum/useSubscribeToTopic";
import { useForumTopicSubscriptionStatus } from "../../hooks/forum/useForumTopicSubscriptionStatus";
import { useReportForumPost } from "../../hooks/forum/useReportForumPost";
import { useForumTopic } from "../../hooks/forum/useForumTopic";
import { useNotification } from "../../hooks/useNotification";
import { useOrganization } from "../../hooks/useOrganization";
import { useOrgNavigate, useOrgPath } from "../../hooks/useOrgNavigate";
import EditPostDialog from "../../components/forum/EditPostDialog";
import ConfirmDialog from "../../components/ConfirmDialog";
import WYSIWYG from "../../components/WYSIWYG";
import { formatDateTime } from "../../utils/dateFormatter";
import { toPlainText, normalizeRichTextHtml } from "../../utils/stringUtils";
import ReportPostDialog from "../../components/forum/ReportPostDialog";
import {
  ScrollReveal,
  getStaggerDelay,
} from "../../components/animations/ScrollReveal";

const getAvatarInitial = (name) => {
  const trimmed = typeof name === "string" ? name.trim() : "";
  return trimmed ? trimmed.charAt(0).toUpperCase() : "";
};

const ForumReply = ({
  reply,
  isAdmin,
  memberId,
  onReply,
  parentPost,
  onDelete,
  isDeleting,
  onEdit,
  onReport,
}) => {
  const { t } = useTranslation(["forum", "common"]);
  const toOrgPath = useOrgPath();
  const { showError, showSuccess } = useNotification();
  const reactErrShownRef = useRef(false);
  const [actionAnchorEl, setActionAnchorEl] = useState(null);
  const {
    likes,
    isPending: likesPending,
    isError: likesError,
  } = useForumPostReactionCount(reply.id);
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
        showError(reactErrorMessage ?? t("forum:error_update_reaction"));
        reactErrShownRef.current = true;
      }
    } else {
      reactErrShownRef.current = false;
    }
  }, [reactIsError, reactErrorMessage, showError]);

  const isOwn = reply.authorMemberId === memberId;

  const isLiked = !!hasReaction;
  const likesDisplay = likesPending ? "..." : likesError ? "—" : likes;

  const hasParent = !!parentPost;
  const isActionMenuOpen = Boolean(actionAnchorEl);

  const handleOpenProfile = (event) => {
    event.stopPropagation();
    if (!reply.authorMemberId) return;
    const url = `${window.location.origin}${toOrgPath(`/profile/${reply.authorMemberId}`)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

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
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "center", sm: "flex-start" },
        gap: { xs: 2, sm: 2.5 },
        borderTop: 1,
        borderColor: "divider",
        ...(hasParent ? { bgcolor: "background.default" } : null),
      }}
    >
      <Box
        sx={{
          width: { xs: "auto", sm: 110 },
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0.5,
        }}
      >
        <Avatar
          src={reply.authorAvatarUrl || undefined}
          alt={reply.authorName}
          onClick={handleOpenProfile}
          sx={{
            width: { xs: 48, sm: 64 },
            height: { xs: 48, sm: 64 },
            mb: 0.5,
            bgcolor: "primary.main",
            color: "primary.contrastText",
            cursor: reply.authorMemberId ? "pointer" : "default",
          }}
        >
          {getAvatarInitial(reply.authorName) || (
            <PersonIcon sx={{ fontSize: 36 }} />
          )}
        </Avatar>
        <Typography
          variant="body2"
          fontWeight={600}
          onClick={handleOpenProfile}
          sx={{
            maxWidth: 104,
            textAlign: "center",
            lineHeight: 1.28,
            overflowWrap: "anywhere",
            cursor: reply.authorMemberId ? "pointer" : "default",
            "&:hover": reply.authorMemberId ? { textDecoration: "underline" } : {},
          }}
        >
          {reply.authorName}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ lineHeight: 1.2 }}
        >
          {reply.role}
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          position: "relative",
          alignSelf: "stretch",
          display: "flex",
          flexDirection: "column",
          minHeight: { sm: 132 },
        }}
      >
        <IconButton
          size="small"
          onClick={handleOpenActionMenu}
          sx={{ position: "absolute", top: -0.5, right: 0 }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
        <Box
          className="ql-editor"
          sx={{
            mb: 1.5,
            mr: 4,
            px: 0,
            py: 0,
            lineHeight: 1.6,
            "&.ql-editor": { p: 0, overflowWrap: "break-word", wordBreak: "break-word", hyphens: "auto" },
            "& p": { m: 0, textAlign: "justify", minHeight: "1.5em", "&:not(:last-child)": { mb: "0.5em" } },
            "& p.ql-empty-line, & p:has(> br:only-child)": { display: "block", minHeight: "1.5em", lineHeight: "1.5em", my: 0 },
            "& img, & img.rich-content-image, & img.ql-content-image": {
              display: "block",
              maxWidth: "min(100%, 520px) !important",
              width: "auto !important",
              height: "auto !important",
              maxHeight: "560px !important",
              objectFit: "contain",
              mx: "auto",
              my: 2,
              borderRadius: 2,
            },
            "& .ql-size-small": { fontSize: "0.85em" },
            "& .ql-size-large": { fontSize: "1.25em" },
            "& .ql-size-huge": { fontSize: "1.6em" },
            "& .ql-align-left, & [style*='text-align: left' i]": { textAlign: "left !important" },
            "& .ql-align-center, & [style*='text-align: center' i]": { textAlign: "center !important" },
            "& .ql-align-right, & [style*='text-align: right' i]": { textAlign: "right !important" },
            "& .ql-align-justify, & [style*='text-align: justify' i]": { textAlign: "justify !important" },
          }}
          dangerouslySetInnerHTML={{ __html: normalizeRichTextHtml(reply.content || "") }}
        />
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            mb: hasParent ? 1.5 : 0,
          }}
        >
          <Menu
            anchorEl={actionAnchorEl}
            open={isActionMenuOpen}
            onClose={handleCloseActionMenu}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <Tooltip
              title={!memberId ? t("forum:login_required_to_comment") : ""}
              placement="left"
              arrow
            >
              <span>
                <MenuItem
                  disabled={!memberId}
                  onClick={() => {
                    handleCloseActionMenu();
                    onReply?.(reply);
                  }}
                >
                  <ReplyOutlinedIcon sx={{ fontSize: 18, mr: 1 }} />
                  {t("forum:reply")}
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
                {t("common:edit")}
              </MenuItem>
            )}
            {canDelete && (
              <MenuItem
                onClick={() => {
                  handleCloseActionMenu();
                  onDelete?.(reply);
                }}
                disabled={isDeleting}
                sx={{ color: "error.main" }}
              >
                <DeleteOutlineOutlinedIcon sx={{ fontSize: 18, mr: 1 }} />
                {t("common:delete")}
              </MenuItem>
            )}
            {!isOwn && (
              <Tooltip
                title={
                  !memberId
                    ? t("forum:login_required_for_action", {
                        defaultValue: "Login required",
                      })
                    : ""
                }
                placement="left"
                arrow
              >
                <span>
                  <MenuItem
                    onClick={() => {
                      handleCloseActionMenu();
                      onReport?.(reply);
                    }}
                    sx={{ color: "warning.main" }}
                    disabled={!memberId}
                  >
                    <FlagOutlinedIcon sx={{ fontSize: 18, mr: 1 }} />
                    {t("common:report")}
                  </MenuItem>
                </span>
              </Tooltip>
            )}
          </Menu>
        </Box>
        {hasParent ? (
          <Box
            sx={{
              mb: 1.5,
              px: 1.25,
              py: 1,
              borderLeft: 3,
              borderLeftColor: "primary.main",
              bgcolor: "background.paper",
              border: 1,
              borderColor: "divider",
              maxWidth: "100%",
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block" }}
            >
              {t("forum:reply")}{" "}
              {parentPost.authorName ??
                t("forum:post_id_fallback", { id: parentPost.id })}
            </Typography>
            <Typography
              variant="body2"
              color="text.primary"
              sx={{
                mt: 0.25,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {toPlainText(parentPost.content) || "—"}
            </Typography>
          </Box>
        ) : null}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1.5,
            mt: "auto",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {reply.createdAt}
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
              ml: "auto",
            }}
          >
            <Button
              size="small"
              variant="text"
              onClick={() => toggleReaction()}
              disabled={reactPending || !memberId}
              sx={{
                minWidth: 0,
                p: 0,
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                color: isLiked ? "error.main" : "text.secondary",
                "&:hover": {
                  bgcolor: "transparent",
                  color: "error.main",
                },
              }}
            >
              {isLiked ? (
                <FavoriteIcon
                  sx={{
                    fontSize: 18,
                    color: "error.main",
                  }}
                />
              ) : (
                <FavoriteBorderIcon
                  sx={{
                    fontSize: 18,
                  }}
                />
              )}
              <Typography variant="caption">{likesDisplay}</Typography>
            </Button>
            <Button
              size="small"
              variant="text"
              onClick={() => {
                const url = window.location.href;
                navigator.clipboard.writeText(url).then(() => {
                  showSuccess(t("common:copied"));
                });
              }}
              sx={{
                minWidth: 0,
                p: 0,
                color: "text.secondary",
                textTransform: "none",
                "&:hover": {
                  bgcolor: "transparent",
                  color: "primary.main",
                },
                "&:hover .MuiSvgIcon-root, &:hover .MuiTypography-root": {
                  color: "primary.main",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <ReplyOutlinedIcon sx={{ fontSize: 18, color: "inherit" }} />
                <Typography variant="caption" color="inherit">
                  {t("common:share")}
                </Typography>
              </Box>
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

const FALLBACK_THREAD = {
  authorName: "—",
  role: "Alumni",
  createdAt: "—",
};

const ForumAlumniThreadPage = () => {
  const { t } = useTranslation(["forum", "common"]);
  const location = useLocation();
  const navigate = useOrgNavigate();
  const toOrgPath = useOrgPath();
  const { threadId, pageId } = useParams();
  const topicId = useMemo(() => {
    const id = parseInt(threadId, 10);
    return Number.isNaN(id) ? null : id;
  }, [threadId]);

  const { isAuthenticated, user, verificationLevel } = useAuth();
  const { isOrgManager } = useCanContribute();
  const { organization } = useOrganization();
  const isAdmin = isOrgManager;
  // Org managers may moderate; regular members need level >= 2 to post.
  const isGuest =
    !isAuthenticated || (!isAdmin && (verificationLevel ?? 0) < 2);
  const [editorValue, setEditorValue] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const editorRef = useRef(null);
  const [isEditTopicOpen, setIsEditTopicOpen] = useState(false);
  const [editTopicTitle, setEditTopicTitle] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [threadTitleOverride, setThreadTitleOverride] = useState("");
  const [isEditPostOpen, setIsEditPostOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isConfirmDeleteTopicOpen, setIsConfirmDeleteTopicOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [postToReport, setPostToReport] = useState(null);
  const [topicStatus, setTopicStatus] = useState(() => {
    const s = location.state?.topicSummary?.status;
    return typeof s === "string" && s.trim()
      ? s.trim().toUpperCase()
      : "ACTIVE";
  });
  
  const [currentPage, setCurrentPage] = useState(() => {
    const p = parseInt(pageId, 10);
    return !isNaN(p) && p > 0 ? p - 1 : 0;
  });

  const organizationId = organization?.id ?? null;
  const { categories } = useForumCategories(organizationId);
  const selectedFilterIdFromState = location.state?.selectedFilterId ?? "all";
  const openingPostErrorFromState =
    typeof location.state?.openingPostError === "string"
      ? location.state.openingPostError.trim()
      : "";

  const memberId = user?.id ?? null;
  const {
    posts,
    pageInfo,
    isPending: postsPending,
    isError: postsError,
  } = useForumPosts(topicId, memberId, currentPage, 10);
  const { topic: fetchedTopic } = useForumTopic(
    !location.state?.topicSummary && topicId ? topicId : null
  );

  useEffect(() => {
    if (fetchedTopic?.status) {
      setTopicStatus(fetchedTopic.status.trim().toUpperCase());
    }
  }, [fetchedTopic]);

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
  const { updateTopicStatus, isPending: topicStatusPending } =
    useUpdateForumTopicStatus();
  const { isSubscribed, isPending: subStatusPending } =
    useForumTopicSubscriptionStatus(topicId, memberId);
  const { toggleSubscription, isPending: subTogglePending } =
    useSubscribeToTopic();
  const { reportPost, isPending: reportPending } = useReportForumPost();
  const { showSuccess, showError, showWarning } = useNotification();
  const hasShownPostsErrorRef = useRef(false);
  const hasShownOpeningErrorRef = useRef(false);
  const currentUserName = user?.fullName?.trim() || t("forum:me");
  const currentUserRole =
    isAdmin && user?.role
      ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()
      : (verificationLevel ?? 0) >= 2
      ? "Alumni"
      : user?.role
        ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()
        : "User";
  const currentUserAvatarUrl = user?.avatarUrl ?? null;

  const openProfileInNewTab = useCallback(
    (profileUserId) => {
      if (!profileUserId) return;
      const url = `${window.location.origin}${toOrgPath(`/profile/${profileUserId}`)}`;
      window.open(url, "_blank", "noopener,noreferrer");
    },
    [toOrgPath],
  );

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
    const topicSummary = location.state?.topicSummary || fetchedTopic;
    const titleFromSummary =
      typeof topicSummary?.title === "string" && topicSummary.title.trim()
        ? topicSummary.title.trim()
        : null;
    const topicTitleFromState = location.state?.topicTitle;
    const titleFromLegacy =
      typeof topicTitleFromState === "string" && topicTitleFromState.trim()
        ? topicTitleFromState.trim()
        : null;
    const title =
      threadTitleOverride ||
      titleFromSummary ||
      titleFromLegacy ||
      t("forum:topic_count_label");

    const firstPost = posts?.[0] ?? null;

    const topicAuthorName =
      typeof topicSummary?.authorName === "string" &&
      topicSummary.authorName.trim()
        ? topicSummary.authorName.trim()
        : null;
    const firstPostFullName =
      typeof firstPost?.authorName === "string" && firstPost.authorName.trim()
        ? firstPost.authorName.trim()
        : null;
    const authorFromPost =
      firstPostFullName ??
      (firstPost?.authorMemberId
        ? String(firstPost.authorMemberId) === String(user?.id)
          ? t("forum:me")
          : `${t("forum:member_prefix")}${firstPost.authorMemberId}`
        : null);
    const authorFromTopic =
      topicAuthorName ??
      (topicSummary?.createdByMemberId != null
        ? String(topicSummary.createdByMemberId) === String(user?.id)
          ? t("forum:me")
          : `${t("forum:member_prefix")}${topicSummary.createdByMemberId}`
        : null);

    const createdFromPost = firstPost?.createdAt
      ? formatDateTime(firstPost.createdAt, "—")
      : null;
    const createdFromTopic = topicSummary?.createdAt
      ? formatDateTime(topicSummary.createdAt, "—")
      : null;

    return {
      title,
      authorName:
        topicSummary !== undefined
          ? authorFromTopic
          : (authorFromPost ?? FALLBACK_THREAD.authorName),
      authorMemberId:
        topicSummary !== undefined
          ? topicSummary.createdByMemberId
          : (firstPost?.authorMemberId ?? null),
      authorAvatarUrl:
        topicSummary !== undefined
          ? topicSummary.authorAvatarUrl
          : (firstPost?.authorAvatarUrl ?? null),
      role: "Alumni",
      createdAt:
        topicSummary !== undefined
          ? createdFromTopic
          : (createdFromPost ?? FALLBACK_THREAD.createdAt),
    };
  }, [
    location.state?.topicTitle,
    location.state?.topicSummary,
    posts,
    threadTitleOverride,
    user?.id,
    t,
    fetchedTopic,
  ]);

  const replies = useMemo(
    () =>
      (posts ?? []).map((post) => {
        const isOwn =
          post.authorMemberId != null &&
          String(post.authorMemberId) === String(user?.id);
        const fullName =
          typeof post.authorName === "string" ? post.authorName.trim() : "";
        return {
          id: post.id,
          answerToPostId: post.answerToPostId ?? null,
          authorMemberId: post.authorMemberId ?? null,
          authorName:
            fullName ||
            (isOwn
              ? t("forum:me")
              : `${t("forum:member_prefix")}${post.authorMemberId ?? "—"}`),
          authorAvatarUrl: post.authorAvatarUrl ?? null,
          role: "Alumni",
          createdAt: formatDateTime(post.createdAt, "—"),
          content: post.content ?? "",
        };
      }),
    [posts, user?.id, t],
  );

  const replyMap = useMemo(() => {
    const m = new Map();
    for (const r of replies) m.set(r.id, r);
    return m;
  }, [replies]);

  // The reply box is a ReactQuill editor: its editable element is the
  // contenteditable `.ql-editor` div, not a <textarea>.
  const focusReplyEditor = useCallback(() => {
    window.setTimeout(() => {
      editorRef.current?.scrollIntoView?.({
        behavior: "smooth",
        block: "center",
      });
      const editor = editorRef.current?.querySelector?.(".ql-editor");
      editor?.focus?.();
    }, 0);
  }, []);

  const handleReply = useCallback(
    (reply) => {
      if (!reply?.id) return;
      setReplyTo({
        postId: reply.id,
        authorName: reply.authorName ?? "",
        content: reply.content ?? "",
      });
      focusReplyEditor();
    },
    [focusReplyEditor],
  );

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
      showSuccess(t("forum:success_delete_post"));
    } catch (err) {
      const message =
        err?.response?.data?.message ??
        deleteErrorMessage ??
        err?.message ??
        t("forum:error_delete_post");
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
      showSuccess(t("forum:success_report"));
      setIsReportOpen(false);
      setPostToReport(null);
    } catch (err) {
      showError(
        err?.response?.data?.message ?? err?.message ?? t("forum:error_report"),
      );
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
      showSuccess(t("forum:success_update_post"));
    } catch (err) {
      const message =
        err?.response?.data?.message ??
        updatePostErrorMessage ??
        err?.message ??
        t("forum:error_update_post");
      showError(message);
    }
  };

  const handleConfirmDeleteTopic = useCallback(async () => {
    if (!topicId) return;
    try {
      await deleteTopic(topicId);
      showSuccess(t("forum:success_delete_topic"));
      if (selectedFilterIdFromState?.startsWith?.("parent-")) {
        navigate("/forum", {
          state: { selectedFilterId: selectedFilterIdFromState },
        });
        return;
      }
      if (selectedFilterIdFromState === "alumni") {
        navigate("/forum");
        return;
      }
      navigate("/forum");
    } catch (err) {
      const message =
        err?.response?.data?.message ??
        deleteTopicErrorMessage ??
        err?.message ??
        t("forum:error_delete_topic");
      showError(message);
    }
  }, [
    deleteTopic,
    deleteTopicErrorMessage,
    navigate,
    selectedFilterIdFromState,
    showError,
    showSuccess,
    topicId,
  ]);

  const handleDeleteTopicClick = useCallback(() => {
    setIsConfirmDeleteTopicOpen(true);
  }, []);

  const handleOpenEditTopic = useCallback(() => {
    const topicSummary = location.state?.topicSummary;
    setEditTopicTitle((thread.title ?? "").trim());
    setEditCategoryId(
      String(topicSummary?.categoryId ?? categories?.[0]?.id ?? ""),
    );
    setIsEditTopicOpen(true);
  }, [categories, location.state?.topicSummary, thread.title]);

  const handleCloseEditTopic = useCallback(() => {
    if (updateTopicPending) return;
    setIsEditTopicOpen(false);
  }, [updateTopicPending]);

  const handleSaveEditTopic = useCallback(async () => {
    const trimmedTitle = (editTopicTitle ?? "").trim();
    const parsedCategoryId = parseInt(editCategoryId, 10);
    if (
      !topicId ||
      !trimmedTitle ||
      Number.isNaN(parsedCategoryId) ||
      parsedCategoryId <= 0
    ) {
      showWarning(t("forum:validate_title_and_subcategory"));
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
      showSuccess(t("forum:success_update_topic"));
    } catch (err) {
      const message =
        err?.response?.data?.message ??
        updateTopicErrorMessage ??
        err?.message ??
        t("forum:error_update_topic");
      showError(message);
    }
  }, [
    editCategoryId,
    editTopicTitle,
    showError,
    showSuccess,
    showWarning,
    topicId,
    updateTopic,
    updateTopicErrorMessage,
  ]);

  const isTopicInactive = topicStatus === "INACTIVE";

  const handleToggleLock = async () => {
    if (!topicId) return;
    const next = isTopicInactive ? "ACTIVE" : "INACTIVE";
    try {
      await updateTopicStatus({ topicId, status: next });
      setTopicStatus(next);
      showSuccess(
        next === "INACTIVE"
          ? t("forum:success_lock")
          : t("forum:success_unlock"),
      );
    } catch (_) {
      showError(t("forum:error_toggle_lock"));
    }
  };

  const handleToggleSubscription = async () => {
    if (!topicId || !memberId) {
      showWarning(t("forum:login_required_for_action"));
      return;
    }
    try {
      await toggleSubscription({ topicId, memberId });
      showSuccess(
        isSubscribed
          ? t("forum:success_unsubscribed")
          : t("forum:success_subscribed"),
      );
    } catch (_) {
      showError(t("forum:error_toggle_subscription"));
    }
  };

  const filters = useMemo(() => {
    const parentCategories = (categories ?? []).filter(
      (c) => c.parentId == null,
    );
    return [
      { id: "all", label: t("common:all") },
      ...parentCategories.map((c) => ({ id: `parent-${c.id}`, label: c.name })),
    ];
  }, [categories, t]);

  const handleSubmit = async () => {
    const plainContent = stripHtml(editorValue ?? "");
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
        showSuccess(t("forum:success_reply"));
      } else {
        await createPost(payload);
        showSuccess(t("forum:success_create_post"));
      }
      setEditorValue("");

      // Jump to the last page to see the new post
      if (pageInfo) {
        const newTotal = pageInfo.totalItem + 1;
        const newLastPage = Math.max(
          0,
          Math.ceil(newTotal / pageInfo.pageSize) - 1,
        );
        if (currentPage !== newLastPage) {
          navigate(`/forum/topic/${threadId}/page/${newLastPage + 1}`, {
            state: location.state,
          });
        }
      }
    } catch (err) {
      const message =
        err?.response?.data?.message ??
        err?.message ??
        (replyTo?.postId
          ? t("forum:error_send_reply")
          : t("forum:error_create_post"));
      showError(message);
    }
  };

  useEffect(() => {
    if (postsError) {
      if (!hasShownPostsErrorRef.current) {
        showError(t("forum:error_load_posts"));
        hasShownPostsErrorRef.current = true;
      }
      return;
    }
    hasShownPostsErrorRef.current = false;
  }, [postsError, showError]);

  useEffect(() => {
    if (openingPostErrorFromState) {
      if (!hasShownOpeningErrorRef.current) {
        showWarning(
          `${t("forum:opening_post_error_prefix")} ${openingPostErrorFromState}`,
        );
        hasShownOpeningErrorRef.current = true;
      }
      return;
    }
    hasShownOpeningErrorRef.current = false;
  }, [openingPostErrorFromState, showWarning]);

  const handleFilterChange = useCallback(
    (id) => {
      if (id === "all") {
        navigate("/forum");
        return;
      }
      if (typeof id === "string" && id.startsWith("parent-")) {
        navigate("/forum", { state: { selectedFilterId: id } });
        return;
      }
    },
    [navigate],
  );

  const handlePaginationChange = useCallback(
    (_, nextPage) => {
      setReplyTo(null);
      navigate(`/forum/topic/${threadId}/page/${nextPage}`, {
        state: location.state,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [navigate, threadId, location.state],
  );

  const selectedFilterId = useMemo(() => {
    const allFilterIds = filters.map((f) => f.id);
    return allFilterIds.includes(selectedFilterIdFromState)
      ? selectedFilterIdFromState
      : "all";
  }, [filters, selectedFilterIdFromState]);

  const activeCategory = useMemo(() => {
    const categoryId = location.state?.topicSummary?.categoryId || fetchedTopic?.categoryId;
    if (categoryId != null) {
      const cat = categories?.find((c) => c.id === categoryId);
      if (cat) return cat;
      if (fetchedTopic?.categoryName && fetchedTopic?.categoryId === categoryId) {
        return {
          id: fetchedTopic.categoryId,
          name: fetchedTopic.categoryName,
          parentId: fetchedTopic.parentCategoryId,
        };
      }
    }
    return null;
  }, [categories, location.state?.topicSummary?.categoryId, fetchedTopic]);

  const parentCategory = useMemo(() => {
    if (!activeCategory?.parentId) return null;
    const pCat = categories?.find((c) => c.id === activeCategory.parentId);
    if (pCat) return pCat;
    if (fetchedTopic?.parentCategoryName && fetchedTopic?.parentCategoryId === activeCategory.parentId) {
      return {
        id: fetchedTopic.parentCategoryId,
        name: fetchedTopic.parentCategoryName,
      };
    }
    return null;
  }, [activeCategory, categories, fetchedTopic]);

  const breadcrumbItems = useMemo(() => {
    const items = [];
    if (parentCategory) {
      items.push({
        label: parentCategory.name,
        path: "/forum",
        state: { selectedFilterId: `parent-${parentCategory.id}` },
      });
    }
    if (activeCategory) {
      items.push({
        label: activeCategory.name,
        path: `/forum/category/${activeCategory.id}`,
        state: {
          selectedFilterId: activeCategory.parentId
            ? `parent-${activeCategory.parentId}`
            : `parent-${activeCategory.id}`,
        },
      });
    }
    items.push({ label: thread.title });
    return items;
  }, [activeCategory, parentCategory, thread.title]);

  return (
    <AlumniContentLayout
      variant="forum"
      pageTitle={`${thread.title}`}
      meta={<meta name="description" content={t("forum:career_topic_meta")} />}
      sidebar={
        <ForumFilterPanel
          filters={filters}
          selectedId={selectedFilterId}
          onChange={handleFilterChange}
        />
      }
      header={null}
      contentSpacing={0}
      after={
        <>
          <Dialog
            open={isEditTopicOpen}
            onClose={handleCloseEditTopic}
            fullWidth
            maxWidth="sm"
          >
            <DialogTitle>{t("forum:edit_topic_dialog_title")}</DialogTitle>
            <DialogContent
              sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1.5 }}
            >
              <TextField
                variant="standard"
                size="small"
                label={t("forum:title_field_label")}
                value={editTopicTitle}
                onChange={(e) => setEditTopicTitle(e.target.value)}
                fullWidth
                autoFocus
              />
              <TextField
                select
                variant="standard"
                size="small"
                label={t("forum:subcategory_field_label")}
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
              <Button
                onClick={handleCloseEditTopic}
                disabled={updateTopicPending}
              >
                {t("common:cancel")}
              </Button>
              <Button
                onClick={handleSaveEditTopic}
                variant="contained"
                disabled={updateTopicPending}
              >
                {updateTopicPending ? t("forum:saving") : t("common:save")}
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
            title={t("forum:confirm_delete_post_title")}
            message={t("forum:confirm_delete_post_message")}
            confirmText={t("common:delete")}
            cancelText={t("common:cancel")}
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
          <ConfirmDialog
            open={isConfirmDeleteTopicOpen}
            title={t("common:confirm_delete", { defaultValue: 'Xác nhận xoá' })}
            message={t("forum:confirm_delete_topic_message", { defaultValue: 'Bạn có chắc chắn muốn xoá chủ đề này không?' })}
            confirmText={t("common:delete")}
            cancelText={t("common:cancel")}
            confirmColor="error"
            loading={deleteTopicPending}
            onConfirm={handleConfirmDeleteTopic}
            onCancel={() => setIsConfirmDeleteTopicOpen(false)}
          />
        </>
      }
    >
      <Stack
        spacing={0}
        sx={{
          flex: 1,
          minWidth: 0,
          width: "100%",
          px: { xs: 0, sm: 2, md: 2.75 },
        }}
      >
        <ScrollReveal>
          <Breadcrumb items={breadcrumbItems} uppercase color="primary" />
        </ScrollReveal>
        <Box
          sx={{
            backgroundColor: "background.paper",
            border: 1,
            borderColor: "divider",
          }}
        >
          {/* Header + main thread */}
          <ScrollReveal
            sx={{
              px: { xs: 1.5, sm: 2, md: 3 },
              py: { xs: 1.5, md: 2 },
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "flex-start", sm: "center" },
                justifyContent: "space-between",
                gap: 2,
                mb: 2,
              }}
            >
              <Typography
                variant="h5"
                component="h1"
                fontWeight={800}
                sx={{
                  fontSize: { xs: "1.2rem", sm: "1.4rem", md: "1.6rem" },
                  wordBreak: "break-word",
                }}
              >
                {thread.title}
              </Typography>
              {isAdmin ? (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "repeat(2, 1fr)",
                      sm: "repeat(3, 1fr)",
                    },
                    gap: 1,
                    width: "100%",
                    maxWidth: { xs: 300, sm: 360 },
                    minWidth: { xs: 240, sm: 320 },
                  }}
                >
                  <Button
                    fullWidth
                    variant="outlined"
                    color={isSubscribed ? "primary" : "secondary"}
                    size="small"
                    startIcon={
                      <NotificationsNoneOutlinedIcon sx={{ fontSize: 18 }} />
                    }
                    onClick={handleToggleSubscription}
                    disabled={subStatusPending || subTogglePending}
                    sx={{
                      whiteSpace: "nowrap",
                      minWidth: 0,
                    }}
                  >
                    {isSubscribed
                      ? t("forum:subscribed")
                      : t("forum:subscribe")}
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    color="secondary"
                    size="small"
                    startIcon={<EditOutlinedIcon sx={{ fontSize: 18 }} />}
                    onClick={handleOpenEditTopic}
                    sx={{
                      whiteSpace: "nowrap",
                      minWidth: 0,
                    }}
                  >
                    {t("common:edit")}
                  </Button>
                  <Tooltip
                    title={
                      !isAuthenticated
                        ? t("forum:login_required_to_comment")
                        : ""
                    }
                    arrow
                  >
                    <span>
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<ReplyOutlinedIcon sx={{ fontSize: 18 }} />}
                        onClick={focusReplyEditor}
                        disabled={isGuest}
                        sx={{ whiteSpace: "nowrap" }}
                      >
                        {t("forum:reply")}
                      </Button>
                    </span>
                  </Tooltip>
                  <Button
                    fullWidth
                    variant="contained"
                    color="error"
                    size="small"
                    startIcon={
                      <DeleteOutlineOutlinedIcon sx={{ fontSize: 18 }} />
                    }
                    onClick={handleDeleteTopicClick}
                    disabled={deleteTopicPending}
                    sx={{ whiteSpace: "nowrap" }}
                  >
                    {deleteTopicPending
                      ? t("forum:deleting")
                      : t("common:delete")}
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    size="small"
                    onClick={handleToggleLock}
                    disabled={topicStatusPending}
                    startIcon={<LockOutlinedIcon sx={{ fontSize: 18 }} />}
                    sx={{
                      bgcolor: isTopicInactive
                        ? "success.main"
                        : "warning.main",
                      color: isTopicInactive
                        ? "success.contrastText"
                        : "warning.contrastText",
                      "&:hover": {
                        bgcolor: isTopicInactive
                          ? "success.dark"
                          : "warning.dark",
                      },
                      whiteSpace: "nowrap",
                    }}
                  >
                    {isTopicInactive ? t("forum:unlock") : t("forum:lock")}
                  </Button>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                    justifyContent: { xs: "flex-start", sm: "flex-end" },
                  }}
                >
                  <Button
                    variant={isSubscribed ? "contained" : "outlined"}
                    color="primary"
                    size="small"
                    startIcon={
                      <NotificationsNoneOutlinedIcon sx={{ fontSize: 18 }} />
                    }
                    onClick={handleToggleSubscription}
                    disabled={subStatusPending || subTogglePending}
                  >
                    {isSubscribed
                      ? t("forum:subscribed")
                      : t("forum:subscribe")}
                  </Button>
                  <Tooltip
                    title={
                      !isAuthenticated
                        ? t("forum:login_required_to_comment")
                        : ""
                    }
                    arrow
                  >
                    <span>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<ReplyOutlinedIcon sx={{ fontSize: 18 }} />}
                        onClick={focusReplyEditor}
                        disabled={isGuest}
                      >
                        {t("forum:reply")}
                      </Button>
                    </span>
                  </Tooltip>
                </Box>
              )}
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Avatar
                src={thread.authorAvatarUrl || undefined}
                alt={thread.authorName}
                onClick={() => openProfileInNewTab(thread.authorMemberId)}
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  flexShrink: 0,
                  cursor: thread.authorMemberId ? "pointer" : "default",
                }}
              >
                {getAvatarInitial(thread.authorName) || (
                  <PersonIcon sx={{ fontSize: 26 }} />
                )}
              </Avatar>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.4 }}>
                {postsPending && !location.state?.topicSummary ? (
                  <Typography variant="body2" color="text.secondary">
                    {t("forum:loading_topic_info")}
                  </Typography>
                ) : (
                  <>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      onClick={() => openProfileInNewTab(thread.authorMemberId)}
                      sx={{
                        lineHeight: 1.2,
                        cursor: thread.authorMemberId ? "pointer" : "default",
                        "&:hover": thread.authorMemberId ? { textDecoration: "underline" } : {},
                      }}
                    >
                      {thread.authorName}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ lineHeight: 1.15 }}
                    >
                      {thread.createdAt}
                    </Typography>
                  </>
                )}
              </Box>
            </Box>
          </ScrollReveal>

          {/* Replies */}
          <Box>
            {postsPending ? (
              <Box sx={{ px: { xs: 1.5, sm: 2, md: 3 }, py: 3 }}>
                <Typography color="text.secondary">
                  {t("forum:loading_posts")}
                </Typography>
              </Box>
            ) : postsError ? (
              <Box sx={{ px: { xs: 1.5, sm: 2, md: 3 }, py: 3 }}>
                <Typography color="text.secondary">
                  {t("forum:error_loading_posts")}
                </Typography>
              </Box>
            ) : (
              replies.map((reply, index) => (
                <ScrollReveal
                  key={reply.id}
                  delay={getStaggerDelay(index, 0.06)}
                >
                  <ForumReply
                    reply={reply}
                    isAdmin={isAdmin}
                    memberId={memberId}
                    isGuest={isGuest}
                    onReply={handleReply}
                    onDelete={handleDeletePost}
                    onEdit={handleEditPost}
                    onReport={handleReportPost}
                    isDeleting={deletePending}
                    parentPost={
                      reply.answerToPostId
                        ? replyMap.get(reply.answerToPostId)
                        : null
                    }
                  />
                </ScrollReveal>
              ))
            )}
          </Box>

          {!!pageInfo?.totalPage && pageInfo.totalPage > 1 && (
            <ScrollReveal
              sx={{
                px: { xs: 1.5, sm: 2, md: 3 },
                py: { xs: 1.5, md: 2 },
                borderTop: 1,
                borderColor: "divider",
                display: "flex",
                justifyContent: "center",
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
            </ScrollReveal>
          )}

          {/* Reply editor */}
          <ScrollReveal
            sx={{
              px: { xs: 1.5, sm: 2, md: 3 },
              py: { xs: 2, md: 2.5 },
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "center", sm: "flex-start" },
                gap: 2,
              }}
            >
              {/* Left: avatar column */}
              <Box
                sx={{
                  width: { xs: "auto", sm: 110 },
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: { xs: "row", sm: "column" },
                  alignItems: { xs: "center", sm: "center" },
                  gap: { xs: 1, sm: 0.5 },
                  pt: { sm: 0.5 },
                }}
              >
                <Avatar
                  src={currentUserAvatarUrl || undefined}
                  alt={currentUserName}
                  sx={{
                    width: { xs: 40, sm: 56 },
                    height: { xs: 40, sm: 56 },
                    mb: { sm: 0.5 },
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    flexShrink: 0,
                  }}
                >
                  {getAvatarInitial(currentUserName) || (
                    <PersonIcon sx={{ fontSize: 30 }} />
                  )}
                </Avatar>
                <Box
                  sx={{ textAlign: { xs: "left", sm: "center" }, minWidth: 0 }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    sx={{
                      maxWidth: { xs: 180, sm: 104 },
                      textAlign: { xs: "left", sm: "center" },
                      lineHeight: 1.28,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {currentUserName}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ lineHeight: 1.2 }}
                  >
                    {currentUserRole}
                  </Typography>
                </Box>
              </Box>

              {/* Right: editor */}
              <Box ref={editorRef} sx={{ flex: 1, minWidth: 0, width: "100%" }}>
                {replyTo ? (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      mb: 1,
                      borderLeft: 3,
                      borderLeftColor: "primary.main",
                      bgcolor: "background.default",
                      border: 1,
                      borderColor: "divider",
                      p: 1.25,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: { xs: "flex-start", sm: "center" },
                        justifyContent: "space-between",
                        gap: 1,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {t("forum:replying_to")}{" "}
                        {replyTo.authorName ||
                          t("forum:post_id_fallback", { id: replyTo.postId })}
                      </Typography>
                      <Button
                        size="small"
                        variant="text"
                        onClick={handleCancelReply}
                      >
                        {t("common:cancel")}
                      </Button>
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.primary"
                      sx={{
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {stripHtml(replyTo.content) || "—"}
                    </Typography>
                  </Box>
                ) : null}
                <Tooltip
                  title={
                    !isAuthenticated ? t("forum:login_required_to_comment") : ""
                  }
                  arrow
                  placement="top"
                >
                  <Box>
                    <WYSIWYG
                      value={editorValue}
                      onChange={setEditorValue}
                      readOnly={isGuest}
                    />
                  </Box>
                </Tooltip>
                <Box
                  sx={{ display: "flex", justifyContent: "flex-end", mt: 1.5 }}
                >
                  <Tooltip
                    title={
                      !isAuthenticated
                        ? t("forum:login_required_to_comment")
                        : ""
                    }
                    arrow
                  >
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
                          !stripHtml(editorValue ?? "")
                        }
                      >
                        {createPending || answerPending
                          ? t("forum:posting")
                          : t("forum:post_action")}
                      </Button>
                    </span>
                  </Tooltip>
                </Box>
              </Box>
            </Box>
          </ScrollReveal>
        </Box>
      </Stack>
    </AlumniContentLayout>
  );
};

export default ForumAlumniThreadPage;
