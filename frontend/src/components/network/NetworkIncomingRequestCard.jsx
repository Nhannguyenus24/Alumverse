import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import { CONVERSATION_REQUEST_STATUS } from '../../constants/conversationRequestStatus';
import { formatDateTime } from '../../utils/dateFormatter';
import ChatAvatar from '../ChatAvatar';

const STATUS_LABELS = {
  [CONVERSATION_REQUEST_STATUS.PENDING]: 'PENDING',
  [CONVERSATION_REQUEST_STATUS.REJECTED]: 'REJECTED',
};

function getStatusChipSx(status) {
  return (theme) => {
    const { primary, grey } = theme.palette;

    if (status === CONVERSATION_REQUEST_STATUS.PENDING) {
      return {
        bgcolor: primary.lighter,
        color: primary.dark,
        border: `1px solid ${alpha(primary.main, 0.18)}`,
        fontWeight: 600,
      };
    }

    if (status === CONVERSATION_REQUEST_STATUS.REJECTED) {
      return {
        bgcolor: grey[200],
        color: grey[700],
        border: `1px solid ${grey[300]}`,
        fontWeight: 600,
      };
    }

    return null;
  };
}

const NetworkIncomingRequestCard = ({
  request,
  onViewDetail,
  onAccept,
  onReject,
  isResponding = false,
}) => {
  const previewMessage = request.message ?? '';
  const isPending = request.status === CONVERSATION_REQUEST_STATUS.PENDING;
  const avatarSrc = request.avatarUrl?.trim();

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
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={1}
              sx={{ mb: 0.5 }}
            >
              <Typography fontWeight={700} noWrap sx={{ minWidth: 0 }}>
                {request.fullName}
              </Typography>
              {STATUS_LABELS[request.status] ? (
                <Chip
                  label={STATUS_LABELS[request.status]}
                  size="small"
                  sx={(theme) => {
                    const chipSx = getStatusChipSx(request.status)?.(theme);
                    return chipSx
                      ? { flexShrink: 0, ...chipSx }
                      : { flexShrink: 0 };
                  }}
                />
              ) : null}
            </Stack>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                mb: 0.75,
              }}
            >
              {previewMessage || 'Không có tin nhắn.'}
            </Typography>

            <Typography variant="caption" color="text.secondary">
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
