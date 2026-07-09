import { useState } from 'react';
import { IconButton, Menu, Tooltip } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useTranslation } from 'react-i18next';

import MessagesPreviewPanel from './MessagesPreviewPanel';
import { useMessagesPreviewMenu } from '../hooks/chat/useMessagesPreviewMenu';
import { useCanAccessChat } from '../hooks/chat/useCanAccessChat';

const MessagesNavDropdown = ({ headerTextColor }) => {
  const { t } = useTranslation(['network', 'common']);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const { menuActionsRef, slotProps, updateMenuPosition } = useMessagesPreviewMenu({ mt: 4 });
  const { canAccessChat } = useCanAccessChat();

  const handleOpen = (event) => {
    if (!canAccessChat) return;
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Tooltip
        title={canAccessChat ? t('conversations') : t('common:verification_required_tooltip')}
        arrow
        placement="bottom"
        slotProps={{
          popper: {
            modifiers: [{ name: 'offset', options: { offset: [0, 4] } }],
          },
        }}
      >
        <span>
          <IconButton
            id="messages-nav-trigger"
            size="small"
            aria-label={t('conversations')}
            aria-controls={open ? 'messages-nav-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
            onClick={handleOpen}
            disabled={!canAccessChat}
            sx={{ color: headerTextColor }}
          >
            <ChatBubbleOutlineIcon />
          </IconButton>
        </span>
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
