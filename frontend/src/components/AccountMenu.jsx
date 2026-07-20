import { useState, useMemo, useCallback } from "react";
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
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { useNotification } from "../hooks/useNotification";
import { useCanContribute } from "../hooks/useCanContribute";
import { useOrgNavigate, useOrgPath } from '../hooks/useOrgNavigate';
import useOrganizationStore from "../stores/organizationStore";
import { resolveMediaUrl } from "../utils/imageUtils";

const AVATAR_SX = {
  borderRadius: "50%",
  bgcolor: "action.disabledBackground",
  color: "text.primary",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const FALLBACK_PERSON_ICON_SX = {
  fontSize: 22,
  color: (theme) => theme.palette.mode === "dark"
    ? theme.palette.text.primary
    : theme.palette.common.white,
};

const DEFAULT_MENU_ANCHOR_ORIGIN = { vertical: "bottom", horizontal: "right" };
const DEFAULT_MENU_TRANSFORM_ORIGIN = { vertical: "top", horizontal: "right" };

const AccountMenu = ({
  displayName,
  displayRole,
  avatarUrl,
  contrastMode,
  textColor,
  onNavigate,
  sx,
  menuAnchorOrigin = DEFAULT_MENU_ANCHOR_ORIGIN,
  menuTransformOrigin = DEFAULT_MENU_TRANSFORM_ORIGIN,
}) => {
  const { t } = useTranslation(['profile', 'common', 'event', 'article', 'nav']);
  const navigate = useOrgNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [prevAvatarUrl, setPrevAvatarUrl] = useState(avatarUrl);

  if (avatarUrl !== prevAvatarUrl) {
    setPrevAvatarUrl(avatarUrl);
    setAvatarLoadFailed(false);
  }

  const open = Boolean(anchorEl);
  const { logout, verificationLevel, user } = useAuth();
  const { showSuccess } = useNotification();
  const { isOrgManager } = useCanContribute();
  const toOrgPath = useOrgPath();
  const organization = useOrganizationStore((state) => state.organization);
  const currentSlug = useOrganizationStore((state) => state.currentSlug);
  const isGuestVerificationLevel = verificationLevel === 0;
  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'STAFF';
  const handleOpen = useCallback((event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  }, []);
  const handleClose = useCallback(() => setAnchorEl(null), []);

  const handleItemClick = useCallback(() => {
    handleClose();
    onNavigate?.();
  }, [handleClose, onNavigate]);

  const handleLogout = useCallback(async () => {
    handleItemClick();
    await logout();
    showSuccess(t("common:logout_success"));
    navigate("/");
  }, [handleItemClick, logout, showSuccess, t, navigate]);

  const resolvedAvatarUrl = !avatarLoadFailed && avatarUrl ? resolveMediaUrl(avatarUrl) : undefined;
  const avatarImgProps = useMemo(() => ({
    referrerPolicy: "no-referrer",
    onError: () => setAvatarLoadFailed(true),
  }), []);

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          ml: 0.5,
          cursor: "pointer",
          ...sx,
        }}
        onClick={handleOpen}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        aria-controls={open ? "account-menu" : undefined}
      >
        <Box sx={{ width: 36, height: 36, ...AVATAR_SX }}>
          <Avatar
            src={resolvedAvatarUrl}
            alt={displayName}
            slotProps={{ img: avatarImgProps }}
            sx={{ width: "100%", height: "100%" }}
          >
            <PersonIcon sx={FALLBACK_PERSON_ICON_SX} />
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
              ...(textColor ? { color: textColor } : {}),
              lineHeight: 1.25,
            }}
          >
            {displayName}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: contrastMode ? "primary.contrastText" : "primary.main",
              ...(textColor ? { color: textColor } : {}),
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
        anchorOrigin={menuAnchorOrigin}
        transformOrigin={menuTransformOrigin}
        sx={{ zIndex: (theme) => theme.zIndex.modal + 2 }}
        slotProps={{
          paper: {
            sx: {
              mt: 2.5,
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
            sx={{ ...AVATAR_SX, width: 40, height: 40 }}
          >
            <PersonIcon sx={FALLBACK_PERSON_ICON_SX} />
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

        <Divider sx={{ borderColor: "divider" }} />

        <MenuItem
          component={Link}
          to={toOrgPath('/profile')}
          onClick={handleItemClick}
          sx={{
            borderTop: "none",
            display: "flex",
            alignItems: "center",
          }}
        >
          <PersonIcon fontSize="small" />
          <Typography variant="body2">{t('profile:my_profile')}</Typography>
        </MenuItem>

        {!isAdmin && !isStaff && (
          <MenuItem
            component={Link}
            to={toOrgPath('/my-tickets')}
            onClick={handleItemClick}
          >
            <ConfirmationNumberOutlinedIcon fontSize="small" />
            <Typography variant="body2">{t('event:my_tickets')}</Typography>
          </MenuItem>
        )}

        <MenuItem
          component={Link}
          to={toOrgPath('/saved-articles')}
          onClick={handleItemClick}
        >
          <FavoriteBorderIcon fontSize="small" />
          <Typography variant="body2">{t('article:saved_articles')}</Typography>
        </MenuItem>

        {isAdmin && (
          <MenuItem
            component={Link}
            to="/admin"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleItemClick}
          >
            <AdminPanelSettingsOutlinedIcon fontSize="small" />
            <Typography variant="body2">{t('nav:admin')}</Typography>
          </MenuItem>
        )}

        {isStaff && isOrgManager && (organization?.slug || currentSlug) && (
          <MenuItem
            component={Link}
            to={toOrgPath('/admin')}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleItemClick}
            sx={{
              color: "primary.main",
              "& .MuiSvgIcon-root": { color: "primary.main" },
            }}
          >
            <AdminPanelSettingsOutlinedIcon fontSize="small" />
            <Typography variant="body2">{t('nav:admin')}</Typography>
          </MenuItem>
        )}

        <MenuItem
          component={Link}
          to={toOrgPath('/settings')}
          onClick={handleItemClick}
          sx={{
            borderTop: "none",
            display: "flex",
            alignItems: "center",
          }}
        >
          <SettingsIcon fontSize="small" />
          <Typography variant="body2">{t('common:settings')}</Typography>
        </MenuItem>
        {isGuestVerificationLevel && (
          <MenuItem
            component={Link}
            to={toOrgPath('/organization-registration')}
            onClick={handleItemClick}
            sx={{
              borderTop: "none",
              display: "flex",
              alignItems: "center",
              color: "accent.dark",
              "& .MuiSvgIcon-root": { color: "accent.dark" },
            }}
          >
            <VerifiedUserIcon fontSize="small" />
            <Typography variant="body2">{t('profile:verify_account')}</Typography>
          </MenuItem>
        )}

        <Divider sx={{ borderColor: "divider" }} />

        <MenuItem
          onClick={handleLogout}
          sx={{
            color: "error.main",
          }}
        >
          <LogoutRoundedIcon fontSize="small" />
          <Typography variant="body2">{t('common:logout')}</Typography>
        </MenuItem>
      </Menu>
    </>
  );
};

export default AccountMenu;
