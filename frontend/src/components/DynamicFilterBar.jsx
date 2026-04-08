import { useState } from 'react';
import { Stack, Button, Select, MenuItem,
         Checkbox, ListItemText, TextField,
         Slider, Box, Typography, } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const filterBaseSx = (theme, active) => ({
  height: 40,
  borderRadius: 10,
  fontWeight: 600,
  fontSize: '0.9rem',
  px: 2.5,

  ...(active
    ? {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
      }
    : {
        border: `1px solid ${theme.palette.primary.main}`,
        color: theme.palette.primary.main,
      }),
});

const DynamicFilterBar = ({ config = [], value = {}, onChange }) => {
  const [internalValue, setInternalValue] = useState({
    all: true,
    ...value,
  });

  const updateState = (newState) => {
    setInternalValue(newState);
    onChange?.(newState);
  };

  // ===== TẤT CẢ =====
const handleAllClick = () => {
  const reset = { all: true };

  config.forEach((item) => {
    if (item.type === 'range') {
      reset[item.key] = [item.min, item.max];
    } else if (item.type === 'date') {
      reset[item.key] = '';
    } else {
      reset[item.key] = [];
    }
  });

  updateState(reset);
};

  // ===== TOPICS =====
  const handleTopicToggle = (key, option) => {
    const current = internalValue[key] || [];

    let newValues;
    if (current.includes(option)) {
      newValues = current.filter((v) => v !== option);
    } else {
      newValues = [...current, option];
    }

    updateState({
      ...internalValue,
      all: false,
      [key]: newValues,
    });
  };

  // ===== DROPDOWN =====
  const handleDropdownChange = (key, newValue) => {
    updateState({
      ...internalValue,
      all: false,
      [key]: newValue,
    });
  };

  // ===== DATE =====
  const handleDateChange = (key, newValue) => {
    updateState({
      ...internalValue,
      all: false,
      [key]: newValue,
    });
  };

  // ===== RANGE =====
  const handleRangeChange = (key, newValue) => {
    updateState({
      ...internalValue,
      all: false,
      [key]: newValue,
    });
  };

const formatDateVN = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date)) return '';
  return date.toLocaleDateString('vi-VN');
};

return (
    <Stack direction="row" gap={1.5} flexWrap="wrap" alignItems="center">
      {/* ===== TẤT CẢ ===== */}
      <Button
        variant={internalValue.all ? 'contained' : 'outlined'}
        onClick={handleAllClick}
        sx={(theme) => filterBaseSx(theme, internalValue.all)}
     >
        Tất cả
      </Button>

      {/* ===== DYNAMIC RENDER ===== */}
      {config.map((filter) => {
        // ===== TOPIC BUTTONS =====
        if (filter.type === 'topics') {
          return filter.options.map((option) => {
            const active =
              !internalValue.all &&
              (internalValue[filter.key] || []).includes(option);

            return (
              <Button
                key={`${filter.key}-${option}`}
                variant={active ? 'contained' : 'outlined'}
                onClick={() => handleTopicToggle(filter.key, option)}
                sx={(theme) => filterBaseSx(theme, active)}
                >
                {option}
              </Button>
            );
          });
        }

        // ===== DROPDOWN =====
        if (filter.type === 'dropdown') {
          return (
            <Select
                key={filter.key}
                multiple={filter.multiple}
                value={internalValue[filter.key] || []}
                onChange={(e) =>
                    handleDropdownChange(filter.key, e.target.value)}
                displayEmpty
                renderValue={(selected) => {
                    if (selected.length === 0) return filter.label;
                    if (selected.length === 1) return selected[0];
                    return `${filter.label} (${selected.length})`;
                }}
                sx={(theme) =>
                    filterBaseSx(theme, (internalValue[filter.key] || []).length > 0)
                }
                inputProps={{ sx: { p: 0 } }}
            >
              {filter.options.map((option) => (
                <MenuItem key={option} value={option}>
                  {filter.multiple && (
                    <Checkbox
                      checked={
                        (internalValue[filter.key] || []).indexOf(option) > -1
                      }
                    />
                  )}
                  <ListItemText primary={option} />
                </MenuItem>
              ))}
            </Select>
          );
        }

        // ===== DATE PICKER =====
        if (filter.type === 'date') {
            const value = internalValue[filter.key];
            const hasValue = Boolean(value);

            return (
                <Box
                    key={filter.key}
                    onClick={() =>
                        document.getElementById(`date-${filter.key}`)?.showPicker?.()
                    }
                    sx={(theme) => ({
                        ...filterBaseSx(theme, hasValue),
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                    })}
                >
                    {/* TEXT */}
                    <span>
                        {hasValue ? formatDateVN(value) : filter.label}
                    </span>

                    {/* ICON */}
                    <CalendarTodayIcon sx={{ fontSize: '1rem' }} />

                    {/* HIDDEN INPUT */}
                    <input
                        id={`date-${filter.key}`}
                        type="date"
                        value={value || ''}
                        onChange={(e) =>
                        handleDateChange(filter.key, e.target.value)
                        }
                        style={{
                        position: 'absolute',
                        opacity: 0,
                        pointerEvents: 'none',
                        }}
                    />
                </Box>
            );
        }

        // ===== RANGE SLIDER =====
        if (filter.type === 'range') {
            const valueRange =
                internalValue[filter.key] || [filter.min, filter.max];

            const active =
                valueRange[0] !== filter.min || valueRange[1] !== filter.max;

            return (
                <Box
                key={filter.key}
                sx={(theme) => ({
                    ...filterBaseSx(theme, active),
                    width: 220,
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    py: 1,
                })}
                >
                <Typography variant="caption">
                    {filter.label}: {valueRange[0]} - {valueRange[1]}
                </Typography>

                <Slider
                    value={valueRange}
                    onChange={(e, newValue) =>
                    handleRangeChange(filter.key, newValue)
                    }
                    size="small"
                    min={filter.min}
                    max={filter.max}
                />
                </Box>
            );
        }

        return null;
      })}
    </Stack>
  );
};

export default DynamicFilterBar;