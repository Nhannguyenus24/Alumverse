import { Box, Typography, Button, Stack } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useState } from 'react';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LinkIcon from '@mui/icons-material/Link';
import { useTranslation } from 'react-i18next';
import { getCardTitleFontSize } from '../../utils/text';
import { toPlainText } from '../../utils/stringUtils';

const ArticleCard = ({ article, isAdmin = false, onEdit, stretch = true }) => {
  const { t } = useTranslation(['common']);
  const [hovered, setHovered] = useState(false);
  const description = toPlainText(article.description);

  return (
    <Box
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: stretch ? '100%' : 'auto',
        gap: 1.5,
        transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
    >
      {/* IMAGE — wrapper với hiệu ứng wipe từ góc trên bên phải & bóng mờ phát sáng tông chính */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: 180,
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

      {/* TEXT — flex: 1 để đẩy date/buttons xuống đáy */}
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 1 }}>
        {/* Title + arrow */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              flex: 1,
              fontSize: getCardTitleFontSize(article.title),
              lineHeight: 1.25,
              wordBreak: 'break-word',
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
            textAlign: 'left',
            lineHeight: 1.5,
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
          }}
        >
          {description}
        </Typography>

        {/* BOTTOM SECTION */}
        <Box sx={{ mt: 'auto', pt: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                {t('common:edit')}
              </Button>
            </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ArticleCard;
