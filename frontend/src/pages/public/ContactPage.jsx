import { useState } from 'react';
import { Box, Container, Typography, Button, Stack, TextField } from '@mui/material';
import Page from '../../components/Page';
import Input from '../../components/Input';
import Dropdown from '../../components/Dropdown';

const BACKGROUND_IMG = '/home_page/home_page_contact.png';

const CONTACT_INFO = {
  office: 'Văn phòng Khoa Công nghệ Thông tin',
  address: 'Phòng I53, Tòa nhà I, 227 Nguyễn Văn Cừ, Phường Chợ Quán, TP. HCM',
  email: 'info@fit.hcmus.edu.vn',
  phone: '(028) 6288 4499',
  admissions: '093 773 4004',
};

const SUBJECT_OPTIONS = [
  { value: 'general', label: 'Chủ đề chung' },
  { value: 'admissions', label: 'Tuyển sinh' },
  { value: 'alumni', label: 'Cựu sinh viên' },
  { value: 'partnership', label: 'Hợp tác' },
  { value: 'other', label: 'Khác' },
];

const ContactPage = () => {
  const [form, setForm] = useState({
    lastName: '',
    firstName: '',
    email: '',
    phone: '',
    subject: '',
    title: '',
    message: '',
  });

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Placeholder: would call API to send contact message
  };

  return (
    <Page
      title="Liên hệ"
      meta={
        <meta
          name="description"
          content="Liên hệ với Văn phòng Khoa Công nghệ Thông tin - Trường Đại học Khoa học Tự nhiên, ĐHQG-HCM"
        />
      }
    >
      <Container maxWidth={false} disableGutters sx={{ display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            position: 'relative',
            height: { xs: 'auto', md: '85vh' },
            minHeight: { xs: 640, md: 560 },
          }}
        >
          {/* Background image */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${BACKGROUND_IMG})`,
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
            }}
          />

          {/* White card overlapping background */}
          <Box
            sx={{
              position: 'absolute',
              top: { xs: '16%', sm: '20%', md: '24%' },
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              px: { xs: 2, sm: 3 },
              pointerEvents: 'auto',
            }}
          >
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                width: '100%',
                maxWidth: 960,
                backgroundColor: '#fff',
                borderRadius: 1,
                boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
                overflow: 'hidden',
                py: { xs: 3, md: 4 },
                px: { xs: 2.5, md: 4 },
              }}
            >
              <Typography
                variant="h1"
                component="h2"
                fontWeight={700}
                color="primary.main"
                textAlign="center"
                sx={{ mb: 3, fontSize: { xs: '1.75rem', md: '2rem' } }}
              >
                LIÊN HỆ
              </Typography>

              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={{ xs: 3, md: 4 }}
                alignItems="stretch"
                sx={{ flexWrap: 'wrap' }}
              >
                {/* Left: Contact information */}
                <Box
                  sx={{
                    flex: { xs: 'none', md: '1 1 0' },
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                    Thông tin liên hệ
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    {CONTACT_INFO.office}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {CONTACT_INFO.address}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Email: {CONTACT_INFO.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    SĐT: {CONTACT_INFO.phone}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tuyển sinh: {CONTACT_INFO.admissions}
                  </Typography>
                </Box>

                {/* Right: Form */}
                <Box
                  sx={{
                    flex: { xs: 'none', md: '1 1 0' },
                    minWidth: 0,
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                    Thông tin cá nhân
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5, width: '100%', flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
                      <Input
                        label=""
                        placeholder="Họ"
                        value={form.lastName}
                        onChange={handleChange('lastName')}
                      />
                    </Box>
                    <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
                      <Input
                        label=""
                        placeholder="Tên"
                        value={form.firstName}
                        onChange={handleChange('firstName')}
                      />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5, width: '100%', flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
                      <Input
                        label=""
                        placeholder="Email"
                        type="email"
                        value={form.email}
                        onChange={handleChange('email')}
                      />
                    </Box>
                    <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
                      <Input
                        label=""
                        placeholder="Số điện thoại"
                        value={form.phone}
                        onChange={handleChange('phone')}
                      />
                    </Box>
                  </Box>

                  <Typography variant="subtitle1" fontWeight={700} color="text.primary" sx={{ mt: 0.5 }}>
                    Nội dung
                  </Typography>
                  <Box sx={{ width: '100%' }}>
                    <Dropdown
                      label="Chủ đề"
                      placeholder="Chủ đề"
                      options={SUBJECT_OPTIONS}
                      value={form.subject}
                      onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                    />
                  </Box>
                  <Box sx={{ width: '100%' }}>
                    <Input
                      label=""
                      placeholder="Tiêu đề"
                      value={form.title}
                      onChange={handleChange('title')}
                    />
                  </Box>
                  <Box sx={{ width: '100%' }}>
                    <TextField
                      placeholder="Viết nội dung..."
                      multiline
                      rows={4}
                      value={form.message}
                      onChange={handleChange('message')}
                      fullWidth
                      variant="outlined"
                      sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'grey.50' } }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'center', pt: 0.5 }}>
                    <Button type="submit" variant="contained" color="primary" size="large" sx={{ fontWeight: 600, px: 4 }}>
                      Gửi tin nhắn
                    </Button>
                  </Box>
                </Box>
              </Stack>
            </Box>
          </Box>
        </Box>

        {/* Spacer so content is not cut off when scrolling */}
        <Box sx={{ minHeight: { xs: 640, sm: 480, md: 280 } }} />
      </Container>
    </Page>
  );
};

export default ContactPage;
