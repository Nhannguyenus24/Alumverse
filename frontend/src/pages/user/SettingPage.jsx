import React, { useState } from 'react';
import {
  Box,
  Card,
  Container,
  Grid,
  TextField,
  Typography,
  Button,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Paper,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SecurityIcon from '@mui/icons-material/Security';
import NotificationsIcon from '@mui/icons-material/Notifications';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonIcon from '@mui/icons-material/Person';
import Page from '../../components/Page';

const MENU_ITEMS = [
  { id: 'personal', label: 'Cá nhân', icon: PersonIcon },
  { id: 'account', label: 'Tài khoản', icon: SecurityIcon },
  { id: 'notification', label: 'Thông báo', icon: NotificationsIcon },
  { id: 'display', label: 'Hiển thị', icon: VisibilityIcon },
  { id: 'advisor', label: 'Thông tin cố vấn', icon: VerifiedUserIcon },
];

export default function SettingPage() {
  const [activeTab, setActiveTab] = useState('personal');
  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    birthDate: '',
    phone: '',
    studentId: '',
    email: '',
    faculty: '',
    program: '',
    batch: '',
    graduationYear: '',
    specialization: '',
    graduationStatus: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    forumReply: true,
    forumMentioned: true,
    forumSubscribedTopics: true,
    forumPosts: true,
    activityNews: true,
    activityFollowedEvents: true,
    activityEventReminders: true,
    mentorScheduleReminder: true,
    mentorNewEvaluation: true,
    mentorAdvisorRequests: true,
  });

  const [displaySettings, setDisplaySettings] = useState({
    profilePage: true,
    donationHistory: true,
    interestedEvents: true,
    articlesAboutMe: true,
  });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotificationSettings((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleDisplayChange = (e) => {
    const { name, checked } = e.target;
    setDisplaySettings((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSave = () => {
    console.log('Save settings:', { formData, notificationSettings, displaySettings });
  };

  const renderPersonalSettings = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mt: 2 }}>
        Thông tin cá nhân
      </Typography>

      <Grid container spacing={3}>
        {/* Row 1: Full Name & Gender */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Họ và tên"
            name="fullName"
            value={formData.fullName}
            onChange={handleFormChange}
            placeholder="Nhập họ và tên"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Giới tính</InputLabel>
            <Select
              name="gender"
              value={formData.gender}
              label="Giới tính"
              onChange={handleFormChange}
            >
              <MenuItem value="male">Nam</MenuItem>
              <MenuItem value="female">Nữ</MenuItem>
              <MenuItem value="other">Khác</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Row 2: Birth Date & Phone */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Ngày sinh"
            name="birthDate"
            type="date"
            value={formData.birthDate}
            onChange={handleFormChange}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Số điện thoại"
            name="phone"
            value={formData.phone}
            onChange={handleFormChange}
            placeholder="Nhập số điện thoại"
          />
        </Grid>

        {/* Row 3: Student ID & Email */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Mã số sinh viên"
            name="studentId"
            value={formData.studentId}
            onChange={handleFormChange}
            placeholder="Nhập mã số sinh viên"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleFormChange}
            placeholder="Nhập email"
          />
        </Grid>

        {/* Row 4: Faculty & Program */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Khoa/Bộ môn</InputLabel>
            <Select
              name="faculty"
              value={formData.faculty}
              label="Khoa/Bộ môn"
              onChange={handleFormChange}
            >
              <MenuItem value="cs">Khoa Công nghệ Thông tin</MenuItem>
              <MenuItem value="math">Khoa Toán</MenuItem>
              <MenuItem value="physics">Khoa Vật lý</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Chương trình đào tạo</InputLabel>
            <Select
              name="program"
              value={formData.program}
              label="Chương trình đào tạo"
              onChange={handleFormChange}
            >
              <MenuItem value="standard">Chuẩn</MenuItem>
              <MenuItem value="advanced">Nâng cao</MenuItem>
              <MenuItem value="honors">Chất lượng cao</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Row 5: Batch & Graduation Year */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Khoá</InputLabel>
            <Select
              name="batch"
              value={formData.batch}
              label="Khoá"
              onChange={handleFormChange}
            >
              <MenuItem value="2020">2020</MenuItem>
              <MenuItem value="2021">2021</MenuItem>
              <MenuItem value="2022">2022</MenuItem>
              <MenuItem value="2023">2023</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Năm tốt nghiệp"
            name="graduationYear"
            type="number"
            value={formData.graduationYear}
            onChange={handleFormChange}
            placeholder="Nhập năm tốt nghiệp"
          />
        </Grid>

        {/* Row 6: Specialization & Graduation Status */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Chuyên ngành</InputLabel>
            <Select
              name="specialization"
              value={formData.specialization}
              label="Chuyên ngành"
              onChange={handleFormChange}
            >
              <MenuItem value="ai">Trí tuệ nhân tạo</MenuItem>
              <MenuItem value="web">Phát triển web</MenuItem>
              <MenuItem value="mobile">Phát triển di động</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Trạng thái tốt nghiệp</InputLabel>
            <Select
              name="graduationStatus"
              value={formData.graduationStatus}
              label="Trạng thái tốt nghiệp"
              onChange={handleFormChange}
            >
              <MenuItem value="graduated">Đã tốt nghiệp</MenuItem>
              <MenuItem value="studying">Đang học</MenuItem>
              <MenuItem value="pending">Chờ công bố</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
        <Button variant="contained" color="primary" onClick={handleSave}>
          Lưu thay đổi
        </Button>
        <Button variant="outlined" color="secondary">
          Huỷ
        </Button>
      </Box>
    </Box>
  );

  const renderAccountSettings = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Change Password Section */}
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Đặt lại mật khẩu
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Mật khẩu hiện tại"
              type="password"
              placeholder="Nhập mật khẩu hiện tại"
            />
          </Grid>
          <Grid item xs={12} sm={6} />
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Mật khẩu mới"
              type="password"
              placeholder="Nhập mật khẩu mới"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Xác nhận mật khẩu"
              type="password"
              placeholder="Xác nhận mật khẩu"
            />
          </Grid>
        </Grid>
        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button variant="contained" color="primary">
            Cập nhật mật khẩu
          </Button>
          <Button variant="outlined" color="secondary">
            Huỷ
          </Button>
        </Box>
      </Box>

      <Divider />

      {/* Logged In Devices Section */}
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Thiết bị đã đăng nhập
        </Typography>
        <List>
          <ListItem
            secondaryAction={
              <Button variant="outlined" color="error" size="small">
                Đăng xuất
              </Button>
            }
          >
            <ListItemText
              primary="Chrome - Windows"
              secondary="Lần cuối: 2 giờ trước"
            />
          </ListItem>
          <ListItem
            secondaryAction={
              <Button variant="outlined" color="error" size="small">
                Đăng xuất
              </Button>
            }
          >
            <ListItemText
              primary="Safari - macOS"
              secondary="Lần cuối: 30 phút trước"
            />
          </ListItem>
          <ListItem
            secondaryAction={
              <Button variant="outlined" color="error" size="small">
                Đăng xuất
              </Button>
            }
          >
            <ListItemText
              primary="Firefox - Linux"
              secondary="Lần cuối: 3 ngày trước"
            />
          </ListItem>
        </List>
      </Box>
    </Box>
  );

  const renderNotificationSettings = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Forum Notifications */}
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Thông báo diễn đàn
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <FormControlLabel
            control={
              <Checkbox
                name="forumReply"
                checked={notificationSettings.forumReply}
                onChange={handleNotificationChange}
              />
            }
            label="Có trả lời cho bài viết của bạn"
          />
          <FormControlLabel
            control={
              <Checkbox
                name="forumMentioned"
                checked={notificationSettings.forumMentioned}
                onChange={handleNotificationChange}
              />
            }
            label="Bạn đã được nhắc đến"
          />
          <FormControlLabel
            control={
              <Checkbox
                name="forumSubscribedTopics"
                checked={notificationSettings.forumSubscribedTopics}
                onChange={handleNotificationChange}
              />
            }
            label="Chủ đề đã đăng ký có hoạt động mới"
          />
          <FormControlLabel
            control={
              <Checkbox
                name="forumPosts"
                checked={notificationSettings.forumPosts}
                onChange={handleNotificationChange}
              />
            }
            label="Bài viết mới từ những người bạn theo dõi"
          />
        </Box>
      </Box>

      <Divider />

      {/* Activity Notifications */}
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Thông báo hoạt động
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <FormControlLabel
            control={
              <Checkbox
                name="activityNews"
                checked={notificationSettings.activityNews}
                onChange={handleNotificationChange}
              />
            }
            label="Tin tức mới"
          />
          <FormControlLabel
            control={
              <Checkbox
                name="activityFollowedEvents"
                checked={notificationSettings.activityFollowedEvents}
                onChange={handleNotificationChange}
              />
            }
            label="Cập nhật sự kiện đã theo dõi"
          />
          <FormControlLabel
            control={
              <Checkbox
                name="activityEventReminders"
                checked={notificationSettings.activityEventReminders}
                onChange={handleNotificationChange}
              />
            }
            label="Nhắc nhở sự kiện sắp tới"
          />
        </Box>
      </Box>

      <Divider />

      {/* Mentor Notifications */}
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Thông báo cố vấn
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <FormControlLabel
            control={
              <Checkbox
                name="mentorScheduleReminder"
                checked={notificationSettings.mentorScheduleReminder}
                onChange={handleNotificationChange}
              />
            }
            label="Nhắc nhở lịch cố vấn"
          />
          <FormControlLabel
            control={
              <Checkbox
                name="mentorNewEvaluation"
                checked={notificationSettings.mentorNewEvaluation}
                onChange={handleNotificationChange}
              />
            }
            label="Đánh giá mới từ cố vấn"
          />
          <FormControlLabel
            control={
              <Checkbox
                name="mentorAdvisorRequests"
                checked={notificationSettings.mentorAdvisorRequests}
                onChange={handleNotificationChange}
              />
            }
            label="Yêu cầu cố vấn mới"
          />
        </Box>
      </Box>

      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
        <Button variant="contained" color="primary" onClick={handleSave}>
          Lưu thay đổi
        </Button>
        <Button variant="outlined" color="secondary">
          Huỷ
        </Button>
      </Box>
    </Box>
  );

  const renderDisplaySettings = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
        Tùy chọn hiển thị trang cá nhân
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              name="profilePage"
              checked={displaySettings.profilePage}
              onChange={handleDisplayChange}
            />
          }
          label="Hiển thị trang cá nhân công khai"
        />
        <FormControlLabel
          control={
            <Checkbox
              name="donationHistory"
              checked={displaySettings.donationHistory}
              onChange={handleDisplayChange}
            />
          }
          label="Hiển thị lịch sử quyên góp"
        />
        <FormControlLabel
          control={
            <Checkbox
              name="interestedEvents"
              checked={displaySettings.interestedEvents}
              onChange={handleDisplayChange}
            />
          }
          label="Hiển thị sự kiện quan tâm"
        />
        <FormControlLabel
          control={
            <Checkbox
              name="articlesAboutMe"
              checked={displaySettings.articlesAboutMe}
              onChange={handleDisplayChange}
            />
          }
          label="Hiển thị các bài viết về bạn"
        />
      </Box>

      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button variant="contained" color="primary" onClick={handleSave}>
          Lưu thay đổi
        </Button>
        <Button variant="outlined" color="secondary">
          Huỷ
        </Button>
      </Box>
    </Box>
  );

  const renderAdvisorSettings = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
        Thông tin cố vấn học tập
      </Typography>

      <Typography variant="body2" color="textSecondary">
        Chưa có cố vấn được gán. Vui lòng liên hệ với bộ phận quản lý sinh viên để được gán cố vấn.
      </Typography>

      <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Thông tin liên hệ
        </Typography>
        <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
          Email: admin@hcmus.edu.vn
        </Typography>
        <Typography variant="caption" color="textSecondary" display="block">
          Điện thoại: 028 3821 4444
        </Typography>
      </Paper>
    </Box>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'personal':
        return renderPersonalSettings();
      case 'account':
        return renderAccountSettings();
      case 'notification':
        return renderNotificationSettings();
      case 'display':
        return renderDisplaySettings();
      case 'advisor':
        return renderAdvisorSettings();
      default:
        return null;
    }
  };

  return (
    <Page
      title="Cài đặt người dùng"
      meta={
        <meta
          name="description"
          content="Cài đặt người dùng - AlumVerse, Trường Đại học Khoa học Tự nhiên, ĐHQG-HCM"
        />
      }
    >
      <Container maxWidth="lg" sx={{ py: 10, minHeight: 'calc(100vh - 80px)', display: 'flex', alignItems: 'stretch' }}>
        <Grid container spacing={3} sx={{ width: '100%' }}>
          <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'flex-start' }}>
            <Paper elevation={0} sx={{ bgcolor: '#f9f9f9', borderRadius: 2, position: 'sticky', top: 20, width: '100%' }}>
              <List disablePadding>
                {MENU_ITEMS.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <ListItemButton
                      key={item.id}
                      selected={activeTab === item.id}
                      onClick={() => setActiveTab(item.id)}
                      sx={{
                        px: 2,
                        py: 1.5,
                        borderLeft: activeTab === item.id ? '4px solid' : '4px solid transparent',
                        borderColor: activeTab === item.id ? '#1976d2' : 'transparent',
                        backgroundColor: activeTab === item.id ? '#e3f2fd' : 'transparent',
                        '&:hover': {
                          backgroundColor: activeTab === item.id ? '#e3f2fd' : '#f0f0f0',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Icon
                          sx={{
                            fontSize: 20,
                            color: activeTab === item.id ? '#1976d2' : '#666',
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: activeTab === item.id ? 600 : 500,
                            color: activeTab === item.id ? '#1976d2' : '#333',
                          }}
                        >
                          {item.label}
                        </Typography>
                      </Box>
                    </ListItemButton>
                  );
                })}
              </List>
            </Paper>
          </Grid>

          {/* Right Content Area */}
          <Grid item xs={12} md={9} sx={{ display: 'flex', height: '100%', flex: 1 }}>
            <Card sx={{ p: 3, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
              {/* Header */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2' }}>
                  Cài đặt người dùng
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                  Quản lý thông tin tài khoản và các tùy chọn cá nhân
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Tab Content */}
              {renderContent()}
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Page>
  );
}
