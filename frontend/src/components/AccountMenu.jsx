import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Box,
  Typography,
  Menu,
  MenuItem,
  Divider,
  Avatar,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { useAuth } from "../hooks/useAuth";
import { useOrgPath } from '../hooks/useOrgNavigate';

const AccountMenu = ({ displayName, displayRole, avatarUrl, contrastMode }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const open = Boolean(anchorEl);
  const { logout } = useAuth();
  const toOrgPath = useOrgPath();

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [avatarUrl]);

  const handleOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleClose();
    await logout();
  };

  const avatarSx = {
    borderRadius: "50%",
    bgcolor: "primary.main",
    color: "primary.contrastText",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const resolvedAvatarUrl = !avatarLoadFailed && avatarUrl ? avatarUrl : undefined;
  const avatarImgProps = {
    referrerPolicy: "no-referrer",
    onError: () => setAvatarLoadFailed(true),
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          ml: 0.5,
          cursor: "pointer",
        }}
        onClick={handleOpen}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        aria-controls={open ? "account-menu" : undefined}
      >
        <Box sx={{ width: 36, height: 36, ...avatarSx }}>
          <Avatar
            src={resolvedAvatarUrl}
            alt={displayName}
            slotProps={{ img: avatarImgProps }}
            sx={{ width: "100%", height: "100%" }}
          >
            <PersonIcon sx={{ fontSize: 22 }} />
          </Avatar>
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{
              color: contrastMode ? "primary.contrastText" : "text.primary",
              lineHeight: 1.25,
            }}
          >
            {displayName}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: contrastMode ? "primary.contrastText" : "primary.main",
              lineHeight: 1.25,
            }}
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
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1.5,
              minWidth: 260,
              bgcolor: "background.paper",
              color: "text.primary",
              borderRadius: 2,
              overflow: "hidden",
              "& .MuiMenuItem-root": {
                py: 1.25,
                px: 1.75,
                gap: 1.25,
              },
            },
          },
        }}
        MenuListProps={{
          disablePadding: true,
          sx: { py: 0.5 },
        }}
      >
        <Box
          sx={{
            px: 2,
            pt: 1.5,
            pb: 1.25,
            display: "flex",
            alignItems: "center",
            gap: 1.25,
          }}
        >
          <Avatar
            src={resolvedAvatarUrl}
            slotProps={{ img: avatarImgProps }}
            sx={{ ...avatarSx, width: 40, height: 40 }}
          >
            <PersonIcon sx={{ fontSize: 22 }} />
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              fontWeight={600}
              noWrap
              sx={{ lineHeight: 1.3, letterSpacing: 0.1 }}
            >
              {displayName}
            </Typography>
            {displayRole && (
              <Typography
                variant="caption"
                sx={{ opacity: 0.85, display: "block", mt: 0.25 }}
                noWrap
              >
                {displayRole}
              </Typography>
            )}
          </Box>
        </Box>

        <Divider sx={{ borderColor: "divider", mx: 1.5 }} />

        <MenuItem
          component={Link}
          to={toOrgPath('/settings')}
          onClick={handleClose}
          sx={{
            borderTop: "none",
            display: "flex",
            alignItems: "center",
          }}
        >
          <PersonIcon fontSize="small" />
          <Typography variant="body2">Hồ sơ của tôi</Typography>
        </MenuItem>

        <Divider sx={{ borderColor: "divider", mx: 1.5, my: 0.5 }} />

        <MenuItem
          onClick={handleLogout}
          to="/auth/login"
          sx={{
            color: "error.main",
          }}
        >
          <LogoutRoundedIcon fontSize="small" />
          <Typography variant="body2">Đăng xuất</Typography>
        </MenuItem>
      </Menu>
    </>
  );
};

export default AccountMenu;
