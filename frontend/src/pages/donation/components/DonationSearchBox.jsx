import { InputAdornment, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

export default function DonationSearchBox({ value, onChange, onKeyDown }) {
  return (
    <TextField
      fullWidth
      placeholder="Tìm kiếm chiến dịch quyên góp..."
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      sx={{
        mb: 4,
        "& .MuiOutlinedInput-root": {
          borderRadius: 999,
          backgroundColor: "#ffffff",
          boxShadow: "0 4px 16px rgba(17, 72, 156, 0.08)",
        },
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: "#6581b4" }} />
          </InputAdornment>
        ),
      }}
    />
  );
}
