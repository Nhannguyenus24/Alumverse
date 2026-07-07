import { alpha } from '@mui/material/styles';

const DatePicker = (theme) => {
  const isDark = theme.palette.mode === 'dark';

  return {
    MuiPickersPopper: {
      styleOverrides: {
        paper: {
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.customShadows?.dropdown,
        },
      },
    },
    MuiPickersLayout: {
      styleOverrides: {
        root: {
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        },
      },
    },
    MuiDateCalendar: {
      styleOverrides: {
        root: {
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        },
      },
    },
    MuiPickersCalendarHeader: {
      styleOverrides: {
        root: {
          color: theme.palette.text.primary,
        },
        switchViewButton: {
          color: theme.palette.text.secondary,
        },
      },
    },
    MuiPickersDay: {
      styleOverrides: {
        root: {
          color: theme.palette.text.primary,
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, isDark ? 0.18 : 0.08),
          },
          '&.Mui-selected': {
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
          },
          '&.Mui-disabled': {
            color: theme.palette.text.disabled,
          },
        },
        today: {
          borderColor: theme.palette.primary.main,
        },
      },
    },
  };
};

export default DatePicker;
