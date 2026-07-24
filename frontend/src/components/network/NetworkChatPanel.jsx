import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ScrollReveal } from '../animations/ScrollReveal';
import {
  alpha,
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
import AttachFileIcon from '@mui/icons-material/AttachFile';

import Scrollbar from '../Scrollbar';
import ChatEmojiPickerButton from '../ChatEmojiPickerButton';
import { insertTextAtInputSelection } from '../../utils/insertTextAtInputSelection';
import ConfirmDialog from '../ConfirmDialog';
import IconButtonMenu from '../IconButtonMenu';
import GroupMembersDrawer from './GroupMembersDrawer';
import { useChatMessages } from '../../hooks/chat/useChatMessages';
import { applyIncomingMessageToChatLists } from '../../hooks/chat/invalidateChatQueries';
import { useGroupBlockedMembersContext } from '../../hooks/chat/useGroupBlockedMembersContext';
import { usePeerActiveStatus } from '../../hooks/chat/usePeerActiveStatus';
import { useChatWebSocket } from '../../hooks/mentorship/useChatWebSocket';
import { useBlockUser } from '../../hooks/network/useBlockUser';
import { useNotification } from '../../hooks/useNotification';
import useAuthStore from '../../stores/authStore';
import ChatAvatar from '../ChatAvatar';
import { buildGroupBlockedMembersBannerMessage } from '../../utils/formatBlockedMemberNames';
import { useCanContribute } from '../../hooks/useCanContribute';
import { chatApi } from '../../utils/api';
import {
  CHAT_ATTACHMENT_ACCEPT,
  fileToBase64,
  isAnimatedGif,
  isChatImageExtension,
  isChatVideoExtension,
  validateChatImageFile,
  validateVideoFile,
} from '../../utils/imageUtils';
import ChatMessageMedia from './ChatMessageMedia';
import ChatDateSeparator from './ChatDateSeparator';
import { exceedsLengthLimit, MAX_MESSAGE_LENGTH } from '../../utils/messageContent';
import {
  formatChatTime,
  formatChatDateSeparator,
  isSameCalendarDay,
} from '../../utils/dateFormatter';


const SCROLL_TOP_THRESHOLD = 8;

const NetworkChatPanel = ({ activeChat, onLeaveGroup, onBack }) => {
  const { t } = useTranslation(['network', 'common']);
  const queryClient = useQueryClient();
  const { canUseBasicActions } = useCanContribute();
  const { showError } = useNotification();
  const [draft, setDraft] = useState('');
  const draftInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [membersDrawerOpen, setMembersDrawerOpen] = useState(false);
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
  const token = useAuthStore((state) => state.token ?? null);
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);

  const isPrivateChat = activeChat?.type === 'PRIVATE';
  const isGroupChat = activeChat?.type === 'GROUP';
  const peerMemberId = isPrivateChat ? activeChat?.peerMemberId ?? null : null;
  const blockedByMe = Boolean(activeChat?.blockedByMe);
  const blockedByPeer = Boolean(activeChat?.blockedByPeer);

  const { peerActive } = usePeerActiveStatus(peerMemberId, {
    enabled: isPrivateChat && !blockedByMe && !blockedByPeer,
  });
  const peerInactive = isPrivateChat && !blockedByMe && !blockedByPeer && !peerActive;

  const isMessagingBlocked = blockedByMe || blockedByPeer || peerInactive;

  const { blockUser, unblockUser, isPending: isBlockActionPending } = useBlockUser({
    targetMemberId: peerMemberId,
    onSuccess: () => setBlockConfirmOpen(false),
  });

  const { messages, isLoading, isLoadingMore, hasMore, loadMore, appendMessage, resyncMessages } = useChatMessages(
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
    // Keep the left column's preview + ordering in sync for the open conversation. This is
    // the only signal the sender gets (the SSE new-message fan-out excludes the sender), so
    // it stops the sender's own sidebar from drifting. The chat is open, so never unread.
    applyIncomingMessageToChatLists(queryClient, {
      chatId: p.groupId,
      preview: p.content,
      createdAt: p.createdAt,
      markUnread: false,
    });
  }, [queryClient]);

  const resyncMessagesRef = useRef(resyncMessages);
  useEffect(() => { resyncMessagesRef.current = resyncMessages; }, [resyncMessages]);

  const handleWsReconnect = useCallback(() => {
    resyncMessagesRef.current?.();
  }, []);

  const { joinGroup, leaveGroup, sendMessage: wsSendMessage, isOpen } = useChatWebSocket({
    token,
    onEvent: handleWsEvent,
    onReconnect: handleWsReconnect,
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
    const timer = window.setTimeout(() => setMembersDrawerOpen(false), 0);
    return () => window.clearTimeout(timer);
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

  // After a real-time message arrives: always scroll to bottom for our own message,
  // otherwise only scroll if already near bottom (avoid yanking while reading history)
  useEffect(() => {
    const el = scrollRef.current;
    const prevCount = prevMessageCountRef.current;
    const newCount = messages.length;
    prevMessageCountRef.current = newCount;

    if (!el || isLoadingMore || newCount <= prevCount) return;
    if (isInitialLoadRef.current) return;

    const lastMsg = messages[newCount - 1];
    const isOwnMessage = lastMsg && lastMsg.senderMemberId === currentUserId;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (isOwnMessage || isNearBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isLoadingMore, currentUserId]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !hasMore || isLoadingMore) return;
    if (el.scrollTop <= SCROLL_TOP_THRESHOLD) {
      prevScrollHeightRef.current = el.scrollHeight;
      loadMore();
    }
  }, [hasMore, isLoadingMore, loadMore]);

  // --- Send ---
  const isInputDisabled = !isOpen || isMessagingBlocked;
  const charCount = draft.length;
  const atLengthLimit = charCount >= MAX_MESSAGE_LENGTH;

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text || !activeChat?.id || !isOpen || isMessagingBlocked) return;
    if (exceedsLengthLimit(text)) {
      showError(t('network:chat.message_too_long', { max: MAX_MESSAGE_LENGTH }));
      return;
    }
    wsSendMessage({ groupId: activeChat.id, content: text, chatType: activeChat?.type });
    setDraft('');
  }, [draft, activeChat, isOpen, isMessagingBlocked, wsSendMessage, showError, t]);

  const handleKeyDown = useCallback((event) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    handleSend();
  }, [handleSend]);

  const handleEmojiSelect = useCallback((emoji) => {
    insertTextAtInputSelection(draftInputRef, setDraft, emoji);
  }, []);

  const isAttachDisabled = isInputDisabled || isUploadingAttachment;

  const handleAttachClick = useCallback(() => {
    if (isAttachDisabled) return;
    fileInputRef.current?.click();
  }, [isAttachDisabled]);

  const handleFileSelected = useCallback(async (event) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';
    if (!file || !activeChat?.id) return;

    const isVideo = isChatVideoExtension(file.name);
    const isImage = !isVideo && isChatImageExtension(file.name);

    if (!isVideo && !isImage) {
      showError(t('network:chat.file_type_unsupported'));
      return;
    }

    const validation = isVideo ? validateVideoFile(file, t) : validateChatImageFile(file, t);
    if (!validation.valid) {
      showError(validation.message);
      return;
    }

    setIsUploadingAttachment(true);
    try {
      const base64 = await fileToBase64(file);
      const useRawUpload = isVideo || isAnimatedGif(file.name);
      const url = useRawUpload
        ? await chatApi.uploadChatMedia({ base64String: base64, fileName: file.name })
        : await chatApi.uploadChatImage(base64);

      if (!url) throw new Error('upload_failed');

      wsSendMessage({
        groupId: activeChat.id,
        content: url,
        chatType: activeChat?.type,
        messageType: isVideo ? 'VIDEO' : 'IMAGE',
        metadata: { fileName: file.name, size: file.size, mimeType: file.type },
      });
    } catch (error) {
      showError(error?.response?.data?.message ?? t('network:chat.upload_failed'));
    } finally {
      setIsUploadingAttachment(false);
    }
  }, [activeChat?.id, activeChat?.type, showError, t, wsSendMessage]);

  return (
    <ScrollReveal
      direction="left"
      distance={18}
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
                  disabled={isBlockActionPending || !canUseBasicActions}
                  onClick={() => {
                    close();
                    if (!canUseBasicActions) return;
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
                  disabled={isBlockActionPending || !canUseBasicActions}
                  onClick={() => {
                    close();
                    if (!canUseBasicActions) return;
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
            bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.16 : 0.08),
            color: 'primary.main',
            '& .MuiAlert-icon': { color: 'primary.main' },
            '& .MuiAlert-message': { flex: 1 },
          }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => { if (canUseBasicActions) unblockUser(); }}
              disabled={isBlockActionPending || !canUseBasicActions}
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

      {peerInactive ? (
        <Alert severity="warning" sx={{ borderRadius: 0 }}>
          {t('network:peer_inactive_user', { name: activeChat?.name })}
        </Alert>
      ) : null}

      {isGroupChat && groupBlockedBannerMessage ? (
        <Alert
          severity="info"
          sx={{
            borderRadius: 0,
            alignItems: 'center',
            bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.16 : 0.08),
            color: 'primary.main',
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
          messages.map((msg, index) => {
            const isOwn = msg.senderMemberId === currentUserId;
            const prev = messages[index - 1];
            const showDateSeparator =
              !prev || !isSameCalendarDay(prev.createdAt, msg.createdAt);
            return (
              <Fragment key={msg.id}>
                {showDateSeparator && (
                  <ChatDateSeparator label={formatChatDateSeparator(msg.createdAt, t)} />
                )}
              <Box
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
                  {msg.messageType === 'IMAGE' || msg.messageType === 'VIDEO' ? (
                    <ChatMessageMedia
                      messageType={msg.messageType}
                      url={msg.content}
                      metadata={msg.metadata}
                    />
                  ) : (
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        width: 'fit-content',
                        maxWidth: '100%',
                        px: 1.5,
                        py: 1.25,
                        borderRadius: 999,
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
                  )}
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
                    {formatChatTime(msg.createdAt)}
                  </Typography>
                </Box>
              </Box>
              </Fragment>
            );
          })}
      </Scrollbar>

      {/* Character counter — shown as the message nears / reaches the limit */}
      {charCount > MAX_MESSAGE_LENGTH * 0.8 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0, px: 2, pt: 0.5 }}>
          <Typography
            variant="caption"
            sx={{ color: atLengthLimit ? 'primary.main' : 'text.secondary' }}
          >
            {t('network:chat.char_count', { count: charCount, max: MAX_MESSAGE_LENGTH })}
          </Typography>
          <Typography variant="caption" sx={{ color: atLengthLimit ? 'primary.main' : 'text.disabled' }}>
            {t('network:chat.char_count_hint')}
          </Typography>
        </Box>
      )}

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
        <input
          ref={fileInputRef}
          type="file"
          accept={CHAT_ATTACHMENT_ACCEPT}
          onChange={handleFileSelected}
          style={{ display: 'none' }}
        />
        <Tooltip title={t('network:chat.attach_file')} placement="top">
          <span>
            <IconButton
              size="small"
              aria-label={t('network:chat.attach_file')}
              onClick={handleAttachClick}
              disabled={isAttachDisabled}
              sx={{ flexShrink: 0 }}
            >
              {isUploadingAttachment ? (
                <CircularProgress size={20} />
              ) : (
                <AttachFileIcon fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip
          title={
            blockedByMe
              ? t('network:blocked_placeholder')
              : blockedByPeer
                ? t('network:cannot_message_placeholder')
                : peerInactive
                  ? t('network:peer_inactive_placeholder')
                  : ''
          }
          placement="top"
          disableHoverListener={!isMessagingBlocked}
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
            inputProps={{ maxLength: MAX_MESSAGE_LENGTH }}
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 999,
                minHeight: 48,
                alignItems: 'center',
                pr: 1,
                ...(atLengthLimit && {
                  '& fieldset': { borderColor: 'primary.main' },
                  '&:hover fieldset': { borderColor: 'primary.main' },
                  '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                }),
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
            <Typography component="strong" variant="inherit" sx={{ color: 'text.primary', fontWeight: 700 }}>
              {t('network:block_note')}
            </Typography>
            {' '}{t('network:block_result_note')}
          </>
        )}
        confirmText={t('network:block')}
        cancelText={t('network:cancel')}
        confirmColor="primary"
        loading={isBlockActionPending}
        onConfirm={() => { if (canUseBasicActions) blockUser(); }}
        onCancel={() => setBlockConfirmOpen(false)}
      />
    </ScrollReveal>
  );
};

export default NetworkChatPanel;
