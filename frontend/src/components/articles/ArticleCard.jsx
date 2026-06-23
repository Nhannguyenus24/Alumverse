import { Box, Typography, Button, Stack } from '@mui/material';
import { useState } from 'react';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useTranslation } from 'react-i18next';

const ArticleCard = ({ article, isAdmin = false, onEdit, onDelete }) => {
  const { t } = useTranslation('article');
  const [hovered, setHovered] = useState(false);

  return (
    <Box
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%', // kéo full chiều cao cell trong grid
        gap: 1,
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

        <Typography variant="caption" color="text.secondary">
          {article.date}
        </Typography>

        {/* Spacer đẩy buttons xuống đáy */}
        <Box sx={{ flex: 1 }} />

        {/* ACTION BUTTONS */}
        {isAdmin && (
          <Stack direction="row" spacing={1}>
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
              {t('edit_article')}
            </Button>

            {/* DELETE BUTTON */}
            <Button
              fullWidth
              variant="contained"
              color="error"
              startIcon={<DeleteOutlineOutlinedIcon />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
              }}
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
            >
              {t('delete_article')}
            </Button>
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default ArticleCard;