import { useState } from 'react';
import {
  Box,
  Stack,
  TextField,
  Typography,
  MenuItem,
  Grid,
  Button,
} from '@mui/material';
import WYSIWYG from './WYSIWYG';
import Input from './Input';
import Dropdown from './Dropdown';
import { useFundStatuses } from '../hooks/news/useFundStatuses';
import { useFundReceivingInfos } from '../hooks/news/useFundReceivingInfos';

const TOPICS_BY_CHANNEL = {
  news: ['Thông báo trường', 'Khoa/Bộ môn', 'Hoạt động sinh viên', 'Alumni news', 'Hợp tác doanh nghiệp', 'Học thuật - nghiên cứu', 'Tuyển sinh - học bổng'],
  event: ['Workshop', 'Talkshow', 'Career Fair', 'Networking', 'Reunion', 'Seminar học thuật', 'Hoạt động CLB'],
  donation: ['Học bổng sinh viên', 'Hỗ trợ khó khăn', 'Nghiên cứu', 'Cơ sở vật chất', 'Hoạt động cộng đồng', 'Khẩn cấp'],
  alumni: ['Doanh nhân', 'Công nghệ', 'Nghiên cứu học thuật', 'Du học', 'Startup', 'Lãnh đạo', 'Nghệ thuật - sáng tạo'],
  achievement: ['Giải thưởng', 'Học bổng', 'Thành tựu nghề nghiệp', 'Nghiên cứu khoa học', 'Startup', 'Quốc tế'],
  learning: ['Học bổng', 'Thạc sĩ', 'Du học', 'Khóa học online', 'Chứng chỉ', 'Trao đổi sinh viên', 'Nghiên cứu'],
  job: ['Internship', 'Full-time', 'Part-time', 'Freelance', 'Referral nội bộ', 'Remote'],
};

const eventTypeOptions = [
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
];

const PostArticleForm = ({ 
  channel, 
  channelLabel, 
  title, 
  setTitle, 
  content, 
  setContent, 
  topic, 
  setTopic,
  donationData = {},
  handleDonationInputChange,
  eventData = {},
  handleEventInputChange,
}) => {
  const { statuses: fundStatuses } = useFundStatuses();
  const { infos: fundReceivingInfos } = useFundReceivingInfos();

  const fundStatusOptions = fundStatuses.map((s) => ({ value: s.id, label: s.name }));
  const fundReceivingOptions = fundReceivingInfos.map((i) => ({
    value: i.id,
    label: `${i.bankName ?? ''} - ${i.accountName ?? ''} (${i.accountNumber ?? ''})`,
  }));

  return (
    <Stack spacing={3}>
      
      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
        <TextField
          fullWidth
          label="Kênh"
          value={channelLabel}
          InputProps={{
            readOnly: true,
            sx: { fontWeight: 800, color: 'primary.main' }
          }}
        />

        <TextField 
          select 
          fullWidth 
          label="Chủ đề" 
          value={topic} 
          onChange={(e) => setTopic(e.target.value)}
        >
          {TOPICS_BY_CHANNEL[channel].map((opt) => (
            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
          ))}
        </TextField>
      </Box>

      {/* 1. LAYOUT QUYÊN GÓP (Giữ nguyên cấu trúc Huy đã tweak) */}
      {channel === 'donation' && (
        <Box sx={{ backgroundColor: '#e3f2fd', borderRadius: 2, p: { xs: 2, sm: 3, md: 4 }, my: 2 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 3, color: 'primary.main' }}>
            Thông tin quyên góp
          </Typography>
          <Box sx={{ mb: 3 }}>
            <Input label="Tên quỹ quyên góp" name="donationFundName" value={donationData.donationFundName} onChange={handleDonationInputChange} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Box sx={{ flex: 1 }}><Input label="Người phụ trách" name="organizer" value={donationData.organizer} onChange={handleDonationInputChange} /></Box>
            <Box sx={{ flex: 1 }}><Dropdown label="Trạng thái quỹ" options={fundStatusOptions} value={donationData.statusId ?? ''} onChange={(e) => handleDonationInputChange({ target: { name: 'statusId', value: e.target.value } })} /></Box>
          </Box>
          <Box sx={{ mb: 3 }}>
            <Dropdown
              label="Tài khoản nhận quyên góp"
              options={fundReceivingOptions}
              value={donationData.fundReceivingInfoId ?? ''}
              onChange={(e) => handleDonationInputChange({ target: { name: 'fundReceivingInfoId', value: e.target.value } })}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', md: 'row' } }}>
            <Box sx={{ width: { xs: '100%', md: '60%' }, height: 220, borderRadius: 2, border: '1px dashed', borderColor: 'divider', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {donationData.qrPreview ? <img src={donationData.qrPreview} alt="QR" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <Typography variant="body2" color="text.secondary">Chưa có mã QR</Typography>}
            </Box>
            <Box sx={{ width: { xs: '100%', md: '40%' }, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2 }}>
              <Button variant="contained" component="label">{donationData.qrPreview ? 'Sửa ảnh QR' : 'Upload ảnh QR'}<input hidden type="file" accept="image/*" onChange={(e) => { const file = e.target.files[0]; if (file) { handleDonationInputChange({ target: { name: 'qrFile', value: file } }); handleDonationInputChange({ target: { name: 'qrPreview', value: URL.createObjectURL(file) } }); } }} /></Button>
              <Input label="Mục tiêu quyên góp (VNĐ)" name="donationGoal" type="number" value={donationData.donationGoal} onChange={handleDonationInputChange} />
            </Box>
          </Box>
          <Box sx={{ mb: 3 }}><TextField fullWidth label="Lý do quyên góp" name="reasonForDonation" multiline rows={3} value={donationData.reasonForDonation} onChange={handleDonationInputChange} /></Box>
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Box sx={{ flex: 1 }}><TextField fullWidth label="Ngày bắt đầu" type="date" name="startDate" InputLabelProps={{ shrink: true }} value={donationData.startDate} onChange={handleDonationInputChange} /></Box>
            <Box sx={{ flex: 1 }}><TextField fullWidth label="Ngày kết thúc" type="date" name="endDate" InputLabelProps={{ shrink: true }} value={donationData.endDate} onChange={handleDonationInputChange} /></Box>
          </Box>
        </Box>
      )}

      {/* 2. LAYOUT SỰ KIỆN */}
      {channel === 'event' && (
        <Box sx={{ backgroundColor: '#e3f2fd', borderRadius: 2, p: { xs: 2, sm: 3, md: 4 }, my: 2 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 3, color: 'primary.main' }}>
            Thông tin sự kiện
          </Typography>

          {/* Tên sự kiện */}
          <Box sx={{ mb: 3 }}>
            <Input 
              label="Tên sự kiện" 
              placeholder="Nhập tên sự kiện" 
              name="eventName" 
              value={eventData.eventName} 
              onChange={handleEventInputChange} 
            />
          </Box>

          {/* Người tổ chức + Địa điểm */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Box sx={{ flex: 1 }}>
              <Input label="Người tổ chức" name="organizer" value={eventData.organizer} onChange={handleEventInputChange} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Input label="Địa điểm" placeholder="Nhập địa điểm hoặc link meeting" name="location" value={eventData.location} onChange={handleEventInputChange} />
            </Box>
          </Box>

          {/* Hình thức - Người tham gia - Hạn đóng đơn (Flex 3) */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Box sx={{ flex: 1 }}>
              <Dropdown 
                label="Hình thức" 
                options={eventTypeOptions} 
                value={eventData.type} 
                onChange={(e) => handleEventInputChange({ target: { name: 'type', value: e.target.value } })} 
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Input label="Số lượng người tham gia" type="number" name="maxParticipants" value={eventData.maxParticipants} onChange={handleEventInputChange} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField 
                fullWidth 
                label="Ngày đóng đơn" 
                type="date" 
                name="deadline" 
                InputLabelProps={{ shrink: true }} 
                value={eventData.deadline} 
                onChange={handleEventInputChange} 
              />
            </Box>
          </Box>

          {/* Ngày bắt đầu + Ngày kết thúc */}
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Box sx={{ flex: 1 }}>
              <TextField fullWidth label="Ngày bắt đầu" type="date" name="startDate" InputLabelProps={{ shrink: true }} value={eventData.startDate} onChange={handleEventInputChange} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField fullWidth label="Ngày kết thúc" type="date" name="endDate" InputLabelProps={{ shrink: true }} value={eventData.endDate} onChange={handleEventInputChange} />
            </Box>
          </Box>
        </Box>
      )}

      {/* 3. LAYOUT CỰU SINH VIÊN (Tinh giản như News) */}
      {/* Không hiển thị Box xanh, để người dùng tập trung vào Title và WYSIWYG bên dưới */}

      <TextField
        fullWidth
        variant="standard"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Tiêu đề bài viết"
        InputProps={{
          disableUnderline: true,
          sx: { fontSize: '1.15rem', fontWeight: 600, pb: 1, borderBottom: '1px solid', borderColor: 'divider' },
        }}
      />

      <Box sx={{ mt: 2 }}>
        <WYSIWYG value={content} onChange={setContent} placeholder="Bắt đầu viết nội dung tại đây..." height={400} />
      </Box>
    </Stack>
  );
};

export default PostArticleForm;