import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
} from '@mui/material';
import Page from '../../components/Page';
import Input from '../../components/Input';
import Dropdown from '../../components/Dropdown';

const CreateDonationPage = () => {
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    donationType: '',
    postCategory: '',
    donationFundName: '',
    organizer: '',
    status: '',
    bankName: '',
    accountNumber: '',
    branch: '',
    donationGoal: '',
    reasonForDonation: '',
    startDate: '',
    endDate: '',
    title: '',
    content: '',
  });

  const [errors, setErrors] = useState({});

  // Dropdown options data
  const donationTypeOptions = [
    { value: 'medical', label: 'Y tế' },
    { value: 'education', label: 'Giáo dục' },
    { value: 'disaster', label: 'Thảm họa' },
    { value: 'charity', label: 'Từ thiện' },
    { value: 'other', label: 'Khác' },
  ];

  const postCategoryOptions = [
    { value: 'campaign', label: 'Chiến dịch quyên góp' },
    { value: 'news', label: 'Tin tức' },
    { value: 'update', label: 'Cập nhật' },
    { value: 'success', label: 'Câu chuyện thành công' },
  ];

  const statusOptions = [
    { value: 'planning', label: 'Đang lên kế hoạch' },
    { value: 'ongoing', label: 'Đang diễn ra' },
    { value: 'completed', label: 'Hoàn thành' },
    { value: 'closed', label: 'Đóng' },
  ];

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Handle dropdown change
  const handleDropdownChange = (name) => (event) => {
    setFormData((prev) => ({ ...prev, [name]: event.target.value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Handle content editor change
  const handleContentChange = (value) => {
    setFormData((prev) => ({ ...prev, content: value }));
    if (errors.content) {
      setErrors((prev) => ({ ...prev, content: '' }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.donationType) newErrors.donationType = 'Vui lòng chọn loại quyên góp';
    if (!formData.postCategory) newErrors.postCategory = 'Vui lòng chọn chủ đề bài đăng';
    if (!formData.donationFundName.trim())
      newErrors.donationFundName = 'Vui lòng nhập tên quỹ quyên góp';
    if (!formData.organizer.trim()) newErrors.organizer = 'Vui lòng nhập tên người tổ chức';
    if (!formData.status) newErrors.status = 'Vui lòng chọn trạng thái';
    if (!formData.bankName.trim()) newErrors.bankName = 'Vui lòng nhập tên ngân hàng';
    if (!formData.accountNumber.trim()) newErrors.accountNumber = 'Vui lòng nhập số tài khoản';
    if (!formData.branch.trim()) newErrors.branch = 'Vui lòng nhập chi nhánh';
    if (!formData.donationGoal) newErrors.donationGoal = 'Vui lòng nhập mục tiêu quyên góp';
    if (!formData.reasonForDonation.trim())
      newErrors.reasonForDonation = 'Vui lòng nhập lý do quyên góp';
    if (!formData.startDate) newErrors.startDate = 'Vui lòng chọn ngày bắt đầu';
    if (!formData.endDate) newErrors.endDate = 'Vui lòng chọn ngày kết thúc';
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.dateRange = 'Ngày kết thúc phải sau ngày bắt đầu';
    }
    if (!formData.title.trim()) newErrors.title = 'Vui lòng nhập tiêu đề bài đăng';
    if (!formData.content.trim()) newErrors.content = 'Vui lòng nhập nội dung bài đăng';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      console.log('Form submitted:', formData);
      // TODO: Submit form data to backend
      // navigate('/donations');
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <Page
      title="Tạo bài đăng quyên góp"
      meta={<meta name="description" content="Tạo bài đăng quyên góp" />}
    >
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4, md: 5 },
            backgroundColor: '#fff',
            borderRadius: 2,
            boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
          }}
        >
          {/* Header Section */}
          <Typography
            variant="h4"
            component="h1"
            fontWeight={700}
            textAlign="center"
            sx={{ mb: 4, color: 'primary.main' }}
          >
            ĐĂNG BÀI
          </Typography>

          <form onSubmit={handleSubmit}>
            {/* Filter/Category Selection Section */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6}>
                <Dropdown
                  label="Loại quyên góp"
                  placeholder="Chọn loại quyên góp"
                  options={donationTypeOptions}
                  value={formData.donationType}
                  onChange={handleDropdownChange('donationType')}
                  error={!!errors.donationType}
                  helperText={errors.donationType}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Dropdown
                  label="Chủ đề bài đăng"
                  placeholder="Chọn chủ đề"
                  options={postCategoryOptions}
                  value={formData.postCategory}
                  onChange={handleDropdownChange('postCategory')}
                  error={!!errors.postCategory}
                  helperText={errors.postCategory}
                />
              </Grid>
            </Grid>

            {/* Donation Information Section */}
            <Box
              sx={{
                backgroundColor: '#e3f2fd',
                borderRadius: 2,
                p: { xs: 2, sm: 3, md: 4 },
                mb: 4,
              }}
            >
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ mb: 3, color: 'primary.main' }}
              >
                Thông tin quyên góp
              </Typography>

              {/* Donation Fund Name */}
              <Box sx={{ mb: 3 }}>
                <Input
                  label="Tên quỹ quyên góp"
                  placeholder="Nhập tên quỹ quyên góp"
                  name="donationFundName"
                  value={formData.donationFundName}
                  onChange={handleInputChange}
                  error={!!errors.donationFundName}
                  helperText={errors.donationFundName}
                />
              </Box>

              {/* Organizer & Status */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Input
                    label="Người tổ chức"
                    placeholder="Nhập tên người tổ chức"
                    name="organizer"
                    value={formData.organizer}
                    onChange={handleInputChange}
                    error={!!errors.organizer}
                    helperText={errors.organizer}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Dropdown
                    label="Trạng thái"
                    placeholder="Chọn trạng thái"
                    options={statusOptions}
                    value={formData.status}
                    onChange={handleDropdownChange('status')}
                    error={!!errors.status}
                    helperText={errors.status}
                  />
                </Grid>
              </Grid>

              {/* Bank Information */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={4}>
                  <Input
                    label="Tên ngân hàng"
                    placeholder="Nhập tên ngân hàng"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    error={!!errors.bankName}
                    helperText={errors.bankName}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Input
                    label="Số tài khoản"
                    placeholder="Nhập số tài khoản"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    error={!!errors.accountNumber}
                    helperText={errors.accountNumber}
                  />
                </Grid>
                <Grid item xs={12} sm={12} md={4}>
                  <Input
                    label="Chi nhánh"
                    placeholder="Nhập chi nhánh ngân hàng"
                    name="branch"
                    value={formData.branch}
                    onChange={handleInputChange}
                    error={!!errors.branch}
                    helperText={errors.branch}
                  />
                </Grid>
              </Grid>

              {/* Donation Goal */}
              <Box sx={{ mb: 3 }}>
                <Input
                  label="Mục tiêu quyên góp (VNĐ)"
                  placeholder="Nhập mục tiêu quyên góp"
                  name="donationGoal"
                  type="number"
                  value={formData.donationGoal}
                  onChange={handleInputChange}
                  error={!!errors.donationGoal}
                  helperText={errors.donationGoal}
                />
              </Box>

              {/* Reason for Donation */}
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="Lý do quyên góp"
                  placeholder="Nhập lý do quyên góp"
                  name="reasonForDonation"
                  value={formData.reasonForDonation}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                  error={!!errors.reasonForDonation}
                  helperText={errors.reasonForDonation}
                />
              </Box>

              {/* Date Range */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Ngày bắt đầu"
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.startDate}
                    helperText={errors.startDate}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Ngày kết thúc"
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.endDate}
                    helperText={errors.endDate || errors.dateRange}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Content Editor Section */}

            {/* Title */}
            <Box sx={{ mb: 3 }}>
              <Input
                label="Tiêu đề bài đăng"
                placeholder="Nhập tiêu đề bài đăng"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                error={!!errors.title}
                helperText={errors.title}
              />
            </Box>

            {/* Content Input */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="subtitle2"
                fontWeight={600}
                sx={{ mb: 1, color: 'text.primary' }}
              >
                Nội dung bài đăng
              </Typography>
              <Box
                sx={{
                  border: errors.content ? '2px solid #d32f2f' : '1px solid #e0e0e0',
                  borderRadius: 1,
                }}
              >
                <TextField
                  fullWidth
                  multiline
                  minRows={12}
                  value={formData.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Nhập nội dung bài đăng..."
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  }}
                />
              </Box>
              {errors.content && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                  {errors.content}
                </Typography>
              )}
            </Box>

            {/* Action Buttons */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 2,
                pt: 2,
              }}
            >
              <Button
                variant="outlined"
                color="primary"
                onClick={handleCancel}
                sx={{
                  px: 4,
                  py: 1.2,
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '1rem',
                }}
              >
                Hủy
              </Button>
              <Button
                variant="contained"
                color="primary"
                type="submit"
                sx={{
                  px: 4,
                  py: 1.2,
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '1rem',
                }}
              >
                Đăng
              </Button>
            </Box>
          </form>
        </Paper>
      </Container>
    </Page>
  );
};

export default CreateDonationPage;
