import { Box, Container, Stack, Typography, IconButton } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Logo from './Logo';

const FOOTER_BG = '#0F213A';

const SOCIAL_LINKS = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/fit.hcmus',
    icon: (
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    ),
  },
  {
    label: 'Twitter',
    href: 'https://twitter.com',
    icon: (
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    ),
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com',
    icon: (
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    ),
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com',
    icon: (
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    ),
  },
];

const SocialIcon = ({ href, label, children }) => (
  <IconButton
    component="a"
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
    sx={{
      color: '#fff',
      '&:hover': { color: 'grey.300', backgroundColor: 'rgba(255,255,255,0.08)' },
      '& svg': { width: 24, height: 24 },
    }}
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      {children}
    </svg>
  </IconButton>
);

const Footer = () => {
  const { t } = useTranslation(['footer']);
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: FOOTER_BG,
        color: '#fff',
        py: { xs: 4, md: 5 },
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={{ xs: 3, md: 4 }}
          alignItems={{ md: 'flex-start' }}
          sx={{ flexWrap: 'wrap' }}
        >
          {/* Left: Logos + copyright */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: { xs: 'none', md: '1 1 0' }, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Logo
                variant="image"
                src="/alumverse_logo/Logo_White.svg"
                alt="AlumVerse"
                size="xlarge"
              />
              <Logo
                variant="image"
                src="/school_logo/HCMUS_Logo_White.svg"
                alt="Trường Đại học Khoa học Tự nhiên, ĐHQG-HCM"
                size="large"
              />
            </Box>
            <Typography variant="body1" fontWeight={700} sx={{ fontSize: '1.125rem' }}>
              © AlumVerse (2026)
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', lineHeight: 1.6 }}>
              {t('footer:tagline')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', lineHeight: 1.6 }}>
              {t('footer:institution')}
            </Typography>
          </Box>

          {/* Middle: Contact */}
          <Box sx={{ flex: { xs: 'none', md: '1 1 0' }, minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{ mb: 1.5, fontSize: '1rem' }}
            >
              {t('footer:contact_heading')}
            </Typography>
            <Typography variant="body2" fontWeight={600} sx={{ color: 'rgba(255,255,255,0.95)' }}>
              {t('footer:office_name')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.5, lineHeight: 1.6 }}>
              {t('footer:address')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mt: 1 }}>
              Email: info@fit.hcmus.edu.vn
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              {t('footer:phone_label')}: (028) 6288 4499
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              {t('footer:admissions_label')}: 093 773 4004
            </Typography>
          </Box>

          {/* Right: Social */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: { xs: 'none', md: '1 1 0' }, minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{ mb: 1.5, fontSize: '1rem' }}
            >
              {t('footer:social_heading')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {SOCIAL_LINKS.map(({ label, href, icon }) => (
                <SocialIcon key={label} href={href} label={label}>
                  {icon}
                </SocialIcon>
              ))}
            </Box>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};

export default Footer;
