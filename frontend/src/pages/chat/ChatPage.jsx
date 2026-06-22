import { useEffect, useMemo, useState, useCallback } from 'react';
import { Alert, Box, useMediaQuery, useTheme } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router';

import Page from '../../components/Page';
import NetworkChatPanel from '../../components/network/NetworkChatPanel';
import NetworkChatSidebar from '../../components/network/NetworkChatSidebar';
import CreateGroupChatDialog from '../../components/CreateGroupChatDialog';
import { useGroupChatList } from '../../hooks/chat/useGroupChatList';
import { usePrivateChatList } from '../../hooks/chat/usePrivateChatList';
import { invalidateChatListQueries } from '../../hooks/chat/invalidateChatQueries';

function normalizeGroupChat(item) {
  return {
    id: item.id,
    name: item.title ?? '(No name)',
    preview: item.lastMessagePreview ?? '',
    lastMessageAt: item.lastMessageAt ?? null,
    type: 'GROUP',
  };
}

function normalizePrivateChat(item) {
  return {
    id: item.id,
    name: item.peerFullName ?? item.title ?? '(No name)',
    avatarUrl: item.peerAvatarUrl ?? null,
    preview: item.lastMessagePreview ?? '',
    lastMessageAt: item.lastMessageAt ?? null,
    type: 'PRIVATE',
    peerMemberId: item.peerMemberId,
    blockedByMe: Boolean(item.blockedByMe),
    blockedByPeer: Boolean(item.blockedByPeer),
  };
}

const ChatPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetMemberId = searchParams.get('memberId');
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [activeChatId, setActiveChatId] = useState(null);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  const {
    items: groupItems,
    totalPage: groupTotalPage,
    isPending: groupPending,
    isFetching: groupFetching,
    isError: groupError,
    errorMessage: groupErrorMsg,
  } = useGroupChatList({ searchQuery: appliedSearch, page });

  const {
    items: privateItems,
    totalPage: privateTotalPage,
    isPending: privatePending,
    isFetching: privateFetching,
    isError: privateError,
    errorMessage: privateErrorMsg,
  } = usePrivateChatList({ searchQuery: appliedSearch, page, pageSize: targetMemberId ? 100 : undefined });

  const chats = useMemo(() => {
    const merged = [
      ...groupItems.map(normalizeGroupChat),
      ...privateItems.map(normalizePrivateChat),
    ];
    merged.sort((a, b) => {
      if (!a.lastMessageAt && !b.lastMessageAt) return 0;
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
    });
    return merged;
  }, [groupItems, privateItems]);

  const totalPage = Math.max(groupTotalPage, privateTotalPage);
  const safePage = totalPage === 0 ? 1 : Math.min(page, totalPage);

  useEffect(() => {
    if (totalPage > 0 && page > totalPage) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPage(totalPage);
    }
  }, [totalPage, page]);

  useEffect(() => {
    if (!targetMemberId) return;
    const targetChat = chats.find(
      (chat) => chat.type === 'PRIVATE' && String(chat.peerMemberId) === String(targetMemberId),
    );
    if (targetChat && activeChatId !== targetChat.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveChatId(targetChat.id);
    }
  }, [activeChatId, chats, targetMemberId]);

  useEffect(() => {
    if (targetMemberId) return;
    if (isMobile) return;
    if (activeChatId == null && chats.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveChatId(chats[0].id);
    }
  }, [chats, activeChatId, isMobile, targetMemberId]);

  const activeChat = useMemo(
    () => chats.find((c) => c.id === activeChatId) ?? null,
    [chats, activeChatId],
  );

  const isPending = groupPending || privatePending;
  const isFetching = groupFetching || privateFetching;
  const isError = groupError || privateError;
  const errorMessage = groupErrorMsg ?? privateErrorMsg ?? null;

  const handleSearchSubmit = useCallback(() => {
    setAppliedSearch(searchInput.trim());
    setPage(1);
  }, [searchInput]);

  const handlePageChange = useCallback((_, value) => {
    setPage(value);
  }, []);

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
          height: { xs: 'calc(100dvh - 56px)', md: 'calc(100dvh - 64px)' },
          minHeight: 0,
          width: '100%',
          position: 'relative',
          bgcolor: 'background.default',
          overflow: 'hidden',
        }}
      >
        {isError ? (
          <Alert
            severity="error"
            sx={{
              borderRadius: 0,
              position: 'absolute',
              left: 0,
              right: 0,
              zIndex: 2,
            }}
          >
            {errorMessage}
          </Alert>
        ) : null}

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
              page={safePage}
              totalPage={totalPage}
              onPageChange={handlePageChange}
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
