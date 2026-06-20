import { useMemo, useState } from 'react';
import { Box, Container, Typography, Button, Stack, TextField } from '@mui/material';
import Page from '../../components/Page';
import Input from '../../components/Input';
import Dropdown from '../../components/Dropdown';
import { useOrganization } from '../../hooks/useOrganization';
import { organizationApi } from '../../utils/api';
import { useNotification } from '../../hooks/useNotification';
import { validateVietnamPhone } from '../../utils/regexUtils';

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
  const { organization } = useOrganization();
  const { showError, showSuccess } = useNotification();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    content: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // Phone is required here; show a VN-format error once the user types.
  const phoneError = form.phone.trim()
    ? validateVietnamPhone(form.phone)
    : null;

  const canSubmit = useMemo(() => {
    return (
      !loading &&
      form.fullName.trim() &&
      form.email.trim() &&
      form.phone.trim() &&
      form.subject.trim() &&
      form.content.trim()
    );
  }, [form, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!organization?.id) {
      showError('Không tìm thấy thông tin trường để gửi góp ý.');
      return;
    }
    if (!canSubmit) {
      showError('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }
    const phoneErr = validateVietnamPhone(form.phone);
    if (phoneErr) {
      showError(phoneErr);
      return;
    }

    setLoading(true);
    try {
      await organizationApi.createSchoolFeedback(organization.id, {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        content: form.content.trim(),
      });

      setForm({
        fullName: '',
        email: '',
        phone: '',
        subject: '',
        content: '',
      });
      showSuccess('Gửi góp ý thành công. Cảm ơn bạn đã liên hệ.');
    } catch (error) {
      const message = error?.response?.data?.message ?? 'Không thể gửi góp ý lúc này. Vui lòng thử lại sau.';
      showError(message);
    } finally {
      setLoading(false);
    }
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
            py: { xs: 8, md: 12 },
            px: { xs: 2, sm: 3 },
            overflow: 'hidden',
          }}
        >
          {/* Background image */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${BACKGROUND_IMG})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />

          {/* White card overlapping background */}
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              justifyContent: 'center',
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
                py: { xs: 5, md: 6 },
                px: { xs: 5, md: 6 },
              }}
            >
              <Typography
                variant="h1"
                fontWeight={800}
                color="primary.main"
                textAlign="center"
                sx={{ mb: 5, fontSize: { xs: '1.8rem', md: '2.3rem' } }}
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
                    Thông tin người gửi
                  </Typography>
                  <Box sx={{ width: '100%' }}>
                    <Input label="" placeholder="Họ và tên" value={form.fullName} onChange={handleChange('fullName')} />
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
                        inputProps={{ inputMode: 'numeric', maxLength: 10 }}
                        onInput={(e) => {
                          e.target.value = e.target.value.replace(/\D/g, '');
                        }}
                        error={Boolean(phoneError)}
                        helperText={phoneError || ''}
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
                    <TextField
                      placeholder="Viết nội dung góp ý..."
                      multiline
                      rows={4}
                      value={form.content}
                      onChange={handleChange('content')}
                      fullWidth
                      variant="outlined"
                      sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'grey.50' } }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'center', pt: 0.5 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      size="large"
                      disabled={!canSubmit}
                      sx={{ fontWeight: 600, px: 4 }}
                    >
                      {loading ? 'Đang gửi...' : 'Gửi góp ý'}
                    </Button>
                  </Box>
                </Box>
              </Stack>
            </Box>
          </Box>
        </Box>
      </Container>
    </Page>
  );
};

export default ContactPage;
