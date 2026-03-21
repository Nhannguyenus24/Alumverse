import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Button,
  Container,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import Page from '../components/Page';
import ForumFilterPanel from '../components/forum/ForumFilterPanel';
import ForumSponsoredCard from '../components/forum/ForumSponsoredCard';

const FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'alumni', label: 'Cựu sinh viên' },
  { id: 'jobs', label: 'Việc làm' },
  { id: 'events', label: 'Hoạt động' },
  { id: 'tech', label: 'Công nghệ' },
  { id: 'courses', label: 'Học phần' },
  { id: 'admissions', label: 'Tuyển sinh' },
];

const SUBJECT_OPTIONS = ['Hướng nghiệp', 'Kinh nghiệm làm việc', 'Câu chuyện truyền cảm hứng'];
const SUB_SUBJECT_OPTIONS = ['Tư vấn ngành nghề', 'Chia sẻ lộ trình', 'Khác'];

const ForumAlumniCreateTopicPage = () => {
  const navigate = useNavigate();
  const [subject, setSubject] = useState(SUBJECT_OPTIONS[0]);
  const [subSubject, setSubSubject] = useState(SUB_SUBJECT_OPTIONS[0]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleFilterChange = useCallback(
    (id) => {
      if (id === 'all') {
        navigate('/forum');
        return;
      }
      if (id === 'alumni') {
        navigate('/forum/alumni/career');
        return;
      }
    },
    [navigate]
  );

  const handleCancel = () => {
    navigate('/forum/alumni/career');
  };

  const handleSubmit = () => {
    navigate('/forum/alumni/career');
  };

  return (
    <Page
      title="Tạo chủ đề - Cựu sinh viên"
      meta={<meta name="description" content="Tạo chủ đề mới - Diễn đàn Cựu sinh viên" />}
    >
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          pt: { xs: '56px', md: '64px' },
          pb: { xs: 4, md: 6 },
          backgroundColor: '#F3F6FB',
          overflowX: 'hidden',
        }}
      >
        <Container maxWidth="xl" sx={{ pt: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3, lg: 6 } }}>
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
                selectedId="alumni"
                onChange={handleFilterChange}
              />
              <ForumSponsoredCard
                title="Sponsored"
                imageSrc="/forum/metro_station.png"
                imageAlt="HCMC Metro Opening"
                caption="HCMC Metro Opening"
              />
            </Stack>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h4"
                component="h1"
                fontWeight={800}
                color="primary.main"
                sx={{ mb: 2.5, fontSize: { xs: '1.6rem', md: '1.9rem' }, letterSpacing: 1 }}
              >
                TẠO CHỦ ĐỀ MỚI
              </Typography>

              {/* Subject selectors */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 1.5,
                  mb: 2.5,
                }}
              >
                <TextField
                  select
                  fullWidth
                  label="Chủ đề"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  size="small"
                >
                  {SUBJECT_OPTIONS.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  fullWidth
                  label="Chủ đề phụ"
                  value={subSubject}
                  onChange={(e) => setSubSubject(e.target.value)}
                  size="small"
                >
                  {SUB_SUBJECT_OPTIONS.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              {/* Editor card */}
              <Box
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  backgroundColor: '#fff',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: { xs: 'center', md: 'stretch' },
                  }}
                >
                  {/* Avatar column */}
                  <Box
                    sx={{
                      width: { xs: '100%', md: 140 },
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: { xs: 'row', md: 'column' },
                      alignItems: { xs: 'center', md: 'center' },
                      justifyContent: { xs: 'center', md: 'flex-start' },
                      gap: 1,
                      py: { xs: 2, md: 3 },
                      px: { xs: 2, md: 0 },
                      borderRight: { xs: 0, md: 1 },
                      borderBottom: { xs: 1, md: 0 },
                      borderColor: 'divider',
                    }}
                  >
                    <Box
                      sx={{
                        width: { xs: 48, md: 64 },
                        height: { xs: 48, md: 64 },
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <PersonIcon sx={{ fontSize: 34 }} />
                    </Box>
                    <Box sx={{ textAlign: { xs: 'left', md: 'center' } }}>
                      <Typography variant="body2" fontWeight={600}>
                        Nguyễn Văn An
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Alumni
                      </Typography>
                    </Box>
                  </Box>

                  {/* Title + editor */}
                  <Box
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Box
                      sx={{
                        px: { xs: 2, md: 2.5 },
                        py: 1.75,
                        borderBottom: 1,
                        borderColor: 'divider',
                      }}
                    >
                      <TextField
                        fullWidth
                        variant="standard"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Tiêu đề chủ đề"
                        InputProps={{
                          disableUnderline: true,
                          sx: {
                            fontSize: { xs: '1.05rem', md: '1.15rem' },
                            fontWeight: 600,
                          },
                        }}
                      />
                    </Box>

                    <Box sx={{ px: { xs: 2, md: 2.5 }, py: 2 }}>
                      <TextField
                        fullWidth
                        multiline
                        minRows={8}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Nội dung mở đầu"
                      />
                    </Box>
                  </Box>
                </Box>

                {/* Actions */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column-reverse', sm: 'row' },
                    justifyContent: 'flex-end',
                    gap: 1,
                    px: { xs: 2, md: 2.5 },
                    py: 1.5,
                    borderTop: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={handleCancel}
                    fullWidth={false}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                  >
                    Hủy
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    fullWidth={false}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                  >
                    Tạo chủ đề
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>
        </Container>
      </Container>
    </Page>
  );
};

export default ForumAlumniCreateTopicPage;
