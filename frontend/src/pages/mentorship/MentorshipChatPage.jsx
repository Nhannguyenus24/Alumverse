import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
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
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import SendIcon from "@mui/icons-material/Send";
import MoodIcon from "@mui/icons-material/Mood";
import { useChatGroups } from "../../hooks/mentorship/useChatGroups";

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

function formatRelativeTime(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffM = Math.floor(diffMs / 60000);

  if (!Number.isFinite(diffM) || diffM < 0) return "";
  if (diffM <= 1) return "1m";
  if (diffM < 60) return `${diffM}m`;

  const diffH = Math.floor(diffM / 60);
  if (diffH < 24) return `${diffH}h`;

  const diffD = Math.floor(diffH / 24);
  return `${diffD}d`;
}

function getChatDisplayName(chat) {
  return chat?.title ?? `Private chat #${chat?.id ?? ""}`;
}

function getBootstrapMessages(chat) {
  const name = getChatDisplayName(chat);
  return [
    {
      id: `boot-${chat?.id}-1`,
      fromPeer: true,
      body: `Xin chào! Đây là cuộc trò chuyện ${name}.`,
    },
    { id: `boot-${chat?.id}-2`, fromPeer: false, body: LOREM },
  ];
}

function initials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const MentorshipChatPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { chatId } = useParams();
  const [draft, setDraft] = useState("");
  const [messagesByChat, setMessagesByChat] = useState({});
  const messagesEndRef = useRef(null);

  const { chatGroups, isPending, isError, errorMessage } =
    useChatGroups("PRIVATE");

  const paramId = useMemo(() => {
    const n = chatId != null ? Number(chatId) : null;
    return n != null && Number.isFinite(n) ? n : null;
  }, [chatId]);

  const activeChatId = useMemo(() => {
    if (isPending) return null;
    if (!chatGroups?.length) return null;
    if (paramId != null && chatGroups.some((g) => g.id === paramId))
      return paramId;
    return chatGroups[0]?.id ?? null;
  }, [chatGroups, isPending, paramId]);

  useEffect(() => {
    if (activeChatId == null) return;
    if (paramId === activeChatId) return;
    navigate(`/development/mentorship/chat/${activeChatId}`, { replace: true });
  }, [activeChatId, navigate, paramId]);

  const selectedChat = useMemo(
    () => chatGroups.find((c) => c.id === activeChatId) ?? null,
    [chatGroups, activeChatId],
  );

  const selectedChatName = selectedChat
    ? getChatDisplayName(selectedChat)
    : "Private chat";
  const selectedChatLastSeen = selectedChat
    ? formatRelativeTime(selectedChat.updatedAt ?? selectedChat.createdAt)
    : "";

  const messages = useMemo(() => {
    if (activeChatId == null) return [];
    const existing = messagesByChat[activeChatId];
    if (existing) return existing;
    if (!selectedChat) return [];
    return getBootstrapMessages(selectedChat);
  }, [activeChatId, messagesByChat, selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChatId, messages.length]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    if (activeChatId == null) return;

    const msgId = `local-${Date.now()}`;
    setMessagesByChat((prev) => ({
      ...prev,
      [activeChatId]: [
        ...(prev[activeChatId] ??
          (selectedChat ? getBootstrapMessages(selectedChat) : []) ??
          []),
        { id: msgId, fromPeer: false, body: text },
      ],
    }));
    setDraft("");
  };

  const bg = theme.palette.background.default;
  const paper = theme.palette.background.paper;
  const grey200 = theme.palette.grey[200];
  const sidebarWidth = { xs: "100%", md: 320 };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        flex: 1,
        minHeight: 0,
        width: "100%",
        overflow: "hidden",
      }}
    >
      {/* Sidebar — chat list */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: sidebarWidth,
          borderRight: { md: `1px solid ${theme.palette.divider}` },
          borderBottom: {
            xs: `1px solid ${theme.palette.divider}`,
            md: "none",
          },
          bgcolor: paper,
          flexShrink: 0,
          maxHeight: { xs: 240, md: "none" },
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="subtitle1" fontWeight={600} color="text.primary">
            Chats
          </Typography>
        </Box>
        <Box sx={{ flex: 1, overflow: "auto" }}>
          {isPending ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Box
                key={i}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: 2,
                  py: 1.5,
                }}
              >
                <Skeleton variant="circular" width={44} height={44} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Skeleton width="60%" />
                  <Skeleton width="90%" />
                </Box>
              </Box>
            ))
          ) : chatGroups.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {isError
                  ? (errorMessage ?? "Unable to load chat groups")
                  : "No private chats found."}
              </Typography>
            </Box>
          ) : (
            chatGroups.map((chat) => {
              const active = chat.id === activeChatId;
              const chatName = getChatDisplayName(chat);
              const timeLabel =
                formatRelativeTime(chat.updatedAt ?? chat.createdAt) || "—";
              return (
                <Box
                  key={chat.id}
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    navigate(`/development/mentorship/chat/${chat.id}`)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/development/mentorship/chat/${chat.id}`);
                    }
                  }}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    px: 2,
                    py: 1.5,
                    cursor: "pointer",
                    bgcolor: active
                      ? theme.palette.action.selected
                      : "transparent",
                    "&:hover": { bgcolor: theme.palette.action.hover },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 44,
                      height: 44,
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      fontSize: "0.9375rem",
                    }}
                  >
                    {initials(chatName)}
                  </Avatar>
                  <Box
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.25,
                    }}
                  >
                    <Typography variant="subtitle2" noWrap fontWeight={600}>
                      {chatName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {timeLabel === "—"
                        ? "No messages yet."
                        : `Updated ${timeLabel} ago`}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 0.5,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {timeLabel}
                    </Typography>
                    <Box sx={{ width: 8, height: 8 }} />
                  </Box>
                </Box>
              );
            })
          )}
        </Box>
      </Box>

      {/* Main chat */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minWidth: 0,
          bgcolor: bg,
        }}
      >
        {isPending ? (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              p: 2,
              gap: 2,
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
        ) : (
          <>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 2,
                py: 1.5,
                borderBottom: `1px solid ${theme.palette.divider}`,
                bgcolor: paper,
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
                  </Typography>
                </Box>
              </Box>
              <IconButton size="small" aria-label="More options">
                <MoreHorizIcon />
              </IconButton>
            </Box>

            <Box
              sx={{
                flex: 1,
                overflow: "auto",
                px: 2,
                py: 2,
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
              }}
            >
              {messages.map((msg) => (
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
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ wordBreak: "break-word" }}
                    >
                      {msg.body}
                    </Typography>
                  </Box>
                </Box>
              ))}
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
                        <IconButton size="small" aria-label="Emoji" edge="end">
                          <MoodIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <IconButton
                  color="primary"
                  aria-label="Send"
                  onClick={handleSend}
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
    </Box>
  );
};

export default MentorshipChatPage;
