import { Box, Typography, Button } from '@mui/material';

const ArticleDonationCard = ({ article }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* IMAGE */}
      <Box component="img" src={article.image} alt={article.title} sx={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 1 }} />

      {/* MAIN INFO */}
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {/* DATE */}
        <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>{article.date}</Typography>

        {/* FUND NAME */}
        <Typography variant="h4" fontWeight={700}>{article.title}</Typography>

        {/* ORGANIZER */}
        <Typography variant="body2" color="text.secondary">{article.organizer || 'Ban tổ chức'}</Typography>

        {/* STATS */}
        <Typography variant="caption" color="text.secondary">
          {article.donors || 0} người đã quyên góp
        </Typography>
      </Box>

      {/* DESCRIPTION */}
      <Typography variant="body2">{article.description}</Typography>

      {/* ACTION BUTTON */}
      <Button fullWidth variant="contained" color="primary" sx={{ textTransform: 'none', fontWeight: 600 }}>
        Quyên góp
      </Button>
    </Box>
  );
};

export default ArticleDonationCard;