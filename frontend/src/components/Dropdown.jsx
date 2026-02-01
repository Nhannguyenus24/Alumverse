import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const Dropdown = ({
  label = 'Input',
  placeholder = 'Write something',
  error = false,
  helperText,
  fullWidth = true,
  options = [],
  value = '',
  onChange,
  ...rest
}) => {
  const errorMessage = error ? (helperText ?? 'Alert message') : helperText;

  return (
    <FormControl fullWidth={fullWidth} error={error} variant="outlined">
      <InputLabel id={`dropdown-${label}-label`} shrink>
        {label}
      </InputLabel>
      <Select
        labelId={`dropdown-${label}-label`}
        label={label}
        value={value}
        onChange={onChange}
        displayEmpty
        renderValue={(v) => (v === '' ? placeholder : v)}
        IconComponent={KeyboardArrowDownIcon}
        {...rest}
      >
        <MenuItem value="">
          <em>{placeholder}</em>
        </MenuItem>
        {options.map((opt) => (
          <MenuItem key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </MenuItem>
        ))}
      </Select>
      {errorMessage && <FormHelperText>{errorMessage}</FormHelperText>}
    </FormControl>
  );
};

export default Dropdown;
