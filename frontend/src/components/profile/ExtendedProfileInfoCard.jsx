import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

const FIELD_LABELS = {
  faculty: 'Khoa',
  major: 'Chuyên ngành',
  program: 'Chương trình',
  graduatedYear: 'Năm tốt nghiệp',
  degree: 'Bằng',
  period: 'Giai đoạn',
  company: 'Công ty',
  position: 'Chức vụ',
  from: 'Bắt đầu',
  to: 'Kết thúc',
  year: 'Năm',
  link: 'Đường dẫn',
  description: 'Mô tả',
  technologies: 'Công nghệ',
  issuer: 'Đơn vị cấp',
};

const ExtendedProfileInfoCard = ({ item, icon: Icon }) => {
  // Lọc bỏ các giá trị null, undefined hoặc chuỗi rỗng trước khi render
  const validEntries = Object.entries(item || {}).filter(
    ([_, v]) => v != null && String(v).trim() !== ''
  );

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: 'background.paper',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 4px 12px 0 rgba(0,0,0,0.02)',
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        transition: 'all 0.2s',
        '&:hover': {
  transform: 'translateY(-6px)',
  boxShadow: '0 12px 32px rgba(0,0,0,0.10)',
  borderColor: 'primary.main',
},
      }}
    >
      <Stack spacing={1.5}>
        {/* Phần Header chứa Icon và Tiêu đề chính (Phần tử đầu tiên) */}
        <Box
  sx={{
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    mb: 2,
  }}
>
  {Icon && (
    <Box
      sx={{
        width: 52,
        height: 52,
        borderRadius: 3,
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
        color: 'primary.main',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon sx={{ fontSize: 26 }} />
    </Box>
  )}

  <Typography
    variant="h5"
    fontWeight={700}
    color="text.primary"
  >
    {String(validEntries[0]?.[1] ?? '')}
  </Typography>
</Box>

        {/* Vòng lặp hiển thị các thông tin chi tiết còn lại (bỏ qua phần tử đầu tiên) */}
        {validEntries.slice(1).map(([k, v]) => (
  <Box
    key={k}
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 2,
    }}
  >
            <Typography
  variant="body2"
  color="text.secondary"
  fontWeight={600}
  sx={{ textTransform: "uppercase", flexShrink: 0, minWidth: { xs: 100, md: 120 } }}
>
  {FIELD_LABELS[k] ?? k}
</Typography>
            <Typography
  variant="body2"
  fontWeight={500}
  textAlign="right"
  sx={{
    flex: 1,
  }}
>
  {String(v)}
</Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

export default ExtendedProfileInfoCard;