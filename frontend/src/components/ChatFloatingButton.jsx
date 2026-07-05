import { useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Fade,
  IconButton,
  Menu,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ChatBubbleOutline as ChatBubbleOutlineIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';
import { useLocation } from 'react-router';

import { useAuth } from '../hooks/useAuth';
import { useOrgNavigate } from '../hooks/useOrgNavigate';
import MessagesPreviewPanel from './MessagesPreviewPanel';
import { useMessagesPreviewMenu } from '../hooks/chat/useMessagesPreviewMenu';
import { useCanAccessChat } from '../hooks/chat/useCanAccessChat';
import { useTranslation } from 'react-i18next';

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
`;

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const AnimatedAvatar = styled(Avatar, {
  shouldForwardProp: (prop) => prop !== 'isAnimating',
})(({ isAnimating, theme }) => ({
  width: 60,
  height: 60,
  backgroundColor: theme.palette.primary.main,
  animation: isAnimating ? `${pulse} 1.5s ease-in-out infinite` : 'none',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.1)',
  },
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
}));

const LoginPanel = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  bottom: 70,
  right: 0,
  width: 320,
  borderRadius: theme.spacing(2),
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
  zIndex: 998,
  overflow: 'hidden',
  animation: `${slideUp} 0.3s ease-out`,
}));

const PanelHeader = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  padding: theme.spacing(2),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

const PanelBody = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2.5),
  backgroundColor: theme.palette.background.paper,
}));

export default function ChatFloatingButton({ isOpen = false, onOpen, onClose }) {
  const { t } = useTranslation('common');
  const { isAuthenticated } = useAuth();
  const navigate = useOrgNavigate();
  const location = useLocation();
  const [showLoginPanel, setShowLoginPanel] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);
  const { menuActionsRef, slotProps, updateMenuPosition } = useMessagesPreviewMenu({ mb: 1.5 });
  const { canAccessChat } = useCanAccessChat();

  useEffect(() => {
    if (!isOpen) {
      setAnchorEl(null);
      setShowLoginPanel(false);
    }
  }, [isOpen]);

  const handleClick = (event) => {
    onOpen?.();
    if (isAuthenticated) {
      if (!canAccessChat) return;
      setAnchorEl(event.currentTarget);
      return;
    }
    setShowLoginPanel(true);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    onClose?.();
  };

  const handleClosePanel = () => {
    setShowLoginPanel(false);
    onClose?.();
  };

  const goToLogin = () => {
    setShowLoginPanel(false);
    onClose?.();
    navigate('/auth/login', { state: { from: location } });
  };

  const goToRegister = () => {
    setShowLoginPanel(false);
    onClose?.();
    navigate('/auth/register', { state: { from: location } });
  };

  const isBlocked = isAuthenticated && !canAccessChat;

  return (
    <Box sx={{ position: 'relative' }}>
      <Tooltip
        title={isBlocked ? t('verification_required_tooltip') : t('chat_tooltip')}
        placement="left"
      >
        <AnimatedAvatar
          onClick={handleClick}
          isAnimating={!isBlocked && !showLoginPanel && !menuOpen}
          sx={{
            cursor: isBlocked ? 'not-allowed' : 'pointer',
            opacity: isBlocked ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChatBubbleOutlineIcon sx={{ fontSize: 28, color: 'common.white' }} />
        </AnimatedAvatar>
      </Tooltip>

      {isAuthenticated && (
        <Menu
          id="messages-floating-menu"
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={handleCloseMenu}
          actions={menuActionsRef}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          slotProps={slotProps}
        >
          <MessagesPreviewPanel
            onClose={handleCloseMenu}
            queryEnabled={menuOpen}
            onContentReady={updateMenuPosition}
          />
        </Menu>
      )}

      <Fade in={showLoginPanel} timeout={300}>
        <LoginPanel>
          <PanelHeader>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <ChatBubbleOutlineIcon />
              {t('chat_tooltip')}
            </Typography>
            <IconButton
              size="small"
              onClick={handleClosePanel}
              aria-label={t('close')}
              sx={{ color: 'common.white' }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </PanelHeader>

          <PanelBody>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              {t('chat_login_prompt')}
            </Typography>

            <Stack spacing={1.5}>
              <Button variant="contained" fullWidth onClick={goToLogin}>
                {t('login')}
              </Button>
              <Button variant="outlined" fullWidth onClick={goToRegister}>
                {t('register')}
              </Button>
            </Stack>
          </PanelBody>
        </LoginPanel>
      </Fade>
    </Box>
  );
}
