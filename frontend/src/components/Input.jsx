import { useState } from 'react';
import { TextField, InputAdornment, Box, IconButton } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const Input = ({
  label = 'Input',
  placeholder = 'Write something',
  error = false,
  helperText,
  fullWidth = true,
  type,
  InputProps,
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const errorMessage = error ? (helperText ?? 'Alert message') : helperText;

  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const composedEndAdornment =
    error || isPassword ? (
      <InputAdornment position="end" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {error ? (
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
        ) : null}
        {isPassword ? (
          <IconButton
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            onClick={() => setShowPassword((v) => !v)}
            onMouseDown={(e) => e.preventDefault()}
            edge="end"
            size="small"
          >
            {showPassword ? <VisibilityOff /> : <Visibility />}
          </IconButton>
        ) : null}
      </InputAdornment>
    ) : null;

  return (
    <TextField
      label={label}
      placeholder={placeholder}
      error={error}
      helperText={errorMessage}
      fullWidth={fullWidth}
      type={effectiveType}
      InputProps={{
        ...InputProps,
        ...(composedEndAdornment ? { endAdornment: composedEndAdornment } : {}),
      }}
      {...rest}
    />
  );
};

export default Input;
