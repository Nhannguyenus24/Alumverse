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
  Stack
} from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SecurityIcon from '@mui/icons-material/Security';
import NotificationsIcon from '@mui/icons-material/Notifications';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import Page from '../../components/Page';
import Sidebar from '../../components/Sidebar';

const MENU_ITEMS = [
  { id: 'personal', label: 'Cá nhân', icon: <PersonIcon /> },
  { id: 'account', label: 'Tài khoản', icon: <SecurityIcon /> },
  { id: 'notification', label: 'Thông báo', icon: <NotificationsIcon /> },
  { id: 'display', label: 'Hiển thị', icon: <VisibilityIcon /> },
  { id: 'advisor', label: 'Thông tin cố vấn', icon: <VerifiedUserIcon /> },
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
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
    {/* Avatar Row */}
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: 'primary.main', color: 'primary.contrastText',
                   display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PersonIcon fontSize="large" />
        </Box>
        <Box>
          <Typography variant="h3" lineHeight={1}>{formData.fullName || 'User'}</Typography>
          <Typography variant="body2" color="primary.main">Alumni {formData.studentId}</Typography>
        </Box>
      </Box>
      <Button variant="outlined" startIcon={<EditIcon />}>Chỉnh sửa ảnh</Button>
    </Box>

    {/* Thông tin cơ bản */}
    <Box>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 2 }}>Thông tin cơ bản</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        <TextField fullWidth label="Họ và tên" name="fullName" value={formData.fullName} onChange={handleFormChange} />
        <FormControl fullWidth>
          <InputLabel>Giới tính</InputLabel>
          <Select name="gender" value={formData.gender} label="Giới tính" onChange={handleFormChange}>
            <MenuItem value="male">Nam</MenuItem>
            <MenuItem value="female">Nữ</MenuItem>
            <MenuItem value="other">Khác</MenuItem>
          </Select>
        </FormControl>

        <TextField fullWidth label="Ngày sinh" name="birthDate" type="date"
          value={formData.birthDate} onChange={handleFormChange} InputLabelProps={{ shrink: true }} />
        <TextField fullWidth label="Số điện thoại" name="phone" value={formData.phone} onChange={handleFormChange} />

        <TextField fullWidth label="Mã số sinh viên" name="studentId" value={formData.studentId} onChange={handleFormChange} />
        <TextField fullWidth label="Email" name="email" type="email" value={formData.email} onChange={handleFormChange} />
      </Box>
    </Box>

    {/* Thông tin học vấn */}
    <Box>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 2 }}>Thông tin học vấn</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        <FormControl fullWidth>
          <InputLabel>Khoa/Bộ môn</InputLabel>
          <Select name="faculty" value={formData.faculty} label="Khoa/Bộ môn" onChange={handleFormChange}>
            <MenuItem value="cs">Khoa Công nghệ Thông tin</MenuItem>
            <MenuItem value="math">Khoa Toán</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel>Chương trình đào tạo</InputLabel>
          <Select name="program" value={formData.program} label="Chương trình đào tạo" onChange={handleFormChange}>
            <MenuItem value="standard">Chuẩn</MenuItem>
            <MenuItem value="advanced">Nâng cao</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Khoá</InputLabel>
          <Select name="batch" value={formData.batch} label="Khoá" onChange={handleFormChange}>
            <MenuItem value="2022">2022</MenuItem>
            <MenuItem value="2023">2023</MenuItem>
          </Select>
        </FormControl>
        <TextField fullWidth label="Năm tốt nghiệp" name="graduationYear" type="number"
          value={formData.graduationYear} onChange={handleFormChange} />

        <FormControl fullWidth>
          <InputLabel>Chuyên ngành</InputLabel>
          <Select name="specialization" value={formData.specialization} label="Chuyên ngành" onChange={handleFormChange}>
            <MenuItem value="ai">Trí tuệ nhân tạo</MenuItem>
            <MenuItem value="web">Phát triển web</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel>Trạng thái tốt nghiệp</InputLabel>
          <Select name="graduationStatus" value={formData.graduationStatus} label="Trạng thái tốt nghiệp" onChange={handleFormChange}>
            <MenuItem value="graduated">Đã tốt nghiệp</MenuItem>
            <MenuItem value="studying">Đang học</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Box>

    {/* Actions */}
    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
      <Button variant="outlined" color="inherit" sx={{ px: 4 }}>Huỷ</Button>
      <Button variant="contained" color="primary" onClick={handleSave} sx={{ px: 4 }}>Lưu thay đổi</Button>
    </Box>
  </Box>
);

  const renderAccountSettings = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Change Password Section */}
      <Box>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Đặt lại mật khẩu
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
          <TextField fullWidth label="Mật khẩu hiện tại" type="password" placeholder="Nhập mật khẩu hiện tại" />
          <TextField fullWidth label="Mật khẩu mới" type="password" placeholder="Nhập mật khẩu mới" />
          <TextField fullWidth label="Xác nhận mật khẩu" type="password" placeholder="Xác nhận mật khẩu" />
        </Box>
        <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="contained" color="primary">Cập nhật mật khẩu</Button>
          <Button variant="outlined" color="secondary">Huỷ</Button>
        </Box>
      </Box>

      <Divider />

      {/* Logged In Devices Section */}
      <Box>
        <Typography variant="h4" sx= {{ mb: 2 }}>
          Thiết bị đã đăng nhập
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {[
            { device: 'Chrome - Windows', last: 'Lần cuối: 2 giờ trước' },
            { device: 'Safari - macOS', last: 'Lần cuối: 30 phút trước' },
            { device: 'Firefox - Linux', last: 'Lần cuối: 3 ngày trước' },
          ].map(({ device, last }) => (
            <Box key={device} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                border: 1, borderColor: 'divider', borderRadius: 1, px: 2, py: 1.5 }}>
              <Box>
                <Typography variant="h5">{device}</Typography>
                <Typography variant="caption" color="text.secondary">{last}</Typography>
              </Box>
              <Button variant="outlined" color="error" size="small">Đăng xuất</Button>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );

  const renderNotificationSettings = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Forum Notifications */}
      <Box>
        <Typography variant="h4" sx={{ mb: 2 }}>
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
        <Typography variant="h4" sx={{ mb: 2 }}>
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
        <Typography variant="h4" sx={{ mb: 2 }}>
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

      <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
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
    <Box sx={{ display: 'flex', flexDirection: 'column'}}>
      <Typography variant="h4" sx={{ mb: 2 }}>
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

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
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
      <Typography variant="h4">
        Thông tin cố vấn học tập
      </Typography>

      <Typography variant="body1" color="textSecondary">
        Chưa có cố vấn được gán. Vui lòng liên hệ với bộ phận quản lý sinh viên để được gán cố vấn.
      </Typography>

      <Paper sx={{ p: 3, bgcolor: 'primary.light' }}>
        <Typography variant="h5" sx={{ color: 'primary.main' }}>
          Thông tin liên hệ
        </Typography>
        <Typography variant="body1" color="secondary.dark" display="block" sx={{ mt: 2 }}>
          Email: admin@hcmus.edu.vn
        </Typography>
        <Typography variant="body1" color="secondary.dark" display="block">
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
      <Container maxWidth="xl"
                 sx={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'stretch',
                       pt: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3, lg: 6 }, pb: { xs: 2, sm: 3, lg: 6 }, }}>
        <Box sx={{ display: 'flex', width: '100%', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 3 } }}>
          <Stack spacing={2} sx={{ width: { xs: '100%', md: 260 } }}>
            <Sidebar
              items={MENU_ITEMS}
              value={activeTab}
              onChange={setActiveTab}
              useRouting={false}
            />
          </Stack>

          {/* Right Content Area */}
          <Stack spacing={2} sx={{ flex: 1, minWidth: 0, px: { xs: 1.5, sm: 2, md: 2.75 }}}>
            <Stack gap={2}>
              <Typography variant="h1" fontWeight={800} color="primary.main">
                CÀI ĐẶT NGƯỜI DÙNG
              </Typography>
            </Stack>
            <Card sx={{ p: 4, width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
                        border: 1, borderColor: 'divider', borderRadius: 1, backgroundColor: 'white' }}>
              {/* Tab Content */}
              {renderContent()}
            </Card>
          </Stack>
        </Box>
      </Container>
    </Page>
  );
}
