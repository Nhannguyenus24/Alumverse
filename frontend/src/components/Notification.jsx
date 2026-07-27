import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  IconButton,
  Menu,
  Typography,
  Tooltip,
  Button,
  CircularProgress,
} from "@mui/material";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SettingsIcon from "@mui/icons-material/Settings";
import { formatTimeAgoVi } from "../utils/dateFormatter";
import { notificationApi } from "../utils/api";
import { useOrgNavigate } from "../hooks/useOrgNavigate";
import { NOTIFICATIONS_UPDATED_EVENT } from "../hooks/useServerSentEvents";
import useAuthStore from "../stores/authStore";
import useNotificationUnreadStore from "../stores/notificationUnreadStore";

const isPeerVerificationNotification = (notification) => {
  const title = String(notification?.title || "").toLowerCase();
  return (
    title.includes("xác thực đồng nghiệp")
    || title.includes("peer verification")
  );
};

const getSeenStorageKey = (user) => {
  const userKey = user?.id ?? user?.email ?? user?.username ?? "anonymous";
  return `alumverse:notifications:lastSeenAt:${userKey}`;
};

const readLastSeenAt = (user) => {
  if (typeof window === "undefined") return 0;
  const value = window.localStorage.getItem(getSeenStorageKey(user));
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getNotificationTimestamp = (notification) => {
  const value = Date.parse(notification?.createdAt);
  return Number.isFinite(value) ? value : 0;
};

const Notification = ({ headerTextColor = "text.primary" }) => {
  const { t } = useTranslation(['notification', 'common']);
  const navigate = useOrgNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const [lastSeenAt, setLastSeenAt] = useState(() => readLastSeenAt(useAuthStore.getState().user));

  const open = Boolean(anchorEl);

  const fetchNotifications = useCallback(async () => {
    if (!token || document.visibilityState === 'hidden') return;

    setLoading(true);
    try {
      const data = await notificationApi.getNotifications();
      setNotifications(data);
    } catch (error) {
      if (error?.response?.status !== 429) {
        console.error("Failed to fetch notifications:", error);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;

    // Initial fetch
    fetchNotifications();
    
    // Set up polling every 2 minutes. Local dev often points to the shared
    // production API, so keeping this modest helps avoid rate-limit noise.
    const interval = setInterval(fetchNotifications, 120000);

    // Realtime SSE notifications (vd: lời mời kết nối) phát sự kiện này để chuông
    // refetch ngay, không phải chờ vòng poll kế tiếp.
    const handleRealtimeUpdate = () => fetchNotifications();
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handleRealtimeUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, handleRealtimeUpdate);
    };
  }, [fetchNotifications, token]);

  useEffect(() => {
    setLastSeenAt(readLastSeenAt(user));
  }, [user]);

  const handleOpen = useCallback((event) => {
    setAnchorEl(event.currentTarget);
    const seenAt = Date.now();
    if (typeof window !== "undefined") {
      window.localStorage.setItem(getSeenStorageKey(user), String(seenAt));
    }
    setLastSeenAt(seenAt);
    // Refresh notifications when opening
    if (token) fetchNotifications();
  }, [fetchNotifications, token, user]);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleNotificationClick = useCallback(async (notification) => {
    if (!notification.isRead) {
      try {
        await notificationApi.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notification.id ? { ...notif, isRead: true } : notif
          )
        );
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }
    const targetLink = notification.link || (isPeerVerificationNotification(notification)
      ? "/settings?tab=verification"
      : "");
    
    if (targetLink) {
      handleClose();
      if (/^https?:\/\//i.test(targetLink)) {
        window.open(targetLink, "_blank", "noopener,noreferrer");
      } else {
        navigate(targetLink);
      }
    }
  }, [navigate, handleClose]);

  // Filter notifications based on active tab
  const filteredNotifications = useMemo(
    () => activeTab === 0 ? notifications : notifications.filter((notif) => !notif.isRead),
    [activeTab, notifications]
  );

  // Count unread notifications
  const unreadCount = useMemo(
    () => notifications.filter((notif) => !notif.isRead).length,
    [notifications]
  );

  const hasNewSinceLastSeen = useMemo(
    () => notifications.some((notif) => getNotificationTimestamp(notif) > lastSeenAt),
    [lastSeenAt, notifications]
  );

  // Mirror the bell dot state into the global store so the favicon can react.
  const setUnreadStoreCount = useNotificationUnreadStore((s) => s.setCount);
  useEffect(() => {
    setUnreadStoreCount(hasNewSinceLastSeen ? 1 : 0);
  }, [hasNewSinceLastSeen, setUnreadStoreCount]);

  return (
    <>
      <Tooltip
        title={t("notification:tooltip")}
        arrow
        placement="bottom"
        slotProps={{
          popper: {
            modifiers: [{ name: 'offset', options: { offset: [0, 4] } }],
          },
        }}
      >
        <Box sx={{ position: "relative" }}>
          <IconButton
            size="small"
            aria-label={t("notification:tooltip")}
            sx={{ color: headerTextColor }}
            onClick={handleOpen}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
          >
            <NotificationsOutlinedIcon />
          </IconButton>
          {hasNewSinceLastSeen && (
            <Box
              sx={{
                position: "absolute",
                top: 4,
                right: 4,
                width: 6,
                height: 6,
                bgcolor: "error.main",
                borderRadius: "50%",
              }}
            />
          )}
        </Box>
      </Tooltip>

      <Menu
        id="notification-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{ zIndex: (theme) => theme.zIndex.modal + 2 }}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 500,
            mt: 4,
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
            p: 1
          },
        }}
        MenuListProps={{ sx: { p: 0 } }}
      >
        {/* Header with title and settings */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 1,
            py: 1.25,
          }}
        >
          <Typography variant="h3" sx={{ fontWeight: 700, color: "primary.main" }}>
            {t("notification:heading")}
          </Typography>
          <Tooltip title={t("notification:settings_tooltip")} arrow>
            <IconButton 
              size="small" 
              sx={{ color: "text.secondary" }}
              onClick={() => {
                handleClose();
                navigate('/settings?tab=notification');
              }}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 2, px: 1, display: "flex", gap: 1 }}>
          <Button
            variant={activeTab === 0 ? "contained" : "outlined"}
            color="primary"
            onClick={() => handleTabChange(null, 0)}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.875rem",
              px: 2,
              py: 0.5,
            }}
          >
            {t("notification:tab_all")}
          </Button>
          <Button
            variant={activeTab === 1 ? "contained" : "outlined"}
            color="primary"
            onClick={() => handleTabChange(null, 1)}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.875rem",
              px: 2,
              py: 0.5,
            }}
          >
            {t("notification:tab_unread")}
          </Button>
        </Box>

        {/* Notification List */}
        <Box
          sx={{
            maxHeight: 350,
            overflowY: "auto",
            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-track": {
              background: (theme) => theme.palette.action.hover,
            },
            "&::-webkit-scrollbar-thumb": {
              background: (theme) => theme.palette.action.focus,
              borderRadius: "3px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: (theme) => theme.palette.action.active,
            },
          }}
        >
          {loading && notifications.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification, index) => (
              <Box
                key={notification.id}
                sx={{
                  p: 2,
                  borderBottom:
                    index < filteredNotifications.length - 1
                      ? "1px solid"
                      : "none",
                  borderColor: "divider",
                  bgcolor: !notification.isRead
                    ? "action.hover"
                    : "background.paper",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                  "&:hover": {
                    bgcolor: "action.hover",
                  },
                  display: "flex",
                  gap: 1,
                  alignItems: "flex-start",
                }}
                onClick={() => handleNotificationClick(notification)}
              >
                {/* Notification content */}
                <Box sx={{ flex: 1 }}>
                  {notification.title && (
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: notification.isRead ? 600 : 700,
                        color: "text.primary",
                        mb: 0.5
                      }}
                    >
                      {notification.title}
                    </Typography>
                  )}
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: notification.isRead ? 400 : 600,
                      color: "text.primary",
                      lineHeight: 1.4,
                    }}
                  >
                    {notification.message}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      mt: 0.5,
                      color: "text.secondary",
                    }}
                  >
                    {formatTimeAgoVi(notification.createdAt)}
                  </Typography>
                </Box>

                {/* Unread indicator dot */}
                {!notification.isRead && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      bgcolor: "error.main",
                      borderRadius: "50%",
                      mt: 1,
                      flexShrink: 0,
                    }}
                  />
                )}
              </Box>
            ))
          ) : (
            <Box
              sx={{
                p: 3,
                textAlign: "center",
                color: "text.secondary",
              }}
            >
              <Typography variant="body2">
                {t("notification:empty")}
              </Typography>
            </Box>
          )}
        </Box>
      </Menu>
    </>
  );
};

export default Notification;
