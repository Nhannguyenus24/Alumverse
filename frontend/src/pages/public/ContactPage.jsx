import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Container, Typography, Button, Stack, TextField, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
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

const ContactPage = () => {
  const { t } = useTranslation('contact');
  const theme = useTheme();
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
  const isDark = theme.palette.mode === 'dark';
  const formBg = 'background.paper';
  const fieldBg = isDark ? alpha(theme.palette.common.white, 0.04) : 'grey.50';

  const SUBJECT_OPTIONS = [
    { value: 'general', label: t('subject_general') },
    { value: 'admissions', label: t('subject_admissions') },
    { value: 'alumni', label: t('subject_alumni') },
    { value: 'partnership', label: t('subject_partnership') },
    { value: 'other', label: t('subject_other') },
  ];

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

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
      showError(t('error_no_org'));
      return;
    }
    if (!canSubmit) {
      showError(t('error_fill_required'));
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

      setForm({ fullName: '', email: '', phone: '', subject: '', content: '' });
      showSuccess(t('success'));
    } catch (error) {
      const message = error?.response?.data?.message ?? t('error_send_failed');
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page
      title={t('page_title')}
      meta={<meta name="description" content={t('page_meta_desc')} />}
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

          <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center' }}>
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                width: '100%',
                maxWidth: 960,
                backgroundColor: formBg,
                color: 'text.primary',
                borderRadius: 1,
                border: '1px solid',
                borderColor: isDark ? 'divider' : alpha(theme.palette.common.black, 0.06),
                boxShadow: isDark
                  ? '0 18px 48px rgba(0,0,0,0.42), 0 0 0 1px rgba(255,255,255,0.04)'
                  : '0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
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
                {t('heading')}
              </Typography>

              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={{ xs: 3, md: 7 }}
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
                    gap: 1.6,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                    {t('contact_info_title')}
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
                    {t('label_phone')}: {CONTACT_INFO.phone}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('label_admissions')}: {CONTACT_INFO.admissions}
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
                  <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                    {t('sender_info_title')}
                  </Typography>
                  <Box sx={{ width: '100%' }}>
                    <Input label="" placeholder={t('placeholder_fullname')} value={form.fullName} onChange={handleChange('fullName')} />
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5, width: '100%', flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
                      <Input
                        label=""
                        placeholder={t('placeholder_email')}
                        type="email"
                        value={form.email}
                        onChange={handleChange('email')}
                      />
                    </Box>
                    <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
                      <Input
                        label=""
                        placeholder={t('placeholder_phone')}
                        value={form.phone}
                        onChange={handleChange('phone')}
                        inputProps={{ inputMode: 'numeric', maxLength: 10 }}
                        onInput={(e) => { e.target.value = e.target.value.replace(/\D/g, ''); }}
                        error={Boolean(phoneError)}
                        helperText={phoneError || ''}
                      />
                    </Box>
                  </Box>

                  <Typography variant="subtitle1" fontWeight={700} color="primary.main" sx={{ mt: 0.5 }}>
                    {t('content_title')}
                  </Typography>
                  <Box sx={{ width: '100%' }}>
                    <Dropdown
                      label={t('subject_label')}
                      placeholder={t('subject_label')}
                      options={SUBJECT_OPTIONS}
                      value={form.subject}
                      onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                      sx={{
                        bgcolor: fieldBg,
                        color: 'text.primary',
                        '& .MuiSelect-select': {
                          color: form.subject ? 'text.primary' : 'text.secondary',
                        },
                      }}
                    />
                  </Box>
                  <Box sx={{ width: '100%' }}>
                    <TextField
                      placeholder={t('placeholder_content')}
                      multiline
                      rows={4}
                      value={form.content}
                      onChange={handleChange('content')}
                      fullWidth
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: fieldBg,
                          color: 'text.primary',
                        },
                        '& .MuiOutlinedInput-input::placeholder': {
                          color: 'text.secondary',
                          opacity: 1,
                        },
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'center', pt: 0.5 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      size="large"
                      disabled={!canSubmit}
                      fullWidth
                      sx={{ fontWeight: 600, px: 4 }}
                    >
                      {loading ? t('sending') : t('submit')}
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
