import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Button,
  Container,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import Page from '../components/Page';
import WYSIWYG from '../components/WYSIWYG';

const RequestAchievementsPage = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleCancel = () => {
    navigate('/honors');
  };

  const handleSubmit = () => {
    navigate('/honors');
  };

  return (
    <Page
      title="Đơn xét thành tựu"
      meta={<meta name="description" content="Đơn xét thành tựu - AlumVerse" />}
    >
      {/* PAGE BACKGROUND */}
      <Box sx={{ minHeight: '100vh' }}>

        {/* COVER SECTION */}
        <Box
          sx={{
            height: 220,
            backgroundColor: 'primary.main',
          }}
        />

        {/* MAIN CONTENT WRAPPER */}
        <Container maxWidth="lg">

          {/* FLOATING CARD */}
          <Box
            sx={{
              width: { xs: '100%', md: '70%' },
              mx: 'auto',
              mt: -12,
              mb: 6,
              backgroundColor: '#fff',
              borderRadius: 3,
              boxShadow: 3,
              p: { xs: 3, md: 4 },
            }}
          >

            {/* TITLE */}
            <Typography
                variant="h1"
                fontWeight={800}
                color="primary.main"
                sx={{ fontSize: { xs: '1.8rem', md: '2.3rem' }, textAlign: 'center', mb: 3 }}
            >
                ĐƠN XÉT THÀNH TỰU
            </Typography>

            {/* DESCRIPTION */}
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Đơn này dành cho những cựu sinh viên có nhu cầu được xét duyệt thành
              tựu và vinh danh. Nếu đơn được duyệt, cựu sinh viên sẽ được thông
              báo về bài đăng của mình.
            </Typography>

            {/* POST SECTION */}
            <Stack spacing={2}>

              {/* TITLE INPUT */}
              <TextField
                fullWidth
                variant="standard"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                InputProps={{
                  disableUnderline: true,
                  sx: {
                    fontSize: '1.15rem',
                    fontWeight: 600,
                    pb: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  },
                }}
              />

              {/* WYSIWYG EDITOR */}
              <Box>
                <WYSIWYG
                  value={content}
                  onChange={setContent}
                  placeholder="Write something"
                  height={260}
                />
              </Box>

              {/* ACTION BUTTONS */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 1,
                  pt: 4,
                }}
              >
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={handleCancel}
                >
                  Huỷ
                </Button>

                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                >
                  Gửi
                </Button>
              </Box>

            </Stack>
          </Box>
        </Container>
      </Box>
    </Page>
  );
};

export default RequestAchievementsPage;