import { lazy, useState } from 'react';

const EmojiPicker = lazy(() => import('emoji-picker-react'));

function ChatEmojiPickerButton({ disabled = false, onEmojiSelect }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event) => {
    if (disabled) return;
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleEmojiClick = (emojiData) => {
    onEmojiSelect?.(emojiData.emoji);
    handleClose();
  };

  return (
    <>
      <IconButton
        size="small"
        aria-label="Emoji"
        edge="end"
        disabled={disabled}
        onClick={handleOpen}
        aria-expanded={open}
      >
        <MoodIcon />
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { overflow: 'hidden' },
          },
        }}
      >
        <Suspense fallback={<Box sx={{ width: 320, height: 400 }} />}>
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            width={320}
            height={400}
          />
        </Suspense>
      </Popover>
    </>
  );
}

export default ChatEmojiPickerButton;
