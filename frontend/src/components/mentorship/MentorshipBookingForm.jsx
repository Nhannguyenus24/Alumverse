import { useRef } from 'react';
import {
  Box,
  Button,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import dayjs from 'dayjs';

const SESSION_OPTIONS = [
  { value: 'CAREER', label: 'Định hướng / Chia sẻ kinh nghiệm nghề nghiệp' },
  { value: 'ACADEMIC', label: 'Kinh nghiệm học tập / Học bổng / Nghiên cứu' },
  { value: 'SOFT_SKILLS', label: 'Kỹ năng mềm' },
];

const MentorshipBookingForm = ({
  slot,
  values,
  onChange,
  onBack,
  onSubmit,
  submitting = false,
}) => {
  const fileInputRef = useRef(null);

  const update = (key, value) => onChange({ ...values, [key]: value });

  const handlePickFile = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) update('cv', file);
    e.target.value = null;
  };

  const handleRemoveFile = () => update('cv', null);

  const isValid = values.sessionType && values.introduction.trim();

  return (
    <Stack spacing={3}>
      {/* SLOT SUMMARY */}
      <Box
        sx={{
          p: 2,
          border: '1px solid',
          borderColor: 'primary.lighter',
          borderRadius: 2,
          bgcolor: 'primary.lighter',
        }}
      >
        <Typography fontWeight={700} color="primary.main" mb={1}>
          Khung giờ đã chọn
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <EventAvailableOutlinedIcon fontSize="small" color="primary" />
            <Typography>{dayjs(slot.startTime).format('dddd, DD/MM/YYYY')}</Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <AccessTimeOutlinedIcon fontSize="small" color="primary" />
            <Typography>
              {dayjs(slot.startTime).format('HH:mm')} – {dayjs(slot.endTime).format('HH:mm')}
            </Typography>
          </Stack>
        </Stack>
      </Box>

      {/* SESSION TYPE */}
      <TextField
        select
        label="Loại buổi tư vấn"
        value={values.sessionType}
        onChange={(e) => update('sessionType', e.target.value)}
        required
        fullWidth
      >
        {SESSION_OPTIONS.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </TextField>

      {/* INTRODUCTION */}
      <TextField
        label="Giới thiệu bản thân"
        placeholder="Tự giới thiệu ngắn gọn về bạn (sinh viên năm mấy, ngành học, kinh nghiệm hiện tại,...)"
        value={values.introduction}
        onChange={(e) => update('introduction', e.target.value)}
        required
        multiline
        minRows={3}
        fullWidth
      />

      {/* DESCRIPTION */}
      <TextField
        label="Mục đích buổi gặp"
        placeholder="Bạn muốn trao đổi nội dung gì với mentor? Câu hỏi cụ thể? Kỳ vọng sau buổi gặp?"
        value={values.description}
        onChange={(e) => update('description', e.target.value)}
        multiline
        minRows={4}
        fullWidth
      />

      {/* CV UPLOAD */}
      <Box>
        <Typography fontWeight={600} mb={1}>
          CV (không bắt buộc)
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
          Đính kèm CV để mentor hiểu rõ hơn về bạn. Hỗ trợ PDF, DOC, DOCX (≤ 10MB).
        </Typography>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          hidden
          onChange={handleFileChange}
        />

        {values.cv ? (
          <Chip
            label={values.cv.name}
            onDelete={handleRemoveFile}
            deleteIcon={<DeleteOutlineIcon />}
            color="primary"
            variant="outlined"
            sx={{ maxWidth: '100%' }}
          />
        ) : (
          <Button
            variant="outlined"
            startIcon={<UploadFileOutlinedIcon />}
            onClick={handlePickFile}
          >
            Chọn file CV
          </Button>
        )}
      </Box>

      {/* ACTIONS */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="flex-end"
        spacing={1.5}
        pt={1}
      >
        <Button variant="outlined" color="inherit" onClick={onBack} disabled={submitting}>
          Quay lại
        </Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={!isValid || submitting}
        >
          {submitting ? 'Đang gửi...' : 'Xác nhận đặt lịch'}
        </Button>
      </Stack>
    </Stack>
  );
};

export default MentorshipBookingForm;
