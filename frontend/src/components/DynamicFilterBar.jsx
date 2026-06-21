import { useEffect, useState, useCallback } from 'react';
import {
  Stack, Button, Select, MenuItem, Checkbox, ListItemText,
  TextField, Slider, Box, Typography, Popover, Paper
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const INPUT_FILTER_DEFAULTS = { text: '', number: '' };

/**
 * Trigger giống Select; bấm mở panel nhập (text hoặc number qua inputMode).
 */
const FilterInputPopover = ({ filter, value, onCommit }) => {
  const inputMode = filter.inputMode === 'number' ? 'number' : 'text';
  const storedValue = value === undefined || value === null ? INPUT_FILTER_DEFAULTS[inputMode] : String(value);

  const [anchorEl, setAnchorEl] = useState(null);
  const [draft, setDraft] = useState(storedValue);

  const open = Boolean(anchorEl);
  const isActive = Boolean(String(storedValue).trim());

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => setDraft(storedValue), 0);
      return () => clearTimeout(timer);
    }
  }, [open, storedValue]);

  const close = () => setAnchorEl(null);
  const handleOpen = (event) => setAnchorEl(event.currentTarget);

  const handleClear = () => {
    onCommit('');
    setDraft('');
    close();
  };

  const handleApply = () => {
    const trimmed = draft.trim();

    if (!trimmed) {
      onCommit('');
      close();
      return;
    }

    if (inputMode === 'number') {
      const parsed = Number.parseInt(trimmed, 10);
      if (Number.isNaN(parsed)) return;
      if (filter.min != null && parsed < filter.min) return;
      if (filter.max != null && parsed > filter.max) return;
      onCommit(String(parsed));
    } else {
      onCommit(trimmed);
    }

    close();
  };

  const displayLabel = () => {
    if (!isActive) return filter.label;
    const shown = String(storedValue);
    if (inputMode === 'number') return `${filter.label}: ${shown}`;
    return shown.length > 8 ? `${shown.slice(0, 8)}…` : shown;
  };

  return (
    <>
      <Box
        role="button" tabIndex={0} onClick={handleOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpen(e);
          }
        }}
        sx={(theme) => ({
          ...filterBaseSx(theme, isActive),
          minWidth: 140, cursor: 'pointer', display: 'inline-flex',
          alignItems: 'center', justifyContent: 'space-between', gap: 0.5, userSelect: 'none',
        })}
      >
        <Typography component="span" noWrap sx={{ fontSize: 'inherit', fontWeight: 'inherit', lineHeight: 1.2, maxWidth: 200 }}>
          {displayLabel()}
        </Typography>
        <KeyboardArrowDownIcon sx={{ fontSize: '1.1rem', flexShrink: 0 }} />
      </Box>

      <Popover
        open={open} anchorEl={anchorEl} onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { mt: 0.75 } } }}
      >
        <Paper elevation={3} sx={{ p: 2, minWidth: 260 }}>
          <Stack spacing={1.5}>
            <Typography variant="subtitle2" fontWeight={700} color="primary.main">
              {filter.label}
            </Typography>
            <TextField
              autoFocus fullWidth size="small" value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={filter.placeholder || ''}
              type={inputMode === 'number' ? 'number' : 'text'}
              inputProps={inputMode === 'number' ? { min: filter.min, max: filter.max, inputMode: 'numeric' } : undefined}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleApply();
                }
              }}
            />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button size="small" onClick={handleClear}>Xóa</Button>
              <Button size="small" variant="contained" onClick={handleApply}>Áp dụng</Button>
            </Stack>
          </Stack>
        </Paper>
      </Popover>
    </>
  );
};

const filterBaseSx = (theme, active) => ({
  height: 40, borderRadius: 10, fontWeight: 600, fontSize: '0.9rem', px: 2.5,
  ...(active
    ? { backgroundColor: theme.palette.primary.main, color: theme.palette.primary.contrastText }
    : { border: `1px solid ${theme.palette.primary.main}`, color: theme.palette.primary.main }),
});

const DynamicFilterBar = ({ config = [], value = {}, onChange }) => {
  const [internalValue, setInternalValue] = useState({ all: true, ...value });

  const updateState = useCallback((newState) => {
    setInternalValue(newState);
    onChange?.(newState);
  }, [onChange]);

  // ===== TẤT CẢ =====
  const handleAllClick = useCallback(() => {
    const reset = { all: true };

    config.forEach((item) => {
      if (item.type === 'range') reset[item.key] = [item.min, item.max];
      else if (item.type === 'date') reset[item.key] = '';
      else if (item.type === 'dropdown') reset[item.key] = item.multiple ? [] : '';
      else if (item.type === 'input') reset[item.key] = '';
      else if (item.type === 'topics') reset[item.key] = [];
      else reset[item.key] = [];
    });
    updateState(reset);
  }, [config, updateState]);

  // ===== TOPICS =====
  const handleTopicToggle = useCallback((key, option) => {
    const current = internalValue[key] || [];
    const newValues = current.includes(option) ? current.filter((v) => v !== option) : [...current, option];

    updateState({ ...internalValue, all: false, [key]: newValues });
  }, [internalValue, updateState]);

  // ===== DROPDOWN =====
  const handleDropdownChange = useCallback((key, newValue) => {
    updateState({ ...internalValue, all: false, [key]: newValue });
  }, [internalValue, updateState]);

  // ===== DATE =====
  const handleDateChange = useCallback((key, newValue) => {
    updateState({ ...internalValue, all: false, [key]: newValue });
  }, [internalValue, updateState]);

  // ===== RANGE =====
  const handleRangeChange = useCallback((key, newValue) => {
    updateState({ ...internalValue, all: false, [key]: newValue });
  }, [internalValue, updateState]);

  // ===== INPUT =====
  const handleInputCommit = useCallback((key, newValue) => {
    updateState({ ...internalValue, all: false, [key]: newValue });
  }, [internalValue, updateState]);

  const formatDateVN = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return isNaN(date) ? '' : date.toLocaleDateString('vi-VN');
  };

  return (
    <Stack direction="row" gap={1.5} flexWrap="wrap" alignItems="center">
      {/* ===== TẤT CẢ ===== */}
      <Button variant={internalValue.all ? 'contained' : 'outlined'} onClick={handleAllClick} sx={(theme) => filterBaseSx(theme, internalValue.all)}>
        Tất cả
      </Button>

      {/* ===== DYNAMIC RENDER ===== */}
      {config.map((filter) => {
        // ===== TOPIC BUTTONS =====
        if (filter.type === 'topics') {
          return filter.options.map((option) => {
            const active = !internalValue.all && (internalValue[filter.key] || []).includes(option);

            return (
              <Button
                key={`${filter.key}-${option}`} variant={active ? 'contained' : 'outlined'}
                onClick={() => handleTopicToggle(filter.key, option)} sx={(theme) => filterBaseSx(theme, active)}
              >
                {option}
              </Button>
            );
          });
        }

        // ===== DROPDOWN =====
        if (filter.type === 'dropdown') {
          const getOptValue = (opt) => (typeof opt === 'object' ? opt.value : opt);
          const getOptLabel = (opt) => (typeof opt === 'object' ? opt.label : opt);

          const currentValue = internalValue[filter.key] ?? (filter.multiple ? [] : '');
          const isActive = filter.multiple ? currentValue.length > 0 : Boolean(currentValue);

          return (
            <Select
              key={filter.key} multiple={filter.multiple} value={currentValue} displayEmpty
              onChange={(e) => handleDropdownChange(filter.key, e.target.value)}
              sx={(theme) => filterBaseSx(theme, isActive)} inputProps={{ sx: { p: 0 } }}
              renderValue={(selected) => {
                if (filter.multiple) {
                  if (selected.length === 0) return filter.label;
                  if (selected.length === 1) {
                    const found = filter.options.find((o) => getOptValue(o) === selected[0]);
                    return found ? getOptLabel(found) : selected[0];
                  }
                  return `${filter.label} (${selected.length})`;
                }
                if (!selected) return filter.label;
                const found = filter.options.find((o) => getOptValue(o) === selected);
                return found ? getOptLabel(found) : selected;
              }}
            >
              {filter.options.map((opt) => {
                const optValue = getOptValue(opt);
                const optLabel = getOptLabel(opt);
                return (
                  <MenuItem key={optValue} value={optValue}>
                    {filter.multiple && <Checkbox checked={currentValue.indexOf(optValue) > -1} />}
                    <ListItemText primary={optLabel} />
                  </MenuItem>
                );
              })}
            </Select>
          );
        }

        // ===== DATE PICKER =====
        if (filter.type === 'date') {
          const value = internalValue[filter.key];
          const hasValue = Boolean(value);

          return (
            <Box
              key={filter.key} onClick={() => document.getElementById(`date-${filter.key}`)?.showPicker?.()}
              sx={(theme) => ({ ...filterBaseSx(theme, hasValue), cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1 })}
            >
              <span>{hasValue ? formatDateVN(value) : filter.label}</span>
              <CalendarTodayIcon sx={{ fontSize: '1rem' }} />
              <input
                id={`date-${filter.key}`} type="date" value={value || ''}
                onChange={(e) => handleDateChange(filter.key, e.target.value)}
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
              />
            </Box>
          );
        }

        // ===== INPUT POPOVER =====
        if (filter.type === 'input') {
          const currentValue = internalValue[filter.key] ?? '';

          return (
            <FilterInputPopover
              key={filter.key} filter={filter} value={currentValue}
              onCommit={(newValue) => handleInputCommit(filter.key, newValue)}
            />
          );
        }

        // ===== RANGE SLIDER =====
        if (filter.type === 'range') {
          const valueRange = internalValue[filter.key] || [filter.min, filter.max];
          const active = valueRange[0] !== filter.min || valueRange[1] !== filter.max;

          return (
            <Box key={filter.key} sx={(theme) => ({ ...filterBaseSx(theme, active), width: 220, height: 40, position: 'relative', display: 'flex', alignItems: 'center', overflow: 'visible' })}>
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, lineHeight: 1 }}>
                {filter.label}: {valueRange[0]} - {valueRange[1]}
              </Typography>
              <Box sx={{ position: 'absolute', left: 12, right: 12, bottom: -20 }}>
                <Slider value={valueRange} size="small" min={filter.min} max={filter.max} onChange={(e, newValue) => handleRangeChange(filter.key, newValue)} />
              </Box>
            </Box>
          );
        }
        return null;
      })}
    </Stack>
  );
};

export default DynamicFilterBar;