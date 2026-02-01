import { TextField, InputAdornment, Box } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const Input = ({
  label = 'Input',
  placeholder = 'Write something',
  error = false,
  helperText,
  fullWidth = true,
  ...rest
}) => {
  const errorMessage = error ? (helperText ?? 'Alert message') : helperText;

  return (
    <TextField
      label={label}
      placeholder={placeholder}
      error={error}
      helperText={errorMessage}
      fullWidth={fullWidth}
      InputProps={{
        endAdornment: error ? (
          <InputAdornment position="end">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 24,
                height: 24,
                borderRadius: '50%',
                bgcolor: 'error.main',
                color: 'error.contrastText',
              }}
            >
              <ErrorOutlineIcon sx={{ fontSize: 16 }} />
            </Box>
          </InputAdornment>
        ) : undefined,
      }}
      {...rest}
    />
  );
};

export default Input;
