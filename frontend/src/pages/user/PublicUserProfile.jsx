import LoadingSkeleton from '../../components/LoadingSkeleton';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import WorkIcon from '@mui/icons-material/Work';
import BusinessIcon from '@mui/icons-material/Business';
import { useTranslation } from 'react-i18next';

import ProfileLayout from '../../layouts/ProfileLayout';
import NetworkMessageDrawer from '../../components/network/NetworkMessageDrawer';
import UserHighlights from '../../components/profile/UserHighlights';
import AcademicInfoSection from '../../components/profile/AcademicInfoSection';
import PersonalInfoRow from '../../components/profile/PersonalInfoRow';
import ProfileSectionTitle from '../../components/profile/ProfileSectionTitle';
import SocialLinksRenderer from '../../components/profile/SocialLinksRenderer';
import { CONVERSATION_REQUEST_STATUS } from '../../constants/conversationRequestStatus';
import { useCheckConversationRequestStatus } from '../../hooks/network/useCheckConversationRequestStatus';
import { useNetworkCurrentMemberId } from '../../hooks/network/useNetworkCurrentMemberId';
import { useNotification } from '../../hooks/useNotification';
import { usePublicProfile } from '../../hooks/profile/usePublicProfile';
import { resolveProfileRoleLabel } from '../../utils/profileRoleUtils';
import { resolveMediaUrl } from '../../utils/imageUtils';
import { ScrollReveal } from '../../components/animations/ScrollReveal';

const DEFAULT_COVER =
  'https://ethnasia.com/cdn/shop/articles/sean-o-KMn4VEeEPR8-unsplash_edited.jpg?v=1621585619';

const PublicUserProfile = ({ userId, navigate }) => {
  const { t } = useTranslation('profile');
  const profileQuery = usePublicProfile(userId);
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
      showInfo(t('pub_own_profile_msg'));
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
      showError(t('pub_check_connection_error'));
    }
  }, [checkStatus, currentMemberId, navigate, profile?.userId, showError, showInfo, t, userId]);

  const handleCloseMessage = useCallback(() => {
    setIsMessageDrawerOpen(false);
    setConnectionStatus(null);
  }, []);

  if (profileQuery.isLoading || isOwnProfile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <LoadingSkeleton />
      </Box>
    );
  }

  if (profileQuery.isError || !profile) {
    return (
      <Alert severity="error" sx={{ m: 4 }}>
        {t('pub_load_profile_error')}
      </Alert>
    );
  }

  const user = {
    name: profile.fullName ?? `User #${profile.userId}`,
    role: resolveProfileRoleLabel({
      profile,
      academicProfile: profile.organizationMember ?? profile,
      t,
    }),
    avatar: resolveMediaUrl(profile.avatarUrl ?? ''),
    cover: resolveMediaUrl(profile.coverUrl) || DEFAULT_COVER,
  };

  const hasBio = !!profile.bio?.trim();
  const personalFields = [
    { icon: PersonIcon, label: t('full_name'), value: profile.fullName },
    { icon: EmailIcon, label: t('email'), value: profile.email },
    { icon: WorkIcon, label: t('current_job'), value: profile.currentJobTitle },
    { icon: BusinessIcon, label: t('company'), value: profile.currentCompany },
  ];
  const academicProfile = profile.organizationMember ?? profile;
  const messagePeer = {
    userId: profile.userId ?? userId,
    fullName: profile.fullName,
    avatarUrl: resolveMediaUrl(profile.avatarUrl),
    program: academicProfile.program,
    major: academicProfile.major,
  };

  return (
    <>
      <ProfileLayout
        user={user}
        cover={user.cover}
        tabs={[]}
        onNavigate={navigate}
        mode="userView"
        onUserMessage={handleMessage}
        userMessageLabel={t('send_message')}
      >
        <Stack spacing={6}>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12 }} sx={{ pb: 2 }}><ScrollReveal>
              <ProfileSectionTitle icon={PersonIcon}>{t('intro_section')}</ProfileSectionTitle>
              <Typography
                color={hasBio ? 'text.secondary' : 'text.disabled'}
                sx={{
                  whiteSpace: 'pre-line',
                  fontSize: '1.05rem',
                  lineHeight: 1.7,
                  fontStyle: hasBio ? 'normal' : 'italic',
                }}
              >
                {profile.bio?.trim() || t('pub_no_bio')}
              </Typography>
            </ScrollReveal></Grid>

            <Grid size={{ xs: 12, lg: 4 }}><ScrollReveal direction="right">
              <Box sx={{ height: '100%' }}>
                <ProfileSectionTitle icon={BusinessIcon}>{t('basic_info')}</ProfileSectionTitle>
                <Box>
                  {personalFields.map((field) => (
                    <PersonalInfoRow
                      key={field.label}
                      icon={field.icon}
                      label={field.label}
                      value={field.value}
                    />
                  ))}
                  <SocialLinksRenderer linksRaw={profile.links} />
                </Box>
              </Box>
            </ScrollReveal></Grid>

            <Grid size={{ xs: 12, lg: 8 }}><ScrollReveal direction="left">
              <AcademicInfoSection academicProfile={academicProfile} />
            </ScrollReveal></Grid>
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
  );
};

export default PublicUserProfile;
