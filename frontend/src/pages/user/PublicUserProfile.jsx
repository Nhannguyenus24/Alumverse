import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import SchoolIcon from '@mui/icons-material/School';
import SchoolIcon from '@mui/icons-material/School';
import WorkIcon from '@mui/icons-material/Work';
import BusinessIcon from '@mui/icons-material/Business';
import VerifiedIcon from '@mui/icons-material/Verified';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import VerifiedIcon from '@mui/icons-material/Verified';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';

import ProfileLayout from '../../layouts/ProfileLayout';
import NetworkMessageDrawer from '../../components/network/NetworkMessageDrawer';
import NetworkMessageDrawer from '../../components/network/NetworkMessageDrawer';
import UserHighlights from '../../components/profile/UserHighlights';
import AcademicInfoRowCard from '../../components/profile/AcademicInfoRowCard';
import PersonalInfoRow from '../../components/profile/PersonalInfoRow';
import { CONVERSATION_REQUEST_STATUS } from '../../constants/conversationRequestStatus';
import { useCheckConversationRequestStatus } from '../../hooks/network/useCheckConversationRequestStatus';
import { useNetworkCurrentMemberId } from '../../hooks/network/useNetworkCurrentMemberId';
import { useNotification } from '../../hooks/useNotification';
import AcademicInfoRowCard from '../../components/profile/AcademicInfoRowCard';
import PersonalInfoRow from '../../components/profile/PersonalInfoRow';
import { CONVERSATION_REQUEST_STATUS } from '../../constants/conversationRequestStatus';
import { useCheckConversationRequestStatus } from '../../hooks/network/useCheckConversationRequestStatus';
import { useNetworkCurrentMemberId } from '../../hooks/network/useNetworkCurrentMemberId';
import { useNotification } from '../../hooks/useNotification';
import { usePublicProfile } from '../../hooks/profile/usePublicProfile';

const DEFAULT_COVER =
  'https://ethnasia.com/cdn/shop/articles/sean-o-KMn4VEeEPR8-unsplash_edited.jpg?v=1621585619';

const formatAcademicValue = (raw) => {
  if (raw == null) return null;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) return parsed.join(', ');
  } catch {
    // fallthrough
  }
  if (Array.isArray(raw)) return raw.join(', ');
  return String(raw);
};

const SectionTitle = ({ icon: Icon, children }) => (
  <Typography variant="h5" fontWeight={800} color="primary.main" mb={2} display="flex" alignItems="center" gap={1}>
    <Icon /> {children}
  </Typography>
);

const PublicUserProfile = ({ userId, navigate }) => {
  const profileQuery = usePublicProfile(userId);
  const { checkStatus } = useCheckConversationRequestStatus();
  const currentMemberId = useNetworkCurrentMemberId();
  const { showError, showInfo } = useNotification();
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [isMessageDrawerOpen, setIsMessageDrawerOpen] = useState(false);
  const { checkStatus } = useCheckConversationRequestStatus();
  const currentMemberId = useNetworkCurrentMemberId();
  const { showError, showInfo } = useNotification();
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [isMessageDrawerOpen, setIsMessageDrawerOpen] = useState(false);
  const profile = profileQuery.data;
  const isOwnProfile = String(userId) === String(currentMemberId);

  useEffect(() => {
    if (isOwnProfile) {
      navigate('/profile', { replace: true });
    }
  }, [isOwnProfile, navigate]);

  const handleMessage = useCallback(async () => {
    const targetMemberId = profile?.userId ?? userId;
    if (!targetMemberId) return;
    if (String(targetMemberId) === String(currentMemberId)) {
      showInfo('Đây là hồ sơ của bạn, nên không thể tự nhắn tin.');
      return;
    }

    try {
      const result = await checkStatus(targetMemberId);
      if (result?.status === CONVERSATION_REQUEST_STATUS.ACCEPTED) {
        navigate(`/chat?memberId=${targetMemberId}`);
        return;
      }
      setConnectionStatus(result);
      setIsMessageDrawerOpen(true);
    } catch {
      showError('Không thể kiểm tra trạng thái kết nối. Vui lòng thử lại.');
    }
  }, [checkStatus, currentMemberId, navigate, profile?.userId, showError, showInfo, userId]);

  const handleCloseMessage = useCallback(() => {
    setIsMessageDrawerOpen(false);
    setConnectionStatus(null);
  }, []);
  const isOwnProfile = String(userId) === String(currentMemberId);

  useEffect(() => {
    if (isOwnProfile) {
      navigate('/profile', { replace: true });
    }
  }, [isOwnProfile, navigate]);

  const handleMessage = useCallback(async () => {
    const targetMemberId = profile?.userId ?? userId;
    if (!targetMemberId) return;
    if (String(targetMemberId) === String(currentMemberId)) {
      showInfo('Đây là hồ sơ của bạn, nên không thể tự nhắn tin.');
      return;
    }

    try {
      const result = await checkStatus(targetMemberId);
      if (result?.status === CONVERSATION_REQUEST_STATUS.ACCEPTED) {
        navigate(`/chat?memberId=${targetMemberId}`);
        return;
      }
      setConnectionStatus(result);
      setIsMessageDrawerOpen(true);
    } catch {
      showError('Không thể kiểm tra trạng thái kết nối. Vui lòng thử lại.');
    }
  }, [checkStatus, currentMemberId, navigate, profile?.userId, showError, showInfo, userId]);

  const handleCloseMessage = useCallback(() => {
    setIsMessageDrawerOpen(false);
    setConnectionStatus(null);
  }, []);

  if (profileQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isOwnProfile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isOwnProfile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (profileQuery.isError || !profile) {
    return (
      <Alert severity="error" sx={{ m: 4 }}>Không tải được hồ sơ người dùng. Vui lòng thử lại.</Alert>
    );
  }

  const user = {
    name: profile.fullName ?? `User #${profile.userId}`,
    role: [profile.currentJobTitle, profile.currentCompany].filter(Boolean).join(' @ ') || 'Thành viên',
    avatar: profile.avatarUrl ?? '',
    cover: profile.coverUrl || DEFAULT_COVER,
  };

  const hasBio = !!profile.bio?.trim();
  const personalFields = [
    { icon: PersonIcon, label: 'Họ và tên', value: profile.fullName },
    { icon: EmailIcon, label: 'Email', value: profile.email },
    { icon: WorkIcon, label: 'Công việc hiện tại', value: profile.currentJobTitle },
    { icon: BusinessIcon, label: 'Công ty', value: profile.currentCompany },
  ];
  const academicFields = [
    { label: 'Khoa', value: formatAcademicValue(profile.faculty), icon: AccountBalanceIcon },
    { label: 'Chuyên ngành', value: formatAcademicValue(profile.major), icon: AccountTreeIcon },
    { label: 'Chương trình', value: formatAcademicValue(profile.program), icon: MenuBookIcon },
    { label: 'Khoá', value: formatAcademicValue(profile.startedYear), icon: CalendarMonthIcon },
    { label: 'Năm tốt nghiệp', value: formatAcademicValue(profile.graduatedYear), icon: EventAvailableIcon },
    { label: 'Trạng thái tốt nghiệp', value: formatAcademicValue(profile.graduationStatus), icon: VerifiedIcon },
  ];
  const messagePeer = {
    userId: profile.userId ?? userId,
    fullName: profile.fullName,
    avatarUrl: profile.avatarUrl,
    program: profile.program,
    major: profile.major,
  };

  const hasBio = !!profile.bio?.trim();
  const personalFields = [
    { icon: PersonIcon, label: 'Họ và tên', value: profile.fullName },
    { icon: EmailIcon, label: 'Email', value: profile.email },
    { icon: WorkIcon, label: 'Công việc hiện tại', value: profile.currentJobTitle },
    { icon: BusinessIcon, label: 'Công ty', value: profile.currentCompany },
  ];
  const academicFields = [
    { label: 'Khoa', value: formatAcademicValue(profile.faculty), icon: AccountBalanceIcon },
    { label: 'Chuyên ngành', value: formatAcademicValue(profile.major), icon: AccountTreeIcon },
    { label: 'Chương trình', value: formatAcademicValue(profile.program), icon: MenuBookIcon },
    { label: 'Khoá', value: formatAcademicValue(profile.startedYear), icon: CalendarMonthIcon },
    { label: 'Năm tốt nghiệp', value: formatAcademicValue(profile.graduatedYear), icon: EventAvailableIcon },
    { label: 'Trạng thái tốt nghiệp', value: formatAcademicValue(profile.graduationStatus), icon: VerifiedIcon },
  ];
  const messagePeer = {
    userId: profile.userId ?? userId,
    fullName: profile.fullName,
    avatarUrl: profile.avatarUrl,
    program: profile.program,
    major: profile.major,
  };

  return (
    <>
      <ProfileLayout
        user={user}
        cover={user.cover}
        tabs={[]}
        onNavigate={navigate}
        mode="userView"
        onUserMessage={isOwnProfile ? null : handleMessage}
        userMessageLabel={isOwnProfile ? 'Đây là bạn' : 'Nhắn tin'}
      >
        <Stack spacing={6}>
    <>
      <ProfileLayout
        user={user}
        cover={user.cover}
        tabs={[]}
        onNavigate={navigate}
        mode="userView"
        onUserMessage={isOwnProfile ? null : handleMessage}
        userMessageLabel={isOwnProfile ? 'Đây là bạn' : 'Nhắn tin'}
      >
        <Stack spacing={6}>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12 }} sx={{ pb: 2 }}>
              <SectionTitle icon={PersonIcon}>Giới thiệu</SectionTitle>
              <Typography
                color={hasBio ? 'text.secondary' : 'text.disabled'}
                sx={{
                  whiteSpace: 'pre-line',
                  fontSize: '1.05rem',
                  lineHeight: 1.7,
                  fontStyle: hasBio ? 'normal' : 'italic',
                }}
              >
                {profile.bio?.trim() || 'Người dùng này chưa cập nhật phần giới thiệu.'}
              </Typography>
            <Grid size={{ xs: 12 }} sx={{ pb: 2 }}>
              <SectionTitle icon={PersonIcon}>Giới thiệu</SectionTitle>
              <Typography
                color={hasBio ? 'text.secondary' : 'text.disabled'}
                sx={{
                  whiteSpace: 'pre-line',
                  fontSize: '1.05rem',
                  lineHeight: 1.7,
                  fontStyle: hasBio ? 'normal' : 'italic',
                }}
              >
                {profile.bio?.trim() || 'Người dùng này chưa cập nhật phần giới thiệu.'}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, lg: 4 }}>
              <Box sx={{ height: '100%' }}>
                <SectionTitle icon={BusinessIcon}>Thông tin cơ bản</SectionTitle>
                <Box>
                  {personalFields.map((field, index) => (
                    <PersonalInfoRow key={index} icon={field.icon} label={field.label} value={field.value} />
                  ))}
                </Box>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, lg: 8 }}>
              <SectionTitle icon={SchoolIcon}>Thông tin học thuật</SectionTitle>
              <Grid container spacing={3} sx={{ py: 1.75 }}>
                {academicFields.map((field, index) => (
                  <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
                    <AcademicInfoRowCard icon={field.icon} label={field.label} value={field.value} />
            <Grid size={{ xs: 12, lg: 4 }}>
              <Box sx={{ height: '100%' }}>
                <SectionTitle icon={BusinessIcon}>Thông tin cơ bản</SectionTitle>
                <Box>
                  {personalFields.map((field, index) => (
                    <PersonalInfoRow key={index} icon={field.icon} label={field.label} value={field.value} />
                  ))}
                </Box>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, lg: 8 }}>
              <SectionTitle icon={SchoolIcon}>Thông tin học thuật</SectionTitle>
              <Grid container spacing={3} sx={{ py: 1.75 }}>
                {academicFields.map((field, index) => (
                  <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
                    <AcademicInfoRowCard icon={field.icon} label={field.label} value={field.value} />
                  </Grid>
                ))}
                ))}
              </Grid>
            </Grid>
          </Grid>

          <UserHighlights userId={userId} navigate={navigate} />
        </Stack>
      </ProfileLayout>

      <NetworkMessageDrawer
        open={isMessageDrawerOpen}
        onClose={handleCloseMessage}
        peer={messagePeer}
        connectionStatus={connectionStatus}
      />
    </>
          <UserHighlights userId={userId} navigate={navigate} />
        </Stack>
      </ProfileLayout>

      <NetworkMessageDrawer
        open={isMessageDrawerOpen}
        onClose={handleCloseMessage}
        peer={messagePeer}
        connectionStatus={connectionStatus}
      />
    </>
  );
};

export default PublicUserProfile;
