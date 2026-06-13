import { useCallback, useEffect, useRef } from "react";
import { useSnackbar } from "notistack";
import {
  Avatar,
  Box,
  IconButton,
  InputAdornment,
  Skeleton,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import SendIcon from "@mui/icons-material/Send";

import ChatEmojiPickerButton from "../ChatEmojiPickerButton";
import { insertTextAtInputSelection } from "../../utils/insertTextAtInputSelection";

const CHAT_INDEX = "/development/mentorship/chat";

function initials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function MentorshipChatPanel({
  mainView,
  paramId,
  isPending,
  privateChats,
  isError,
  errorMessage,
  selectedChatName,
  selectedChatLastSeen,
  token,
  isOpen,
  wsStatus,
  messages,
  isHistoryLoading,
  messagesEndRef,
  draft,
  setDraft,
  handleSend,
  navigate,
  activeChatId,
}) {
  const { enqueueSnackbar } = useSnackbar();
  const listErrorShownRef = useRef(false);
  const draftInputRef = useRef(null);

  const handleEmojiSelect = useCallback(
    (emoji) => {
      insertTextAtInputSelection(draftInputRef, setDraft, emoji);
    },
    [setDraft],
  );
  const theme = useTheme();
  const paper = theme.palette.background.paper;
  const bg = theme.palette.background.default;
  const grey200 = theme.palette.grey[200];

  useEffect(() => {
    if (mainView === "empty" && isError && privateChats.length === 0) {
      if (!listErrorShownRef.current) {
        enqueueSnackbar(errorMessage ?? "Không tải được danh sách. Thử lại sau.", { variant: "error" });
        listErrorShownRef.current = true;
      }
      return;
    }
    if (!isError) {
      listErrorShownRef.current = false;
    }
  }, [mainView, isError, errorMessage, privateChats.length, enqueueSnackbar]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        overflow: "hidden",
        bgcolor: bg,
        [theme.breakpoints.down("md")]: {
          ...(paramId == null ? { display: "none" } : {}),
        },
      }}
    >
      {mainView === "loading" ? (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          {paramId != null ? (
            <Box
              sx={{
                display: "none",
                [theme.breakpoints.down("md")]: {
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1,
                  py: 1,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  bgcolor: paper,
                },
              }}
            >
              <IconButton
                size="small"
                aria-label="Quay lại danh sách chat"
                onClick={() => navigate(CHAT_INDEX, { replace: false })}
              >
                <ArrowBackIcon />
              </IconButton>
              <Skeleton variant="text" width="50%" height={28} />
            </Box>
          ) : null}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              p: 2,
              gap: 2,
              minHeight: 0,
            }}
          >
            <Skeleton height={48} />
            <Skeleton
              variant="rounded"
              height={72}
              sx={{ alignSelf: "flex-start", width: "72%" }}
            />
            <Skeleton
              variant="rounded"
              height={56}
              sx={{ alignSelf: "flex-end", width: "64%" }}
            />
            <Skeleton
              variant="rounded"
              height={72}
              sx={{ alignSelf: "flex-start", width: "72%" }}
            />
          </Box>
        </Box>
      ) : mainView === "empty" ? (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            px: 3,
            py: 4,
            textAlign: "center",
            gap: 1.5,
          }}
        >
          <ChatBubbleOutlineIcon
            sx={{ fontSize: 56, color: "text.disabled", opacity: 0.85 }}
            aria-hidden
          />
          {isPending && paramId == null ? (
            <>
              <Typography variant="subtitle1" fontWeight={600} color="text.primary">
                Cuộc trò chuyện
              </Typography>
              <Typography variant="body2" color="text.secondary" maxWidth={360}>
                Đang tải danh sách chat…
              </Typography>
            </>
          ) : privateChats.length === 0 ? (
            <>
              <Typography variant="subtitle1" fontWeight={600} color="text.primary">
                Chưa có cuộc trò chuyện
              </Typography>
              <Typography variant="body2" color="text.secondary" maxWidth={360}>
                {isError
                  ? (errorMessage ?? "Không tải được danh sách. Thử lại sau.")
                  : "Khi có cuộc trò chuyện riêng, bạn sẽ thấy ở cột bên trái."}
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="subtitle1" fontWeight={600} color="text.primary">
                Chọn cuộc trò chuyện
              </Typography>
              <Typography variant="body2" color="text.secondary" maxWidth={360}>
                Chọn một mục trong danh sách chat để xem và gửi tin nhắn. Hoặc mở trực tiếp bằng
                đường dẫn có mã chat (ví dụ{" "}
                <Typography component="span" variant="body2" fontFamily="monospace">
                  /development/mentorship/chat/1
                </Typography>
                ).
              </Typography>
            </>
          )}
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: "none",
              [theme.breakpoints.up("md")]: {
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 2,
                py: 1.5,
                borderBottom: `1px solid ${theme.palette.divider}`,
                bgcolor: paper,
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                minWidth: 0,
              }}
            >
              <Avatar
                sx={{
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                }}
              >
                {initials(selectedChatName)}
              </Avatar>
              <Box
                sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}
              >
                <Typography variant="subtitle1" fontWeight={600} noWrap>
                  {selectedChatName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedChatLastSeen}
                  {token ? (
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                      sx={{ ml: 1 }}
                    >
                      •{" "}
                      {isOpen
                        ? "Realtime: connected"
                        : `Realtime: ${wsStatus}`}
                    </Typography>
                  ) : null}
                </Typography>
              </Box>
            </Box>
            <IconButton size="small" aria-label="More options">
              <MoreHorizIcon />
            </IconButton>
          </Box>

          <Box
            sx={{
              display: "none",
              [theme.breakpoints.down("md")]: {
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1,
                py: 1,
                borderBottom: `1px solid ${theme.palette.divider}`,
                bgcolor: paper,
              },
            }}
          >
            <IconButton
              size="small"
              aria-label="Quay lại danh sách chat"
              onClick={() => navigate(CHAT_INDEX, { replace: false })}
            >
              <ArrowBackIcon />
            </IconButton>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                fontSize: "0.875rem",
              }}
            >
              {initials(selectedChatName)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={600} noWrap>
                {selectedChatName}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {selectedChatLastSeen}
                {token ? (
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                    sx={{ ml: 0.5 }}
                  >
                    • {isOpen ? "Đang kết nối" : wsStatus}
                  </Typography>
                ) : null}
              </Typography>
            </Box>
            <IconButton size="small" aria-label="More options">
              <MoreHorizIcon />
            </IconButton>
          </Box>

          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              overflowX: "hidden",
              px: 2,
              py: 2,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            {isHistoryLoading ? (
              <>
                <Skeleton
                  variant="rounded"
                  height={56}
                  sx={{ alignSelf: "flex-start", width: "72%" }}
                />
                <Skeleton
                  variant="rounded"
                  height={48}
                  sx={{ alignSelf: "flex-end", width: "64%" }}
                />
                <Skeleton
                  variant="rounded"
                  height={56}
                  sx={{ alignSelf: "flex-start", width: "72%" }}
                />
              </>
            ) : messages.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No messages yet.
              </Typography>
            ) : (
              messages.map((msg) => (
                <Box
                  key={msg.id}
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: msg.fromPeer ? "flex-start" : "flex-end",
                    alignItems: "flex-end",
                    gap: 1,
                  }}
                >
                  {msg.fromPeer && (
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        fontSize: "0.75rem",
                        bgcolor: "primary.main",
                        color: "primary.contrastText",
                      }}
                    >
                      {initials(selectedChatName)}
                    </Avatar>
                  )}
                  <Box
                    sx={{
                      maxWidth: { xs: "85%", sm: "72%" },
                      px: 1.25,
                      py: 1,
                      borderRadius: 2,
                      bgcolor: msg.fromPeer ? grey200 : "primary.main",
                      color: msg.fromPeer
                        ? "text.primary"
                        : "primary.contrastText",
                      opacity: msg.pending ? 0.7 : 1,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ wordBreak: "break-word", whiteSpace: "pre-wrap" }}
                    >
                      {msg.body}
                    </Typography>
                  </Box>
                </Box>
              ))
            )}
            <div ref={messagesEndRef} />
          </Box>

          <Box
            sx={{
              flexShrink: 0,
              px: 2,
              py: 1.5,
              borderTop: `1px solid ${theme.palette.divider}`,
              bgcolor: paper,
              display: "flex",
              alignItems: "flex-end",
              gap: 1,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-end",
                gap: 1,
                flex: 1,
                minWidth: 0,
              }}
            >
              <TextField
                fullWidth
                multiline
                maxRows={4}
                inputRef={draftInputRef}
                placeholder="Aa"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                variant="outlined"
                size="small"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <ChatEmojiPickerButton
                        disabled={!token || activeChatId == null}
                        onEmojiSelect={handleEmojiSelect}
                      />
                    </InputAdornment>
                  ),
                }}
              />
              <IconButton
                color="primary"
                aria-label="Send"
                onClick={handleSend}
                disabled={!token || activeChatId == null}
                sx={{
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  "&:hover": { bgcolor: "primary.dark" },
                }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}
