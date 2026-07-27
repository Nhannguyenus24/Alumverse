import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';

import Page from '../../components/Page';
import NetworkChatPanel from '../../components/network/NetworkChatPanel';
import NetworkChatSidebar from '../../components/network/NetworkChatSidebar';
import CreateGroupChatDialog from '../../components/CreateGroupChatDialog';
import { useGroupChatList } from '../../hooks/chat/useGroupChatList';
import { usePrivateChatList } from '../../hooks/chat/usePrivateChatList';
import {
  invalidateChatListQueries,
  resetChatUnreadInLists,
} from '../../hooks/chat/invalidateChatQueries';
import useActiveChatStore from '../../stores/activeChatStore';
import { chatApi } from '../../utils/api';
import { HEADER_HEIGHT } from '../../constants/layout';

function getPreviewText(previewText, t) {
  if (!previewText) return '';
  const urlRegex = /^https?:\/\/[^\s]+$/;
  if (urlRegex.test(previewText)) {
    // GIFs (e.g. from Giphy) live on external CDNs, so classify them by extension
    // regardless of host before the backend-hosted-media checks below.
    if (previewText.toLowerCase().match(/\.gif(\?.*)?$/)) {
      return t('network:chat.preview_gif', '[GIF]');
    }
    const backendUrl = import.meta.env.VITE_API_BASE_URL || '';
    if (backendUrl && previewText.startsWith(backendUrl)) {
      const lowerText = previewText.toLowerCase();
      if (lowerText.match(/\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/)) {
        return t('network:chat.preview_image', '[Hình ảnh]');
      }
      if (lowerText.match(/\.(mp4|mov|webm|avi)(\?.*)?$/)) {
        return t('network:chat.preview_video', '[Video]');
      }
      if (
        lowerText.includes('/files/') || 
        lowerText.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|txt|csv|rtf|7z)(\?.*)?$/)
      ) {
        return t('network:chat.preview_file', '[Tập tin]');
      }
    }
    return t('network:chat.preview_link', '[Đường dẫn]');
  }
  return previewText;
}

function normalizeGroupChat(item, t) {
  return {
    id: item.id,
    name: item.title ?? t('network:chat.no_name', '(No name)'),
    avatarUrl: item.avatarUrl ?? null,
    preview: getPreviewText(item.lastMessagePreview, t),
    lastMessageAt: item.lastMessageAt ?? null,
    unreadCount: Number(item.unreadCount) || 0,
    type: 'GROUP',
  };
}

function normalizePrivateChat(item, t) {
  return {
    id: item.id,
    name: item.peerFullName ?? item.title ?? t('network:chat.no_name', '(No name)'),
    avatarUrl: item.peerAvatarUrl ?? null,
    preview: getPreviewText(item.lastMessagePreview, t),
    lastMessageAt: item.lastMessageAt ?? null,
    unreadCount: Number(item.unreadCount) || 0,
    type: 'PRIVATE',
    peerMemberId: item.peerMemberId,
    blockedByMe: Boolean(item.blockedByMe),
    blockedByPeer: Boolean(item.blockedByPeer),
  };
}

const ChatPage = () => {
  const { t } = useTranslation(['network']);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetMemberId = searchParams.get('memberId');
  const targetChatId = searchParams.get('chatId');
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [activeChatId, setActiveChatId] = useState(null);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const chatListPageSize = 200;

  const {
    items: groupItems,
    isPending: groupPending,
    isFetching: groupFetching,
    isError: groupError,
    errorMessage: groupErrorMsg,
  } = useGroupChatList({ searchQuery: appliedSearch, page: 1, pageSize: chatListPageSize });

  const {
    items: privateItems,
    isPending: privatePending,
    isFetching: privateFetching,
    isError: privateError,
    errorMessage: privateErrorMsg,
  } = usePrivateChatList({
    searchQuery: appliedSearch,
    page: 1,
    pageSize: chatListPageSize,
  });

  const chats = useMemo(() => {
    const merged = [
      ...groupItems.map(item => normalizeGroupChat(item, t)),
      ...privateItems.map(item => normalizePrivateChat(item, t)),
    ];
    merged.sort((a, b) => {
      if (!a.lastMessageAt && !b.lastMessageAt) return 0;
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
    });
    return merged;
  }, [groupItems, privateItems, t]);

  // Deep-link params (memberId/chatId) only SEED the initial selection. We consume
  // each param value once (tracked via refs) instead of re-applying it on every
  // render: keeping it in the deps of `activeChatId` made the param override manual
  // sidebar selection, so clicking another conversation snapped straight back to the
  // deep-linked one and the user could never switch. The param stays in the URL, while
  // the sidebar always loads a single large scrollable list so the target chat stays loaded.
  const consumedMemberIdRef = useRef(null);
  const consumedChatIdRef = useRef(null);

  useEffect(() => {
    if (!targetMemberId || consumedMemberIdRef.current === targetMemberId) return;
    const targetChat = chats.find(
      (chat) => chat.type === 'PRIVATE' && String(chat.peerMemberId) === String(targetMemberId),
    );
    if (!targetChat) return;
    consumedMemberIdRef.current = targetMemberId;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveChatId(targetChat.id);
  }, [chats, targetMemberId]);

  useEffect(() => {
    if (!targetChatId || consumedChatIdRef.current === targetChatId) return;
    const targetChat = chats.find((chat) => String(chat.id) === String(targetChatId));
    if (!targetChat) return;
    consumedChatIdRef.current = targetChatId;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveChatId(targetChat.id);
  }, [chats, targetChatId]);

  useEffect(() => {
    if (targetMemberId || targetChatId) return;
    if (isMobile) return;
    if (activeChatId == null && chats.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveChatId(chats[0].id);
    }
  }, [chats, activeChatId, isMobile, targetMemberId, targetChatId]);

  const activeChat = useMemo(
    () => chats.find((c) => c.id === activeChatId) ?? null,
    [chats, activeChatId],
  );

  // Keep the global active-chat store in sync so the SSE handler (mounted app-wide, with
  // no access to this page's state) knows which conversation is open and won't flag its
  // incoming messages as unread. Also mark the conversation read on the server and clear
  // its unread marker locally right away when it becomes active.
  useEffect(() => {
    useActiveChatStore.getState().setActiveChatId(activeChatId);
    if (activeChatId == null) return;
    resetChatUnreadInLists(queryClient, activeChatId);
    chatApi.markGroupAsRead(activeChatId).catch(() => {});
  }, [activeChatId, queryClient]);

  // Clear the active-chat marker when leaving the chat page.
  useEffect(() => () => useActiveChatStore.getState().setActiveChatId(null), []);

  const isPending = groupPending || privatePending;
  const isFetching = groupFetching || privateFetching;
  const isError = groupError || privateError;
  const errorMessage = groupErrorMsg ?? privateErrorMsg ?? null;

  useEffect(() => {
    if (isError && errorMessage) {
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  }, [isError, errorMessage, enqueueSnackbar]);

  const handleSearchSubmit = useCallback(() => {
    setAppliedSearch(searchInput.trim());
  }, [searchInput]);

  const handleGroupCreated = useCallback((createdGroup) => {
    if (createdGroup?.id) {
      setActiveChatId(createdGroup.id);
    }
  }, []);

  const handleLeaveGroup = useCallback((leftGroupId) => {
    invalidateChatListQueries(queryClient);
    if (activeChatId === leftGroupId) {
      setActiveChatId(null);
    }
  }, [queryClient, activeChatId]);

  const handleSelectChat = useCallback((chatId) => {
    setActiveChatId(chatId);
  }, []);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const showMobileChatPanel = isMobile && activeChatId != null;
  const showSidebar = !isMobile || !showMobileChatPanel;
  const showPanel = !isMobile || showMobileChatPanel;

  return (
    <Page title="Chat">
      <Box
        sx={{
          height: {
            xs: `calc(100dvh - ${HEADER_HEIGHT.xs}px)`,
            md: `calc(100dvh - ${HEADER_HEIGHT.md}px)`,
          },
          minHeight: 0,
          width: '100%',
          position: 'relative',
          bgcolor: 'background.default',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            width: '100%',
            height: '100%',
            minHeight: 0,
            overflow: 'hidden',
            bgcolor: 'background.paper',
          }}
        >
          {showSidebar ? (
            <NetworkChatSidebar
              chats={chats}
              activeChatId={activeChatId}
              onSelectChat={handleSelectChat}
              onCreateGroupChat={() => setCreateGroupOpen(true)}
              searchValue={searchInput}
              onSearchChange={setSearchInput}
              onSearchSubmit={handleSearchSubmit}
              isPending={isPending}
              isFetching={isFetching}
            />
          ) : null}

          {showPanel ? (
            <NetworkChatPanel
              activeChat={activeChat}
              onLeaveGroup={handleLeaveGroup}
              onBack={isMobile ? handleBack : undefined}
            />
          ) : null}
        </Box>
      </Box>
      <CreateGroupChatDialog
        open={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        onCreated={handleGroupCreated}
      />
    </Page>
  );
};

export default ChatPage;
