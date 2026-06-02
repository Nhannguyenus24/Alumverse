import React, { useEffect, useMemo, useState } from 'react';
import {
  Autocomplete,
  Box,
  Card,
  Container,
  Chip,
  TextField,
  Typography,
  Button,
  MenuItem,
  FormControlLabel,
  Switch,
  Divider,
  Paper,
  FormControl,
  InputLabel,
  Select,
  Stack,
  InputAdornment,
  IconButton,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SecurityIcon from '@mui/icons-material/Security';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Page from '../../components/Page';
import Sidebar from '../../components/Sidebar';
import { userSettingsApi } from '../../utils/api';
import useAuthStore from '../../stores/authStore';
import { useNotification } from '../../hooks/useNotification';
import { useOrganization } from '../../hooks/useOrganization';
import { formatDateTime } from '../../utils/dateFormatter';

const parseOrganizationOptions = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => String(item ?? '').trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item ?? '').trim())
          .filter(Boolean);
      }
    } catch {
      return trimmed
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
};

const normalizeAcademicList = (value) => {
  if (value == null) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => String(item ?? '').trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item ?? '').trim())
          .filter(Boolean);
      }
    } catch {
      return [trimmed];
    }
  }

  return [String(value).trim()].filter(Boolean);
};

const normalizeIntegerList = (value) =>
  normalizeAcademicList(value)
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item));

export default function SettingPage() {
  useAuthStore();
  const { showSuccess, showError, showWarning } = useNotification();
  const { organization } = useOrganization();
  const organizationId = useMemo(() => Number(organization?.id) || null, [organization?.id]);

  const organizationProgramOptions = useMemo(
    () => parseOrganizationOptions(organization?.programs),
    [organization?.programs],
  );
  const organizationMajorOptions = useMemo(
    () => parseOrganizationOptions(organization?.majors),
    [organization?.majors],
  );

  const [activeTab, setActiveTab] = useState('personal');
  const [isTrustedVerifier, setIsTrustedVerifier] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const menuItems = useMemo(() => {
    const items = [
      { id: 'personal', label: 'Cá nhân', icon: <PersonIcon /> },
      { id: 'account', label: 'Tài khoản', icon: <SecurityIcon /> },
      { id: 'notification', label: 'Thông báo', icon: <NotificationsIcon /> },
      { id: 'advisor', label: 'Thông tin cố vấn', icon: <VerifiedUserIcon /> },
    ];

    if (isTrustedVerifier) {
      items.push({ id: 'verification', label: 'Xác thực đồng nghiệp', icon: <GroupAddIcon /> });
    }

    return items;
  }, [isTrustedVerifier]);

  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    birthDate: '',
    phone: '',
    studentId: '',
    email: '',
    faculty: '',
    programs: [],
    batch: '',
    graduationYears: [],
    specializations: [],
    graduationStatuses: [],
  });

  const [notificationSettings, setNotificationSettings] = useState({
    forumReplyEnabled: true,
    eventReminderEnabled: true,
    newsEnabled: true,
    emailEnabled: true,
    pushEnabled: true,
  });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loginHistory, setLoginHistory] = useState([]);

  const getErrorMessage = (error, fallbackMessage) => {
    return (
      error?.response?.data?.message
      || error?.response?.data?.error
      || fallbackMessage
    );
  };

  const loadPendingRequests = async () => {
    if (!organizationId || !isTrustedVerifier) return;
    setLoadingRequests(true);
    try {
      const requests = await userSettingsApi.getPendingPeerVerifications(organizationId);
      setPendingRequests(requests);
    } catch (error) {
      console.error('Failed to load pending requests', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [profile, member, settings, history] = await Promise.all([
          userSettingsApi.getProfile(),
          organizationId ? userSettingsApi.getOrganizationMember(organizationId) : Promise.resolve(null),
          userSettingsApi.getNotificationSettings(),
          userSettingsApi.getLoginHistory({ page: 0, limit: 10 }),
        ]);

        setIsTrustedVerifier(member?.isTrustedVerifier ?? false);

        setFormData((prev) => ({
          ...prev,
          fullName: profile?.fullName ?? '',
          gender: (profile?.gender ?? '').toLowerCase(),
          birthDate: profile?.dob ?? '',
          phone: profile?.phone ?? '',
          studentId: profile?.userName ?? '',
          email: profile?.email ?? '',
          programs: normalizeAcademicList(member?.program),
          graduationYears: normalizeIntegerList(member?.graduatedYear).map(String),
          specializations: normalizeAcademicList(member?.major),
          graduationStatuses: normalizeAcademicList(member?.graduationStatus),
        }));

        setNotificationSettings((prev) => ({
          ...prev,
          forumReplyEnabled: settings?.forumReplyEnabled ?? true,
          eventReminderEnabled: settings?.eventReminderEnabled ?? true,
          newsEnabled: settings?.newsEnabled ?? true,
          emailEnabled: settings?.emailEnabled ?? true,
          pushEnabled: settings?.pushEnabled ?? true,
        }));

        setLoginHistory(Array.isArray(history) ? history : []);
      } catch (error) {
        console.error('Failed to load setting data', error);
        showError(getErrorMessage(error, 'Không tải được dữ liệu cài đặt.'));
      }
    };

    loadSettings();
  }, [organizationId, showError]);

  useEffect(() => {
    if (activeTab === 'verification') {
      loadPendingRequests();
    }
  }, [activeTab, organizationId, isTrustedVerifier]);

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

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async () => {
    if (!organizationId) {
      showWarning('Không xác định được tổ chức hiện tại. Vui lòng thử tải lại trang.');
      return;
    }

    try {
      await userSettingsApi.updateProfile({
        organizationId,
        phone: formData.phone || null,
        gender: formData.gender || null,
        program: formData.programs.length > 0 ? formData.programs : null,
        graduatedYear:
          normalizeIntegerList(formData.graduationYears).length > 0
            ? normalizeIntegerList(formData.graduationYears)
            : null,
        graduationStatus: formData.graduationStatuses.length > 0 ? formData.graduationStatuses : null,
        major: formData.specializations.length > 0 ? formData.specializations : null,
      });
      showSuccess('Cập nhật thông tin cá nhân thành công.');
    } catch (error) {
      console.error('Failed to update profile', error);
      showError(getErrorMessage(error, 'Cập nhật thông tin cá nhân thất bại.'));
    }
  };

  const handleSaveNotificationSettings = async () => {
    try {
      await userSettingsApi.updateNotificationSettings(notificationSettings);
      showSuccess('Cập nhật cài đặt thông báo thành công.');
    } catch (error) {
      console.error('Failed to update notification settings', error);
      showError(getErrorMessage(error, 'Cập nhật cài đặt thông báo thất bại.'));
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      showWarning('Vui lòng nhập đầy đủ các trường mật khẩu.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showWarning('Mật khẩu mới và xác nhận mật khẩu không khớp.');
      return;
    }

    try {
      await userSettingsApi.changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      showSuccess('Đổi mật khẩu thành công.');
    } catch (error) {
      console.error('Failed to change password', error);
      showError(getErrorMessage(error, 'Đổi mật khẩu thất bại.'));
    }
  };

  const handleAcceptVerification = async (requestId) => {
    try {
      await userSettingsApi.acceptPeerVerification(requestId);
      showSuccess('Xác thực đồng nghiệp thành công.');
      setPendingRequests((prev) => prev.filter((r) => r.requestId !== requestId));
    } catch (error) {
      console.error('Failed to accept verification', error);
      showError(getErrorMessage(error, 'Xác thực đồng nghiệp thất bại.'));
    }
  };

  const parseUserAgent = (userAgent = '') => {
    const ua = String(userAgent ?? '').toLowerCase();

    let browser = 'Unknown Browser';
    if (ua.includes('edg/')) browser = 'Edge';
    else if (ua.includes('chrome/') && !ua.includes('edg/')) browser = 'Chrome';
    else if (ua.includes('safari/') && !ua.includes('chrome/')) browser = 'Safari';
    else if (ua.includes('firefox/')) browser = 'Firefox';

    let os = 'Unknown OS';
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('mac os') || ua.includes('macintosh')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) os = 'iOS';

    return `${browser} - ${os}`;
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
        <TextField fullWidth label="Họ và tên" name="fullName" value={formData.fullName} InputProps={{ readOnly: true }} />
        <FormControl fullWidth>
          <InputLabel>Giới tính</InputLabel>
          <Select name="gender" value={formData.gender} label="Giới tính" onChange={handleFormChange}>
            <MenuItem value="male">Nam</MenuItem>
            <MenuItem value="female">Nữ</MenuItem>
            <MenuItem value="other">Khác</MenuItem>
          </Select>
        </FormControl>

        <TextField fullWidth label="Ngày sinh" name="birthDate" type="date"
          value={formData.birthDate} InputProps={{ readOnly: true }} InputLabelProps={{ shrink: true }} />
        <TextField fullWidth label="Số điện thoại" name="phone" value={formData.phone} onChange={handleFormChange} />

        <TextField fullWidth label="Mã số sinh viên" name="studentId" value={formData.studentId} InputProps={{ readOnly: true }} />
        <TextField fullWidth label="Email" name="email" type="email" value={formData.email} InputProps={{ readOnly: true }} />
      </Box>
    </Box>

    {/* Thông tin học vấn */}
    <Box>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 2 }}>Thông tin học vấn</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        <TextField fullWidth label="Khoa/Bộ môn" name="faculty" value={formData.faculty} InputProps={{ readOnly: true }} />
        <Autocomplete
          multiple
          freeSolo
          options={organizationProgramOptions}
          value={formData.programs}
          onChange={(_e, value) =>
            setFormData((prev) => ({
              ...prev,
              programs: value.map((item) => String(item ?? '').trim()).filter(Boolean),
            }))
          }
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip label={option} {...getTagProps({ index })} key={option} />
            ))
          }
          renderInput={(params) => (
            <TextField {...params} label="Chương trình đào tạo" placeholder="Thêm chương trình" />
          )}
        />

        <TextField fullWidth label="Khoá" name="batch" value={formData.batch} InputProps={{ readOnly: true }} />
        <Autocomplete
          multiple
          freeSolo
          options={[]}
          value={formData.graduationYears}
          onChange={(_e, value) =>
            setFormData((prev) => ({
              ...prev,
              graduationYears: value.map((item) => String(item ?? '').trim()).filter(Boolean),
            }))
          }
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip label={option} {...getTagProps({ index })} key={option} />
            ))
          }
          renderInput={(params) => (
            <TextField {...params} label="Năm tốt nghiệp" placeholder="Nhập từng năm" />
          )}
        />

        <Autocomplete
          multiple
          freeSolo
          options={organizationMajorOptions}
          value={formData.specializations}
          onChange={(_e, value) =>
            setFormData((prev) => ({
              ...prev,
              specializations: value.map((item) => String(item ?? '').trim()).filter(Boolean),
            }))
          }
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip label={option} {...getTagProps({ index })} key={option} />
            ))
          }
          renderInput={(params) => (
            <TextField {...params} label="Chuyên ngành" placeholder="Thêm chuyên ngành" />
          )}
        />

        <Autocomplete
          multiple
          freeSolo
          options={['graduated', 'studying']}
          value={formData.graduationStatuses}
          onChange={(_e, value) =>
            setFormData((prev) => ({
              ...prev,
              graduationStatuses: value.map((item) => String(item ?? '').trim()).filter(Boolean),
            }))
          }
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip label={option} {...getTagProps({ index })} key={option} />
            ))
          }
          renderInput={(params) => (
            <TextField {...params} label="Trạng thái tốt nghiệp" placeholder="Nhập hoặc chọn trạng thái" />
          )}
        />
      </Box>
    </Box>

    {/* Actions */}
    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
      <Button variant="outlined" color="inherit" sx={{ px: 4 }}>Huỷ</Button>
      <Button variant="contained" color="primary" onClick={handleSaveProfile} sx={{ px: 4 }}>Lưu thay đổi</Button>
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
          <TextField
            fullWidth
            name="oldPassword"
            value={passwordForm.oldPassword}
            onChange={handlePasswordChange}
            label="Mật khẩu hiện tại"
            type={showOldPassword ? 'text' : 'password'}
            placeholder="Nhập mật khẩu hiện tại"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showOldPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      onClick={() => setShowOldPassword((v) => !v)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                    >
                      {showOldPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            fullWidth
            name="newPassword"
            value={passwordForm.newPassword}
            onChange={handlePasswordChange}
            label="Mật khẩu mới"
            type={showNewPassword ? 'text' : 'password'}
            placeholder="Nhập mật khẩu mới"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      onClick={() => setShowNewPassword((v) => !v)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                    >
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            fullWidth
            name="confirmPassword"
            value={passwordForm.confirmPassword}
            onChange={handlePasswordChange}
            label="Xác nhận mật khẩu"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Xác nhận mật khẩu"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>
        <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="contained" color="primary" onClick={handleChangePassword}>Cập nhật mật khẩu</Button>
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
          {loginHistory.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Chưa có dữ liệu đăng nhập gần đây.
            </Typography>
          )}

          {loginHistory.map((entry, index) => (
            <Box key={entry?.id ?? `${entry?.loginAt ?? 'history'}-${index}`} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                border: 1, borderColor: 'divider', borderRadius: 1, px: 2, py: 1.5 }}>
              <Box>
                <Typography variant="h5">{parseUserAgent(entry?.userAgent)}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Lần cuối: {formatDateTime(entry?.loginAt, 'Không rõ thời gian')} | IP: {entry?.loginIp || 'N/A'} | Phương thức: {entry?.loginMethod || 'N/A'}
                </Typography>
              </Box>
              <Button variant="outlined" color="inherit" size="small" disabled>
                Theo dõi
              </Button>
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
          Thông báo theo backend
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <FormControlLabel
            control={
              <Switch
                name="forumReplyEnabled"
                checked={notificationSettings.forumReplyEnabled}
                onChange={handleNotificationChange}
              />
            }
            label="Có trả lời cho bài viết của bạn"
          />
          <FormControlLabel
            control={
              <Switch
                name="eventReminderEnabled"
                checked={notificationSettings.eventReminderEnabled}
                onChange={handleNotificationChange}
              />
            }
            label="Nhắc nhở sự kiện sắp tới"
          />
          <FormControlLabel
            control={
              <Switch
                name="newsEnabled"
                checked={notificationSettings.newsEnabled}
                onChange={handleNotificationChange}
              />
            }
            label="Tin tức mới"
          />
          <FormControlLabel
            control={
              <Switch
                name="emailEnabled"
                checked={notificationSettings.emailEnabled}
                onChange={handleNotificationChange}
              />
            }
            label="Cho phep thong bao qua email"
          />
          <FormControlLabel
            control={
              <Switch
                name="pushEnabled"
                checked={notificationSettings.pushEnabled}
                onChange={handleNotificationChange}
              />
            }
            label="Cho phep thong bao day"
          />
        </Box>
      </Box>

      <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button variant="contained" color="primary" onClick={handleSaveNotificationSettings}>
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

  const renderVerificationManagement = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h4">Quản lý xác thực đồng nghiệp</Typography>
      <Typography variant="body1" color="textSecondary">
        Đây là danh sách các yêu cầu xác thực đồng nghiệp đang chờ bạn xử lý.
      </Typography>

      {loadingRequests ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : pendingRequests.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', border: '1px dashed', borderColor: 'divider' }}>
          <Typography color="textSecondary">Không có yêu cầu xác thực nào đang chờ.</Typography>
        </Paper>
      ) : (
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {pendingRequests.map((request) => (
            <Paper
              key={request.requestId}
              variant="outlined"
              sx={{ mb: 2, p: 2, '&:hover': { bgcolor: 'action.hover' } }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                <Stack spacing={0.5}>
                  <Typography variant="h5" fontWeight="bold">
                    {request.requesterName}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    ID người dùng: {request.requesterUserId}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Ngày gửi: {formatDateTime(request.createdAt)}
                  </Typography>
                </Stack>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => handleAcceptVerification(request.requestId)}
                >
                  Xác nhận
                </Button>
              </Stack>
            </Paper>
          ))}
        </List>
      )}
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
      case 'advisor':
        return renderAdvisorSettings();
      case 'verification':
        return renderVerificationManagement();
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
              items={menuItems}
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
