import {
  Avatar,
  Box,
  Button,
  Card,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';

import { formatDateTime } from '../../utils/dateFormatter';

const NetworkBlockedMemberCard = ({
  member,
  onUnblock,
  isUnblockLoading = false,
}) => {
  const displayName = member.fullName || 'N/A';

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
              Chặn lúc {formatDateTime(member.blockedAt, 'Không rõ')}
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ flexShrink: 0, alignSelf: { xs: 'flex-end', sm: 'auto' } }}>
          <Button
            variant="outlined"
            color="inherit"
            size="small"
            type="button"
            onClick={onUnblock}
            disabled={isUnblockLoading}
            sx={{ minWidth: 100 }}
          >
            {isUnblockLoading ? <CircularProgress size={16} color="inherit" /> : 'Bỏ chặn'}
          </Button>
        </Box>
      </Stack>
    </Card>
  );
};

export default NetworkBlockedMemberCard;
