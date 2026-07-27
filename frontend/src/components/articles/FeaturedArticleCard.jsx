import { Box, Typography, Button, Stack } from '@mui/material';
import { alpha } from '@mui/material/styles';
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
        gap: { xs: 1.25, md: 3 },
        transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
    >
      {/* IMAGE */}
      <Box
        sx={{
          position: 'relative',
          width: { xs: '100%', md: '45%' },
          height: { xs: 180, sm: 220, md: isAdmin ? 300 : 252 },
          aspectRatio: { md: '16 / 10' },
          alignSelf: { md: 'stretch' },
          borderRadius: 2,
          overflow: 'hidden',
          flexShrink: 0,
          boxShadow: hovered
            ? '0 8px 20px rgba(0,0,0,0.12)'
            : '0 2px 8px rgba(0,0,0,0.04)',
          transition: 'box-shadow 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '140%',
            height: '140%',
            transformOrigin: '100% 0%',
            background: (theme) =>
              `radial-gradient(circle at 100% 0%, ${alpha(theme.palette.primary.main, 0.34)} 0%, ${alpha(
                theme.palette.primary.main,
                0.12
              )} 40%, transparent 75%)`,
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'scale(1.15)' : 'scale(0.2)',
            transition: 'opacity 0.65s cubic-bezier(0.25, 1, 0.5, 1), transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)',
            pointerEvents: 'none',
            zIndex: 2,
          },
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
            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: hovered ? 'scale(1.08)' : 'scale(1)',
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
          minHeight: { md: isAdmin ? 300 : 252 },
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
              lineHeight: { xs: 1.22, md: 1.18 },
              overflowWrap: 'break-word',
              wordBreak: 'normal',
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
          variant="body1"
          sx={{
            mt: { xs: 0.75, md: 2 },
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            color: 'text.secondary',
            lineHeight: { xs: 1.45, md: 1.55 },
            minHeight: { xs: '4.35em', md: '4.65em' },
            textAlign: 'left',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
          }}
        >
          {article.description}
        </Typography>

        {/* BOTTOM SECTION */}
        <Box
          sx={{
            mt: 'auto',
            pt: { xs: 1.25, md: isAdmin ? 2 : 1.5 },
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 1.25, md: isAdmin ? 1.5 : 1 },
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
