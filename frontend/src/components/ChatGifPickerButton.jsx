import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  CircularProgress,
  IconButton,
  InputBase,
  Popover,
  Typography,
} from '@mui/material';
import GifBoxOutlinedIcon from '@mui/icons-material/GifBoxOutlined';
import SearchIcon from '@mui/icons-material/Search';

// Giphy keys are client-side keys, so shipping one to the browser is expected.
const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY || '3G9gLchSlXUZpn9MxTLwvhsBB1aNfrUv';
const GIPHY_ENDPOINT = 'https://api.giphy.com/v1/gifs';
const RESULT_LIMIT = 24;
const SEARCH_DEBOUNCE_MS = 400;

/**
 * A GIF picker backed by the Giphy REST API. Shows trending GIFs on open and
 * searches as the user types (debounced). Selecting a GIF calls
 * `onGifSelect({ url, title })` with a chat-sized rendition URL.
 */
function ChatGifPickerButton({ disabled = false, onGifSelect }) {
  const { t } = useTranslation(['network']);
  const [anchorEl, setAnchorEl] = useState(null);
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const open = Boolean(anchorEl);
  // Guards against out-of-order responses: only the latest request may commit.
  const requestIdRef = useRef(0);

  const handleOpen = (event) => {
    if (disabled) return;
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setQuery('');
  };

  const fetchGifs = useCallback(async (search) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError(false);
    try {
      const trimmed = search.trim();
      const path = trimmed ? 'search' : 'trending';
      const params = new URLSearchParams({
        api_key: GIPHY_API_KEY,
        limit: String(RESULT_LIMIT),
        rating: 'g',
        bundle: 'messaging_non_clips',
      });
      if (trimmed) params.set('q', trimmed);

      const response = await fetch(`${GIPHY_ENDPOINT}/${path}?${params.toString()}`);
      if (!response.ok) throw new Error('giphy_request_failed');
      const json = await response.json();
      if (requestId !== requestIdRef.current) return; // a newer request superseded this one

      const images = (json.data ?? [])
        .map((gif) => ({
          id: gif.id,
          preview: gif.images?.fixed_width_downsampled?.url ?? gif.images?.fixed_width?.url,
          // The API's rendition URLs carry long analytics query strings that can blow
          // past the 200-char message-content limit. Build the short canonical media
          // URL from the GIF id instead — it stays well under the limit and renders
          // the same animated GIF.
          full: gif.id ? `https://media.giphy.com/media/${gif.id}/giphy.gif` : null,
          title: gif.title || 'GIF',
        }))
        .filter((gif) => gif.preview && gif.full);
      setGifs(images);
    } catch {
      if (requestId !== requestIdRef.current) return;
      setError(true);
      setGifs([]);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  // Load trending immediately on open; debounce while the user is searching.
  useEffect(() => {
    if (!open) {
      setGifs([]);
      return undefined;
    }
    const delay = query.trim() ? SEARCH_DEBOUNCE_MS : 0;
    const timer = window.setTimeout(() => fetchGifs(query), delay);
    return () => window.clearTimeout(timer);
  }, [open, query, fetchGifs]);

  const handleSelect = (gif) => {
    onGifSelect?.({ url: gif.full, title: gif.title });
    handleClose();
  };

  return (
    <>
      <IconButton
        size="small"
        aria-label={t('network:chat.gif_picker', 'Chọn ảnh GIF')}
        edge="end"
        disabled={disabled}
        onClick={handleOpen}
        aria-expanded={open}
      >
        <GifBoxOutlinedIcon />
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        slotProps={{ paper: { sx: { overflow: 'hidden', borderRadius: 2 } } }}
      >
        <Box sx={{ width: 340, height: 420, display: 'flex', flexDirection: 'column' }}>
          {/* Search */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1.5,
              py: 1,
              m: 1,
              borderRadius: 999,
              bgcolor: 'action.hover',
            }}
          >
            <SearchIcon fontSize="small" color="disabled" />
            <InputBase
              autoFocus
              fullWidth
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('network:chat.gif_search_placeholder', 'Tìm ảnh GIF trên GIPHY')}
              sx={{ fontSize: 14 }}
            />
          </Box>

          {/* Results */}
          <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 1 }}>
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {!loading && error && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', px: 2 }}>
                <Typography variant="body2" color="text.secondary" align="center">
                  {t('network:chat.gif_error', 'Không tải được GIF. Vui lòng thử lại.')}
                </Typography>
              </Box>
            )}

            {!loading && !error && gifs.length === 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', px: 2 }}>
                <Typography variant="body2" color="text.secondary" align="center">
                  {t('network:chat.gif_empty', 'Không tìm thấy GIF phù hợp.')}
                </Typography>
              </Box>
            )}

            {!loading && !error && gifs.length > 0 && (
              <Box sx={{ columnCount: 2, columnGap: '8px', pb: 1 }}>
                {gifs.map((gif) => (
                  <Box
                    key={gif.id}
                    component="img"
                    src={gif.preview}
                    alt={gif.title}
                    loading="lazy"
                    onClick={() => handleSelect(gif)}
                    sx={{
                      width: '100%',
                      mb: 1,
                      borderRadius: 1.5,
                      display: 'block',
                      cursor: 'pointer',
                      breakInside: 'avoid',
                      bgcolor: 'action.hover',
                      transition: 'opacity 0.15s',
                      '&:hover': { opacity: 0.85 },
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>

          {/* Giphy attribution (required by the Giphy API terms) */}
          <Box sx={{ px: 1.5, py: 0.5, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.disabled">
              {t('network:chat.gif_powered_by', 'Cung cấp bởi GIPHY')}
            </Typography>
          </Box>
        </Box>
      </Popover>
    </>
  );
}

export default ChatGifPickerButton;
