import { Box, Typography, Button, Stack } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LinkIcon from '@mui/icons-material/Link';

const FeaturedArticleCard = ({
  article,
  isAdmin = false,
  onEdit,
}) => {
  const { t } = useTranslation(['common']);
  const [hovered, setHovered] = useState(false);

  return (
    <Box
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: 'center',
        width: '100%',
        gap: 3,
        transition: 'transform 0.25s ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
    >
      {/* IMAGE */}
      <Box
        sx={{
          width: { xs: '100%', md: '45%' },
          height: { xs: 200, md: 250 },
          borderRadius: 2,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
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

      {/* CONTENT */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        {/* TITLE + ARROW */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 0.5,
          }}
        >
          <Typography
            variant="h2"
            fontWeight={700}
            sx={{
              flex: 1,
              fontSize: { xs: '1.4rem', md: '2rem' },
              color: hovered ? 'primary.main' : 'text.primary',
              transition: 'color 0.2s ease',
            }}
          >
            {article.title}
          </Typography>

          <ArrowForwardIcon
            sx={{
              mt: '6px',
              flexShrink: 0,
              color: 'primary.main',
              opacity: hovered ? 1 : 0,
              transform: hovered
                ? 'translateX(0)'
                : 'translateX(-6px)',
              transition:
                'opacity 0.2s ease, transform 0.2s ease',
            }}
          />
        </Box>

        {/* DESCRIPTION */}
        <Typography
          sx={{
            mt: 2,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {article.description}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 2 }}>
          <Typography
            variant="caption"
            color="text.secondary"
          >
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

        {/* PUSH ACTIONS DOWN */}
        <Box sx={{ flex: 1 }} />

        {/* ACTION BUTTONS */}
        {isAdmin && (
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
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

export default FeaturedArticleCard;
