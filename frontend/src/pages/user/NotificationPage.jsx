import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material";
import Page from "../../components/Page";
import SettingsIcon from "@mui/icons-material/Settings";
import { formatTimeAgoVi } from "../../utils/dateFormatter";

// Mock notification data
const mockNotifications = [
  {
    id: 1,
    text: "Có sinh viên mới đăng ký tham gia diễn đàn",
    timestamp: new Date(Date.now() - 5 * 60000),
    isRead: false,
  },
  {
    id: 2,
    text: "Bạn nhận được bình luận mới trên bài viết",
    timestamp: new Date(Date.now() - 30 * 60000),
    isRead: false,
  },
  {
    id: 3,
    text: "Cựu sinh viên Nguyễn Văn A đã cập nhật hồ sơ",
    timestamp: new Date(Date.now() - 2 * 60 * 60000),
    isRead: true,
  },
  {
    id: 4,
    text: "Sự kiện mới: Talkshow cựu sinh viên",
    timestamp: new Date(Date.now() - 24 * 60 * 60000),
    isRead: true,
  },
  {
    id: 5,
    text: "Bạn được kết nối với sinh viên mới",
    timestamp: new Date(Date.now() - 72 * 60 * 60000),
    isRead: true,
  },
  {
    id: 6,
    text: "Bạn được mời tham gia nhóm thảo luận",
    timestamp: new Date(Date.now() - 120 * 60 * 60000),
    isRead: false,
  },
  {
    id: 7,
    text: "Có bài viết mới trong danh mục quan tâm",
    timestamp: new Date(Date.now() - 168 * 60 * 60000),
    isRead: true,
  },
  {
    id: 8,
    text: "Lời mời kết nối từ Trần Minh Châu",
    timestamp: new Date(Date.now() - 240 * 60 * 60000),
    isRead: false,
  },
  {
    id: 9,
    text: "Sự kiện sắp diễn ra: Buổi gặp gỡ cựu sinh viên",
    timestamp: new Date(Date.now() - 360 * 60 * 60000),
    isRead: true,
  },
  {
    id: 10,
    text: "Bài viết của bạn nhận được 10 lượt thích",
    timestamp: new Date(Date.now() - 480 * 60 * 60000),
    isRead: true,
  },
];

const NotificationPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [notifications, setNotifications] = useState(mockNotifications);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleNotificationClick = (notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, isRead: true }))
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
    <Page title="Thông báo">
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
            Thông báo
          </Typography>
          <Tooltip title="Cài đặt">
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
              Tất cả
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
              Chưa đọc ({unreadCount})
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
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </Box>

        {/* Notifications List */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <Box
                key={notification.id}
                onClick={() => handleNotificationClick(notification.id)}
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
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: notification.isRead ? 400 : 600,
                      color: notification.isRead ? "text.secondary" : "text.primary",
                      lineHeight: 1.5,
                      mb: 0.5,
                    }}
                  >
                    {notification.text}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      color: !notification.isRead ? "primary.main" : "text.disabled",
                    }}
                  >
                    {formatTimeAgoVi(notification.timestamp)}
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
                Bạn đã xem hết thông báo
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 400 }}>
                Khi có sự kiện hoặc tương tác mới, chúng sẽ xuất hiện ở đây.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Page>
  );
};

export default NotificationPage;