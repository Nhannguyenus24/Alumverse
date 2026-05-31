import {
  Box,
  Checkbox,
  FormControlLabel,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

const COMMITMENTS = [
  'Cung cấp thông tin hồ sơ trung thực, rõ ràng và phù hợp với mục đích mentoring.',
  'Không sử dụng mentorship để quảng cáo, lôi kéo, thu phí trái quy định hoặc cung cấp dịch vụ bên ngoài nền tảng.',
  'Tôn trọng thời gian của bên còn lại, phản hồi booking trong thời gian hợp lý và thông báo sớm nếu cần hủy/đổi lịch.',
  'Bảo mật các thông tin cá nhân hoặc nội dung nhạy cảm được chia sẻ trong quá trình mentoring.',
  'Không sử dụng ngôn từ, hành vi quấy rối, phân biệt đối xử, xúc phạm hoặc vi phạm pháp luật.',
  'Cho phép hệ thống ghi nhận lịch sử session, feedback và report nhằm cải thiện chất lượng mentorship và xử lý tranh chấp nếu có.',
];

const MentorSignupTabTerms = ({ values, onChange }) => {
  const accepted = Boolean(values.termsAccepted);

  return (
    <Stack spacing={2}>
      <Typography fontWeight={700}>Điều khoản sử dụng tính năng Mentorship</Typography>

      <Paper
        variant="outlined"
        sx={{ p: 2.5, maxHeight: 360, overflowY: 'auto', bgcolor: 'background.default' }}
      >
        <Stack spacing={1.5} sx={{ color: 'text.secondary' }}>
          <Typography variant="body2">
            Mentorship trong AlumVerse là hoạt động kết nối phi lợi nhuận giữa mentor và mentee
            nhằm hỗ trợ định hướng học tập, nghề nghiệp và phát triển kỹ năng. AlumVerse đóng vai
            trò là nền tảng trung gian hỗ trợ kết nối, quản lý lịch hẹn và ghi nhận phản hồi; nội
            dung trao đổi trong buổi mentoring là trách nhiệm của các bên tham gia.
          </Typography>

          <Typography variant="body2" fontWeight={600} color="text.primary">
            Khi sử dụng tính năng Mentorship, người dùng đồng ý:
          </Typography>

          <Box component="ol" sx={{ pl: 3, m: 0 }}>
            {COMMITMENTS.map((item, index) => (
              <Typography key={index} component="li" variant="body2" sx={{ mb: 0.75 }}>
                {item}
              </Typography>
            ))}
          </Box>

          <Typography variant="body2">
            Trong trường hợp mentor hoặc mentee đặt lịch nhưng không tham gia, hủy lịch nhiều lần,
            hoặc có hành vi không phù hợp, AlumVerse có quyền cảnh báo, hạn chế hoặc tạm khóa
            quyền sử dụng tính năng Mentorship.
          </Typography>
        </Stack>
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
