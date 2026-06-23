import { useTranslation } from 'react-i18next';
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
import { useNetworkMemberProfileNavigation } from '../../hooks/network/useNetworkMemberProfileNavigation';
import { networkCardClickableSx } from './networkCardUtils';
import ChatAvatar from '../ChatAvatar';

const NetworkIncomingRequestCard = ({
  request,
  onViewDetail,
  onAccept,
  onReject,
  isResponding = false,
}) => {
  const { t } = useTranslation('network');
  const previewMessage = request.message ?? '';
  const isPending = request.status === CONVERSATION_REQUEST_STATUS.PENDING;
  const { navigateToProfile, stopActionPropagation } =
    useNetworkMemberProfileNavigation(request.requesterMemberId);

  const handleCardClick = () => {
    onViewDetail?.(request);
  };

  const handleCardKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCardClick();
    }
  };

  const handleProfileClick = (event) => {
    stopActionPropagation(event);
    navigateToProfile();
  };

  const handleProfileKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      stopActionPropagation(event);
      navigateToProfile();
    }
  };

  const profileLinkSx = {
    cursor: 'pointer',
    '&:hover': { textDecoration: 'underline' },
  };

  const handleAccept = (event) => {
    stopActionPropagation(event);
    onAccept?.(request.id);
  };

  const handleReject = (event) => {
    stopActionPropagation(event);
    onReject?.(request.id);
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none',
        transition: 'transform 0.2s, box-shadow 0.2s',
        ...networkCardClickableSx,
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
            <Typography
              fontWeight={700}
              noWrap
              sx={{ minWidth: 0, lineHeight: 1.3, ...profileLinkSx }}
              role="button"
              tabIndex={0}
              onClick={handleProfileClick}
              onKeyDown={handleProfileKeyDown}
            >
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
            onClick={stopActionPropagation}
          >
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={handleAccept}
              disabled={isResponding}
            >
              {isResponding ? <CircularProgress size={16} color="inherit" /> : t('accept')}
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              onClick={handleReject}
              disabled={isResponding}
              sx={(theme) => ({
                borderColor: alpha(theme.palette.text.primary, 0.23),
              })}
            >
              {t('reject')}
            </Button>
          </Stack>
        ) : null}
      </Stack>
    </Card>
  );
};

export default NetworkIncomingRequestCard;
