import { TextField } from '@mui/material';
import { readVietnameseDong } from '../utils/numberFormatter';

const toDisplay = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  const num = Number(value);
  if (!Number.isFinite(num)) return '';
  return num.toLocaleString('en-US');
};

/**
 * Ô nhập số tiền có điều khiển: tự chèn dấu "," mỗi 1000 khi gõ và hiển thị
 * dòng đọc số tiền bằng tiếng Việt làm helper text.
 * Dùng để bọc field của react-hook-form Controller — truyền `value`/`onChange`.
 * onChange phát ra Number, hoặc '' khi ô trống.
 */
const MoneyField = ({ value, onChange, error, helperText, inputProps, ...rest }) => {
  const handleChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 15);
    onChange(digits === '' ? '' : Number(digits));
  };

  const words = readVietnameseDong(value);
  const helper = error ? helperText : words || helperText;

  return (
    <TextField
      {...rest}
      value={toDisplay(value)}
      onChange={handleChange}
      error={error}
      helperText={helper}
      inputProps={{ inputMode: 'numeric', ...inputProps }}
    />
  );
};

export default MoneyField;
