import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  IconButton,
  Skeleton,
  Divider,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  OpenInFull as OpenInFullIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

import Scrollbar from './Scrollbar';
import ChatAvatar from './ChatAvatar';
import { formatDateTime } from '../utils/dateFormatter';
import { useOrgNavigate } from '../hooks/useOrgNavigate';
import { useRecentChatPreviews } from '../hooks/chat/useRecentChatPreviews';

export default function MessagesPreviewPanel({
  onClose,
  queryEnabled = true,
  onContentReady,
}) {
  const { t } = useTranslation(['network', 'common']);
  const navigate = useOrgNavigate();
  const { previews, isPending, isError } = useRecentChatPreviews({ enabled: queryEnabled });

  useEffect(() => {
    if (!queryEnabled || isPending) return;
    onContentReady?.();
  }, [queryEnabled, isPending, previews.length, isError, onContentReady]);

  const goToChat = (chatId) => {
    onClose?.();
    navigate(chatId ? `/chat?chatId=${chatId}` : '/chat');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
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
          {t('conversations')}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title={t('view_all_messages')}>
            <IconButton size="small" onClick={() => goToChat()} aria-label={t('view_all_messages')}>
              <OpenInFullIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={onClose} aria-label={t('common:close')}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Divider />

      <Scrollbar sx={{ flex: 1, minHeight: 0 }}>
        {isPending && (
          <Box>
            {[...Array(3)].map((_, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.5,
                  px: 2,
                  py: 1.5,
                  borderBottom: index < 2 ? '1px solid' : 'none',
                  borderColor: 'divider',
                }}
              >
                <Skeleton variant="circular" width={44} height={44} />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Skeleton variant="text" width="40%" height={20} />
                    <Skeleton variant="text" width="20%" height={16} />
                  </Box>
                  <Skeleton variant="text" width="80%" height={20} />
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {isError && !isPending && (
          <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {t('messages_load_error')}
            </Typography>
          </Box>
        )}

        {!isPending && !isError && previews.length === 0 && (
          <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {t('no_messages_yet')}
            </Typography>
          </Box>
        )}

        {!isPending && !isError && previews.map((chat, index) => {
          const unreadCount = chat.unreadCount ?? 0;
          const hasUnread = unreadCount > 0;
          return (
          <Box
            key={chat.id}
            role="button"
            tabIndex={0}
            onClick={() => goToChat(chat.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                goToChat(chat.id);
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
              variant={chat.type === 'GROUP' ? 'group' : 'user'}
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
                <Typography variant="subtitle2" fontWeight={hasUnread ? 800 : 600} color={hasUnread ? 'text.primary' : undefined} noWrap>
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
              <Typography variant="body2" color={hasUnread ? 'text.primary' : 'text.secondary'} fontWeight={hasUnread ? 600 : 400} noWrap>
                {chat.preview}
              </Typography>
            </Box>
            {hasUnread ? (
              <Box
                sx={{
                  flexShrink: 0,
                  minWidth: 20,
                  height: 20,
                  px: 0.75,
                  borderRadius: 999,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  lineHeight: 1,
                  alignSelf: 'center',
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Box>
            ) : null}
          </Box>
        )})}
      </Scrollbar>

      <Divider />

      <Box sx={{ p: 1.5, flexShrink: 0 }}>
        <Button
          fullWidth
          variant="text"
          color="primary"
          onClick={() => goToChat()}
          sx={{ fontWeight: 700, textTransform: 'none', py: 1 }}
        >
          {t('view_all_messages')}
        </Button>
      </Box>
    </Box>
  );
}
