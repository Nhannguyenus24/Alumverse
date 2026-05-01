import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const SearchBar = ({
  value = '',
  onChange,
  onKeyDown,
  placeholder = 'Tìm kiếm',
  sx,
  inputSx,
  iconSx,
}) => {
  return (
    <TextField
      fullWidth
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
          paddingLeft: 1.5,
          backgroundColor: 'grey.200',
          ...inputSx,
        },
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ fontSize: '1rem', color: 'text.secondary', ...iconSx }} />
          </InputAdornment>
        ),
      }}
    />
  );
};

export default SearchBar;