import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Container, Stack, Typography } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';

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
    name: item.peerUserName ?? item.title ?? '(No name)',
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
  const queryClient = useQueryClient();
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
  } = usePrivateChatList({ searchQuery: appliedSearch, page });

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
    if (activeChatId == null && chats.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveChatId(chats[0].id);
    }
  }, [chats, activeChatId]);

  const activeChat = useMemo(
    () => chats.find((c) => c.id === activeChatId) ?? null,
    [chats, activeChatId],
  );

  const isPending = groupPending || privatePending;
  const isFetching = groupFetching || privateFetching;
  const isError = groupError || privateError;
  const errorMessage = groupErrorMsg ?? privateErrorMsg ?? null;

  const handleSearchSubmit = () => {
    setAppliedSearch(searchInput.trim());
    setPage(1);
  };

  const handlePageChange = (_, value) => {
    setPage(value);
  };

  const handleGroupCreated = (createdGroup) => {
    if (createdGroup?.id) {
      setActiveChatId(createdGroup.id);
    }
  };

  const handleLeaveGroup = (leftGroupId) => {
    invalidateChatListQueries(queryClient);
    if (activeChatId === leftGroupId) {
      setActiveChatId(null);
    }
  };

  return (
    <Page title="Chat">
      <Container maxWidth={false} disableGutters sx={{ pb: 3 }}>
        <Container
          maxWidth="xl"
          sx={{
            pt: { xs: 1.5, sm: 2, md: 2 },
            px: { xs: 2, sm: 3, lg: 6 },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: { xs: 2, md: 3 },
            }}
          >
            <Stack
              spacing={1.5}
              sx={{
                flex: 1,
                minWidth: 0,
                width: '100%',
                minHeight: 0,
                px: { xs: 1.5, sm: 2, md: 2.75 },
              }}
            >
              <Typography
                variant="h1"
                fontWeight={800}
                color="primary.main"
                sx={{ fontSize: { xs: '1.8rem', md: '2.3rem' } }}
              >
                NETWORK
              </Typography>

              {isError ? (
                <Alert severity="error" sx={{ borderRadius: 1.5 }}>
                  {errorMessage}
                </Alert>
              ) : null}

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  overflow: 'hidden',
                  height: { xs: 'calc(100dvh - 254px)', md: 'calc(100dvh - 209px)' },
                  minHeight: 0,
                  bgcolor: 'background.paper',
                }}
              >
                <NetworkChatSidebar
                  chats={chats}
                  activeChatId={activeChatId}
                  onSelectChat={setActiveChatId}
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
                <NetworkChatPanel activeChat={activeChat} onLeaveGroup={handleLeaveGroup} />
              </Box>
            </Stack>
          </Box>
        </Container>
      </Container>
      <CreateGroupChatDialog
        open={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        onCreated={handleGroupCreated}
      />
    </Page>
  );
};

export default ChatPage;
