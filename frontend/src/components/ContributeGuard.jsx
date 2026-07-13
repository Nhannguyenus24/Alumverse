import { Alert, Box, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { useCanContribute } from '../hooks/useCanContribute';

/**
 * Shared UI helpers for gating content-changing actions behind alumni
 * verification (verificationLevel >= 2, ADMIN/STAFF bypass).
 *
 * See {@link useCanContribute} for the underlying rule.
 */

const useGuardMessage = () => {
  const { t } = useTranslation('common');
  const { canContribute, isAuthenticated } = useCanContribute();

  if (canContribute) return '';
  return isAuthenticated
    ? t('verification_required_tooltip')
    : t('verification_required_login');
};

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
}) => {
  const title = useGuardMessage();

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
export const VerificationRequiredAlert = ({ sx, severity = 'warning' }) => {
  const { t } = useTranslation('common');
  const { canContribute, isAuthenticated } = useCanContribute();

  if (canContribute) return null;

  return (
    <Alert severity={severity} sx={sx}>
      {isAuthenticated ? t('verification_required_alert') : t('verification_required_login')}
    </Alert>
  );
};
