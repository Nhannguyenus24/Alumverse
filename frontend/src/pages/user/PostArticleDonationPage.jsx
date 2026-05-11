import { useState } from 'react';

import { Box, Button, Container, Typography } from '@mui/material';

import Page from '../../components/Page';
import PostArticleForm from '../../components/PostArticleForm';
import CoverUpload from '../../components/CoverUpload';
import { useCreateFund } from '../../hooks/news/useCreateFund';
import { fileToBase64 } from '../../hooks/images/fileToBase64';
import { useNotification } from '../../hooks/useNotification';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';

const MOCK_ORGANIZATION_ID = 1;

const toIsoDateTime = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
};

const PostDonationPage = () => {
  const navigate = useOrgNavigate();
  const { showSuccess, showError } = useNotification();
  const { createFund, isPending } = useCreateFund();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const [donationData, setDonationData] = useState({
    donationFundName: '',
    organizer: '',
    statusId: '',
    fundReceivingInfoId: '',
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
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || content === '<p><br></p>') {
      showError('Vui lòng nhập tiêu đề và nội dung');
      return;
    }
    if (!donationData.donationFundName.trim()) {
      showError('Vui lòng nhập tên quỹ');
      return;
    }
    if (!donationData.statusId || !donationData.fundReceivingInfoId) {
      showError('Vui lòng chọn trạng thái và tài khoản nhận');
      return;
    }
    if (!donationData.donationGoal || Number(donationData.donationGoal) <= 0) {
      showError('Vui lòng nhập mục tiêu quyên góp hợp lệ');
      return;
    }
    if (!donationData.startDate || !donationData.endDate) {
      showError('Vui lòng nhập thời gian bắt đầu và kết thúc');
      return;
    }

    try {
      const logoBase64 = coverFile ? await fileToBase64(coverFile) : null;

      const payload = {
        name: donationData.donationFundName.trim(),
        description_short: donationData.reasonForDonation?.trim() || title.trim(),
        description_full: content.trim(),
        managerName: donationData.organizer?.trim() || null,
        logoBase64,
        organizationId: MOCK_ORGANIZATION_ID,
        fundReceivingInfoId: Number(donationData.fundReceivingInfoId),
        status_id: Number(donationData.statusId),
        targetAmount: Number(donationData.donationGoal),
        timeStarted: toIsoDateTime(donationData.startDate),
        timeEnded: toIsoDateTime(donationData.endDate),
      };

      const result = await createFund(payload);
      showSuccess('Thông tin quyên góp đã được đăng thành công!');
      navigate(`/article/donation/${result.id}`);
    } catch (err) {
      showError(err.response?.data?.message ?? 'Đăng quyên góp thất bại');
    }
  };

  return (
    <Page title="Tạo quyên góp" meta={<meta name="description" content="Tạo quyên góp - AlumVerse" />}>
      <Box sx={{ minHeight: '100vh' }}>
        {/* Cover Upload Section */}
        <CoverUpload value={coverPreview} onChange={handleCoverUpload} />

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