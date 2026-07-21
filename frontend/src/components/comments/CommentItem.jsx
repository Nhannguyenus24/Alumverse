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
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ReplyOutlinedIcon from "@mui/icons-material/ReplyOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ConfirmDialog from "../ConfirmDialog";
import WYSIWYG from "../WYSIWYG";
import { formatDateTime } from "../../utils/dateFormatter";
import { normalizeRichTextHtml, prepareRichTextForEdit, toPlainText, hasRichTextContent } from "../../utils/stringUtils";

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
    setEditValue(prepareRichTextForEdit(comment.content || ""));
    setIsEditing(true);
    handleMenuClose();
  };

  const handleSaveEdit = async () => {
    if (!hasRichTextContent(editValue)) return;
    await onUpdate?.(comment.id, editValue);
    setIsEditing(false);
  };

  const handleConfirmDelete = async () => {
    await onDelete?.(comment.id);
    setConfirmDeleteOpen(false);
  };

  const sanitizedContent = normalizeRichTextHtml(comment.content || "");

  return (
    <Box sx={{ width: "100%" }}>
      {/* Top Header Row: Avatar + Author Name (vertically centered) + 3 dots menu button */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
        <Avatar src={comment.authorAvatarUrl} sx={{ width: 40, height: 40, flexShrink: 0 }}>
          {getAvatarInitial(comment.authorName)}
        </Avatar>
        <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1, minWidth: 0 }}>
          {comment.authorName || t("common:anonymous", "Ẩn danh")}
        </Typography>
        {(canEdit || canDelete) && (
          <>
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
              {canEdit && (
                <MenuItem onClick={handleStartEdit}>
                  <EditOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
                  {t("comment:edit")}
                </MenuItem>
              )}
              {canDelete && (
                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    setConfirmDeleteOpen(true);
                  }}
                  sx={{ color: "error.main" }}
                >
                  <DeleteOutlineIcon fontSize="small" sx={{ mr: 1, color: "error.main" }} />
                  {t("comment:delete")}
                </MenuItem>
              )}
            </Menu>
          </>
        )}
      </Stack>

      {/* Body & Bottom Actions: offset by 52px (40px avatar + 12px gap) so text starts right under the name */}
      <Box sx={{ pl: "52px" }}>
        {isEditing ? (
          <Box sx={{ mt: 0.5 }}>
            <WYSIWYG
              value={editValue}
              onChange={setEditValue}
              allowImages={true}
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
              p: "0 !important",
              mt: 0.5,
              lineHeight: 1.6,
              "&.ql-editor": {
                p: "0 !important",
                padding: "0 !important",
                overflowWrap: "break-word",
                wordBreak: "break-word",
                hyphens: "auto",
              },
              "& p": {
                m: 0,
                textAlign: "justify",
                minHeight: "1.5em",
                "&:not(:last-child)": { mb: "0.5em" },
              },
              "& p.ql-empty-line, & p:has(> br:only-child)": {
                display: "block",
                minHeight: "1.5em",
                lineHeight: "1.5em",
                my: 0,
              },
              "& img, & img.rich-content-image, & img.ql-content-image": {
                display: "block",
                maxWidth: "min(100%, 520px) !important",
                width: "auto !important",
                height: "auto !important",
                maxHeight: "560px !important",
                objectFit: "contain",
                mx: "auto",
                my: 1.5,
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
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        )}

        {/* Bottom Actions: Timestamp & Reply button aligned right */}
        <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1.5} sx={{ mt: 1 }}>
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
        confirmText={t("comment:delete")}
        cancelText={t("common:cancel")}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
        confirmColor="error"
        loading={isDeleting}
      />
    </Box>
  );
};

export default CommentItem;
