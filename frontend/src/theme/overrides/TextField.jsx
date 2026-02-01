const TextField = (theme) => {
  const { palette } = theme;
  const grey = palette.grey || {};
  const borderLight = grey[300] || '#DFE3E8';
  const borderError = palette.error?.main || '#FF4842';

  return {
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'medium',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#fff',
          borderRadius: 8,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: borderLight,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: grey[400] || borderLight,
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
            color: grey[500],
            opacity: 1,
          },
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
