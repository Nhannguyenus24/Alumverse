const Button = (theme) => {
  const { palette } = theme;

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
            backgroundColor: palette.primary.lighter,
          },
        },
        outlinedSecondary: {
          borderColor: palette.secondary.main,
          color: palette.secondary.main,
          "&:hover": {
            borderColor: palette.secondary.dark,
            color: palette.secondary.dark,
            backgroundColor: palette.secondary.lighter,
          },
        },
        outlinedTertiary: {
          borderColor: palette.tertiary?.main ?? palette.grey[800],
          color: palette.tertiary?.main ?? palette.grey[800],
          "&:hover": {
            borderColor: palette.tertiary?.dark ?? palette.grey[900],
            color: palette.tertiary?.dark ?? palette.grey[900],
            backgroundColor: palette.grey[100],
          },
        },
      },
    },
  };
};

export default Button;
