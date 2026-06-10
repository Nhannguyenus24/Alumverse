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
        p: 3,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.2s',
        '&:hover': { transform: 'translateY(-4px)' },
      }}
    >
      <Stack spacing={1.5} alignItems="center">
        <Avatar src={member.avatarUrl} sx={{ width: 80, height: 80 }} />

        <Box sx={{ width: '100%' }}>
          <Typography fontWeight={700} variant="subtitle1" sx={{ lineHeight: 1.3 }}>
            {displayName}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            Chặn lúc {formatDateTime(member.blockedAt, 'Không rõ')}
          </Typography>
        </Box>
      </Stack>

      <Button
        variant="outlined"
        color="inherit"
        sx={{ mt: 3 }}
        fullWidth
        type="button"
        onClick={onUnblock}
        disabled={isUnblockLoading}
      >
        {isUnblockLoading ? <CircularProgress size={22} color="inherit" /> : 'Bỏ chặn'}
      </Button>
    </Card>
  );
};

export default NetworkBlockedMemberCard;
