import { useState } from "react";
import { Avatar, Box, Button, Chip, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import CloseIcon from "@mui/icons-material/Close";
import WYSIWYG from "../WYSIWYG";
import { ContributeGuardTooltip } from "../ContributeGuard";
import { toPlainText } from "../../utils/stringUtils";

const getAvatarInitial = (name) => {
  const trimmed = typeof name === "string" ? name.trim() : "";
  return trimmed ? trimmed.charAt(0).toUpperCase() : "";
};

const CommentForm = ({
  currentUserName,
  currentUserAvatarUrl,
  canComment,
  isSubmitting,
  replyTarget,
  onCancelReply,
  onSubmit,
}) => {
  const { t } = useTranslation(["comment"]);
  const [content, setContent] = useState("");

  const isEmpty = !toPlainText(content ?? "");

  const handleSubmit = async () => {
    if (isEmpty || isSubmitting || !canComment) return;
    await onSubmit?.(content);
    setContent("");
  };

  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
      <Avatar src={currentUserAvatarUrl} sx={{ width: 40, height: 40, flexShrink: 0 }}>
        {getAvatarInitial(currentUserName)}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {replyTarget && (
          <Chip
            size="small"
            onDelete={onCancelReply}
            deleteIcon={<CloseIcon fontSize="small" />}
            label={t("comment:replying_to", { name: replyTarget.authorName || "" })}
            sx={{ mb: 1 }}
          />
        )}
        <ContributeGuardTooltip required="basic" sx={{ display: "block" }}>
          <Box>
            <WYSIWYG
              value={content}
              onChange={setContent}
              allowImages={false}
              readOnly={!canComment}
              height={140}
              placeholder={
                replyTarget ? t("comment:reply_placeholder") : t("comment:placeholder")
              }
            />
          </Box>
        </ContributeGuardTooltip>
        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
          <Button
            variant="contained"
            disabled={isEmpty || isSubmitting || !canComment}
            onClick={handleSubmit}
          >
            {isSubmitting ? t("comment:posting") : t("comment:post_action")}
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
};

export default CommentForm;
