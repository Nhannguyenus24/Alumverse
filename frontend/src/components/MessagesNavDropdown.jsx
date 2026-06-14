import { useState } from 'react';
import { IconButton, Menu } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

import MessagesPreviewPanel from './MessagesPreviewPanel';
import { useMessagesPreviewMenu } from '../hooks/chat/useMessagesPreviewMenu';

const MessagesNavDropdown = ({ headerTextColor }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const { menuActionsRef, slotProps, updateMenuPosition } = useMessagesPreviewMenu({ mt: 3 });

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
        actions={menuActionsRef}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={slotProps}
      >
        <MessagesPreviewPanel
          onClose={handleClose}
          queryEnabled={open}
          onContentReady={updateMenuPosition}
        />
      </Menu>
    </>
  );
};

export default MessagesNavDropdown;
