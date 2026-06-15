import { useState, useEffect } from "react";
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

const Notification = ({ headerTextColor = "text.primary" }) => {
  const navigate = useOrgNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const open = Boolean(anchorEl);

  const fetchNotifications = async () => {
    setLoading(true);
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
    // Initial fetch
    fetchNotifications();
    
    // Set up polling every 1 minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
    // Refresh notifications when opening
    fetchNotifications();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await notificationApi.markAsRead(notification.id);
        setNotifications(
          notifications.map((notif) =>
            notif.id === notification.id ? { ...notif, isRead: true } : notif
          )
        );
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }
    const targetLink = notification.link || "";
    
    if (targetLink) {
      handleClose();
      if (/^https?:\/\//i.test(targetLink)) {
        window.open(targetLink, "_blank", "noopener,noreferrer");
      } else {
        navigate(targetLink);
      }
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
    <>
      <Tooltip title="Thông báo" arrow>
        <Box sx={{ position: "relative" }}>
          <IconButton
            size="small"
            aria-label="Thông báo"
            sx={{ color: headerTextColor }}
            onClick={handleOpen}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
          >
            <NotificationsOutlinedIcon />
          </IconButton>
          {unreadCount > 0 && (
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
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 500,
            mt: 3,
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
            Thông báo
          </Typography>
          <Tooltip title="Cài đặt" arrow>
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
        <Box sx={{ borderBottom: "1px solid #e0e0e0", pb: 2, px: 1, display: "flex", gap: 1 }}>
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
            Tất cả
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
            Chưa đọc
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
              background: "#f1f1f1",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "#888",
              borderRadius: "3px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: "#555",
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
                      ? "1px solid #f0f0f0"
                      : "none",
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
                Không có thông báo nào
              </Typography>
            </Box>
          )}
        </Box>
      </Menu>
    </>
  );
};

export default Notification;