import { Alert, Box, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

import { useCanContribute } from '../hooks/useCanContribute';

/**
 * Shared UI helpers for gating content-changing actions behind alumni
 * verification (verificationLevel >= 2) or basic authenticated actions.
 *
 * See {@link useCanContribute} for the underlying rule.
 */

const useGuardMessage = (required = 'contribute') => {
  const { t } = useTranslation('common');
  const { canContribute, canUseBasicActions, isAuthenticated } = useCanContribute();

  const allowed = required === 'basic' ? canUseBasicActions : canContribute;
  if (allowed) return '';
  return isAuthenticated
    ? t('verification_required_tooltip')
    : t('verification_required_login');
};

export const verificationAccentAlertSx = (theme) => ({
  border: '1px solid',
  borderColor: alpha(theme.palette.accent.main, theme.palette.mode === 'dark' ? 0.46 : 0.32),
  bgcolor: alpha(theme.palette.accent.main, theme.palette.mode === 'dark' ? 0.16 : 0.1),
  color: theme.palette.mode === 'dark' ? theme.palette.accent.light : theme.palette.accent.darker,
  '& .MuiAlert-icon': {
    color: 'accent.main',
  },
});

/**
 * Wraps a control (button, editor, ...) in a Tooltip that explains why the
 * action is unavailable when the current user may not contribute. When the
 * user can contribute, no tooltip is shown. The caller is still responsible
 * for disabling the wrapped control via `useCanContribute().canContribute`.
 */
export const ContributeGuardTooltip = ({
  children,
  placement = 'top',
  arrow = true,
  sx,
  required = 'contribute',
}) => {
  const title = useGuardMessage(required);

  return (
    <Tooltip title={title} placement={placement} arrow={arrow} disableHoverListener={!title}>
      <Box component="span" sx={{ display: 'inline-flex', ...sx }}>
        {children}
      </Box>
    </Tooltip>
  );
};

/**
 * Banner shown near a form/section explaining that alumni verification is
 * required. Renders nothing when the user may contribute.
 */
export const VerificationRequiredAlert = ({ sx, severity = 'info', required = 'contribute' }) => {
  const { t } = useTranslation('common');
  const { canContribute, canUseBasicActions, isAuthenticated } = useCanContribute();

  const allowed = required === 'basic' ? canUseBasicActions : canContribute;
  if (allowed) return null;

  return (
    <Alert
      severity={severity}
      sx={[
        verificationAccentAlertSx,
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {isAuthenticated ? t('verification_required_alert') : t('verification_required_login')}
    </Alert>
  );
};
