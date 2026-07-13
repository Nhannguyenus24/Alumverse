import { Suspense, lazy, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Link, Typography } from '@mui/material';
import BrokenImageOutlinedIcon from '@mui/icons-material/BrokenImageOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';

// Defer the lightbox bundle (+ its CSS) until the user first opens the zoom view.
const FundLogoLightbox = lazy(() => import('../FundLogoLightbox'));

const parseMetadata = (metadata) => {
  if (!metadata) return {};
  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata) ?? {};
    } catch {
      return {};
    }
  }
  return metadata;
};

/**
 * Renders a chat attachment message (IMAGE or VIDEO) inline, with a
 * download-link fallback when the media fails to load or can't be played
 * by the current browser (e.g. webm on Safari, mov on Firefox).
 */
const ChatMessageMedia = ({ messageType, url, metadata }) => {
  const { t } = useTranslation(['network']);
  const [failed, setFailed] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxOpened, setLightboxOpened] = useState(false);
  const meta = useMemo(() => parseMetadata(metadata), [metadata]);
  const fileName = meta?.fileName ?? '';
  const lightboxSlides = useMemo(() => [{ src: url, alt: fileName || 'image' }], [url, fileName]);

  if (!url || failed) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 1,
          borderRadius: 2,
          border: '1px dashed',
          borderColor: 'divider',
          bgcolor: 'action.hover',
        }}
      >
        <BrokenImageOutlinedIcon fontSize="small" color="disabled" />
        <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
          {fileName || t('network:chat.attachment_unavailable')}
        </Typography>
        {url && (
          <Link href={url} download={fileName || true} underline="hover" sx={{ display: 'flex', ml: 0.5 }}>
            <DownloadOutlinedIcon fontSize="small" />
          </Link>
        )}
      </Box>
    );
  }

  if (messageType === 'IMAGE') {
    return (
      <>
        <Box
          component="img"
          src={url}
          alt={fileName || 'image'}
          onError={() => setFailed(true)}
          onClick={() => {
            setLightboxOpened(true);
            setLightboxOpen(true);
          }}
          sx={{
            maxWidth: 280,
            maxHeight: 320,
            borderRadius: 2,
            display: 'block',
            objectFit: 'cover',
            cursor: 'zoom-in',
          }}
        />
        {lightboxOpened && (
          <Suspense fallback={null}>
            <FundLogoLightbox
              open={lightboxOpen}
              onClose={() => setLightboxOpen(false)}
              slides={lightboxSlides}
            />
          </Suspense>
        )}
      </>
    );
  }

  return (
    <Box
      component="video"
      src={url}
      controls
      preload="metadata"
      onError={() => setFailed(true)}
      sx={{
        maxWidth: 300,
        maxHeight: 320,
        borderRadius: 2,
        display: 'block',
        bgcolor: 'common.black',
      }}
    />
  );
};

export default ChatMessageMedia;
