import { useTranslation } from 'react-i18next';
import { IconButton, Menu, MenuItem, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import { changeLanguage } from '../i18n';

const LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
];

const LanguageSwitcher = ({ contrastMode = false }) => {
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
      <Tooltip title={current.label}>
        <IconButton
          onClick={handleOpen}
          size="small"
          sx={{
            color: contrastMode ? 'primary.contrastText' : 'text.primary',
            fontSize: '1.25rem',
            width: 36,
            height: 36,
          }}
          aria-label="change language"
        >
          <span style={{ lineHeight: 1 }}>{current.flag}</span>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: { sx: { mt: 1, minWidth: 150, borderRadius: 2 } },
        }}
      >
        {LANGUAGES.map((lang) => (
          <MenuItem
            key={lang.code}
            selected={lang.code === i18n.language}
            onClick={() => handleSelect(lang.code)}
            sx={{ gap: 1.25 }}
          >
            <span style={{ fontSize: '1.1rem' }}>{lang.flag}</span>
            <Typography variant="body2">{lang.label}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LanguageSwitcher;
