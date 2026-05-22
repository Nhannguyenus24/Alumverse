import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Drawer,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import Scrollbar from '../Scrollbar';
import { DEFAULT_CHAT_AVATAR_SRC } from '../../pages/chat/mockNetworkChats';
import { useNetworkConversation } from '../../hooks/network/useNetworkConversation';
import { useNetworkConversationActions } from '../../hooks/network/useNetworkConversationActions';
import {
  getConversationBanner,
  getConversationUiMode,
  getComposerPlaceholder,
  isComposerEnabled,
} from '../../mocks/networkConversationUi';

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatAcademicValue(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(' · ');
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean).join(' · ');
      }
    } catch {
      return value;
    }
    return value;
  }

  return '';
}

function NetworkMessageBubble({ message, isOwn }) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        alignItems: 'flex-end',
        gap: 1,
      }}
    >
      {!isOwn && (
        <Avatar
          sx={{
            width: 32,
            height: 32,
            fontSize: '0.75rem',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
          }}
        >
          •
        </Avatar>
      )}
      <Box
        sx={{
          maxWidth: { xs: '85%', sm: '78%' },
          px: 1.25,
          py: 1,
          borderRadius: 2,
          bgcolor: isOwn ? 'primary.main' : 'grey.200',
          color: isOwn ? 'primary.contrastText' : 'text.primary',
        }}
      >
        <Typography variant="body2" sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
          {message.body}
        </Typography>
      </Box>
    </Box>
  );
}

const NetworkMessageDrawer = ({ open, onClose, peer }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const messagesEndRef = useRef(null);
  const [draft, setDraft] = useState('');

  const peerMemberId = peer?.memberId ?? null;
  const { conversation, currentMemberId, isPending } = useNetworkConversation(
    peerMemberId,
    open,
  );
  const {
    sendMessage,
    isSending,
    acceptConversation,
    isAccepting,
    declineConversation,
    isDeclining,
  } = useNetworkConversationActions(peerMemberId);

  const mode = conversation ? getConversationUiMode(conversation, currentMemberId) : 'new';
  const banner = conversation
    ? getConversationBanner(mode, conversation, currentMemberId, peer?.fullName)
    : null;
  const composerEnabled =
    conversation && isComposerEnabled(mode, conversation, currentMemberId);
  const messages = conversation?.messages ?? [];

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => setDraft(''), 0);
      return () => clearTimeout(timer);
    }
  }, [open, peerMemberId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, open]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text || !composerEnabled) return;
    sendMessage(text, {
      onSuccess: () => setDraft(''),
    });
  };

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    handleSend();
  };

  const avatarSrc = peer?.avatarUrl || DEFAULT_CHAT_AVATAR_SRC;
  const cohortLabel =
    peer?.startYear != null && peer.startYear !== '' ? peer.startYear : null;
  const programLabel = formatAcademicValue(peer?.program);
  const majorLabel = formatAcademicValue(peer?.major);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 420, md: 440 },
          maxWidth: '100%',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 1,
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Avatar src={avatarSrc} sx={{ width: 48, height: 48 }}>
            {initials(peer?.fullName)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              {peer?.fullName ?? 'Thành viên'}
            </Typography>
            {(cohortLabel || programLabel || majorLabel) && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {[cohortLabel && `Khóa ${cohortLabel}`, programLabel, majorLabel]
                  .filter(Boolean)
                  .join(' · ')}
              </Typography>
            )}
          </Box>
        </Stack>
        <IconButton size="small" onClick={onClose} aria-label="Đóng">
          <CloseIcon />
        </IconButton>
      </Box>

      {banner ? (
        <Alert severity={banner.severity} sx={{ mx: 2, mt: 1.5, borderRadius: 1.5 }}>
          {banner.text}
        </Alert>
      ) : null}

      {mode === 'pending_recipient' ? (
        <Stack direction="row" spacing={1} sx={{ px: 2, pt: 1.5 }}>
          <Button
            variant="contained"
            fullWidth
            disabled={isAccepting || isDeclining}
            onClick={() => acceptConversation()}
          >
            {isAccepting ? <CircularProgress size={22} color="inherit" /> : 'Chấp nhận'}
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            fullWidth
            disabled={isAccepting || isDeclining}
            onClick={() => declineConversation()}
          >
            {isDeclining ? <CircularProgress size={22} /> : 'Từ chối'}
          </Button>
        </Stack>
      ) : null}

      <Scrollbar
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
        {isPending ? (
          <Stack alignItems="center" py={4}>
            <CircularProgress size={32} />
          </Stack>
        ) : messages.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
            {mode === 'new'
              ? 'Chưa có tin nhắn. Hãy gửi lời chào đầu tiên.'
              : 'Chưa có tin nhắn.'}
          </Typography>
        ) : (
          messages.map((msg) => (
            <NetworkMessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderMemberId === currentMemberId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </Scrollbar>

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
          pb: isMobile ? 'max(12px, env(safe-area-inset-bottom))' : 1.5,
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder={getComposerPlaceholder(mode)}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!composerEnabled || isSending}
          variant="outlined"
          size="small"
        />
        <IconButton
          color="primary"
          aria-label="Gửi tin nhắn"
          disabled={!composerEnabled || isSending || !draft.trim()}
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
          {isSending ? <CircularProgress size={22} color="inherit" /> : <SendIcon />}
        </IconButton>
      </Box>
    </Drawer>
  );
};

export default NetworkMessageDrawer;
