import { Box, Typography, Button, Stack } from '@mui/material';
import { useState } from 'react';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LinkIcon from '@mui/icons-material/Link';
import { useTranslation } from 'react-i18next';

const ArticleCard = ({ article, isAdmin = false, onEdit, stretch = true }) => {
  const { t } = useTranslation(['common']);
  const [hovered, setHovered] = useState(false);

  return (
    <Box
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: stretch ? '100%' : 'auto',
        gap: 1.5,
        // Lift nhẹ toàn card khi hover
        transition: 'transform 0.25s ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
    >
      {/* IMAGE — wrapper để clip scale */}
      <Box sx={{ width: '100%', height: 180, borderRadius: 1, overflow: 'hidden', flexShrink: 0 }}>
        <Box
          component="img"
          src={article.image}
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

      {/* TEXT — flex: 1 để đẩy date/buttons xuống đáy */}
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 1 }}>
        {/* Title + arrow */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              flex: 1,
              display: '-webkit-box',
              overflow: 'hidden',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              color: hovered ? 'primary.main' : 'text.primary',
              transition: 'color 0.2s ease',
            }}
          >
            {article.title}
          </Typography>

          {/* Arrow chạy ra khi hover */}
          <ArrowForwardIcon
            fontSize="small"
            sx={{
              mt: '3px',           // align với dòng đầu title
              flexShrink: 0,
              color: 'primary.main',
              opacity: hovered ? 1 : 0,
              transform: hovered ? 'translateX(0)' : 'translateX(-6px)',
              transition: 'opacity 0.2s ease, transform 0.2s ease',
            }}
          />
        </Box>

        {/* Description giữ đúng 3 dòng, overflow → ellipsis */}
        <Typography
          variant="body2"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {article.description}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
          <Typography variant="caption" color="text.secondary">
            {article.date}
          </Typography>
          {article.url && (
            <Button
              size="small"
              variant="text"
              color="primary"
              endIcon={<LinkIcon />}
              onClick={(e) => {
                e.stopPropagation();
                window.open(article.url, '_blank', 'noopener,noreferrer');
              }}
              sx={{ textTransform: 'none', fontWeight: 600, minWidth: 'auto', p: 0.5 }}
            >
              {t('common:link', 'Link')}
            </Button>
          )}
        </Box>

        {/* ACTION BUTTONS */}
        {isAdmin && (
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            {/* EDIT BUTTON */}
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              startIcon={<EditOutlinedIcon />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
              }}
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
            >
              {t('common:edit')}
            </Button>

          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default ArticleCard;
