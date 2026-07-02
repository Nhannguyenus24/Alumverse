import { alpha } from '@mui/material/styles';

export default function Dialog(theme) {
  const isDark = theme.palette.mode === 'dark';

  return {
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: isDark
            ? `0 24px 72px ${alpha(theme.palette.common.black, 0.58)}`
            : `0 24px 72px ${alpha(theme.palette.grey[900], 0.16)}`,
        },
      },
    },
  };
}
