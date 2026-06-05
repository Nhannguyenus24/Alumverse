import { useSnackbar } from 'notistack';
import {
  Avatar,
  Box,
  CircularProgress,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Pagination,
  Stack,
  Typography,
} from '@mui/material';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import Scrollbar from '../Scrollbar';
import SearchBar from '../SearchBar';
import IconButtonMenu from '../IconButtonMenu';
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
  const { enqueueSnackbar } = useSnackbar();

  const handleSearchKeyDown = (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    onSearchSubmit?.();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        bgcolor: 'background.paper',
        borderRight: { xs: 'none', md: 1 },
        borderColor: 'divider',
        width: { xs: '100%', md: 320 },
        minWidth: { xs: '100%', md: 280 },
        maxWidth: { xs: '100%', md: 320 },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="subtitle1" fontWeight={600} sx={{ minWidth: 0 }}>
          Chats
        </Typography>
        <IconButtonMenu
          menuId="network-chat-list-menu"
          buttonAriaLabel="Tùy chọn danh sách chat"
        >
          {({ close }) => (
            <MenuItem
              onClick={() => {
                close();
                if (onCreateGroupChat) {
                  onCreateGroupChat();
                } else {
                  enqueueSnackbar('Tạo nhóm chat đang được phát triển.', { variant: 'info' });
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <GroupAddIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Tạo nhóm chat"
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </MenuItem>
          )}
        </IconButtonMenu>
      </Box>

      <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <SearchBar
          value={searchValue}
          onChange={onSearchChange}
          onKeyDown={handleSearchKeyDown}
          placeholder="Tìm chat… (Enter để tìm)"
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
              Không có cuộc trò chuyện nào.
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
