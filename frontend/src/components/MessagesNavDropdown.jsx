import { useState } from 'react';
import { IconButton, Menu, Tooltip } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useTranslation } from 'react-i18next';

import MessagesPreviewPanel from './MessagesPreviewPanel';
import { useMessagesPreviewMenu } from '../hooks/chat/useMessagesPreviewMenu';

const MessagesNavDropdown = ({ headerTextColor }) => {
  const { t } = useTranslation('network');
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const { menuActionsRef, slotProps, updateMenuPosition } = useMessagesPreviewMenu({ mt: 1.5 });

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Tooltip
        title={t('conversations')}
        arrow
        placement="bottom"
        slotProps={{
          popper: {
            modifiers: [{ name: 'offset', options: { offset: [0, 4] } }],
          },
        }}
      >
        <IconButton
          id="messages-nav-trigger"
          size="small"
          aria-label={t('conversations')}
          aria-controls={open ? 'messages-nav-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleOpen}
          sx={{ color: headerTextColor }}
        >
          <ChatBubbleOutlineIcon />
        </IconButton>
      </Tooltip>

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
