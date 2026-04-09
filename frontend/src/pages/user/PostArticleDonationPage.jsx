import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Box, Button, Container, Typography } from '@mui/material';

import Page from '../../components/Page';
import PostArticleForm from '../../components/PostArticleForm';
import CoverUpload from '../../components/CoverUpload';
import { useCreateNews } from '../../hooks/news/useCreateNews';
import { useNotification } from '../../hooks/useNotification';

const PostDonationPage = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { createNews, isPending } = useCreateNews(); // No donation hook yet

  // Main content
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('');
  const [coverImage, setCoverImage] = useState(null);

  // Donation-specific fields
  const [donationData, setDonationData] = useState({
    donationFundName: '',
    organizer: '',
    status: '',
    qrImage: null,
    donationGoal: '',
    reasonForDonation: '',
    startDate: '',
    endDate: '',
  });

  const handleDonationInputChange = (e) => {
    const { name, value } = e.target;
    setDonationData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCoverUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setCoverImage(imageUrl);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || content === '<p><br></p>') {
      showError('Vui lòng nhập tiêu đề và nội dung');
      return;
    }

    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        thumbnailUrl: coverImage || null,
        topic,
        donationData,
      };

      const result = await createNews(payload);
      showSuccess('Thông tin quyên góp đã được đăng thành công!');
      navigate(`/donation/${result.id}`);
    } catch (err) {
      showError(err.response?.data?.message ?? 'Đăng quyên góp thất bại');
    }
  };

  return (
    <Page title="Tạo quyên góp" meta={<meta name="description" content="Tạo quyên góp - AlumVerse" />}>
      <Box sx={{ minHeight: '100vh' }}>
        {/* Cover Upload Section */}
        <CoverUpload value={coverImage} onChange={handleCoverUpload} />

        {/* Form Container */}
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 10 }}>
          <Box
            sx={{
              width: { xs: '100%', md: '85%', lg: '75%' },
              mx: 'auto',
              mt: -10,
              mb: 6,
              backgroundColor: 'background.paper',
              borderRadius: 2,
              boxShadow: (theme) => theme.customShadows?.z24 || 10,
              p: { xs: 3, md: 5 },
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography
              variant="h1"
              fontWeight={800}
              color="primary.main"
              sx={{ fontSize: { xs: '1.8rem', md: '2.3rem' }, textAlign: 'center', mb: 3 }}
            >
              ĐĂNG BÀI
            </Typography>

            {/* PostArticleForm with donation layout */}
            <PostArticleForm
              channel="donation"
              channelLabel="Quyên góp"
              title={title}
              setTitle={setTitle}
              content={content}
              setContent={setContent}
              topic={topic}
              setTopic={setTopic}
              donationData={donationData}
              handleDonationInputChange={handleDonationInputChange}
            />

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2, mt: 3 }}>
              <Button variant="outlined" color="inherit" onClick={() => navigate(-1)} sx={{ px: 4 }}>
                Huỷ
              </Button>
              <Button variant="contained" color="primary" onClick={handleSubmit} disabled={isPending} sx={{ px: 4 }}>
                {isPending ? 'Đang đăng...' : 'Đăng quyên góp'}
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </Page>
  );
};

export default PostDonationPage;