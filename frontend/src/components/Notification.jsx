import { useState } from "react";
import {
  Box,
  IconButton,
  Menu,
  Typography,
  Tooltip,
  Button,
} from "@mui/material";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SettingsIcon from "@mui/icons-material/Settings";

// Mock notification data
const mockNotifications = [
  {
    id: 1,
    text: "Có sinh viên mới đăng ký tham gia diễn đàn",
    timestamp: new Date(Date.now() - 5 * 60000), // 5 minutes ago
    isRead: false,
  },
  {
    id: 2,
    text: "Bạn nhận được bình luận mới trên bài viết",
    timestamp: new Date(Date.now() - 30 * 60000), // 30 minutes ago
    isRead: false,
  },
  {
    id: 3,
    text: "Cựu sinh viên Nguyễn Văn A đã cập nhật hồ sơ",
    timestamp: new Date(Date.now() - 2 * 60 * 60000), // 2 hours ago
    isRead: true,
  },
  {
    id: 4,
    text: "Sự kiện mới: Talkshow cựu sinh viên",
    timestamp: new Date(Date.now() - 24 * 60 * 60000), // 1 day ago
    isRead: true,
  },
  {
    id: 5,
    text: "Bạn được kết nối với sinh viên mới",
    timestamp: new Date(Date.now() - 72 * 60 * 60000), // 3 days ago
    isRead: true,
  },
];

// Utility function to format time ago
const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - timestamp) / 1000);

  if (diffInSeconds < 60) return "Vừa xong";
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} phút trước`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} giờ trước`;
  }
  const days = Math.floor(diffInSeconds / 86400);
  return `${days} ngày trước`;
};

const Notification = ({ headerTextColor = "text.primary" }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [notifications, setNotifications] = useState(mockNotifications);

  const open = Boolean(anchorEl);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleNotificationClick = (notificationId) => {
    setNotifications(
      notifications.map((notif) =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
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
            <NotificationsOutlinedIcon fontSize="small" />
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
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
          },
        }}
      >
        {/* Header with title and settings */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 1
          }}
        >
          <Typography variant="h3" sx={{ fontWeight: 600 }}>
            Thông báo
          </Typography>
          <Tooltip title="Cài đặt" arrow>
            <IconButton size="small" sx={{ color: "text.secondary" }}>
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: "1px solid #e0e0e0", p: 1, display: "flex", gap: 1 }}>
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
          {filteredNotifications.length > 0 ? (
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
                onClick={() => handleNotificationClick(notification.id)}
              >
                {/* Notification content */}
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: notification.isRead ? 400 : 600,
                      color: "text.primary",
                      lineHeight: 1.4,
                    }}
                  >
                    {notification.text}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      mt: 0.5,
                      color: "text.secondary",
                    }}
                  >
                    {formatTimeAgo(notification.timestamp)}
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