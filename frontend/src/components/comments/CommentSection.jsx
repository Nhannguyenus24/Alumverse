import { useMemo, useState } from "react";
import { Box, Button, CircularProgress, Divider, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import CommentItem from "./CommentItem";
import CommentForm from "./CommentForm";

/**
 * Generic comment section shared by Event, News and AlumniPost article pages.
 * All data access goes through props/callbacks — this component has no
 * knowledge of which backend module the comments belong to.
 */
const CommentSection = ({
  comments = [],
  isLoading = false,
  currentUserId,
  currentUserName,
  currentUserAvatarUrl,
  isAdmin = false,
  canComment = false,
  isSubmitting = false,
  isDeleting = false,
  hasMore = false,
  onLoadMore,
  onCreate,
  onReply,
  onUpdate,
  onDelete,
}) => {
  const { t } = useTranslation(["comment"]);
  const [replyTarget, setReplyTarget] = useState(null);

  const threads = useMemo(() => {
    const roots = comments.filter((c) => !c.parentCommentId);
    const repliesByParent = comments.reduce((acc, c) => {
      if (!c.parentCommentId) return acc;
      if (!acc[c.parentCommentId]) acc[c.parentCommentId] = [];
      acc[c.parentCommentId].push(c);
      return acc;
    }, {});
    return roots.map((root) => ({
      root,
      replies: repliesByParent[root.id] || [],
    }));
  }, [comments]);

  const handleSubmit = async (content) => {
    if (replyTarget) {
      await onReply?.(replyTarget.id, content);
      setReplyTarget(null);
    } else {
      await onCreate?.(content);
    }
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        {t("comment:title")}
      </Typography>

      <CommentForm
        currentUserName={currentUserName}
        currentUserAvatarUrl={currentUserAvatarUrl}
        canComment={canComment}
        isSubmitting={isSubmitting}
        replyTarget={replyTarget}
        onCancelReply={() => setReplyTarget(null)}
        onSubmit={handleSubmit}
      />

      <Divider sx={{ my: 3 }} />

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : threads.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 3 }}>
          {t("comment:empty")}
        </Typography>
      ) : (
        <Stack spacing={3}>
          {threads.map(({ root, replies }) => (
            <Box key={root.id}>
              <CommentItem
                comment={root}
                isOwn={currentUserId != null && String(root.authorMemberId) === String(currentUserId)}
                isAdmin={isAdmin}
                canComment={canComment}
                onReply={setReplyTarget}
                onUpdate={onUpdate}
                onDelete={onDelete}
                isDeleting={isDeleting}
              />
              {replies.length > 0 && (
                <Stack spacing={2} sx={{ mt: 2, pl: { xs: 3, sm: 6 } }}>
                  {replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      isOwn={currentUserId != null && String(reply.authorMemberId) === String(currentUserId)}
                      isAdmin={isAdmin}
                      canComment={false}
                      onUpdate={onUpdate}
                      onDelete={onDelete}
                      isDeleting={isDeleting}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          ))}
        </Stack>
      )}

      {hasMore && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Button variant="outlined" onClick={onLoadMore}>
            {t("comment:load_more")}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default CommentSection;
