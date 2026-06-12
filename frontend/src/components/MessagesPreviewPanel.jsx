import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Typography,
} from '@mui/material';

import Scrollbar from './Scrollbar';
import ChatAvatar from './ChatAvatar';
import { formatDateTime } from '../utils/dateFormatter';
import { useOrgNavigate } from '../hooks/useOrgNavigate';
import { useRecentChatPreviews } from '../hooks/chat/useRecentChatPreviews';

export const MESSAGES_PREVIEW_MENU_PAPER_SX = {
  width: 360,
  maxHeight: 480,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
};

export default function MessagesPreviewPanel({ onClose, queryEnabled = true }) {
  const navigate = useOrgNavigate();
  const { previews, isPending, isError } = useRecentChatPreviews({ enabled: queryEnabled });

  const goToChat = () => {
    onClose?.();
    navigate('/chat');
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.25,
          flexShrink: 0,
        }}
      >
        <Typography variant="h3" fontWeight={700} sx={{ color: 'primary.main' }}>
          Tin nhắn
        </Typography>
      </Box>

      <Divider />

      <Scrollbar sx={{ flex: 1, minHeight: 0, maxHeight: 320 }}>
        {isPending && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {isError && !isPending && (
          <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Không thể tải tin nhắn.
            </Typography>
          </Box>
        )}

        {!isPending && !isError && previews.length === 0 && (
          <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Chưa có tin nhắn nào.
            </Typography>
          </Box>
        )}

        {!isPending && !isError && previews.map((chat, index) => (
          <Box
            key={chat.id}
            role="button"
            tabIndex={0}
            onClick={goToChat}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                goToChat();
              }
            }}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
              px: 2,
              py: 1.5,
              cursor: 'pointer',
              borderBottom: index < previews.length - 1 ? '1px solid' : 'none',
              borderColor: 'divider',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <ChatAvatar
              avatarUrl={chat.avatarUrl}
              name={chat.name}
              size={44}
            />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 1,
                }}
              >
                <Typography variant="subtitle2" fontWeight={600} noWrap>
                  {chat.name}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ flexShrink: 0 }}
                >
                  {formatDateTime(chat.updatedAt)}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" noWrap>
                {chat.preview}
              </Typography>
            </Box>
          </Box>
        ))}
      </Scrollbar>

      <Divider />

      <Box sx={{ p: 1.5, flexShrink: 0 }}>
        <Button
          fullWidth
          variant="text"
          color="primary"
          onClick={goToChat}
          sx={{ fontWeight: 700, textTransform: 'none', py: 1 }}
        >
          Xem tất cả
        </Button>
      </Box>
    </>
  );
}
