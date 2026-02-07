import { useState } from 'react';
import { Link } from 'react-router';
import { Box, Typography, Menu, MenuItem } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';

const AccountMenu = ({ displayName, displayRole, avatarUrl, transparent = false }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);

  const avatarSx = {
    borderRadius: '50%',
    bgcolor: 'primary.main',
    color: 'primary.contrastText',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          ml: 0.5,
          cursor: 'pointer',
        }}
        onClick={handleOpen}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        aria-controls={open ? 'account-menu' : undefined}
      >
        <Box sx={{ width: 36, height: 36, ...avatarSx }}>
          {avatarUrl ? (
            <Box
              component="img"
              src={avatarUrl}
              alt=""
              sx={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <PersonIcon sx={{ fontSize: 22 }} />
          )}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{ color: transparent ? '#fff' : 'text.primary', lineHeight: 1.25 }}
          >
            {displayName}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: transparent ? 'rgba(255,255,255,0.9)' : 'primary.main', lineHeight: 1.25 }}
          >
            {displayRole}
          </Typography>
        </Box>
      </Box>

      <Menu
        id="account-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1.5,
              minWidth: 240,
              backgroundColor: 'grey.900',
              color: '#fff',
              borderRadius: 1,
              boxShadow: 8,
              '& .MuiMenuItem-root': {
                py: 1.25,
              },
            },
          },
        }}
        MenuListProps={{ disablePadding: true }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 40, height: 40, flexShrink: 0, ...avatarSx }}>
            {avatarUrl ? (
              <Box
                component="img"
                src={avatarUrl}
                alt=""
                sx={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <PersonIcon sx={{ fontSize: 24 }} />
            )}
          </Box>
          <Box>
            <Typography variant="body1" fontWeight={600} sx={{ color: 'grey.100' }}>
              {displayName}
            </Typography>
            <Typography variant="body2" sx={{ color: 'primary.main' }}>
              {displayRole}
            </Typography>
          </Box>
        </Box>
        <MenuItem
          component={Link}
          to="/dashboard"
          onClick={handleClose}
          sx={{
            borderTop: 1,
            borderColor: 'grey.700',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            color: 'grey.200',
            '&:hover': { backgroundColor: 'grey.800' },
          }}
        >
          <Box sx={{ width: 32, height: 32, flexShrink: 0, ...avatarSx }}>
            <PersonIcon sx={{ fontSize: 18 }} />
          </Box>
          <Typography variant="body2">Profile</Typography>
        </MenuItem>
      </Menu>
    </>
  );
};

export default AccountMenu;
