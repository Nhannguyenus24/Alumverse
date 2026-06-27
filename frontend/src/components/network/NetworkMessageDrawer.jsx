import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Avatar,
  Box,
  CircularProgress,
  Drawer,
  IconButton,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import Scrollbar from '../Scrollbar';
import { useNetworkConversationActions } from '../../hooks/network/useNetworkConversationActions';
import { useNetworkCurrentMemberId } from '../../hooks/network/useNetworkCurrentMemberId';
import {
  isComposerEnabled,
  resolveConnectionDrawerState,
} from '../../utils/networkConnectionDrawerUi';
import { buildProgramMajorRows } from '../../utils/academicUtils';

import ChatAvatar from '../ChatAvatar';

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

const NetworkMessageDrawer = ({
  open,
  onClose,
  peer,
  connectionStatus,
  variant = 'default',
  contextTitle,
  contextSubtitle,
  contextNote,
}) => {
  const { t } = useTranslation(['network']);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const messagesEndRef = useRef(null);
  const [draft, setDraft] = useState('');
  const [sentInSession, setSentInSession] = useState(false);
  const [localMessages, setLocalMessages] = useState([]);

  const peerUserId = peer?.userId ?? null;
  const currentMemberId = useNetworkCurrentMemberId();
  const { sendMessage, isSending } = useNetworkConversationActions(peerUserId);

  const drawerState = resolveConnectionDrawerState(connectionStatus, t);
  const composerEnabled = isComposerEnabled({
    canCompose: drawerState.canCompose,
    singleMessageOnly: drawerState.singleMessageOnly,
    sentInSession,
  });
  const messages = [...drawerState.messages, ...localMessages];

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setDraft('');
        setSentInSession(false);
        setLocalMessages([]);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open, peerUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, open]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text || !composerEnabled) return;

    sendMessage(text, {
      onSuccess: () => {
        setLocalMessages((prev) => [
          ...prev,
          {
            id: `local-${Date.now()}`,
            body: text,
            senderMemberId: currentMemberId,
          },
        ]);
        setDraft('');
        if (drawerState.singleMessageOnly) {
          setSentInSession(true);
        }
      },
    });
  };

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    handleSend();
  };

  const academicRows = buildProgramMajorRows(peer?.program, peer?.major);

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
          <ChatAvatar avatarUrl={peer?.avatarUrl} name={peer?.fullName} size={48} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              {variant === 'connect' && contextTitle
                ? contextTitle
                : (peer?.fullName ?? t('network:member_fallback_name'))}
            </Typography>
            {variant === 'connect' && contextSubtitle ? (
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                {contextSubtitle}
              </Typography>
            ) : (
              academicRows.map((row, index) => (
                <Typography
                  key={`${row.program}-${row.major}-${index}`}
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  sx={{ display: 'block' }}
                >
                  {[row.program, row.major].filter(Boolean).join(' · ')}
                </Typography>
              ))
            )}
          </Box>
        </Stack>
        <IconButton size="small" onClick={onClose} aria-label={t('network:close_aria')}>
          <CloseIcon />
        </IconButton>
      </Box>

      {variant === 'connect' && contextNote ? (
        <Alert severity="info" sx={{ mx: 2, mt: 1.5, borderRadius: 1.5 }}>
          {contextNote}
        </Alert>
      ) : null}

      {drawerState.banner ? (
        <Alert severity={drawerState.banner.severity} sx={{ mx: 2, mt: 1.5, borderRadius: 1.5 }}>
          {drawerState.banner.text}
        </Alert>
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
        {messages.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
            {drawerState.emptyHint}
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
          placeholder={drawerState.composerPlaceholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!composerEnabled || isSending}
          variant="outlined"
          size="small"
        />
        <IconButton
          color="primary"
          aria-label={t('network:send_message_aria')}
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
