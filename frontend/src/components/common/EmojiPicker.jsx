import { Box, Popover } from "@mui/material";
import EmojiPicker from "emoji-picker-react";

const EmojiPickerComponent = ({
  open = true,
  anchorEl = null,
  onClose,
  onEmojiClick,
}) => {
  const handleEmojiClick = (emojiData) => {
    if (onEmojiClick) {
      onEmojiClick(emojiData);
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "left",
      }}
    >
      <Box sx={{ p: 1 }}>
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          skinTonesDisabled
          searchDisabled={false}
        />
      </Box>
    </Popover>
  );
};

export default EmojiPickerComponent;