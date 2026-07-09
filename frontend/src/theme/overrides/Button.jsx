import { alpha } from '@mui/material/styles';

const Button = (theme) => {
  const { palette } = theme;
  const isDark = palette.mode === 'dark';

  return {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 700,
          borderRadius: 6,
          padding: "6px 16px",
          minWidth: 64,
        },
        sizeSmall: {
          padding: "4px 12px",
          minWidth: 56,
          fontSize: "0.875rem",
        },
        sizeMedium: {
          padding: "8px 20px",
          minWidth: 64,
        },
        sizeLarge: {
          padding: "10px 24px",
          minWidth: 72,
          fontSize: "1rem",
        },
        contained: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
        },
        containedPrimary: {
          backgroundColor: palette.primary.main,
          color: palette.primary.contrastText,
          "&:hover": {
            backgroundColor: palette.primary.dark,
          },
        },
        containedSecondary: {
          backgroundColor: palette.secondary.main,
          color: palette.secondary.contrastText,
          "&:hover": {
            backgroundColor: palette.secondary.dark,
          },
        },
        containedAccent: {
          backgroundColor: palette.accent?.main,
          color: palette.accent?.contrastText,
          "&:hover": {
            backgroundColor: palette.accent?.dark,
          },
        },
        containedTertiary: {
          backgroundColor: palette.tertiary?.main ?? palette.grey[800],
          color: palette.tertiary?.contrastText ?? "#fff",
          "&:hover": {
            backgroundColor: palette.tertiary?.dark ?? palette.grey[900],
          },
        },
        outlined: {
          borderWidth: 1,
          "&:hover": {
            borderWidth: 1,
          },
        },
        outlinedPrimary: {
          borderColor: palette.primary.main,
          color: palette.primary.main,
          "&:hover": {
            borderColor: palette.primary.dark,
            color: palette.primary.dark,
            backgroundColor: isDark ? alpha(palette.primary.main, 0.12) : palette.primary.lighter,
          },
        },
        outlinedSecondary: {
          borderColor: palette.secondary.main,
          color: palette.secondary.main,
          "&:hover": {
            borderColor: palette.secondary.dark,
            color: palette.secondary.dark,
            backgroundColor: isDark ? alpha(palette.secondary.main, 0.12) : palette.secondary.lighter,
          },
        },
        outlinedAccent: {
          borderColor: palette.accent?.main,
          color: palette.accent?.main,
          "&:hover": {
            borderColor: palette.accent?.dark,
            color: palette.accent?.dark,
            backgroundColor: isDark ? alpha(palette.accent?.main ?? palette.primary.main, 0.12) : palette.accent?.lighter,
          },
        },
        outlinedTertiary: {
          borderColor: palette.tertiary?.main ?? palette.grey[800],
          color: palette.tertiary?.main ?? palette.grey[800],
          "&:hover": {
            borderColor: palette.tertiary?.dark ?? palette.grey[900],
            color: palette.tertiary?.dark ?? palette.grey[900],
            backgroundColor: isDark ? alpha(palette.text.primary, 0.08) : palette.grey[100],
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
        },
      },
    },
  };
};

export default Button;
