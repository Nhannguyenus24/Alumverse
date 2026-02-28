import { useMemo, useState, useCallback } from 'react';
import {
  Box,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router';
import Page from '../components/Page';
import ForumFilterPanel from '../components/forum/ForumFilterPanel';
import ForumSponsoredCard from '../components/forum/ForumSponsoredCard';
import ForumSection from '../components/forum/ForumSection';

const FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'alumni', label: 'Cựu sinh viên' },
  { id: 'jobs', label: 'Việc làm' },
  { id: 'events', label: 'Hoạt động' },
  { id: 'tech', label: 'Công nghệ' },
  { id: 'courses', label: 'Học phần' },
  { id: 'admissions', label: 'Tuyển sinh' },
];

const SECTIONS = [
  {
    id: 'main',
    title: 'CHÍNH',
    filterIds: ['all'],
    boards: [
      {
        id: 'announcements',
        name: 'Thông báo',
        description: 'Kênh thông báo chính thức của diễn đàn.',
        threadCount: 20,
        discussionCount: 47,
        lastPost: {
          title: 'Kiểm tra tài khoản c...',
          authorName: 'Nguyễn Văn A',
          createdAt: '15 phút trước',
        },
      },
      {
        id: 'suggestions',
        name: 'Góp ý',
        description: 'Đóng góp ý kiến tại đây.',
        threadCount: '2.4K',
        discussionCount: '40K',
        lastPost: {
          title: 'Kiểm tra tài khoản c...',
          authorName: 'Nguyễn Văn A',
          createdAt: '10 phút trước',
        },
      },
      {
        id: 'general-knowledge',
        name: 'Kiến thức chung',
        description: 'Kiến thức chung về diễn đàn.',
        threadCount: 400,
        discussionCount: '1.5K',
        lastPost: {
          title: 'Kiểm tra tài khoản c...',
          authorName: 'Nguyễn Văn A',
          createdAt: '5 phút trước',
        },
      },
    ],
  },
  {
    id: 'alumni',
    title: 'CỰU SINH VIÊN',
    filterIds: ['all', 'alumni', 'jobs', 'events', 'tech', 'courses', 'admissions'],
    boards: [
      {
        id: 'meetups',
        name: 'Gặp gỡ',
        description: 'Gặp gỡ các Alumni.',
        threadCount: '2.4K',
        discussionCount: '40K',
        lastPost: {
          title: 'Kiểm tra tài khoản c...',
          authorName: 'Nguyễn Văn A',
          createdAt: '15 phút trước',
        },
      },
      {
        id: 'inspiration',
        name: 'Truyền cảm hứng',
        description: 'Những người đi trước truyền cho người đi sau.',
        threadCount: 400,
        discussionCount: '1.5K',
        lastPost: {
          title: 'Kiểm tra tài khoản c...',
          authorName: 'Nguyễn Văn A',
          createdAt: '15 phút trước',
        },
      },
      {
        id: 'scholarships',
        name: 'Học bổng',
        description: 'Quảng bá học bổng tại đây.',
        threadCount: '2.4K',
        discussionCount: '40K',
        lastPost: {
          title: 'Kiểm tra tài khoản c...',
          authorName: 'Nguyễn Văn A',
          createdAt: '15 phút trước',
        },
      },
      {
        id: 'sponsorship',
        name: 'Tài trợ & Quyên góp',
        description: 'Những hoạt động tài trợ và quyên góp.',
        threadCount: 400,
        discussionCount: '1.5K',
        lastPost: {
          title: 'Kiểm tra tài khoản c...',
          authorName: 'Nguyễn Văn A',
          createdAt: '15 phút trước',
        },
      },
      {
        id: 'career',
        name: 'Hướng nghiệp',
        description: 'Cơ hội nghề nghiệp và phát triển.',
        threadCount: 400,
        discussionCount: '1.5K',
        lastPost: {
          title: 'Kiểm tra tài khoản c...',
          authorName: 'Nguyễn Văn A',
          createdAt: '15 phút trước',
        },
      },
    ],
  },
];

const ForumPage = () => {
  const [selectedFilterId, setSelectedFilterId] = useState('all');
  const navigate = useNavigate();

  const handleFilterChange = useCallback(
    (id) => {
      if (id === 'alumni') {
        navigate('/dien-dan/cuu-sinh-vien/huong-nghiep');
        return;
      }
      setSelectedFilterId(id);
    },
    [navigate]
  );

  const visibleSections = useMemo(() => {
    if (selectedFilterId === 'all') return SECTIONS;
    return SECTIONS.filter((s) => (s.filterIds ?? []).includes(selectedFilterId));
  }, [selectedFilterId]);

  return (
    <Page
      title="Diễn đàn"
      meta={<meta name="description" content="Diễn đàn AlumVerse" />}
    >
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          pt: { xs: '56px', md: '64px' },
          pb: { xs: 4, md: 6 },
          backgroundColor: '#F3F6FB',
        }}
      >
        <Container maxWidth="xl" sx={{ pt: { xs: 3, md: 4 }, px: { xs: 3, lg: 6 } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'flex-start',
              gap: { xs: 2, md: 3 },
            }}
          >
            <Stack spacing={2} sx={{ width: { xs: '100%', md: 260 }, flexShrink: 0 }}>
              <ForumFilterPanel
                filters={FILTERS}
                selectedId={selectedFilterId}
                onChange={handleFilterChange}
              />
              <ForumSponsoredCard
                title="Sponsored"
                imageSrc="/forum/metro_station.png"
                imageAlt="HCMC Metro Opening"
                caption="HCMC Metro Opening"
              />
            </Stack>

            <Stack spacing={3} sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h1"
                component="h2"
                fontWeight={800}
                color="primary.main"
                sx={{
                  fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
                  letterSpacing: 1,
                }}
              >
                DIỄN ĐÀN
              </Typography>
              {visibleSections.map((section) => (
                <ForumSection key={section.id} title={section.title} boards={section.boards} />
              ))}
            </Stack>
          </Box>
        </Container>
      </Container>
    </Page>
  );
};

export default ForumPage;

