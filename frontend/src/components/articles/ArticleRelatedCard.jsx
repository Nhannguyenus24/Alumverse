import { Box, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useState } from 'react';

const ArticleRelatedCard = ({ article }) => {
  const [hovered, setHovered] = useState(false);

  if (!article) return null;

  return (
    <Box
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        width: '100%',
        minWidth: 0,
        p: 1,
        border: '1px solid',
        borderColor: hovered ? 'primary.main' : 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
        cursor: 'pointer',
        transition: 'border-color 0.2s ease, background-color 0.2s ease, transform 0.25s ease',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
    >
      <Box
        sx={{
          width: 96,
          height: 72,
          borderRadius: 1,
          overflow: 'hidden',
          flexShrink: 0,
          bgcolor: 'action.hover',
        }}
      >
        <Box
          component="img"
          src={article.image || '/placeholder-image.png'}
          alt={article.title}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease',
            transform: hovered ? 'scale(1.06)' : 'scale(1)',
          }}
        />
      </Box>

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          variant="subtitle2"
          fontWeight={700}
          sx={{
            color: hovered ? 'primary.main' : 'text.primary',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            transition: 'color 0.2s ease',
          }}
        >
          {article.title}
        </Typography>
        {article.date && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            {article.date}
          </Typography>
        )}
      </Box>

      <ArrowForwardIcon
        fontSize="small"
        sx={{
          flexShrink: 0,
          color: 'primary.main',
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateX(0)' : 'translateX(-6px)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }}
      />
    </Box>
  );
};

export default ArticleRelatedCard;
