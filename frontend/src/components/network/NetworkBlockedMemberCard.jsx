import {
  Avatar,
  Box,
  Button,
  Card,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import { formatDateTime } from '../../utils/dateFormatter';
import { useCanContribute } from '../../hooks/useCanContribute';
import { ContributeGuardTooltip } from '../ContributeGuard';

const NetworkBlockedMemberCard = ({
  member,
  onUnblock,
  isUnblockLoading = false,
}) => {
  const { t } = useTranslation('network');
  const { canUseBasicActions } = useCanContribute();
  const displayName = member.fullName || 'N/A';

  const handleUnblock = (event) => {
    if (!canUseBasicActions) return;
    onUnblock?.(event);
  };

  return (
    <Card
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none',
        transition: 'transform 0.2s',
        '&:hover': { transform: 'translateY(-2px)' },
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 1.5, sm: 2 }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
          <Avatar src={member.avatarUrl} sx={{ width: 56, height: 56, flexShrink: 0 }} />

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography fontWeight={700} variant="subtitle1" noWrap sx={{ lineHeight: 1.3 }}>
              {displayName}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              sx={{ display: 'block', mt: 0.25, lineHeight: 1.3 }}
            >
              {t('blocked_at', { datetime: formatDateTime(member.blockedAt, t('unknown_datetime')) })}
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ flexShrink: 0, alignSelf: { xs: 'flex-end', sm: 'auto' } }}>
          <ContributeGuardTooltip required="basic" placement="left">
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              type="button"
              onClick={handleUnblock}
              disabled={isUnblockLoading || !canUseBasicActions}
              sx={{ minWidth: 100 }}
            >
              {isUnblockLoading ? <CircularProgress size={16} color="inherit" /> : t('unblock')}
            </Button>
          </ContributeGuardTooltip>
        </Box>
      </Stack>
    </Card>
  );
};

export default NetworkBlockedMemberCard;
