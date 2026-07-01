import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpen';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import Scrollbar from '../Scrollbar';
import ChatEmojiPickerButton from '../ChatEmojiPickerButton';
import { insertTextAtInputSelection } from '../../utils/insertTextAtInputSelection';
import ConfirmDialog from '../ConfirmDialog';
import IconButtonMenu from '../IconButtonMenu';
import GroupMembersDrawer from './GroupMembersDrawer';
import { useChatMessages } from '../../hooks/chat/useChatMessages';
import { useGroupBlockedMembersContext } from '../../hooks/chat/useGroupBlockedMembersContext';
import { useChatWebSocket } from '../../hooks/mentorship/useChatWebSocket';
import { useBlockUser } from '../../hooks/network/useBlockUser';
import useAuthStore from '../../stores/authStore';
import ChatAvatar from '../ChatAvatar';
import { buildGroupBlockedMembersBannerMessage } from '../../utils/formatBlockedMemberNames';
import { useCanContribute } from '../../hooks/useCanContribute';

function formatTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}


const SCROLL_TOP_THRESHOLD = 8;

const NetworkChatPanel = ({ activeChat, onLeaveGroup, onBack }) => {
  const { t } = useTranslation(['network', 'common']);
  const { canContribute, isAuthenticated } = useCanContribute();
  const [draft, setDraft] = useState('');
  const draftInputRef = useRef(null);
  const [membersDrawerOpen, setMembersDrawerOpen] = useState(false);
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
  const token = useAuthStore((state) => state.token ?? null);
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);

  const isPrivateChat = activeChat?.type === 'PRIVATE';
  const isGroupChat = activeChat?.type === 'GROUP';
  const peerMemberId = isPrivateChat ? activeChat?.peerMemberId ?? null : null;
  const blockedByMe = Boolean(activeChat?.blockedByMe);
  const blockedByPeer = Boolean(activeChat?.blockedByPeer);
  const isMessagingBlocked = blockedByMe || blockedByPeer;

  const { blockUser, unblockUser, isPending: isBlockActionPending } = useBlockUser({
    targetMemberId: peerMemberId,
    onSuccess: () => setBlockConfirmOpen(false),
  });

  const { messages, isLoading, isLoadingMore, hasMore, loadMore, appendMessage } = useChatMessages(
    activeChat?.id ?? null,
  );

  const {
    blockedMembers: blockedMembersInGroup,
    isOwner: isGroupOwner,
    hasBlockedMembersInGroup,
  } = useGroupBlockedMembersContext(activeChat?.id ?? null, {
    enabled: isGroupChat && activeChat?.id != null,
  });

  const groupBlockedBannerMessage = hasBlockedMembersInGroup
    ? buildGroupBlockedMembersBannerMessage(blockedMembersInGroup, isGroupOwner, t)
    : null;

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
      senderFullName: p.senderFullName ?? null,
      senderAvatarUrl: p.senderAvatarUrl ?? null,
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

  useEffect(() => {
    setMembersDrawerOpen(false);
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
  const isInputDisabled = !isOpen || isMessagingBlocked || !canContribute;

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text || !activeChat?.id || !isOpen || isMessagingBlocked || !canContribute) return;
    wsSendMessage({ groupId: activeChat.id, content: text, chatType: activeChat?.type });
    setDraft('');
  }, [draft, activeChat?.id, activeChat?.type, isOpen, isMessagingBlocked, canContribute, wsSendMessage]);

  const handleKeyDown = useCallback((event) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    handleSend();
  }, [handleSend]);

  const handleEmojiSelect = useCallback((emoji) => {
    insertTextAtInputSelection(draftInputRef, setDraft, emoji);
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: { xs: '1 1 auto', md: 1 },
        minWidth: 0,
        minHeight: 0,
        width: '100%',
        height: '100%',
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
          py: 0,
          minHeight: 72,
          flexShrink: 0,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          {onBack ? (
            <IconButton
              size="small"
              aria-label={t('network:back_to_chat_list')}
              onClick={onBack}
              sx={{ flexShrink: 0 }}
            >
              <ArrowBackIcon />
            </IconButton>
          ) : null}
          <ChatAvatar
            avatarUrl={activeChat?.avatarUrl}
            name={activeChat?.name}
            size={40}
            variant={activeChat?.type === 'GROUP' ? 'group' : 'user'}
          />
          <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2} noWrap>
              {activeChat?.name ?? 'Network Chat'}
            </Typography>
            {activeChat?.type === 'GROUP' && (
              <Typography variant="caption" color="text.secondary" lineHeight={1.15} noWrap>
                {t('network:group_chat_label')}
              </Typography>
            )}
          </Box>
        </Box>
        {isPrivateChat && !blockedByPeer ? (
          <IconButtonMenu
            menuId="network-chat-private-menu"
            buttonAriaLabel={t('network:chat_options_aria')}
          >
            {({ close }) => (
              blockedByMe ? (
                <MenuItem
                  disabled={isBlockActionPending || !canContribute}
                  onClick={() => {
                    close();
                    if (!canContribute) return;
                    unblockUser();
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <LockOpenOutlinedIcon fontSize="small" color="success" />
                  </ListItemIcon>
                  <ListItemText primary={t('network:unblock_user')} primaryTypographyProps={{ variant: 'body2' }} />
                </MenuItem>
              ) : (
                <MenuItem
                  disabled={isBlockActionPending || !canContribute}
                  onClick={() => {
                    close();
                    if (!canContribute) return;
                    setBlockConfirmOpen(true);
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <BlockOutlinedIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={t('network:block_user')} primaryTypographyProps={{ variant: 'body2' }} />
                </MenuItem>
              )
            )}
          </IconButtonMenu>
        ) : isPrivateChat ? null : (
          <IconButton
            size="small"
            aria-label={t('network:view_group_members')}
            disabled={activeChat?.type !== 'GROUP'}
            onClick={() => setMembersDrawerOpen(true)}
          >
            <MoreHorizIcon />
          </IconButton>
        )}
      </Box>

      {isPrivateChat && blockedByMe ? (
        <Alert
          severity="info"
          sx={{
            borderRadius: 0,
            alignItems: 'center',
            bgcolor: 'primary.lighter',
            color: 'primary.dark',
            '& .MuiAlert-icon': { color: 'primary.main' },
            '& .MuiAlert-message': { flex: 1 },
          }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => { if (canContribute) unblockUser(); }}
              disabled={isBlockActionPending || !canContribute}
              sx={{ fontWeight: 700, textTransform: 'none' }}
            >
              {t('network:unblock')}
            </Button>
          }
        >
          {t('network:you_blocked_user', { name: activeChat?.name })}
        </Alert>
      ) : null}

      {isPrivateChat && blockedByPeer ? (
        <Alert severity="info" sx={{ borderRadius: 0 }}>
          {t('network:cannot_message_user', { name: activeChat?.name })}
        </Alert>
      ) : null}

      {isGroupChat && groupBlockedBannerMessage ? (
        <Alert
          severity="info"
          sx={{
            borderRadius: 0,
            alignItems: 'center',
            bgcolor: 'primary.lighter',
            color: 'primary.dark',
            '& .MuiAlert-icon': { color: 'primary.main' },
            '& .MuiAlert-message': { flex: 1 },
          }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => setMembersDrawerOpen(true)}
              sx={{ fontWeight: 700, textTransform: 'none' }}
            >
              {t('group_settings')}
            </Button>
          }
        >
          {groupBlockedBannerMessage}
        </Alert>
      ) : null}

      <GroupMembersDrawer
        open={membersDrawerOpen}
        onClose={() => setMembersDrawerOpen(false)}
        groupId={activeChat?.type === 'GROUP' ? activeChat.id : null}
        groupName={activeChat?.name}
        currentUserId={currentUserId}
        onLeaveSuccess={onLeaveGroup}
      />

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
            {t('messages_all_loaded')}
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
              {t('no_messages_yet')}
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
                  alignItems: 'flex-start',
                  gap: 1,
                }}
              >
                {!isOwn && (
                  <Box sx={{ mt: msg.senderFullName ? 2.6 : 0 }}>
                    <ChatAvatar
                      avatarUrl={msg.senderAvatarUrl}
                      name={msg.senderFullName ?? `User ${msg.senderMemberId}`}
                      size={32}
                    />
                  </Box>
                )}
                <Box
                  sx={{
                    maxWidth: { xs: '85%', sm: '72%' },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isOwn ? 'flex-end' : 'flex-start',
                  }}
                >
                  {!isOwn && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                      {msg.senderFullName ?? `User ${msg.senderMemberId}`}
                    </Typography>
                  )}
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      width: 'fit-content',
                      maxWidth: '100%',
                      px: 1.5,
                      py: 1.25,
                      borderRadius: 999,
                      bgcolor: isOwn ? 'primary.main' : 'grey.200',
                      color: isOwn ? 'primary.contrastText' : 'text.primary',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        lineHeight: 1.35,
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {msg.content}
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    sx={{
                      display: 'block',
                      mt: 0.25,
                      textAlign: isOwn ? 'right' : 'left',
                      mx: 0.5,
                      fontSize: '0.68rem',
                      lineHeight: 1.25,
                      whiteSpace: 'nowrap',
                    }}
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
          pt: 1.5,
          pb: { xs: 'max(12px, env(safe-area-inset-bottom))', md: 1.5 },
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Tooltip
          title={
            blockedByMe
              ? t('network:blocked_placeholder')
              : blockedByPeer
                ? t('network:cannot_message_placeholder')
                : !canContribute
                  ? (isAuthenticated ? t('common:verification_required_tooltip') : t('common:verification_required_login'))
                  : ''
          }
          placement="top"
          disableHoverListener={!isMessagingBlocked && canContribute}
        >
          <TextField
            fullWidth
            multiline
            maxRows={4}
            inputRef={draftInputRef}
            placeholder={
              isMessagingBlocked
                ? t('network:cannot_send_placeholder')
                : isOpen
                  ? t('network:message_input_placeholder')
                  : t('network:connecting_placeholder')
            }
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isInputDisabled}
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 999,
                minHeight: 48,
                alignItems: 'center',
                pr: 1,
              },
              '& .MuiOutlinedInput-input': {
                py: 1,
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <ChatEmojiPickerButton
                    disabled={isInputDisabled}
                    onEmojiSelect={handleEmojiSelect}
                  />
                </InputAdornment>
              ),
            }}
          />
        </Tooltip>
        <IconButton
          color="primary"
          aria-label="Send"
          disabled={isInputDisabled || !draft.trim()}
          onClick={handleSend}
          sx={{
            width: 40,
            height: 40,
            p: 0,
            alignSelf: 'center',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': { bgcolor: 'primary.dark' },
            '&.Mui-disabled': {
              bgcolor: 'action.disabledBackground',
              color: 'action.disabled',
            },
          }}
        >
          <SendIcon fontSize="small" />
        </IconButton>
      </Box>

      <ConfirmDialog
        open={blockConfirmOpen}
        title={t('network:block_dialog_title')}
        message={(
          <>
            {t('network:block_dialog_message', { name: activeChat?.name ?? t('network:this_user') })}
            {' '}
            <strong style={{ color: 'rgba(0, 0, 0, 0.87)' }}>
              {t('network:block_note')}
            </strong>
            {' '}{t('network:block_result_note')}
          </>
        )}
        confirmText={t('network:block')}
        cancelText={t('network:cancel')}
        confirmColor="primary"
        loading={isBlockActionPending}
        onConfirm={() => { if (canContribute) blockUser(); }}
        onCancel={() => setBlockConfirmOpen(false)}
      />
    </Box>
  );
};

export default NetworkChatPanel;
