import { Box, Typography, Button } from '@mui/material';

const FeaturedArticleDonationCard = ({ article }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'stretch', md: 'center' }, width: '100%', gap: 3 }}>
      {/* IMAGE */}
      <Box component="img" src={article.image} alt={article.title} sx={{ width: { xs: '100%', md: '45%' }, height: { xs: 200, md: 250 }, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} />

      {/* CONTENT */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {/* INFO BLOCK */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {/* DATE */}
          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>{article.date}</Typography>

          {/* FUND NAME */}
          <Typography variant="h2" fontWeight={700} sx={{ fontSize: { xs: '1.4rem', md: '2rem' } }}>{article.title}</Typography>

          {/* ORGANIZER */}
          <Typography variant="body2" color="text.secondary">{article.organizer || 'Ban tổ chức'}</Typography>

          {/* STATS */}
          <Typography variant="caption" color="text.secondary">{article.donors || 0} người đã quyên góp</Typography>
        </Box>

        {/* DESCRIPTION */}
        <Typography sx={{ mt: 1 }}>{article.description}</Typography>

        {/* ACTION BUTTON */}
        <Box sx={{ mt: 2, display: 'flex' }}>
          <Button fullWidth variant="contained" color="primary" sx={{ textTransform: 'none', fontWeight: 600, py: 1.2 }}>
            Quyên góp
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default FeaturedArticleDonationCard;