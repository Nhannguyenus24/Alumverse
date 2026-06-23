import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import Page from "../../components/Page";
import SettingsIcon from "@mui/icons-material/Settings";
import { formatTimeAgoVi } from "../../utils/dateFormatter";
import { notificationApi } from "../../utils/api";
import { useOrgNavigate } from "../../hooks/useOrgNavigate";

const NotificationPage = () => {
  const navigate = useOrgNavigate();
  const { t } = useTranslation("notification");
  const [activeTab, setActiveTab] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const data = await notificationApi.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleNotificationClick = async (notification) => {
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
    if (notification.link) {
      if (/^https?:\/\//i.test(notification.link)) {
        window.open(notification.link, "_blank", "noopener,noreferrer");
      } else {
        navigate(notification.link);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Assuming marking all as read is done by iterating for now,
      // or if backend has an endpoint for it.
      // Current notificationApi doesn't have markAllAsRead but we can add it or just map locally for UI.
      // Based on UserController, there's no markAllAsRead, only mark individual or deleteAll.
      // We'll mark them one by one or just update UI and let user know.
      // For simplicity, let's just mark them locally for now if there's no backend endpoint.

      const unreadNotifications = notifications.filter(n => !n.isRead);
      await Promise.all(unreadNotifications.map(n => notificationApi.markAsRead(n.id)));

      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  // Filter notifications based on active tab
  const filteredNotifications =
    activeTab === 0
      ? notifications
      : notifications.filter((notif) => !notif.isRead);

  // Count unread notifications
  const unreadCount = notifications.filter((notif) => !notif.isRead).length;

  return (
    <Page title={t("heading")}>
      <Box sx={{ maxWidth: 800, mx: "auto", py: 3 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
            mt: 5,
            pb: 2,
          }}
        >
          <Typography variant="h2" sx={{ fontWeight: 700 }}>
            {t("heading")}
          </Typography>
          <Tooltip title={t("settings_tooltip")}>
            <IconButton sx={{ color: "text.secondary" }}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Filter Buttons */}
        <Box
          sx={{
            display: "flex",
            gap: 1,
            mb: 3,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant={activeTab === 0 ? "contained" : "outlined"}
              color="primary"
              onClick={() => handleTabChange(null, 0)}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                fontSize: "1rem",
                px: 3,
                py: 1,
              }}
            >
              {t("tab_all")}
            </Button>
            <Button
              variant={activeTab === 1 ? "contained" : "outlined"}
              color="primary"
              onClick={() => handleTabChange(null, 1)}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                fontSize: "1rem",
                px: 3,
                py: 1,
              }}
            >
              {t("tab_unread_count", { count: unreadCount })}
            </Button>
          </Box>
          {unreadCount > 0 && (
            <Button
              variant="text"
              color="primary"
              onClick={handleMarkAllAsRead}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                fontSize: "1rem",
              }}
            >
              {t("mark_all_read")}
            </Button>
          )}
        </Box>

        {/* Notifications List */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <Box
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  p: 2.5,
                  display: "flex",
                  gap: 2,
                  alignItems: "flex-start",
                  cursor: "pointer",
                  position: "relative",
                  bgcolor: !notification.isRead
                    ? "rgba(25, 118, 210, 0.05)"
                    : "transparent",
                  transition: "background-color 0.2s ease-in-out",
                  borderBottom: "1px solid #e0e0e0",
                  "&:hover": {
                    bgcolor: !notification.isRead
                      ? "rgba(25, 118, 210, 0.1)"
                      : "rgba(0, 0, 0, 0.02)",
                  },
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {notification.title && (
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        color: "text.primary",
                        mb: 0.5
                      }}
                    >
                      {notification.title}
                    </Typography>
                  )}
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: notification.isRead ? 400 : 600,
                      color: notification.isRead ? "text.secondary" : "text.primary",
                      lineHeight: 1.5,
                      mb: 0.5,
                    }}
                  >
                    {notification.message}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      color: !notification.isRead ? "primary.main" : "text.disabled",
                    }}
                  >
                    {formatTimeAgoVi(notification.createdAt)}
                  </Typography>
                </Box>

                {!notification.isRead && (
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      bgcolor: "primary.main",
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
                py: 8,
                px: 3,
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Typography variant="h6" sx={{ color: "text.primary", fontWeight: 600 }}>
                {t("all_caught_up")}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 400 }}>
                {t("all_caught_up_desc")}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Page>
  );
};

export default NotificationPage;
