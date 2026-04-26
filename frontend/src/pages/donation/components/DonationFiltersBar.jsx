import { Box, Button, FormControl, InputLabel, Menu, MenuItem, Select, Stack, TextField } from "@mui/material";

function FilterDropdown({ label, value, onChange, options }) {
  return (
    <FormControl
      size="small"
      sx={{
        minWidth: { xs: "100%", sm: 180 },
        "& .MuiOutlinedInput-root": {
          borderRadius: 999,
          backgroundColor: "#f7faff",
        },
      }}
    >
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
          minWidth: { xs: "100%", sm: 190 },
          "& .MuiOutlinedInput-root": {
            borderRadius: 999,
            backgroundColor: "#f7faff",
          },
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
          minWidth: { xs: "100%", sm: 190 },
          "& .MuiOutlinedInput-root": {
            borderRadius: 999,
            backgroundColor: "#f7faff",
          },
        }}
      />
      <Button
        onClick={onOpenAmountMenu}
        sx={{
          minWidth: { xs: "100%", sm: 200 },
          justifyContent: "space-between",
          borderRadius: 999,
          px: 2,
          py: 1,
          textTransform: "none",
          color: "#2f4b75",
          border: "1px solid #d8e2f7",
          backgroundColor: "#f7faff",
          fontWeight: 500,
          "&:hover": { backgroundColor: "#eef4ff", borderColor: "#b8caef" },
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
            <Button variant="outlined" fullWidth onClick={onResetAmountRange}>
              Xóa
            </Button>
            <Button variant="contained" fullWidth onClick={onApplyAmountMenu}>
              Áp dụng
            </Button>
          </Stack>
        </Box>
      </Menu>
      <Button variant="outlined" onClick={onClearAllFilters} sx={{ borderRadius: 999, px: 2.2, textTransform: "none", fontWeight: 700 }}>
        Xóa hết bộ lọc
      </Button>
      <Button
        variant="contained"
        onClick={onApplySearchAndFilters}
        sx={{ borderRadius: 999, px: 2.2, textTransform: "none", fontWeight: 700 }}
      >
        Áp dụng bộ lọc
      </Button>
    </Stack>
  );
}
