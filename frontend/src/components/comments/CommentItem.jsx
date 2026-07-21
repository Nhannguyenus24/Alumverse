import { useState } from "react";
import {
  Avatar,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import DOMPurify from "dompurify";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ReplyOutlinedIcon from "@mui/icons-material/ReplyOutlined";
import ConfirmDialog from "../ConfirmDialog";
import WYSIWYG from "../WYSIWYG";
import { formatDateTime } from "../../utils/dateFormatter";
import { normalizeNbsp, toPlainText } from "../../utils/stringUtils";

const getAvatarInitial = (name) => {
  const trimmed = typeof name === "string" ? name.trim() : "";
  return trimmed ? trimmed.charAt(0).toUpperCase() : "";
};

const CommentItem = ({
  comment,
  isOwn,
  isAdmin,
  canComment,
  onReply,
  onUpdate,
  onDelete,
  isDeleting,
}) => {
  const { t } = useTranslation(["comment", "common"]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(comment.content || "");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const canEdit = isOwn;
  const canDelete = isOwn || isAdmin;

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleStartEdit = () => {
    setEditValue(comment.content || "");
    setIsEditing(true);
    handleMenuClose();
  };

  const handleSaveEdit = async () => {
    if (!toPlainText(editValue)) return;
    await onUpdate?.(comment.id, editValue);
    setIsEditing(false);
  };

  const handleConfirmDelete = async () => {
    await onDelete?.(comment.id);
    setConfirmDeleteOpen(false);
  };

  const sanitizedContent = normalizeNbsp(DOMPurify.sanitize(comment.content || ""));

  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
      <Avatar src={comment.authorAvatarUrl} sx={{ width: 40, height: 40, flexShrink: 0 }}>
        {getAvatarInitial(comment.authorName)}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle2" fontWeight={700}>
            {comment.authorName || t("common:anonymous", "Ẩn danh")}
          </Typography>
          {(canEdit || canDelete) && (
            <>
              <IconButton size="small" onClick={handleMenuOpen}>
                <MoreVertIcon fontSize="small" />
              </IconButton>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                {canEdit && <MenuItem onClick={handleStartEdit}>{t("comment:edit")}</MenuItem>}
                {canDelete && (
                  <MenuItem
                    onClick={() => {
                      handleMenuClose();
                      setConfirmDeleteOpen(true);
                    }}
                  >
                    {t("comment:delete")}
                  </MenuItem>
                )}
              </Menu>
            </>
          )}
        </Stack>

        {isEditing ? (
          <Box sx={{ mt: 0.5 }}>
            <WYSIWYG
              value={editValue}
              onChange={setEditValue}
              allowImages={false}
              height={140}
            />
            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1 }}>
              <Button size="small" variant="contained" onClick={handleSaveEdit}>
                {t("comment:save")}
              </Button>
              <Button size="small" variant="outlined" onClick={() => setIsEditing(false)}>
                {t("comment:cancel_reply")}
              </Button>
            </Stack>
          </Box>
        ) : (
          <Box
            className="ql-editor"
            sx={{
              p: 0,
              mt: 0.5,
              "&.ql-editor": {
                overflowWrap: "normal",
                wordBreak: "normal",
                hyphens: "none",
              },
              "& p": { m: 0, "&:not(:last-child)": { mb: "1em" } },
            }}
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        )}

        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mt: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {comment.createdAt ? formatDateTime(comment.createdAt) : ""}
          </Typography>
          {canComment && !comment.parentCommentId && (
            <Button
              size="small"
              startIcon={<ReplyOutlinedIcon fontSize="small" />}
              onClick={() => onReply?.(comment)}
              sx={{ minWidth: "auto", textTransform: "none" }}
            >
              {t("comment:reply_action")}
            </Button>
          )}
        </Stack>
      </Box>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title={t("comment:delete_confirm_title")}
        message={t("comment:delete_confirm_message")}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
        confirmColor="error"
        loading={isDeleting}
      />
    </Stack>
  );
};

export default CommentItem;
