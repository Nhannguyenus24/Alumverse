import { Box, ButtonBase, Card, CardContent, CardMedia, Typography } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

const ForumSponsoredCard = ({
  title = 'Sponsored',
  imageSrc,
  imageAlt = '',
  caption,
  description,
  href,
}) => {
  const card = (
    <Card
      elevation={0}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 0,
        overflow: 'hidden',
        backgroundColor: 'background.paper',
        width: '100%',
        transition: (theme) => theme.transitions.create(['border-color', 'box-shadow', 'transform']),
        '&:hover': href ? {
          borderColor: 'primary.main',
          boxShadow: (theme) => theme.shadows[3],
          transform: 'translateY(-1px)',
        } : undefined,
      }}
    >
      <CardMedia
        component="img"
        src={imageSrc}
        alt={imageAlt}
        sx={{
          height: { xs: 140, sm: 160 },
          objectFit: 'cover',
        }}
      />
      <CardContent sx={{ py: { xs: 1, sm: 1.25 }, px: { xs: 1.25, sm: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Typography variant="body2" fontWeight={700} color="text.primary">
            {caption}
          </Typography>
          {href ? <OpenInNewIcon sx={{ fontSize: 14, color: 'text.secondary', flexShrink: 0 }} /> : null}
        </Box>
        {description ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, lineHeight: 1.45 }}>
            {description}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );

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
      {href ? (
        <ButtonBase
          component="a"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={caption}
          sx={{ display: 'block', width: '100%', textAlign: 'left' }}
        >
          {card}
        </ButtonBase>
      ) : card}
    </Box>
  );
};

export default ForumSponsoredCard;
