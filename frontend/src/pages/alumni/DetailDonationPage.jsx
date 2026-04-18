import { useState } from 'react';

import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Grid,
  Paper,
  Divider,
  Link as MuiLink,
} from '@mui/material';
import Page from '../../components/Page';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';

// Mock data for donation details
const DONATION_DETAIL = {
  id: 1,
  logo: 'https://via.placeholder.com/120?text=HCMUS',
  title: 'Quỹ Cộng đồng Cựu sinh viên Khoa học',
  organizer: 'Giáo vụ',
  date: '12/12/2023',
  donationType: 'Quyên góp',
  description: 'Quỹ Cộng đồng Cựu sinh viên Khoa học',
  subtitle: 'Giáo vụ',
  dateRange: { start: 'January 21, 2026', end: 'January 24, 2026' },
  donorCount: 57,
  averageDonation: 108492,
  updates: [
    { date: '21/01/2026 08:00', message: 'Đã đạt 10 người quyên góp.' },
    { date: '21/01/2026 10:30', message: 'Quyên góp đạt 500,000 VNĐ.' },
    { date: '21/01/2026 14:00', message: 'Cảm ơn các nhà tài trợ.' },
    { date: '21/01/2026 16:45', message: 'Chiến dịch sẽ kết thúc sớm hơn.' },
    { date: '22/01/2026 09:00', message: 'Đạt mục tiêu 1 triệu VNĐ.' },
    { date: '22/01/2026 12:00', message: 'Cảm ơn tất cả người tham gia.' },
    { date: '22/01/2026 15:30', message: 'Tiếp tục kêu gọi quyên góp.' },
    { date: '23/01/2026 08:00', message: 'Giai đoạn 2 bắt đầu.' },
    { date: '23/01/2026 11:00', message: 'Đạt 3 triệu VNĐ.' },
    { date: '23/01/2026 18:00', message: 'Chương trình hết hạn.' },
  ],
  lastUpdated: 'January 21, 2026',
  articleHeading: 'Thực hiện chiến lược phát triển ĐHQG-HCM',
  articleContent: [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  ],
  referralLink: 'https://bit.ly/alumni-donation',
};

const DetailDonationPage = () => {
  const navigate = useOrgNavigate();
  const [donationAmount, setDonationAmount] = useState('');

  const handleDonate = () => {
    if (donationAmount && parseFloat(donationAmount) > 0) {
      console.log('Donation amount:', donationAmount);
      // TODO: Handle donation submission
    }
  };

  const handleDonationAmountChange = (e) => {
    setDonationAmount(e.target.value);
  };

  return (
    <Page
      title={DONATION_DETAIL.title}
      meta={<meta name="description" content={DONATION_DETAIL.description} />}
    >
      <Container
        maxWidth="lg"
        sx={{
          py: { xs: 4, sm: 6, md: 8 },
          minHeight: '100vh',
        }}
      >
        {/* Logo Section */}
        <Box
          sx={{
            textAlign: 'center',
            mb: 6,
          }}
        >
          <Box
            component="img"
            src={DONATION_DETAIL.logo}
            alt="Logo"
            sx={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              mb: 3,
              objectFit: 'cover',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          />
        </Box>

        {/* Breadcrumb */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
          <MuiLink
            onClick={() => navigate('/donations')}
            sx={{
              cursor: 'pointer',
              color: '#888',
              fontSize: '12px',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            &lt; QUYÊN GÓP
          </MuiLink>
        </Box>

        {/* Page Title */}
        <Typography
          variant="h3"
          component="h1"
          fontWeight={700}
          textAlign="center"
          sx={{
            fontSize: { xs: '24px', sm: '28px', md: '32px' },
            color: '#1a1a2e',
            mb: 2,
          }}
        >
          {DONATION_DETAIL.title}
        </Typography>

        {/* Meta Row */}
        <Typography
          textAlign="center"
          sx={{
            fontSize: '12px',
            color: '#888',
            mb: 6,
          }}
        >
          {DONATION_DETAIL.organizer} 📅 {DONATION_DETAIL.date}
        </Typography>

        {/* Donation Card */}
        <Paper
          elevation={0}
          sx={{
            backgroundColor: '#eef2ff',
            borderRadius: '12px',
            p: { xs: 2, sm: 3, md: 4 },
            mb: 8,
          }}
        >
          <Grid container spacing={3}>
            {/* Left Column - Text Info */}
            <Grid item xs={12} sm={6}>
              <Typography
                sx={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#1a73e8',
                  textTransform: 'uppercase',
                  mb: 1,
                  letterSpacing: '0.5px',
                }}
              >
                {DONATION_DETAIL.donationType}
              </Typography>
              <Typography
                sx={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#1a1a2e',
                  mb: 1,
                }}
              >
                {DONATION_DETAIL.description}
              </Typography>
              <Typography
                sx={{
                  fontSize: '14px',
                  color: '#888',
                  mb: 2,
                }}
              >
                {DONATION_DETAIL.subtitle}
              </Typography>
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#1a73e8',
                }}
              >
                {DONATION_DETAIL.dateRange.start} - {DONATION_DETAIL.dateRange.end}
              </Typography>
            </Grid>

            {/* Right Column - Stats & Form */}
            <Grid item xs={12} sm={6}>
              {/* Stats */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography
                      sx={{
                        fontSize: '22px',
                        fontWeight: 700,
                        color: '#1a1a2e',
                        mb: 0.5,
                      }}
                    >
                      {DONATION_DETAIL.donorCount}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '11px',
                        color: '#888',
                      }}
                    >
                      người quyên góp
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography
                      sx={{
                        fontSize: '22px',
                        fontWeight: 700,
                        color: '#1a1a2e',
                        mb: 0.5,
                      }}
                    >
                      {DONATION_DETAIL.averageDonation.toLocaleString('vi-VN')}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '11px',
                        color: '#888',
                      }}
                    >
                      VNĐ / trung bình
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Donation Form */}
              <TextField
                fullWidth
                placeholder="Số tiền quyên góp"
                type="number"
                value={donationAmount}
                onChange={handleDonationAmountChange}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '6px',
                  },
                }}
              />
              <Button
                fullWidth
                variant="contained"
                sx={{
                  backgroundColor: '#1a73e8',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '15px',
                  py: 1.5,
                  borderRadius: '6px',
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: '#1557b0',
                  },
                }}
                onClick={handleDonate}
              >
                Quyên góp
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Update Log Card */}
        <Paper
          elevation={0}
          sx={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            p: { xs: 2, sm: 2.5, md: 3 },
            mb: 8,
            backgroundColor: '#ffffff',
          }}
        >
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#1a1a2e',
              mb: 2,
            }}
          >
            Cập nhật thông tin
          </Typography>

          {/* Update Grid */}
          <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {DONATION_DETAIL.updates.map((update, index) => (
              <Typography
                key={index}
                sx={{
                  fontSize: '12px',
                  color: '#444',
                  lineHeight: 1.6,
                }}
              >
                <strong>{update.date}:</strong> {update.message}
              </Typography>
            ))}
          </Box>

          {/* Last Updated Footer */}
          <Typography
            sx={{
              fontSize: '12px',
              color: '#888',
              fontStyle: 'italic',
              mt: 2,
            }}
          >
            Lần cuối cập nhật: {DONATION_DETAIL.lastUpdated}
          </Typography>
        </Paper>

        {/* Secondary Logo + Title Banner */}
        <Box
          sx={{
            textAlign: 'center',
            my: 8,
            py: 5,
          }}
        >
          <Box
            component="img"
            src={DONATION_DETAIL.logo}
            alt="Logo"
            sx={{
              width: 160,
              height: 160,
              borderRadius: '50%',
              mb: 3,
              objectFit: 'cover',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          />
          <Typography
            sx={{
              fontSize: { xs: '18px', sm: '22px' },
              fontWeight: 700,
              color: '#1a1a2e',
              textTransform: 'uppercase',
              letterSpacing: '4px',
              lineHeight: 1.8,
            }}
          >
            CỘNG ĐỒNG CỰU SINH VIÊN
            <br />
            KHOA HỌC
          </Typography>
        </Box>

        <Divider sx={{ my: 8 }} />

        {/* Article Content */}
        <Box>
          <Typography
            sx={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#1a1a2e',
              mb: 4,
            }}
          >
            {DONATION_DETAIL.articleHeading}
          </Typography>

          {DONATION_DETAIL.articleContent.map((paragraph, index) => (
            <Typography
              key={index}
              sx={{
                fontSize: '14px',
                color: '#333',
                lineHeight: 1.7,
                mb: 2,
                textAlign: 'justify',
              }}
            >
              {paragraph}
            </Typography>
          ))}

          {/* Referral Link */}
          <Typography
            sx={{
              fontSize: '14px',
              color: '#333',
              lineHeight: 1.7,
              mt: 3,
            }}
          >
            Link tham gia Talkshow:{' '}
            <MuiLink
              href={DONATION_DETAIL.referralLink}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: '#1a73e8',
                textDecoration: 'underline',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              {DONATION_DETAIL.referralLink}
            </MuiLink>
          </Typography>
        </Box>
      </Container>
    </Page>
  );
};

export default DetailDonationPage;
