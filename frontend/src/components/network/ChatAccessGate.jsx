import LoadingSkeleton from '../LoadingSkeleton';
import { Box, Container, Typography, Alert, Tooltip, IconButton } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useTranslation } from 'react-i18next';

import { useCanAccessChat } from '../../hooks/chat/useCanAccessChat';
import Page from '../Page';
import { verificationAccentAlertSx } from '../ContributeGuard';

/**
 * Route-level gate for /chat: blocks access for members below the
 * contribute verification threshold instead of rendering the full chat UI
 * with a silently-disabled message input.
 */
const ChatAccessGate = ({ children }) => {
  const { t } = useTranslation(['network', 'common']);
  const { canAccessChat, isAuthenticated, isLoading } = useCanAccessChat();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <LoadingSkeleton />
      </Box>
    );
  }

  if (canAccessChat) return children;

  return (
    <Page title="Chat">
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          {t('network:chat.access_blocked_title')}
        </Typography>
        <Alert
          severity="info"
          sx={[verificationAccentAlertSx, { textAlign: 'left', mt: 2, alignItems: 'center' }]}
        >
          {isAuthenticated
            ? t('common:verification_required_alert')
            : t('common:verification_required_login')}
          <Tooltip title={t('common:verification_required_tooltip')} arrow>
            <IconButton
              size="small"
              sx={{ ml: 1 }}
              aria-label={t('common:verification_required_tooltip')}
            >
              <InfoOutlinedIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </Alert>
      </Container>
    </Page>
  );
};

export default ChatAccessGate;
