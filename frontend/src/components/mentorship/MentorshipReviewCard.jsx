import { Box, Typography, Stack, Avatar } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import { usePublicProfile } from '../../hooks/profile/usePublicProfile';
import { formatDateTime } from '../../utils/dateFormatter';

const MentorshipReviewCard = ({ review }) => {
  const { data: menteeProfile } = usePublicProfile(review?.menteeMemberId);

  const displayName = review?.menteeName || menteeProfile?.fullName || `Mentee #${review?.menteeMemberId}`;
  const displayAvatar = review?.menteeAvatarUrl || menteeProfile?.avatarUrl || '';
  const displayDate = review?.createdAt ? formatDateTime(review.createdAt) : '--';
  const rating = review?.rating || 0;
  const content = review?.comment || '';

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}
    >
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          flexWrap: 'wrap', 
          gap: 2 
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar src={displayAvatar} sx={{ width: 48, height: 48 }} />
          <Stack justifyContent="center"> 
            <Typography fontWeight={700}>
              {displayName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {displayDate}
            </Typography>
          </Stack>
        </Box>
        
        <Box sx={{ display: 'flex' }}>
          {[...Array(5)].map((_, index) => (
            <StarIcon 
              key={index} 
              sx={{ 
                color: index < rating ? "warning.main" : "divider", 
                fontSize: 20 
              }} 
            />
          ))}
        </Box>
      </Box>
      
      <Typography mt={2} color="text.primary">
        {content}
      </Typography>
    </Box>
  );
};

export default MentorshipReviewCard;
