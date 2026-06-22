import { useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import ZoomInOutlinedIcon from '@mui/icons-material/ZoomInOutlined';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import { FUND_LOGO_PREVIEW_SX } from '../utils/imageUtils';

const FundLogoPreview = ({ src, alt = 'Logo preview' }) => {
  const [open, setOpen] = useState(false);

  const slides = useMemo(() => [{ src, alt }], [src, alt]);

  if (!src) return null;

  return (
    <>
      <Box
        onClick={() => setOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setOpen(true);
          }
        }}
        aria-label="Xem ảnh logo phóng to"
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
            Nhấn để phóng to
          </Typography>
        </Box>
      </Box>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        slides={slides}
        plugins={[Zoom]}
        zoom={{ scrollToZoom: true }}
        carousel={{ finite: true }}
        render={{
          buttonPrev: () => null,
          buttonNext: () => null,
        }}
        controller={{ closeOnBackdropClick: true }}
      />
    </>
  );
};

export default FundLogoPreview;
