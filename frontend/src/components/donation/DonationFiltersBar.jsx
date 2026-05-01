import { Box, Button, FormControl, InputLabel, Menu, MenuItem, Select, Stack, TextField } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

const filterControlSx = {
  minWidth: { xs: "100%", sm: 180 },
  "& .MuiOutlinedInput-root": {
    height: 40,
    borderRadius: 10,
    color: "primary.main",
    fontWeight: 600,
    backgroundColor: "#fff",
    "& fieldset": {
      borderColor: "primary.main",
    },
    "&:hover fieldset": {
      borderColor: "primary.main",
    },
    "&.Mui-focused fieldset": {
      borderColor: "primary.main",
      borderWidth: 1.5,
    },
  },
  "& .MuiInputLabel-root": {
    color: "primary.main",
    fontWeight: 600,
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "primary.main",
  },
};

const filterActionButtonSx = {
  height: 40,
  borderRadius: 10,
  px: 2.5,
  textTransform: "none",
  fontWeight: 600,
  fontSize: "0.9rem",
};

const primaryActionButtonSx = {
  height: 42,
  borderRadius: 8,
  px: 2.8,
  textTransform: "none",
  fontWeight: 700,
  fontSize: "0.92rem",
};

const clearActionButtonSx = {
  height: 42,
  borderRadius: 8,
  px: 2.8,
  textTransform: "none",
  fontWeight: 700,
  fontSize: "0.92rem",
  borderColor: "#b6c0cf",
  color: "#445065",
  backgroundColor: "#f8fafc",
  "&:hover": {
    borderColor: "#9aa7b9",
    backgroundColor: "#eef2f7",
  },
};

function FilterDropdown({ label, value, onChange, options }) {
  return (
    <FormControl size="small" sx={filterControlSx}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        label={label}
        onChange={onChange}
        MenuProps={{
          disableScrollLock: true,
        }}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default function DonationFiltersBar({
  draftFilters,
  statusOptions,
  filterOptions,
  amountButtonLabel,
  amountAnchorEl,
  amountMenuOpen,
  onFilterSectionKeyDown,
  onFilterChange,
  onOpenAmountMenu,
  onCloseAmountMenu,
  onResetAmountRange,
  onApplyAmountMenu,
  onClearAllFilters,
  onApplySearchAndFilters,
}) {
  return (
    <Stack direction="row" spacing={1.2} flexWrap="wrap" sx={{ mb: 2.2, rowGap: 1.2 }} onKeyDown={onFilterSectionKeyDown}>
      <FilterDropdown
        label="Status"
        value={draftFilters.statusId}
        onChange={onFilterChange("statusId")}
        options={statusOptions}
      />
      <FilterDropdown
        label="Thịnh hành"
        value={draftFilters.trending}
        onChange={onFilterChange("trending")}
        options={filterOptions.trending}
      />
      <TextField
        label="Time started từ"
        type="date"
        size="small"
        value={draftFilters.timeStartedFrom}
        onChange={onFilterChange("timeStartedFrom")}
        InputLabelProps={{ shrink: true }}
        sx={{
          ...filterControlSx,
          minWidth: { xs: "100%", sm: 190 },
        }}
      />
      <TextField
        label="Time started đến"
        type="date"
        size="small"
        value={draftFilters.timeStartedTo}
        onChange={onFilterChange("timeStartedTo")}
        InputLabelProps={{ shrink: true }}
        sx={{
          ...filterControlSx,
          minWidth: { xs: "100%", sm: 190 },
        }}
      />
      <Button
        onClick={onOpenAmountMenu}
        sx={{
          ...filterActionButtonSx,
          minWidth: { xs: "100%", sm: 200 },
          justifyContent: "space-between",
          color: "primary.main",
          border: "1px solid",
          borderColor: "primary.main",
          backgroundColor: "#fff",
          "&:hover": { backgroundColor: "rgba(25, 118, 210, 0.06)", borderColor: "primary.main" },
        }}
      >
        {amountButtonLabel}
      </Button>
      <Menu
        anchorEl={amountAnchorEl}
        open={amountMenuOpen}
        onClose={onCloseAmountMenu}
        disableScrollLock
        transformOrigin={{ horizontal: "left", vertical: "top" }}
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
      >
        <Box sx={{ width: 280, p: 2, display: "flex", flexDirection: "column", gap: 1.2 }}>
          <TextField
            label="Min"
            size="small"
            type="number"
            value={draftFilters.minAmount}
            onChange={onFilterChange("minAmount")}
            placeholder="0"
          />
          <TextField
            label="Max"
            size="small"
            type="number"
            value={draftFilters.maxAmount}
            onChange={onFilterChange("maxAmount")}
            placeholder="0"
          />
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" fullWidth onClick={onResetAmountRange} sx={{ textTransform: "none", fontWeight: 600 }}>
              Xóa
            </Button>
            <Button variant="contained" fullWidth onClick={onApplyAmountMenu} sx={{ textTransform: "none", fontWeight: 600 }}>
              Áp dụng
            </Button>
          </Stack>
        </Box>
      </Menu>
      <Button
        variant="outlined"
        onClick={onClearAllFilters}
        sx={clearActionButtonSx}
        startIcon={<RestartAltIcon />}
      >
        Xóa hết filter
      </Button>
      <Button
        variant="contained"
        onClick={onApplySearchAndFilters}
        sx={primaryActionButtonSx}
        startIcon={<FilterListIcon />}
      >
        Áp dụng filter
      </Button>
    </Stack>
  );
}
