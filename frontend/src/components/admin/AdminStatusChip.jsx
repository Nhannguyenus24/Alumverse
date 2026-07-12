import React from 'react';
import { useTranslation } from 'react-i18next';
import { resolveAdminStatusChip } from '../../constants/adminStatusDisplay';

const AdminStatusChip = ({
  status,
  category = 'account',
  label: labelOverride,
  size = 'small',
  variant = 'filled',
  sx,
  ...chipProps
}) => {
  const { t } = useTranslation('admin');
  const { label, color } = resolveAdminStatusChip(status, category, t);

  return (
    <Chip
      label={labelOverride ?? label}
      color={color}
      size={size}
      variant={variant}
      {...chipProps}
      sx={[
        {
          fontWeight: 700,
          textTransform: 'none',
          letterSpacing: 0.02,
          px: 0.5,
          height: 'auto',
          minHeight: 24,
          borderRadius: 999,
          '& .MuiChip-label': {
            px: 1,
            py: 0.35,
          },
        },
        ...(Array.isArray(sx) ? sx : sx != null ? [sx] : []),
      ]}
    />
  );
};

export default React.memo(AdminStatusChip);
