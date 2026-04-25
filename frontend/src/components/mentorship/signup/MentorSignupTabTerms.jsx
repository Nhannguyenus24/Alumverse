import {
  Box,
  Checkbox,
  FormControlLabel,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

const MentorSignupTabTerms = ({ values, onChange }) => {
  const accepted = Boolean(values.termsAccepted);

  return (
    <Stack spacing={2}>
      <Typography fontWeight={700}>Điều khoản sử dụng tính năng cố vấn</Typography>

      <Paper
        variant="outlined"
        sx={{ p: 2.5, maxHeight: 360, overflowY: 'auto', bgcolor: 'background.default' }}
      >
        <Typography variant="body2" color="text.secondary" component="div">
          {/* TODO: replace with finalized terms content from product owner */}
          <Box component="p">
            Nội dung điều khoản sẽ được cập nhật sau. Trong thời gian chờ, dưới đây là tóm tắt cam
            kết khi bạn trở thành cố vấn:
          </Box>
          <Box component="ul" sx={{ pl: 3 }}>
            <li>Cung cấp thông tin chính xác về học vấn, kinh nghiệm và kỹ năng.</li>
            <li>Phản hồi yêu cầu đặt lịch của mentee trong thời gian hợp lý.</li>
            <li>Tham gia các buổi tư vấn đúng giờ, đúng cam kết.</li>
            <li>Bảo mật thông tin cá nhân của mentee, không sử dụng sai mục đích.</li>
            <li>Tuân thủ các quy định ứng xử và đạo đức của cộng đồng HCMUS Alumniverse.</li>
          </Box>
        </Typography>
      </Paper>

      <FormControlLabel
        control={
          <Checkbox
            checked={accepted}
            onChange={(e) => onChange({ ...values, termsAccepted: e.target.checked })}
          />
        }
        label="Tôi đã đọc và đồng ý với các điều khoản trên"
      />
    </Stack>
  );
};

export default MentorSignupTabTerms;
