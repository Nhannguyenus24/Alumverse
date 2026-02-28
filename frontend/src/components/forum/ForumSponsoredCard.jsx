import { Box, Card, CardContent, CardMedia, Typography } from '@mui/material';

const ForumSponsoredCard = ({ title = 'Sponsored', imageSrc, imageAlt = '', caption }) => {
  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight={700}
        sx={{ display: 'block', mb: 1, letterSpacing: 0.3 }}
      >
        {title}
      </Typography>
      <Card
        elevation={0}
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 0,
          overflow: 'hidden',
          backgroundColor: '#fff',
        }}
      >
        <CardMedia
          component="img"
          src={imageSrc}
          alt={imageAlt}
          sx={{
            height: 160,
            objectFit: 'cover',
          }}
        />
        <CardContent sx={{ py: 1.25, px: 1.5 }}>
          <Typography variant="body2" fontWeight={600} color="text.primary">
            {caption}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ForumSponsoredCard;

