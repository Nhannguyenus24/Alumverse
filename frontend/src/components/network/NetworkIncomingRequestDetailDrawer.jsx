import {
  Avatar,
  Box,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import Scrollbar from '../Scrollbar';
import { DEFAULT_CHAT_AVATAR_SRC } from '../../pages/chat/mockNetworkChats';
import { formatDateTime } from '../../utils/dateFormatter';

function formatAcademicValue(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(' · ');
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean).join(' · ');
      }
    } catch {
      return value;
    }
    return value;
  }

  return '';
}

function MessageBubble({ message, isOwn }) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
      }}
    >
      <Box
        sx={{
          maxWidth: '85%',
          px: 1.5,
          py: 1.25,
          borderRadius: 2,
          bgcolor: isOwn ? 'primary.main' : 'grey.200',
          color: isOwn ? 'primary.contrastText' : 'text.primary',
        }}
      >
        <Typography variant="body2" sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
          {message.body}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 0.5,
            opacity: 0.75,
            textAlign: 'right',
          }}
        >
          {formatDateTime(message.createdAt)}
        </Typography>
      </Box>
    </Box>
  );
}

const NetworkIncomingRequestDetailDrawer = ({ open, onClose, request, currentMemberId }) => {
  if (!request) return null;

  const avatarSrc = request.avatarUrl?.trim() || DEFAULT_CHAT_AVATAR_SRC;
  const programLabel = formatAcademicValue(request.program);
  const majorLabel = formatAcademicValue(request.major);
  const academicLine = [programLabel, majorLabel].filter(Boolean).join(' · ');

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 420, md: 440 },
          maxWidth: '100%',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 1,
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Avatar
            src={avatarSrc}
            alt={request.fullName}
            slotProps={{ img: { referrerPolicy: 'no-referrer' } }}
            sx={{ width: 48, height: 48 }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              {request.fullName}
            </Typography>
            {academicLine ? (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {academicLine}
              </Typography>
            ) : null}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Gửi lúc {formatDateTime(request.sentAt)}
            </Typography>
          </Box>
        </Stack>
        <IconButton size="small" onClick={onClose} aria-label="Đóng">
          <CloseIcon />
        </IconButton>
      </Box>

      <Scrollbar
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
        {(request.messages ?? []).length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
            Chưa có tin nhắn.
          </Typography>
        ) : (
          request.messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderMemberId === currentMemberId}
            />
          ))
        )}
      </Scrollbar>
    </Drawer>
  );
};

export default NetworkIncomingRequestDetailDrawer;
