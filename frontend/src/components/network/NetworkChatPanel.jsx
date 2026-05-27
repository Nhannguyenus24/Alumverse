import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Avatar,
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import SendIcon from '@mui/icons-material/Send';
import MoodIcon from '@mui/icons-material/Mood';

import Scrollbar from '../Scrollbar';
import { useChatMessages } from '../../hooks/chat/useChatMessages';
import { useChatWebSocket } from '../../hooks/mentorship/useChatWebSocket';
import useAuthStore from '../../stores/authStore';

function formatTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}


const SCROLL_TOP_THRESHOLD = 8;

const NetworkChatPanel = ({ activeChat }) => {
  const [draft, setDraft] = useState('');
  const token = useAuthStore((state) => state.token ?? null);
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);

  const { messages, isLoading, isLoadingMore, hasMore, loadMore, appendMessage } = useChatMessages(
    activeChat?.id ?? null,
  );

  // --- WebSocket ---
  const appendMessageRef = useRef(appendMessage);
  useEffect(() => { appendMessageRef.current = appendMessage; }, [appendMessage]);

  const handleWsEvent = useCallback((event) => {
    if (event.type !== 'MESSAGE_CREATED') return;
    const p = event.payload;
    appendMessageRef.current({
      id: p.id,
      groupId: p.groupId,
      senderMemberId: p.senderMemberId,
      senderFullName: null,
      senderAvatarUrl: null,
      content: p.content,
      messageType: p.messageType,
      metadata: p.metadata,
      createdAt: p.createdAt,
    });
  }, []);

  const { joinGroup, leaveGroup, sendMessage: wsSendMessage, isOpen } = useChatWebSocket({
    token,
    onEvent: handleWsEvent,
  });

  // Join the active group; leave the previous one when switching
  const prevGroupIdRef = useRef(null);
  const wsActionsRef = useRef({ joinGroup, leaveGroup });
  useEffect(() => { wsActionsRef.current = { joinGroup, leaveGroup }; }, [joinGroup, leaveGroup]);

  useEffect(() => {
    const currentGroupId = activeChat?.id ?? null;
    const prev = prevGroupIdRef.current;
    if (prev != null && prev !== currentGroupId) {
      wsActionsRef.current.leaveGroup(prev);
    }
    if (currentGroupId != null) {
      wsActionsRef.current.joinGroup(currentGroupId);
    }
    prevGroupIdRef.current = currentGroupId;
  }, [activeChat?.id]);

  // --- Scroll ---
  const scrollRef = useRef(null);
  const prevScrollHeightRef = useRef(null);
  const isInitialLoadRef = useRef(false);
  const prevMessageCountRef = useRef(0);

  // Mark that we are waiting for the initial load to complete
  useEffect(() => {
    isInitialLoadRef.current = true;
  }, [activeChat?.id]);

  // After initial load: scroll to bottom
  useEffect(() => {
    if (!isLoading && isInitialLoadRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      isInitialLoadRef.current = false;
    }
  }, [isLoading]);

  // After loading older messages: restore scroll position so the view doesn't jump
  useEffect(() => {
    if (!isLoadingMore && prevScrollHeightRef.current != null && scrollRef.current) {
      const newScrollHeight = scrollRef.current.scrollHeight;
      scrollRef.current.scrollTop = newScrollHeight - prevScrollHeightRef.current;
      prevScrollHeightRef.current = null;
    }
  }, [isLoadingMore]);

  // After a real-time message arrives: scroll to bottom if already near bottom
  useEffect(() => {
    const el = scrollRef.current;
    const prevCount = prevMessageCountRef.current;
    const newCount = messages.length;
    prevMessageCountRef.current = newCount;

    if (!el || isLoadingMore || newCount <= prevCount) return;
    if (isInitialLoadRef.current) return;

    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (isNearBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length, isLoadingMore]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !hasMore || isLoadingMore) return;
    if (el.scrollTop <= SCROLL_TOP_THRESHOLD) {
      prevScrollHeightRef.current = el.scrollHeight;
      loadMore();
    }
  }, [hasMore, isLoadingMore, loadMore]);

  // --- Send ---
  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text || !activeChat?.id || !isOpen) return;
    wsSendMessage({ groupId: activeChat.id, content: text });
    setDraft('');
  }, [draft, activeChat?.id, isOpen, wsSendMessage]);

  const handleKeyDown = useCallback((event) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    handleSend();
  }, [handleSend]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <Avatar
            src={activeChat?.avatarUrl}
            sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
          >
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              {activeChat?.name ?? 'Network Chat'}
            </Typography>
            {activeChat?.type === 'GROUP' && (
              <Typography variant="caption" color="text.secondary" noWrap>
                Nhóm chat
              </Typography>
            )}
          </Box>
        </Box>
        <IconButton size="small" aria-label="More options">
          <MoreHorizIcon />
        </IconButton>
      </Box>

      {/* Message list */}
      <Scrollbar
        ref={scrollRef}
        onScroll={handleScroll}
        sx={{
          flex: 1,
          minHeight: 0,
          px: 2,
          py: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        {/* Load more indicator */}
        {isLoadingMore && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
            <CircularProgress size={18} color="primary" />
          </Box>
        )}

        {/* No more older messages hint */}
        {!hasMore && messages.length > 0 && (
          <Typography variant="caption" color="text.disabled" align="center" display="block" sx={{ py: 0.5 }}>
            Đã tải hết tin nhắn
          </Typography>
        )}

        {/* Initial loading */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <CircularProgress size={28} color="primary" />
          </Box>
        )}

        {/* Empty state */}
        {!isLoading && messages.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Chưa có tin nhắn nào.
            </Typography>
          </Box>
        )}

        {/* Messages */}
        {!isLoading &&
          messages.map((msg) => {
            const isOwn = msg.senderMemberId === currentUserId;
            return (
              <Box
                key={msg.id}
                sx={{
                  display: 'flex',
                  justifyContent: isOwn ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-end',
                  gap: 1,
                }}
              >
                {!isOwn && (
                  <Avatar
                    src={msg.senderAvatarUrl ?? undefined}
                    sx={{
                      width: 32,
                      height: 32,
                      fontSize: '0.75rem',
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                    }}
                  >
                  </Avatar>
                )}
                <Box sx={{ maxWidth: { xs: '85%', sm: '72%' } }}>
                  {!isOwn && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                      {msg.senderFullName ?? `User ${msg.senderMemberId}`}
                    </Typography>
                  )}
                  <Box
                    sx={{
                      px: 1.25,
                      py: 1,
                      borderRadius: 2,
                      bgcolor: isOwn ? 'primary.main' : 'grey.200',
                      color: isOwn ? 'primary.contrastText' : 'text.primary',
                    }}
                  >
                    <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                      {msg.content}
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    sx={{ display: 'block', mt: 0.25, textAlign: isOwn ? 'right' : 'left', mx: 0.5 }}
                  >
                    {formatTime(msg.createdAt)}
                  </Typography>
                </Box>
              </Box>
            );
          })}
      </Scrollbar>

      {/* Input area */}
      <Box
        sx={{
          flexShrink: 0,
          px: 2,
          py: 1.5,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1,
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder={isOpen ? 'Nhập tin nhắn...' : 'Đang kết nối...'}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!isOpen}
          variant="outlined"
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" aria-label="Emoji" edge="end" disabled={!isOpen}>
                  <MoodIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <IconButton
          color="primary"
          aria-label="Send"
          disabled={!isOpen || !draft.trim()}
          onClick={handleSend}
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': { bgcolor: 'primary.dark' },
            '&.Mui-disabled': {
              bgcolor: 'action.disabledBackground',
              color: 'action.disabled',
            },
          }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default NetworkChatPanel;
