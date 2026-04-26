import { InputAdornment, MenuItem, Stack, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { DONATION_SEARCH_OPTIONS } from "./constants";

export default function FundraisingListFilters({
  searchBy,
  searchInput,
  onSearchByChange,
  onSearchInputChange,
  onSearchSubmit,
}) {
  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} sx={{ mb: 2.5 }}>
      <TextField
        select
        value={searchBy}
        onChange={(event) => onSearchByChange(event.target.value)}
        sx={{
          minWidth: { xs: "100%", md: 200 },
          "& .MuiOutlinedInput-root": {
            borderRadius: 999,
            backgroundColor: "#ffffff",
          },
        }}
      >
        {DONATION_SEARCH_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        fullWidth
        placeholder="Tìm kiếm"
        value={searchInput}
        onChange={(event) => onSearchInputChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSearchSubmit();
          }
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: 999,
            backgroundColor: "#ffffff",
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: "#6b7f9f" }} />
            </InputAdornment>
          ),
        }}
      />
    </Stack>
  );
}
