import { TextField, InputAdornment, alpha } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useTranslation } from 'react-i18next';

const SearchBar = ({
  value = '',
  onChange,
  onKeyDown,
  placeholder,
  size = 'small',
  disabled = false,
  fullWidth = true,
  InputProps,
  sx,
  inputSx,
  iconSx,
  ...props
}) => {
  const { t } = useTranslation(['common']);
  const resolvedPlaceholder = placeholder !== undefined ? placeholder : t('common:search_placeholder');
  return (
    <TextField
      fullWidth={fullWidth}
      size={size}
      disabled={disabled}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={resolvedPlaceholder}
      variant="outlined"
      sx={{
        ...sx,
        '& .MuiOutlinedInput-root': {
          borderRadius: 10,
          fontSize: '0.8rem',
          fontWeight: 500,
          py: 0.75,
          px: 2,
          bgcolor: (theme) => theme.palette.mode === 'dark'
            ? alpha(theme.palette.common.white, 0.06)
            : 'grey.200',
          '&:hover': {
            bgcolor: (theme) => theme.palette.mode === 'dark'
              ? alpha(theme.palette.common.white, 0.09)
              : 'grey.200',
          },
          '&.Mui-focused': {
            bgcolor: 'background.paper',
          },
          ...inputSx,
        },
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon
              sx={{
                fontSize: '1.5rem',
                color: 'text.secondary',
                ...iconSx,
              }}
            />
          </InputAdornment>
        ),
        ...InputProps,
      }}
      {...props}
    />
  );
};

export default SearchBar;
