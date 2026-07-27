import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { keyframes } from '@mui/material/styles';
import { ScrollReveal } from '../animations/ScrollReveal';
import {
  alpha,
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  ClickAwayListener,
  IconButton,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  TextField,
  Tooltip,
  Typography,
  Link,
} from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpen';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';

import Scrollbar from '../Scrollbar';
import ChatEmojiPickerButton from '../ChatEmojiPickerButton';
import ChatGifPickerButton from '../ChatGifPickerButton';
import { insertTextAtInputSelection } from '../../utils/insertTextAtInputSelection';
import ConfirmDialog from '../ConfirmDialog';
import IconButtonMenu from '../IconButtonMenu';
import GroupMembersDrawer from './GroupMembersDrawer';
import { useChatMessages } from '../../hooks/chat/useChatMessages';
import { useGroupMembers } from '../../hooks/chat/useGroupMembers';
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
const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const TYPING_STALE_MS = 4000;
const TYPING_IDLE_MS = 2500;
const MENTION_MAX_CANDIDATES = 6;
// Sentinel id for the synthetic "@all" (tag everyone) picker entry.
const ALL_MENTION_ID = '__all__';
// The literal token inserted into the draft / persisted in metadata for @all.
const ALL_MENTION_NAME = 'all';

// Three dots that bounce up in sequence — the Facebook-style "is typing" motion.
const typingBounce = keyframes`
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-4px); opacity: 1; }
`;

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Mentions are stored in the message metadata (a JSON string from the REST API,
// an already-parsed object from the live WebSocket broadcast) as { mentions: [...] }.
function parseMentions(metadata) {
  if (!metadata) return [];
  let obj = metadata;
  if (typeof metadata === 'string') {
    try {
      obj = JSON.parse(metadata);
    } catch {
      return [];
    }
  }
  return Array.isArray(obj?.mentions) ? obj.mentions : [];
}

// Finds the @mention token the caret is currently sitting in, if any. The token
// starts at an '@' that is at the very start of the text or preceded by whitespace,
// and runs up to the caret (spaces allowed, since names contain them).
function getMentionToken(text, caret) {
  const upto = text.slice(0, caret);
  const at = upto.lastIndexOf('@');
  if (at === -1) return null;
  if (at > 0 && !/\s/.test(text[at - 1])) return null;
  const query = upto.slice(at + 1);
  if (query.includes('\n')) return null;
  return { start: at, query };
}

function renderMessageContent(content, isOwn, mentions) {
  if (!content) return null;

  const names = (mentions ?? [])
    .map((m) => m?.name)
    .filter(Boolean)
    // Longest first so "@An Nguyen" wins over a shorter "@An" prefix.
    .sort((a, b) => b.length - a.length);
  const mentionRegex = names.length
    ? new RegExp(`(@(?:${names.map(escapeRegExp).join('|')}))`, 'g')
    : null;

  const mentionSx = isOwn
    ? { fontWeight: 700, textDecoration: 'underline' }
    : { fontWeight: 600, color: 'primary.main' };

  let key = 0;
  const renderWithMentions = (text) => {
    if (!mentionRegex) return text;
    return text.split(mentionRegex).map((chunk) => {
      if (chunk && chunk.startsWith('@') && names.includes(chunk.slice(1))) {
        key += 1;
        return (
          <Box key={`m-${key}`} component="span" sx={mentionSx}>
            {chunk}
          </Box>
        );
      }
      key += 1;
      return <Fragment key={`t-${key}`}>{chunk}</Fragment>;
    });
  };

  const parts = content.split(URL_REGEX);
  return parts.map((part, index) => {
    if (part.match(URL_REGEX)) {
      return (
        <Link
          key={`u-${index}`}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            color: 'inherit',
            textDecoration: 'underline',
            '&:hover': {
              opacity: 0.8,
            },
          }}
        >
          {part}
        </Link>
      );
    }
    return <Fragment key={`p-${index}`}>{renderWithMentions(part)}</Fragment>;
  });
}

const NetworkChatPanel = ({ activeChat, onLeaveGroup, onBack }) => {
  const { t } = useTranslation(['network', 'common']);
  const queryClient = useQueryClient();
  const { canUseBasicActions } = useCanContribute();
  const { showError } = useNotification();
  const [draft, setDraft] = useState('');
  const draftInputRef = useRef(null);
  const inputAreaRef = useRef(null);
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

  // --- @Mention (group chats only) ---
  const { members: groupMembers } = useGroupMembers(activeChat?.id ?? null, {
    enabled: isGroupChat && activeChat?.id != null,
  });
  // mentionQuery === null means the picker is closed.
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  // Members the user actually picked in this draft; used to tag the outgoing message.
  const [selectedMentions, setSelectedMentions] = useState([]);

  const mentionCandidates = useMemo(() => {
    if (mentionQuery == null) return [];
    const q = mentionQuery.toLowerCase();
    const others = groupMembers.filter((m) => m.memberId !== currentUserId);
    const list = others
      .filter((m) => (m.fullName ?? '').toLowerCase().includes(q))
      .slice(0, MENTION_MAX_CANDIDATES);
    // Offer "@all" (tag everyone) at the top when the query is empty or looks like
    // it targets everyone, and there are at least two other members to address.
    const allLabel = t('network:chat.mention_all', 'Tất cả mọi người').toLowerCase();
    const wantsAll =
      q === '' || 'all'.startsWith(q) || 'everyone'.startsWith(q) || allLabel.startsWith(q);
    if (wantsAll && others.length > 1) {
      return [
        {
          memberId: ALL_MENTION_ID,
          fullName: t('network:chat.mention_all', 'Tất cả mọi người'),
          isAll: true,
        },
        ...list,
      ];
    }
    return list;
  }, [mentionQuery, groupMembers, currentUserId, t]);
  const mentionOpen = mentionQuery != null && mentionCandidates.length > 0;

  // --- Typing indicator ---
  // Map of memberId -> display name for peers currently typing in the open chat.
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimersRef = useRef({});
  const activeChatIdRef = useRef(activeChat?.id ?? null);
  useEffect(() => { activeChatIdRef.current = activeChat?.id ?? null; }, [activeChat?.id]);

  const clearTypingUsers = useCallback(() => {
    Object.values(typingTimersRef.current).forEach((timer) => window.clearTimeout(timer));
    typingTimersRef.current = {};
    setTypingUsers({});
  }, []);

  // Records/refreshes a peer's typing state. Each active peer gets a stale-timer so
  // the indicator disappears even if the "stopped typing" signal is lost.
  const handleTypingSignal = useCallback((memberId, name, isTyping) => {
    const timers = typingTimersRef.current;
    if (timers[memberId]) {
      window.clearTimeout(timers[memberId]);
      delete timers[memberId];
    }
    if (!isTyping) {
      setTypingUsers((prev) => {
        if (!(memberId in prev)) return prev;
        const next = { ...prev };
        delete next[memberId];
        return next;
      });
      return;
    }
    setTypingUsers((prev) => ({ ...prev, [memberId]: name || `User ${memberId}` }));
    timers[memberId] = window.setTimeout(() => {
      delete timers[memberId];
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[memberId];
        return next;
      });
    }, TYPING_STALE_MS);
  }, []);

  // --- WebSocket ---
  const appendMessageRef = useRef(appendMessage);
  useEffect(() => { appendMessageRef.current = appendMessage; }, [appendMessage]);

  const handleWsEvent = useCallback((event) => {
    if (event.type === 'TYPING') {
      const p = event.payload ?? {};
      if (p.memberId === currentUserId) return;
      if (String(p.groupId) !== String(activeChatIdRef.current)) return;
      handleTypingSignal(p.memberId, p.senderName, p.isTyping);
      return;
    }
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
  }, [queryClient, currentUserId, handleTypingSignal]);

  const resyncMessagesRef = useRef(resyncMessages);
  useEffect(() => { resyncMessagesRef.current = resyncMessages; }, [resyncMessages]);

  const handleWsReconnect = useCallback(() => {
    resyncMessagesRef.current?.();
  }, []);

  const { joinGroup, leaveGroup, sendMessage: wsSendMessage, sendTyping, isOpen } = useChatWebSocket({
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

  // Reset per-conversation transient UI when switching chats: drop any peers'
  // typing indicators, close the mention picker and forget pending mentions.
  useEffect(() => {
    clearTypingUsers();
    setMentionQuery(null);
    setSelectedMentions([]);
  }, [activeChat?.id, clearTypingUsers]);

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

  // --- Typing: broadcast our own "is typing" (throttled to one true/false pair per burst) ---
  const typingSentRef = useRef(false);
  const typingIdleTimerRef = useRef(null);

  const stopTyping = useCallback(() => {
    if (typingIdleTimerRef.current) {
      window.clearTimeout(typingIdleTimerRef.current);
      typingIdleTimerRef.current = null;
    }
    if (typingSentRef.current && activeChat?.id != null) {
      typingSentRef.current = false;
      sendTyping({ groupId: activeChat.id, isTyping: false });
    }
  }, [activeChat?.id, sendTyping]);

  const notifyTyping = useCallback(() => {
    if (activeChat?.id == null || !isOpen || isMessagingBlocked) return;
    if (!typingSentRef.current) {
      typingSentRef.current = true;
      sendTyping({ groupId: activeChat.id, isTyping: true });
    }
    if (typingIdleTimerRef.current) window.clearTimeout(typingIdleTimerRef.current);
    typingIdleTimerRef.current = window.setTimeout(() => {
      typingIdleTimerRef.current = null;
      typingSentRef.current = false;
      sendTyping({ groupId: activeChat.id, isTyping: false });
    }, TYPING_IDLE_MS);
  }, [activeChat?.id, isOpen, isMessagingBlocked, sendTyping]);

  // Stop broadcasting typing when switching away or unmounting.
  useEffect(() => stopTyping, [stopTyping]);

  // --- Mention picker: detect the @token at the caret and pick a member ---
  const detectMention = useCallback((value, caret) => {
    if (!isGroupChat) {
      setMentionQuery(null);
      return;
    }
    const token = getMentionToken(value, caret ?? value.length);
    setMentionQuery(token ? token.query : null);
    setMentionIndex(0);
  }, [isGroupChat]);

  const handleSelectMention = useCallback((member) => {
    if (!member) return;
    const input = draftInputRef.current;
    const caret = input?.selectionStart ?? draft.length;
    const token = getMentionToken(draft, caret);
    if (!token) return;
    const mentionText = member.isAll ? `@${ALL_MENTION_NAME} ` : `@${member.fullName} `;
    const mentionEntry = member.isAll
      ? { memberId: ALL_MENTION_ID, name: ALL_MENTION_NAME }
      : { memberId: member.memberId, name: member.fullName };
    const before = draft.slice(0, token.start);
    const after = draft.slice(caret);
    const next = before + mentionText + after;
    setDraft(next);
    setSelectedMentions((prev) =>
      prev.some((m) => m.memberId === mentionEntry.memberId)
        ? prev
        : [...prev, mentionEntry],
    );
    setMentionQuery(null);
    const caretPos = (before + mentionText).length;
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(caretPos, caretPos);
    });
  }, [draft]);

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text || !activeChat?.id || !isOpen || isMessagingBlocked) return;
    if (exceedsLengthLimit(text)) {
      showError(t('network:chat.message_too_long', { max: MAX_MESSAGE_LENGTH }));
      return;
    }
    // Only tag members whose @name survived edits and is still present in the text.
    const mentions = selectedMentions.filter((m) => text.includes(`@${m.name}`));
    wsSendMessage({
      groupId: activeChat.id,
      content: text,
      chatType: activeChat?.type,
      messageType: 'TEXT',
      metadata: mentions.length ? { mentions } : null,
    });
    setDraft('');
    setSelectedMentions([]);
    setMentionQuery(null);
    stopTyping();
  }, [draft, activeChat, isOpen, isMessagingBlocked, selectedMentions, wsSendMessage, showError, t, stopTyping]);

  const handleKeyDown = useCallback((event) => {
    if (mentionOpen) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setMentionIndex((i) => (i + 1) % mentionCandidates.length);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setMentionIndex((i) => (i - 1 + mentionCandidates.length) % mentionCandidates.length);
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        handleSelectMention(mentionCandidates[mentionIndex]);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setMentionQuery(null);
        return;
      }
    }
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    handleSend();
  }, [mentionOpen, mentionCandidates, mentionIndex, handleSelectMention, handleSend]);

  const handleEmojiSelect = useCallback((emoji) => {
    if (draft.length + emoji.length > MAX_MESSAGE_LENGTH) {
      showError(t('network:chat.paste_limit_exceeded', 'Văn bản vượt quá giới hạn {{max}} ký tự và đã bị cắt bớt.', { max: MAX_MESSAGE_LENGTH }));
      return;
    }
    insertTextAtInputSelection(draftInputRef, setDraft, emoji);
  }, [draft.length, showError, t]);

  const handleGifSelect = useCallback((gif) => {
    if (!gif?.url || !activeChat?.id || !isOpen || isMessagingBlocked) return;
    wsSendMessage({
      groupId: activeChat.id,
      content: gif.url,
      chatType: activeChat?.type,
      messageType: 'IMAGE',
      metadata: { fileName: gif.title ? `${gif.title}.gif` : 'giphy.gif', gif: true },
    });
    stopTyping();
  }, [activeChat?.id, activeChat?.type, isOpen, isMessagingBlocked, wsSendMessage, stopTyping]);

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
                    <LockOpenOutlinedIcon fontSize="small" color="error" />
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
                    <BlockOutlinedIcon fontSize="small" color="error" />
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
              color="error"
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
                        {renderMessageContent(msg.content, isOwn, parseMentions(msg.metadata))}
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

      {/* Typing indicator — Facebook-style bouncing dots */}
      {Object.keys(typingUsers).length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, px: 2, pt: 0.5 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              px: 1.25,
              py: 0.75,
              borderRadius: 999,
              bgcolor: (theme) => alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.1 : 0.06),
            }}
          >
            {[0, 1, 2].map((dot) => (
              <Box
                key={dot}
                component="span"
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: 'text.secondary',
                  animation: `${typingBounce} 1.2s ${dot * 0.16}s infinite ease-in-out`,
                }}
              />
            ))}
          </Box>
          <Typography variant="caption" color="text.secondary" noWrap>
            {(() => {
              const names = Object.values(typingUsers);
              if (names.length === 1) {
                return t('network:chat.typing_one', '{{name}} đang soạn tin...', { name: names[0] });
              }
              if (names.length === 2) {
                return t('network:chat.typing_two', '{{name1}} và {{name2}} đang soạn tin...', {
                  name1: names[0],
                  name2: names[1],
                });
              }
              return t('network:chat.typing_others', '{{name}} và {{count}} người khác đang soạn tin...', {
                name: names[0],
                count: names.length - 1,
              });
            })()}
          </Typography>
        </Box>
      )}

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
        ref={inputAreaRef}
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
        {/* @Mention picker */}
        <Popper
          open={mentionOpen}
          anchorEl={inputAreaRef.current}
          placement="top-start"
          style={{ zIndex: 1300, width: inputAreaRef.current?.offsetWidth }}
          modifiers={[{ name: 'offset', options: { offset: [0, 8] } }]}
        >
          <ClickAwayListener onClickAway={() => setMentionQuery(null)}>
            <Paper elevation={6} sx={{ maxHeight: 260, overflowY: 'auto', borderRadius: 2, py: 0.5 }}>
              <MenuList dense disablePadding>
                {mentionCandidates.map((member, idx) => (
                  <MenuItem
                    key={member.memberId}
                    selected={idx === mentionIndex}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectMention(member)}
                    sx={{ gap: 1.25, px: 1.5, py: 0.75 }}
                  >
                    {member.isAll ? (
                      <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main' }}>
                        <GroupsOutlinedIcon sx={{ fontSize: 18 }} />
                      </Avatar>
                    ) : (
                      <ChatAvatar avatarUrl={member.avatarUrl} name={member.fullName} size={28} />
                    )}
                    <ListItemText
                      primary={member.fullName}
                      secondary={member.isAll ? t('network:chat.mention_all_hint', 'Thông báo cho mọi người trong nhóm') : undefined}
                      primaryTypographyProps={{ variant: 'body2', noWrap: true, fontWeight: member.isAll ? 600 : 400 }}
                      secondaryTypographyProps={{ variant: 'caption', noWrap: true }}
                    />
                  </MenuItem>
                ))}
              </MenuList>
            </Paper>
          </ClickAwayListener>
        </Popper>

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
            onChange={(event) => {
              const rawVal = event.target.value;
              const caret = event.target.selectionStart ?? rawVal.length;
              let val = rawVal;
              if (rawVal.length > MAX_MESSAGE_LENGTH) {
                val = rawVal.slice(0, MAX_MESSAGE_LENGTH);
                setDraft(val);
                showError(t('network:chat.paste_limit_exceeded', 'Văn bản vượt quá giới hạn {{max}} ký tự và đã bị cắt bớt.', { max: MAX_MESSAGE_LENGTH }));
              } else {
                setDraft(val);
              }
              detectMention(val, Math.min(caret, val.length));
              notifyTyping();
            }}
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
                <InputAdornment position="end" sx={{ gap: 0.25 }}>
                  <ChatGifPickerButton
                    disabled={isInputDisabled}
                    onGifSelect={handleGifSelect}
                  />
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
        titleColor="error.main"
        confirmColor="error"
        loading={isBlockActionPending}
        onConfirm={() => { if (canUseBasicActions) blockUser(); }}
        onCancel={() => setBlockConfirmOpen(false)}
      />
    </ScrollReveal>
  );
};

export default NetworkChatPanel;
