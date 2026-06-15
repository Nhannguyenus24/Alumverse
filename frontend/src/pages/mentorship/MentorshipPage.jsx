import {
  Box,
  Button,
  Card,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';

import Page from '../../components/Page';
import Sidebar from '../../components/Sidebar';
import ForumSponsoredCard from '../../components/forum/ForumSponsoredCard';
import MentorshipHubActions from '../../components/mentorship/MentorshipHubActions';
import MentorshipMentorListSection from '../../components/mentorship/MentorshipMentorListSection';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useMentorshipAccessState } from '../../hooks/mentorship/useMentorshipAccessState';
import { MENTORSHIP_SIDEBAR, MENTORSHIP_STATS } from '../../constants/mentorshipNav';
import StatsBanner from '../../components/StatsBanner'

const BENEFITS = [
  {
    icon: <GroupsOutlinedIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
    title: 'Kết nối cộng đồng',
    description:
      'Gặp gỡ cựu sinh viên và chuyên gia cùng khoa, sẵn sàng chia sẻ kinh nghiệm thực tế.',
  },
  {
    icon: <EventAvailableOutlinedIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
    title: 'Đặt lịch linh hoạt',
    description:
      'Chọn khung giờ phù hợp và nhận xác nhận ngay — không cần chờ duyệt từng buổi hẹn.',
  },
  {
    icon: <VerifiedUserOutlinedIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
    title: 'Tin cậy & an toàn',
    description:
      'Chỉ thành viên đã xác minh học vấn tại khoa mới tham gia; cố vấn được khoa phê duyệt trước khi hỗ trợ.',
  },
];

const STEPS = [
  {
    step: '1',
    title: 'Xác minh tài khoản',
    text: 'Xác thực email và thông tin học vấn tại khoa bạn đang tham gia.',
  },
  {
    step: '2',
    title: 'Tìm cố vấn phù hợp',
    text: 'Duyệt danh sách cố vấn theo lĩnh vực, kinh nghiệm và thời gian rảnh.',
  },
  {
    step: '3',
    title: 'Đặt lịch & trao đổi',
    text: 'Chọn slot, gửi mục tiêu buổi hẹn và bắt đầu buổi mentoring.',
  },
];

/** Full marketing landing — guest & level 0 only */
const GuestLandingContent = () => {
  const access = useMentorshipAccessState();
  const navigate = useOrgNavigate();

  return (
    <Stack spacing={4}>
      <Box
        sx={{
          borderRadius: 3,
          px: { xs: 3, md: 5 },
          py: { xs: 4, md: 5 },
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'common.white',
        }}
      >
        <Typography variant="overline" sx={{ opacity: 0.9, letterSpacing: 2 }}>
          CHƯƠNG TRÌNH CỐ VẤN
        </Typography>
        <Typography
          variant="h3"
          fontWeight={800}
          sx={{ mt: 1, mb: 2, fontSize: { xs: '1.75rem', md: '2.25rem' } }}
        >
          Kết nối kinh nghiệm — Định hướng tương lai
        </Typography>
        <Typography sx={{ opacity: 0.92, maxWidth: 640, mb: 3, lineHeight: 1.7 }}>
          Chương trình cố vấn phi lợi nhuận dành cho sinh viên và cựu sinh viên HCMUS.
          Tìm anh chị đi trước để được hỗ trợ học tập, định hướng nghề nghiệp và phát triển kỹ năng.
        </Typography>
        <MentorshipHubActions tone="onPrimary" />
      </Box>

      <StatsBanner items={MENTORSHIP_STATS} />

      <Box>
        <Typography variant="h4" fontWeight={700} mb={3}>
          Lợi ích khi tham gia
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
            gap: 2,
          }}
        >
          {BENEFITS.map((item) => (
            <Card key={item.title} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
              <Box mb={1.5}>{item.icon}</Box>
              <Typography fontWeight={700} mb={1}>
                {item.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {item.description}
              </Typography>
            </Card>
          ))}
        </Box>
      </Box>

      <Box>
        <Typography variant="h4" fontWeight={700} mb={3}>
          Cách hoạt động
        </Typography>
        <Stack spacing={2}>
          {STEPS.map((item) => (
            <Card
              key={item.step}
              sx={{
                p: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                gap: 2,
                alignItems: 'flex-start',
              }}
              elevation={0}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  color: 'common.white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {item.step}
              </Box>
              <Box>
                <Typography fontWeight={700}>{item.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.text}
                </Typography>
              </Box>
            </Card>
          ))}
        </Stack>
      </Box>

      <Card
        sx={{
          p: { xs: 3, md: 4 },
          textAlign: 'center',
          border: '1px dashed',
          borderColor: 'primary.light',
          bgcolor: (theme) => `${theme.palette.primary.main}0a`,
        }}
        elevation={0}
      >
        <Typography variant="h5" fontWeight={700} mb={1}>
          {access.isGuest ? 'Sẵn sàng bắt đầu?' : 'Xác thực email để tiếp tục'}
        </Typography>
        <Typography color="text.secondary" mb={3} maxWidth={520} mx="auto">
          {access.isGuest
            ? 'Đăng nhập hoặc tạo tài khoản để tham gia chương trình cố vấn cùng cộng đồng khoa.'
            : 'Bạn cần xác thực email trước khi xem danh sách cố vấn và đặt lịch.'}
        </Typography>
        <Stack direction="row" spacing={1.5} justifyContent="center" flexWrap="wrap" useFlexGap>
          <MentorshipHubActions />
          {!access.isGuest && (
            <Button variant="outlined" onClick={() => navigate('/settings/account')}>
              Đi tới cài đặt tài khoản
            </Button>
          )}
        </Stack>
      </Card>
    </Stack>
  );
};

/** Hub header + mentor list — level 1 & 2 */
const HubContent = () => (
  <Stack spacing={4}>
    <Stack spacing={2}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        <Typography
          variant="h1"
          fontWeight={800}
          color="primary.main"
          sx={{ fontSize: { xs: '1.8rem', md: '2.3rem' } }}
        >
          CỐ VẤN
        </Typography>
        <MentorshipHubActions />
      </Box>
      <Typography color="text.secondary">
        Chương trình cố vấn dành cho sinh viên và cựu sinh viên — kết nối với anh chị đi trước
        để được hỗ trợ học tập, định hướng nghề nghiệp và phát triển kỹ năng.
      </Typography>
    </Stack>

    <StatsBanner items={MENTORSHIP_STATS} />
    <MentorshipMentorListSection />
  </Stack>
);

const MentorshipPage = () => {
  const access = useMentorshipAccessState();
  const showGuestLanding = access.isGuest || access.needsEmailVerification;

  return (
    <Page title={showGuestLanding ? 'Chương trình Cố vấn' : 'Cố vấn'}>
      <Container maxWidth={false} disableGutters sx={{ pb: 6 }}>
        <Container maxWidth="xl" sx={{ pt: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3, lg: 6 } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: { xs: 2, md: 3 },
            }}
          >
            <Stack spacing={2} sx={{ width: { xs: '100%', md: 260 } }}>
              <Sidebar items={MENTORSHIP_SIDEBAR} />
              <ForumSponsoredCard
                title="Sponsored"
                imageSrc="/forum/metro_station.png"
                imageAlt="HCMC Metro"
                caption="HCMC Metro Opening"
              />
            </Stack>

            <Box sx={{ flex: 1, minWidth: 0, px: { xs: 1.5, sm: 2, md: 2.75 } }}>
              {showGuestLanding ? <GuestLandingContent /> : <HubContent />}
            </Box>
          </Box>
        </Container>
      </Container>
    </Page>
  );
};

export default MentorshipPage;
