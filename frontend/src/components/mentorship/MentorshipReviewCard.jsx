
const MentorshipReviewCard = ({ avatar, name, date, rating, content }) => {
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
          <Avatar src={avatar} sx={{ width: 48, height: 48 }} />
          <Stack justifyContent="center"> 
            <Typography fontWeight={700}>
              {name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {date}
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
