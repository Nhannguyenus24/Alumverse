import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  alpha,
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
import { useCanContribute } from '../../hooks/useCanContribute';
import { usePeerVerificationCounterparts } from '../../hooks/usePeerVerificationCounterparts';
import { VerificationRequiredAlert } from '../ContributeGuard';
import {
  isComposerEnabled,
  resolveConnectionDrawerState,
} from '../../utils/networkConnectionDrawerUi';
import { buildProgramMajorRows } from '../../utils/academicUtils';
import { CONVERSATION_REQUEST_STATUS } from '../../constants/conversationRequestStatus';
import { exceedsLengthLimit, MAX_MESSAGE_LENGTH } from '../../utils/messageContent';

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
          bgcolor: (theme) => isOwn
            ? theme.palette.primary.main
            : alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.1 : 0.06),
          color: isOwn ? 'primary.contrastText' : 'text.primary',
          border: '1px solid',
          borderColor: (theme) => isOwn
            ? alpha(theme.palette.primary.main, 0.35)
            : alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.16 : 0.1),
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
  const [statusOverride, setStatusOverride] = useState(null);

  const peerUserId = peer?.userId ?? null;
  const currentMemberId = useNetworkCurrentMemberId();
  const { canContribute } = useCanContribute();
  const { counterparts } = usePeerVerificationCounterparts();
  const { sendMessage, isSending } = useNetworkConversationActions(peerUserId);

  // A pending/verified peer-verification counterpart may message even below the
  // general contribute threshold — that specific conversation is auto-accepted
  // server-side, so the composer shouldn't be blocked here.
  const isPeerVerificationCounterpart = peerUserId != null && counterparts.includes(peerUserId);

  const drawerState = resolveConnectionDrawerState(statusOverride ?? connectionStatus, t);
  const charCount = draft.length;
  const atLengthLimit = charCount >= MAX_MESSAGE_LENGTH;
  const composerEnabled = (canContribute || isPeerVerificationCounterpart) && isComposerEnabled({
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
        setStatusOverride(null);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open, peerUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, open]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text || !composerEnabled || exceedsLengthLimit(text)) return;

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
          setStatusOverride({
            status: CONVERSATION_REQUEST_STATUS.PENDING,
            cooldownUntil: null,
            latestMessage: null,
          });
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
          // Full screen on mobile; a ~2/3-height panel on larger screens docked
          // to the bottom (LinkedIn-style) — flush with the bottom edge, gap
          // only at the top — and nudged in from the right edge.
          height: { xs: '100%', sm: '66vh' },
          maxHeight: '100%',
          top: { xs: 0, sm: 'auto' },
          bottom: 0,
          right: { xs: 0, sm: '8vw' },
          borderRadius: { xs: 0, sm: '12px 12px 0 0' },
          boxShadow: (theme) => theme.shadows[16],
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
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

      {!isPeerVerificationCounterpart && <VerificationRequiredAlert sx={{ borderRadius: 0 }} />}

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
          inputProps={{ maxLength: MAX_MESSAGE_LENGTH }}
          sx={{
            ...(atLengthLimit && {
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: 'primary.main' },
                '&:hover fieldset': { borderColor: 'primary.main' },
                '&.Mui-focused fieldset': { borderColor: 'primary.main' },
              },
            }),
          }}
          helperText={
            charCount > MAX_MESSAGE_LENGTH * 0.8
              ? `${t('network:chat.char_count', { count: charCount, max: MAX_MESSAGE_LENGTH })} · ${t('network:chat.char_count_hint')}`
              : undefined
          }
          FormHelperTextProps={{
            sx: { color: atLengthLimit ? 'primary.main' : 'text.secondary' },
          }}
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
