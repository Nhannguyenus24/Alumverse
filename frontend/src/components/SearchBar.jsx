import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const SearchBar = ({
  value = '',
  onChange,
  onKeyDown,
  placeholder = 'Tìm kiếm',
  size = 'small',
  disabled = false,
  fullWidth = true,
  InputProps,
  sx,
  inputSx,
  iconSx,
  ...props
}) => {
  return (
    <TextField
      fullWidth={fullWidth}
      size={size}
      disabled={disabled}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      variant="outlined"
      sx={{
        ...sx,
        '& .MuiOutlinedInput-root': {
          borderRadius: 10,
          fontSize: '0.8rem',
          fontWeight: 500,
          py: 0.75,
          px: 2,
          bgcolor: 'grey.200',
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