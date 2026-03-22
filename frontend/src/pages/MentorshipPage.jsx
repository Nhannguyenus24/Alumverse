import { Helmet } from 'react-helmet-async';
import { Box } from '@mui/material';
import MentorshipChatView from '../components/mentorship/MentorshipChatView';

const MentorshipPage = () => (
  <Box
    sx={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
    }}
  >
    <Helmet>
      <title>Mentorship</title>
      <meta
        name="description"
        content="Chương trình mentorship — kết nối cựu sinh viên và sinh viên Trường Đại học Khoa học Tự nhiên, ĐHQG-HCM"
      />
    </Helmet>
    <MentorshipChatView />
  </Box>
);

export default MentorshipPage;
