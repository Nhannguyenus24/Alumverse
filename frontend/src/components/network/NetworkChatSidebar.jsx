import { useSnackbar } from 'notistack';
import {
  Box,
  CircularProgress,
  IconButton,
  Pagination,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import { useTranslation } from 'react-i18next';
import Scrollbar from '../Scrollbar';
import SearchBar from '../SearchBar';
import ChatAvatar from '../ChatAvatar';

const NetworkChatSidebar = ({
  chats = [],
  activeChatId,
  onSelectChat,
  onCreateGroupChat,
  searchValue = '',
  onSearchChange,
  onSearchSubmit,
  page = 1,
  totalPage = 0,
  onPageChange,
  isPending = false,
  isFetching = false,
}) => {
  const { t } = useTranslation('network');
  const { enqueueSnackbar } = useSnackbar();

  const handleSearchKeyDown = (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    onSearchSubmit?.();
  };

  const handleCreateGroupChat = () => {
    if (onCreateGroupChat) {
      onCreateGroupChat();
      return;
    }
    enqueueSnackbar(t('create_group_chat_wip'), { variant: 'info' });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: { xs: '1 1 auto', md: '0 0 340px' },
        minHeight: 0,
        height: '100%',
        overflow: 'hidden',
        bgcolor: 'background.paper',
        position: 'relative',
        '&::after': {
          content: { xs: 'none', md: '""' },
          position: 'absolute',
          top: 0,
          right: 0,
          width: '1px',
          height: '100%',
          bgcolor: 'divider',
          pointerEvents: 'none',
          zIndex: 1,
        },
        width: { xs: '100%', md: 340 },
        minWidth: { xs: '100%', md: 300 },
        maxWidth: { xs: '100%', md: 360 },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          px: 2,
          py: 0,
          minHeight: 72,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography
          variant="h4"
          color="primary.main"
          fontWeight={800}
          sx={{
            minWidth: 0,
            fontSize: { xs: '1.45rem', md: '1.6rem' },
          }}
        >
          {t('chat_sidebar_title')}
        </Typography>
        <Tooltip title={t('create_group_chat_tooltip')} placement="bottom">
          <IconButton
            size="small"
            aria-label={t('create_group_chat_aria')}
            onClick={handleCreateGroupChat}
            sx={{ flexShrink: 0 }}
          >
            <GroupAddIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <SearchBar
          value={searchValue}
          onChange={onSearchChange}
          onKeyDown={handleSearchKeyDown}
          placeholder={t('chat_search_placeholder')}
        />
      </Box>

      <Scrollbar sx={{ flex: 1, minHeight: 0, opacity: isFetching ? 0.6 : 1, transition: 'opacity 0.2s' }}>
        {isPending ? (
          <Stack alignItems="center" py={4}>
            <CircularProgress size={24} color="primary" />
          </Stack>
        ) : chats.length === 0 ? (
          <Box sx={{ px: 2, py: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {t('chat_no_conversations')}
            </Typography>
          </Box>
        ) : (
          chats.map((chat) => {
            const active = chat.id === activeChatId;
            return (
              <Box
                key={chat.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectChat(chat.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelectChat(chat.id);
                  }
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 2,
                  py: 1.5,
                  cursor: 'pointer',
                  bgcolor: active ? 'action.selected' : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <ChatAvatar
                  avatarUrl={chat.avatarUrl}
                  name={chat.name}
                  size={42}
                  variant={chat.type === 'GROUP' ? 'group' : 'user'}
                />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" fontWeight={600} noWrap>
                    {chat.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {chat.preview}
                  </Typography>
                </Box>
              </Box>
            );
          })
        )}
      </Scrollbar>

      {totalPage > 1 ? (
        <Box
          sx={{
            borderTop: 1,
            borderColor: 'divider',
            py: 1,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Pagination
            count={totalPage}
            page={page}
            onChange={onPageChange}
            color="primary"
            shape="rounded"
            size="small"
            disabled={isFetching}
            sx={{
              '& .MuiPaginationItem-root': {
                fontWeight: 700,
              },
            }}
          />
        </Box>
      ) : null}
    </Box>
  );
};

export default NetworkChatSidebar;
