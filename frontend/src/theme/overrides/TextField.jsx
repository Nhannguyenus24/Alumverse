const TextField = (theme) => {
  const { palette } = theme;
  const grey = palette.grey || {};
  const borderLight = palette.mode === 'dark' ? palette.divider : (grey[300] || '#DFE3E8');
  const borderError = palette.error?.main || '#FF4842';
  const fieldBackground = palette.mode === 'dark'
    ? palette.background.paper
    : '#fff';
  const hoverBackground = palette.mode === 'dark'
    ? palette.action.hover
    : '#fff';

  return {
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'medium',
        slotProps: {
          select: {
            MenuProps: {
              disableScrollLock: true,
            },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: fieldBackground,
          borderRadius: 8,
          color: palette.text.primary,
          transition: theme.transitions.create(['background-color', 'border-color']),
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: borderLight,
          },
          '&:hover': {
            backgroundColor: hoverBackground,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: palette.mode === 'dark' ? palette.text.secondary : (grey[400] || borderLight),
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: 1,
            borderColor: palette.primary?.main || '#1976D2',
          },
          '&.Mui-error .MuiOutlinedInput-notchedOutline': {
            borderColor: borderError,
          },
          '&.Mui-error:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: borderError,
          },
        },
        input: {
          '&::placeholder': {
            color: palette.text.secondary,
            opacity: 1,
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          color: palette.text.primary,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: palette.text.secondary,
          '&.Mui-focused': {
            color: palette.primary.main,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        icon: {
          color: palette.text.secondary,
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          '&.Mui-error': {
            color: borderError,
          },
        },
      },
    },
  };
};

export default TextField;
