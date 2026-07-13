import {
  Avatar,
  Box,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';

import Scrollbar from '../Scrollbar';
import { formatDateTime } from '../../utils/dateFormatter';
import ChatAvatar from '../ChatAvatar';

function MessageBubble({ body, createdAt }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
      <Box
        sx={{
          maxWidth: '85%',
          px: 1.5,
          py: 1.25,
          borderRadius: 2,
          bgcolor: 'grey.200',
          color: 'text.primary',
        }}
      >
        <Typography variant="body2" sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
          {body}
        </Typography>
        <Typography
          variant="caption"
          sx={{ display: 'block', mt: 0.5, opacity: 0.75, textAlign: 'right' }}
        >
          {formatDateTime(createdAt)}
        </Typography>
      </Box>
    </Box>
  );
}

const NetworkIncomingRequestDetailDrawer = ({ open, onClose, request }) => {
  const { t } = useTranslation(['network']);
  if (!request) return null;

  

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
          <ChatAvatar avatarUrl={request.avatarUrl} name={request.fullName} size={48} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              {request.fullName}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {t('network:sent_at', { datetime: formatDateTime(request.messageCreatedAt) })}
            </Typography>
          </Box>
        </Stack>
        <IconButton size="small" onClick={onClose} aria-label={t('network:close_aria')}>
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
        {request.message ? (
          <MessageBubble body={request.message} createdAt={request.messageCreatedAt} />
        ) : (
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
            {t('network:no_messages_yet')}
          </Typography>
        )}
      </Scrollbar>
    </Drawer>
  );
};

export default NetworkIncomingRequestDetailDrawer;
