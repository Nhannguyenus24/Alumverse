import { Suspense, lazy, useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import ZoomInOutlinedIcon from '@mui/icons-material/ZoomInOutlined';
import { FUND_LOGO_PREVIEW_SX } from '../utils/imageUtils';
import { useTranslation } from 'react-i18next';

// Defer the lightbox bundle (+ its CSS) until the user first opens the zoom view.
const FundLogoLightbox = lazy(() => import('./FundLogoLightbox'));

const FundLogoPreview = ({ src, alt = 'Logo preview' }) => {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  const slides = useMemo(() => [{ src, alt }], [src, alt]);

  const handleOpen = () => {
    setHasOpened(true);
    setOpen(true);
  };

  if (!src) return null;

  return (
    <>
      <Box
        onClick={handleOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleOpen();
          }
        }}
        aria-label={t('fund_logo_view_zoom')}
        sx={{
          position: 'relative',
          width: '100%',
          cursor: 'zoom-in',
          '&:hover .fund-logo-preview-overlay': { opacity: 1 },
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: 2,
            borderRadius: 1,
          },
        }}
      >
        <Box component="img" src={src} alt={alt} sx={FUND_LOGO_PREVIEW_SX} />
        <Box
          className="fund-logo-preview-overlay"
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.5,
            bgcolor: 'rgba(0, 0, 0, 0.4)',
            opacity: 0,
            transition: 'opacity 0.2s',
            borderRadius: 1,
            color: 'common.white',
          }}
        >
          <ZoomInOutlinedIcon sx={{ fontSize: 36 }} />
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {t('click_to_zoom')}
          </Typography>
        </Box>
      </Box>

      {hasOpened && (
        <Suspense fallback={null}>
          <FundLogoLightbox open={open} onClose={() => setOpen(false)} slides={slides} />
        </Suspense>
      )}
    </>
  );
};

export default FundLogoPreview;
