import { Avatar, Box, Button, Card, Chip, Stack, Typography } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';

/**
 * Card hiển thị một thành viên trong tab Tìm kiếm Network.
 * Tách khỏi MentorshipCard để hai luồng UI có thể phân kỳ sau này.
 * `onMessage`: tùy chọn — gắn khi có luồng nhắn tin (chưa truyền thì bấm không làm gì).
 */
const NetworkSearchMemberCard = ({
  avatar,
  name,
  role,
  rating,
  reviews,
  tags = [],
  onMessage,
}) => {
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
      <Stack spacing={2} alignItems="center">
        <Avatar src={avatar} sx={{ width: 80, height: 80 }} />

        <Box>
          <Typography fontWeight={700} variant="subtitle1">
            {name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {role}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <StarIcon sx={{ color: 'warning.main', fontSize: 18 }} />
          <Typography fontWeight={700} color="primary.main">
            {rating}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ({reviews} reviews)
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 1,
          }}
        >
          {tags.map((tag, idx) => (
            <Chip
              key={idx}
              label={`#${tag}`}
              size="small"
              sx={{
                fontWeight: 600,
                bgcolor: 'primary.light',
                color: 'primary.main',
                '& .MuiChip-label': { px: 1.2 },
              }}
            />
          ))}
        </Box>
      </Stack>

      <Button variant="contained" sx={{ mt: 3 }} fullWidth type="button" onClick={onMessage}>
        Nhắn tin
      </Button>
    </Card>
  );
};

export default NetworkSearchMemberCard;
