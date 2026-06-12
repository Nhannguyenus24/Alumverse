import {
  Box,
  Button,
  Card,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import { CONVERSATION_REQUEST_STATUS } from '../../constants/conversationRequestStatus';
import { formatDateTime } from '../../utils/dateFormatter';
import ChatAvatar from '../ChatAvatar';

const NetworkIncomingRequestCard = ({
  request,
  onViewDetail,
  onAccept,
  onReject,
  isResponding = false,
}) => {
  const previewMessage = request.message ?? '';
  const isPending = request.status === CONVERSATION_REQUEST_STATUS.PENDING;

  const handleCardClick = () => {
    onViewDetail?.(request);
  };

  const handleAccept = (event) => {
    event.stopPropagation();
    onAccept?.(request.id);
  };

  const handleReject = (event) => {
    event.stopPropagation();
    onReject?.(request.id);
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleCardClick();
        }
      }}
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 1,
        },
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', sm: 'flex-start' }}
      >
        <Stack direction="row" spacing={2} sx={{ flex: 1, minWidth: 0 }}>
          <ChatAvatar avatarUrl={request.avatarUrl} name={request.fullName} size={56} />

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography fontWeight={700} noWrap sx={{ minWidth: 0, lineHeight: 1.3 }}>
              {request.fullName}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                mt: 0.25,
                mb: 0.25,
                lineHeight: 1.35,
              }}
            >
              {previewMessage || 'Không có tin nhắn.'}
            </Typography>

            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3 }}>
              Gửi lúc {formatDateTime(request.messageCreatedAt)}
            </Typography>
          </Box>
        </Stack>

        {isPending ? (
          <Stack
            direction={{ xs: 'row', sm: 'column' }}
            spacing={1}
            sx={{ flexShrink: 0, alignSelf: { sm: 'center' } }}
          >
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={handleAccept}
              disabled={isResponding}
              sx={{ minWidth: 100 }}
            >
              {isResponding ? <CircularProgress size={16} color="inherit" /> : 'Chấp nhận'}
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              onClick={handleReject}
              disabled={isResponding}
              sx={(theme) => ({
                minWidth: 100,
                borderColor: alpha(theme.palette.text.primary, 0.23),
              })}
            >
              Từ chối
            </Button>
          </Stack>
        ) : null}
      </Stack>
    </Card>
  );
};

export default NetworkIncomingRequestCard;
