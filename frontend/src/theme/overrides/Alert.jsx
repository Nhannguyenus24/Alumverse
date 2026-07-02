import { alpha } from '@mui/material/styles';

const standardSeverity = (theme, color) => {
  const paletteColor = theme.palette[color];
  const isDark = theme.palette.mode === 'dark';

  return {
    color: isDark ? paletteColor.light : paletteColor.dark,
    backgroundColor: alpha(paletteColor.main, isDark ? 0.14 : 0.1),
    border: `1px solid ${alpha(paletteColor.main, isDark ? 0.32 : 0.22)}`,
    '& .MuiAlert-icon': {
      color: isDark ? paletteColor.light : paletteColor.main,
    },
  };
};

export default function Alert(theme) {
  return {
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: theme.shape.borderRadius,
        },
        standardInfo: standardSeverity(theme, 'info'),
        standardSuccess: standardSeverity(theme, 'success'),
        standardWarning: standardSeverity(theme, 'warning'),
        standardError: standardSeverity(theme, 'error'),
      },
    },
  };
}
