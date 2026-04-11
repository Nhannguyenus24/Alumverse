import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const SearchBar = ({
  value = '',
  onChange,
  placeholder = 'Tìm kiếm',
}) => {
  return (
    <TextField
      fullWidth
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      variant="outlined"
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 10,
          fontSize: '0.8rem',
          fontWeight: 500,
          paddingLeft: 1.5,
          backgroundColor: 'grey.200'
        },
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
          </InputAdornment>
        ),
      }}
    />
  );
};

export default SearchBar;