import {
  Avatar,
  Box,
  IconButton,
  Skeleton,
  Typography,
  useTheme,
} from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";

const CHAT_BASE = "/development/mentorship/chat";

function getChatDisplayName(chat) {
  if (chat?.peerUserName) return chat.peerUserName;
  if (chat?.title) return chat.title;
  return `Private chat #${chat?.id ?? ""}`;
}

function getChatListPreview(chat) {
  const raw = chat?.lastMessagePreview;
  if (raw == null || String(raw).trim() === "") return "Chưa có tin nhắn";
  const s = String(raw).replace(/\s+/g, " ").trim();
  return s.length > 80 ? `${s.slice(0, 80)}…` : s;
}

function initials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function MentorshipChatSidebar({
  paramId,
  isPending,
  isError,
  errorMessage,
  privateChats,
  activeChatId,
  navigate,
}) {
  const theme = useTheme();
  const paper = theme.palette.background.paper;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        bgcolor: paper,
        flexShrink: 0,
        minHeight: 0,
        overflow: "hidden",
        [theme.breakpoints.up("md")]: {
          width: 320,
          minWidth: 280,
          maxWidth: 320,
          flex: "0 0 320px",
          height: "100%",
          maxHeight: "100%",
          borderRight: `1px solid ${theme.palette.divider}`,
          borderBottom: "none",
        },
        [theme.breakpoints.down("md")]: {
          width: "100%",
          borderRight: "none",
          borderBottom:
            paramId == null
              ? "none"
              : `1px solid ${theme.palette.divider}`,
          flex: paramId == null ? 1 : "0 0 auto",
          height: paramId == null ? "100%" : "auto",
          maxHeight: paramId == null ? "100%" : 240,
          ...(paramId != null ? { display: "none" } : {}),
        },
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
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
        }}
      >
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
        ) : privateChats.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {isError
                ? (errorMessage ?? "Unable to load chat groups")
                : "No private chats found."}
            </Typography>
          </Box>
        ) : (
          privateChats.map((chat) => {
            const active = chat.id === activeChatId;
            const chatName = getChatDisplayName(chat);
            const preview = getChatListPreview(chat);
            return (
              <Box
                key={chat.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`${CHAT_BASE}/${chat.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`${CHAT_BASE}/${chat.id}`);
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
                    {preview}
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
                  <IconButton size="small" aria-label="Chat options">
                    <MoreHorizIcon fontSize="small" />
                  </IconButton>
                  <Box sx={{ width: 8, height: 8 }} />
                </Box>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
}
