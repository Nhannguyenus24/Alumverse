import { useTranslation } from 'react-i18next';
import { IconButton, Menu, MenuItem, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import { changeLanguage } from '../i18n';

const LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
];

const TOOLTIP_SLOT_PROPS = {
  popper: {
    modifiers: [
      {
        name: 'offset',
        options: { offset: [0, 4] },
      },
    ],
  },
};

const LanguageSwitcher = ({ contrastMode = false, color, buttonSx }) => {
  const { i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);

  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleSelect = (code) => {
    changeLanguage(code);
    handleClose();
  };

  return (
    <>
      <Tooltip title={current.label} arrow placement="bottom" slotProps={TOOLTIP_SLOT_PROPS} disableTouchListener>
        <IconButton
          onClick={handleOpen}
          size="small"
          sx={{
            color: color || (contrastMode ? 'primary.contrastText' : 'text.primary'),
            fontSize: '1.25rem',
            width: 36,
            height: 36,
            p: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
            verticalAlign: 'middle',
            ...buttonSx,
          }}
          aria-label="change language"
        >
          <span style={{ lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transform: 'translateY(-1px)' }}>
            {current.flag}
          </span>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 3,
              minWidth: 176,
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 3,
              p: 0.75,
              '& .MuiMenu-list': {
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                p: 0,
              },
            },
          },
        }}
      >
        {LANGUAGES.map((lang) => (
          <MenuItem
            key={lang.code}
            selected={lang.code === i18n.language}
            onClick={() => handleSelect(lang.code)}
            sx={{
              gap: 1,
              borderRadius: 1,
              mx: 0,
              my: 0,
              px: 1.75,
              py: 1,
              minHeight: 36,
              '&.Mui-selected': {
                bgcolor: 'action.selected',
                borderRadius: 1,
                '&:hover': { bgcolor: 'action.hover', borderRadius: 1 },
              },
              '&:hover': {
                borderRadius: 1,
              },
            }}
          >
            <span style={{ fontSize: '1.1rem', lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>
              {lang.flag}
            </span>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{lang.label}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LanguageSwitcher;
