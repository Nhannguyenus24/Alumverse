import { useMemo, useState } from 'react';
import { Box, Container, Stack, Typography } from '@mui/material';

import Page from '../../components/Page';
import NetworkChatPanel from '../../components/network/NetworkChatPanel';
import NetworkChatSidebar from '../../components/network/NetworkChatSidebar';
import { MOCK_NETWORK_CHATS } from './mockNetworkChats';

const ChatPage = () => {
  const [activeChatId, setActiveChatId] = useState(MOCK_NETWORK_CHATS[0].id);

  const activeChat = useMemo(
    () =>
      MOCK_NETWORK_CHATS.find((chat) => chat.id === activeChatId) ?? MOCK_NETWORK_CHATS[0],
    [activeChatId],
  );

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
                  chats={MOCK_NETWORK_CHATS}
                  activeChatId={activeChat.id}
                  onSelectChat={setActiveChatId}
                />
                <NetworkChatPanel activeChat={activeChat} />
              </Box>
            </Stack>
          </Box>
        </Container>
      </Container>
    </Page>
  );
};

export default ChatPage;
