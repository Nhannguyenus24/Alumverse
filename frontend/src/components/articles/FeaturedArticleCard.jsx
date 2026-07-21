import { Box, Typography, Button, Stack } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LinkIcon from '@mui/icons-material/Link';
import { getFeaturedTitleFontSize } from '../../utils/text';

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
        alignItems: { xs: 'stretch', md: 'stretch' },
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
          height: { xs: 200, md: 'auto' },
          minHeight: { xs: 200, md: 250 },
          alignSelf: { md: 'stretch' },
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
          minHeight: { md: 250 },
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
              fontSize: getFeaturedTitleFontSize(article.title),
              color: hovered ? 'primary.main' : 'text.primary',
              transition: 'color 0.2s ease',
              wordBreak: 'break-word',
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
            WebkitLineClamp: (article.title || '').length > 75 ? 2 : 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {article.description}
        </Typography>

        {/* BOTTOM SECTION */}
        <Box
          sx={{
            mt: 'auto',
            pt: 2.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
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

          {/* ACTION BUTTONS */}
          {isAdmin && (
            <Stack direction="row" spacing={1}>
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
    </Box>
  );
};

export default FeaturedArticleCard;
