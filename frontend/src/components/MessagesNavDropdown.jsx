import { useState } from 'react';
import { IconButton, Menu } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

import MessagesPreviewPanel, { MESSAGES_PREVIEW_MENU_PAPER_SX } from './MessagesPreviewPanel';

const MessagesNavDropdown = ({ headerTextColor }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        id="messages-nav-trigger"
        size="small"
        aria-controls={open ? 'messages-nav-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleOpen}
        sx={{ color: headerTextColor }}
      >
        <ChatBubbleOutlineIcon />
      </IconButton>

      <Menu
        id="messages-nav-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              ...MESSAGES_PREVIEW_MENU_PAPER_SX,
              mt: 3,
            },
          },
        }}
      >
        <MessagesPreviewPanel onClose={handleClose} />
      </Menu>
    </>
  );
};

export default MessagesNavDropdown;
