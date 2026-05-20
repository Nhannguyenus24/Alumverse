import { Avatar, Box, Button, Card, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

/**
 * Card hiển thị một thành viên trong tab Tìm kiếm Network.
 * Dữ liệu khớp nguồn DB: global_profiles (fullName), users (userName),
 * academic_records.startYear (khóa), organization_members (program, major).
 * `onMessage`: tùy chọn — gắn khi có luồng nhắn tin (chưa truyền thì bấm không làm gì).
 */
const NetworkSearchMemberCard = ({
  avatar,
  fullName,
  userName,
  startYear,
  program,
  major,
  onMessage,
  isDemo = false,
}) => {
  const displayName = fullName || 'N/A';
  const cohortLabel = startYear != null && startYear !== '' ? startYear : 'N/A';
  const programLabel = program ? program : '—';
  const majorLabel = major ? major : 'N/A';

  return (
    <Card
      sx={{
        p: 3,
        borderRadius: 2,
        border: '1px solid',
        borderColor: isDemo ? 'primary.light' : 'divider',
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
        <Avatar src={avatar} sx={{ width: 80, height: 80 }} />

        <Box sx={{ width: '100%' }}>
          <Typography fontWeight={700} variant="subtitle1" sx={{ lineHeight: 1.3 }}>
            {displayName}
          </Typography>
          <Box
            sx={(theme) => ({
              mt: 1.25,
              width: '100%',
              px: 1.25,
              py: 1.25,
              borderRadius: 1.5,
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              border: '1px solid',
              borderColor: alpha(theme.palette.primary.main, 0.18),
            })}
          >
            <Stack spacing={0.75} alignItems="center">
              <Typography variant="body2" sx={{ color: 'primary.dark', fontWeight: 500 }}>
                Khóa:{' '}
                <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>
                  {cohortLabel}
                </Box>
              </Typography>
              <Typography variant="body2" sx={{ color: 'primary.dark', fontWeight: 500 }}>
                Program:{' '}
                <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>
                  {programLabel}
                </Box>
              </Typography>
              <Typography variant="body2" sx={{ color: 'primary.dark', fontWeight: 500 }}>
                Major:{' '}
                <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>
                  {majorLabel}
                </Box>
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Stack>

      <Button
        variant="contained"
        sx={{ mt: 3 }}
        fullWidth
        type="button"
        onClick={onMessage}
        disabled={!onMessage}
      >
        Nhắn tin
      </Button>
    </Card>
  );
};

export default NetworkSearchMemberCard;
