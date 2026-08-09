import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../stores/authStore';
import useOrganizationStore from '../stores/organizationStore';

export default function SessionExpiredDialog() {
  const { t } = useTranslation(['auth', 'common']);
  const sessionExpired = useAuthStore((state) => state.sessionExpired);
  const reset = useAuthStore((state) => state.reset);

  const handleClose = () => {
    // Clear the unusable local session as well as closing the dialog. Keeping the
    // expired access token would make the next authenticated request reopen it.
    reset();
  };

  const handleLogin = () => {
    // Capture slug from organization store BEFORE reset clears it
    const storeSlug = useOrganizationStore.getState().currentSlug;
    
    // Reset clears user context, causing ProtectedRoute to redirect, but since we are handling
    // the redirect manually here we should just redirect explicitly.
    reset();

    if (window.location.pathname.includes('/auth/login')) {
      return;
    }

    const currentPath = `${window.location.pathname}${window.location.search}`;

    const RESERVED = ['admin', '404', 'unauthorized', '500', 'maintenance'];
    let slug = storeSlug ?? null;
    if (!slug) {
      const firstSegment = window.location.pathname.split('/').filter(Boolean)[0];
      slug = firstSegment && !RESERVED.includes(firstSegment) ? firstSegment : null;
    }

    const loginPath = slug
      ? `/${slug}/auth/login?reason=login_required&from=${encodeURIComponent(currentPath)}`
      : `/404`;

    window.location.href = loginPath;
  };

  return (
    <Dialog
      open={sessionExpired}
      // Escape remains disabled, but users can dismiss via the backdrop or Close button.
      disableEscapeKeyDown
      onClose={handleClose}
      PaperProps={{
        sx: {
          borderRadius: 2,
          p: 1,
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 'bold' }}>
        {t('session_expired_title', { defaultValue: 'Phiên đăng nhập hết hạn' })}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t('session_expired_message', { defaultValue: 'Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.' })}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" color="primary" onClick={handleClose} sx={{ flex: 1 }}>
          {t('common:close', { defaultValue: 'Đóng' })}
        </Button>
        <Button variant="contained" color="primary" onClick={handleLogin} sx={{ flex: 1 }}>
          {t('login', { defaultValue: 'Đăng nhập' })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
