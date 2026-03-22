import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Avatar,
  Box,
  IconButton,
  InputAdornment,
  Skeleton,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import SendIcon from '@mui/icons-material/Send';
import MoodIcon from '@mui/icons-material/Mood';

const MOCK_CHATS = [
  {
    id: 'c1',
    name: 'Nguyễn Văn An',
    lastMessage: 'Tin nhắn đã tới đây.',
    timeLabel: '1m',
    unread: true,
    lastSeen: '1m',
  },
  {
    id: 'c2',
    name: 'Nguyễn Văn An',
    lastMessage: 'Tin nhắn đã tới đây.',
    timeLabel: '1m',
    unread: false,
    lastSeen: '2m',
  },
  {
    id: 'c3',
    name: 'Nguyễn Văn An',
    lastMessage: 'Tin nhắn đã tới đây.',
    timeLabel: '1m',
    unread: true,
    lastSeen: '5m',
  },
  {
    id: 'c4',
    name: 'Nguyễn Văn An',
    lastMessage: 'Tin nhắn đã tới đây.',
    timeLabel: '1m',
    unread: false,
    lastSeen: '1h',
  },
];

const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

const MOCK_MESSAGES_BY_CHAT = {
  c1: [
    { id: 'm1', fromPeer: true, body: LOREM },
    { id: 'm2', fromPeer: true, body: LOREM },
    { id: 'm3', fromPeer: false, body: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.' },
    { id: 'm4', fromPeer: false, body: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.' },
    { id: 'm5', fromPeer: true, body: LOREM },
  ],
  c2: [
    { id: 'm1', fromPeer: true, body: 'Xin chào, mình có thể hỗ trợ lịch mentorship tuần này.' },
    { id: 'm2', fromPeer: false, body: 'Dạ em cảm ơn anh.' },
  ],
  c3: [{ id: 'm1', fromPeer: true, body: 'Bạn kiểm tra lại email nhé.' }],
  c4: [{ id: 'm1', fromPeer: false, body: 'Ok ạ.' }],
};

function initials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const MentorshipChatView = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(MOCK_CHATS[0].id);
  const [draft, setDraft] = useState('');
  const [messagesByChat, setMessagesByChat] = useState(() => ({
    ...MOCK_MESSAGES_BY_CHAT,
  }));
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 650);
    return () => clearTimeout(t);
  }, []);

  const selectedChat = useMemo(
    () => MOCK_CHATS.find((c) => c.id === selectedId) ?? MOCK_CHATS[0],
    [selectedId]
  );

  const messages = messagesByChat[selectedId] ?? [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedId, messages.length]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    const msgId = `local-${Date.now()}`;
    setMessagesByChat((prev) => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] ?? []), { id: msgId, fromPeer: false, body: text }],
    }));
    setDraft('');
  };

  const bg = theme.palette.background.default;
  const paper = theme.palette.background.paper;
  const grey200 = theme.palette.grey[200];
  const sidebarWidth = { xs: '100%', md: 320 };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        flex: 1,
        minHeight: 0,
        width: '100%',
        overflow: 'hidden',
      }}
    >
        {/* Sidebar — chat list */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: sidebarWidth,
            borderRight: { md: `1px solid ${theme.palette.divider}` },
            borderBottom: { xs: `1px solid ${theme.palette.divider}`, md: 'none' },
            bgcolor: paper,
            flexShrink: 0,
            maxHeight: { xs: 240, md: 'none' },
          }}
        >
          <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle1" fontWeight={600} color="text.primary">
              Chats
            </Typography>
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5 }}>
                    <Skeleton variant="circular" width={44} height={44} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Skeleton width="60%" />
                      <Skeleton width="90%" />
                    </Box>
                  </Box>
                ))
              : MOCK_CHATS.map((chat) => {
                  const active = chat.id === selectedId;
                  return (
                    <Box
                      key={chat.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedId(chat.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedId(chat.id);
                        }
                      }}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        px: 2,
                        py: 1.5,
                        cursor: 'pointer',
                        bgcolor: active ? theme.palette.action.selected : 'transparent',
                        '&:hover': { bgcolor: theme.palette.action.hover },
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 44,
                          height: 44,
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          fontSize: '0.9375rem',
                        }}
                      >
                        {initials(chat.name)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                        <Typography variant="subtitle2" noWrap fontWeight={600}>
                          {chat.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {chat.lastMessage}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {chat.timeLabel}
                        </Typography>
                        {chat.unread ? (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: 'error.main',
                            }}
                          />
                        ) : (
                          <Box sx={{ width: 8, height: 8 }} />
                        )}
                      </Box>
                    </Box>
                  );
                })}
          </Box>
        </Box>

        {/* Main chat */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minWidth: 0,
            bgcolor: bg,
          }}
        >
          {loading ? (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2, gap: 2 }}>
              <Skeleton height={48} />
              <Skeleton variant="rounded" height={72} sx={{ alignSelf: 'flex-start', width: '72%' }} />
              <Skeleton variant="rounded" height={56} sx={{ alignSelf: 'flex-end', width: '64%' }} />
              <Skeleton variant="rounded" height={72} sx={{ alignSelf: 'flex-start', width: '72%' }} />
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 2,
                  py: 1.5,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  bgcolor: paper,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                    {initials(selectedChat.name)}
                  </Avatar>
                  <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <Typography variant="subtitle1" fontWeight={600} noWrap>
                      {selectedChat.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedChat.lastSeen}
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
                  overflow: 'auto',
                  px: 2,
                  py: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                }}
              >
                {messages.map((msg) => (
                  <Box
                    key={msg.id}
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: msg.fromPeer ? 'flex-start' : 'flex-end',
                      alignItems: 'flex-end',
                      gap: 1,
                    }}
                  >
                    {msg.fromPeer && (
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          fontSize: '0.75rem',
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                        }}
                      >
                        {initials(selectedChat.name)}
                      </Avatar>
                    )}
                    <Box
                      sx={{
                        maxWidth: { xs: '85%', sm: '72%' },
                        px: 1.25,
                        py: 1,
                        borderRadius: 2,
                        bgcolor: msg.fromPeer ? grey200 : 'primary.main',
                        color: msg.fromPeer ? 'text.primary' : 'primary.contrastText',
                      }}
                    >
                      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
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
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, flex: 1, minWidth: 0 }}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    placeholder="Aa"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
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
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': { bgcolor: 'primary.dark' },
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

export default MentorshipChatView;
