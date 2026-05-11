import { useEffect, useRef } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  Divider,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';

const SectionList = ({ title, subtitle, items, onChange, fields, required = false, addLabel = 'Thêm' }) => {
  const handleAdd = () => {
    const empty = Object.fromEntries(fields.map((f) => [f.key, '']));
    onChange([...items, empty]);
  };

  const handleRemove = (idx) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const handleField = (idx, key, value) => {
    onChange(items.map((it, i) => (i === idx ? { ...it, [key]: value } : it)));
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
        <Box>
          <Typography fontWeight={700}>
            {title}
            {required && <Typography component="span" color="error.main">{' *'}</Typography>}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Button size="small" startIcon={<AddIcon />} onClick={handleAdd}>
          {addLabel}
        </Button>
      </Stack>

      {items.length === 0 ? (
        <Card sx={{ p: 2, border: '1px dashed', borderColor: 'divider', textAlign: 'center' }} elevation={0}>
          <Typography variant="body2" color="text.secondary">
            Chưa có mục nào. Bấm "{addLabel}" để thêm.
          </Typography>
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {items.map((item, idx) => (
            <Card key={idx} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }} elevation={0}>
              <Stack spacing={1.5}>
                {fields.map((f) => (
                  <TextField
                    key={f.key}
                    label={f.label}
                    placeholder={f.placeholder}
                    value={item[f.key] ?? ''}
                    onChange={(e) => handleField(idx, f.key, e.target.value)}
                    fullWidth
                    size="small"
                    multiline={f.multiline}
                    minRows={f.multiline ? 2 : 1}
                  />
                ))}
                <Stack direction="row" justifyContent="flex-end">
                  <IconButton size="small" color="error" onClick={() => handleRemove(idx)}>
                    <DeleteOutlineIcon />
                  </IconButton>
                </Stack>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
};

const MentorSignupTabProfile = ({ values, onChange }) => {
  const cvInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    const url = values.avatarPreview;
    return () => {
      if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
    };
  }, [values.avatarPreview]);

  const update = (key, val) => onChange({ ...values, [key]: val });

  const handleAvatarPick = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      onChange({ ...values, avatarFile: file, avatarPreview: previewUrl });
    }
    e.target.value = null;
  };

  const handleCvPick = (e) => {
    const file = e.target.files?.[0];
    if (file) update('cvFile', file);
    e.target.value = null;
  };

  return (
    <Stack spacing={4}>
      {/* Quick fill via CV */}
      <Card sx={{ p: 2.5, border: '1px solid', borderColor: 'primary.lighter', bgcolor: 'primary.lighter' }} elevation={0}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
          <Box>
            <Typography fontWeight={700} color="primary.main">
              Điền nhanh từ CV
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Tự động trích xuất học vấn, kinh nghiệm,... từ CV của bạn (PDF/DOC/DOCX).
            </Typography>
          </Box>
          <Tooltip title="Tính năng đang phát triển" placement="top">
            <span>
              <Button
                variant="contained"
                startIcon={<UploadFileOutlinedIcon />}
                disabled
                onClick={() => cvInputRef.current?.click()}
              >
                Up CV
              </Button>
            </span>
          </Tooltip>
          <input ref={cvInputRef} hidden type="file" accept=".pdf,.doc,.docx" onChange={handleCvPick} />
        </Stack>
        {values.cvFile && (
          <Typography variant="caption" mt={1} display="block">
            Đã chọn: {values.cvFile.name}
          </Typography>
        )}
      </Card>

      {/* Avatar */}
      <Box>
        <Typography fontWeight={700} mb={1}>
          Ảnh đại diện
          <Typography component="span" color="error.main">{' *'}</Typography>
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            src={values.avatarPreview}
            sx={{ width: 88, height: 88, bgcolor: 'grey.200' }}
          />
          <Button
            variant="outlined"
            startIcon={<PhotoCameraIcon />}
            onClick={() => avatarInputRef.current?.click()}
          >
            {values.avatarFile ? 'Đổi ảnh' : 'Chọn ảnh'}
          </Button>
          <input ref={avatarInputRef} hidden type="file" accept="image/*" onChange={handleAvatarPick} />
        </Stack>
      </Box>

      {/* Core profile (BE-supported) */}
      <Box>
        <Typography fontWeight={700} mb={1.5}>
          Vị trí hiện tại
        </Typography>
        <Stack spacing={1.5}>
          <TextField
            label="Chức danh"
            placeholder="VD: Senior Software Engineer"
            value={values.currentJobTitle ?? ''}
            onChange={(e) => update('currentJobTitle', e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Công ty"
            placeholder="VD: Google"
            value={values.currentCompany ?? ''}
            onChange={(e) => update('currentCompany', e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Giới thiệu (bio)"
            placeholder="Vài câu giới thiệu về bạn..."
            value={values.bio ?? ''}
            onChange={(e) => update('bio', e.target.value)}
            fullWidth
            size="small"
            multiline
            minRows={3}
          />
        </Stack>
      </Box>

      <Divider />

      <SectionList
        title="Học vấn"
        subtitle="VD: Cử nhân CNTT @ HCMUS, 2022 — 2026"
        required
        items={values.educations ?? []}
        onChange={(v) => update('educations', v)}
        addLabel="Thêm học vấn"
        fields={[
          { key: 'school', label: 'Trường', placeholder: 'VD: HCMUS' },
          { key: 'degree', label: 'Bằng cấp / chuyên ngành', placeholder: 'VD: Cử nhân CNTT' },
          { key: 'period', label: 'Thời gian', placeholder: 'VD: 2022 — 2026' },
        ]}
      />

      <SectionList
        title="Kinh nghiệm làm việc"
        subtitle="Vị trí, công ty, mô tả công việc — outcome, thời gian"
        required
        items={values.experiences ?? []}
        onChange={(v) => update('experiences', v)}
        addLabel="Thêm kinh nghiệm"
        fields={[
          { key: 'title', label: 'Vị trí', placeholder: 'VD: Software Engineer' },
          { key: 'company', label: 'Công ty', placeholder: 'VD: Google' },
          { key: 'period', label: 'Thời gian', placeholder: 'VD: 06/2024 — Hiện tại' },
          { key: 'description', label: 'Mô tả công việc / outcome', multiline: true },
        ]}
      />

      <SectionList
        title="Project tiêu biểu"
        items={values.projects ?? []}
        onChange={(v) => update('projects', v)}
        addLabel="Thêm project"
        fields={[
          { key: 'name', label: 'Tên project' },
          { key: 'description', label: 'Mô tả', multiline: true },
          { key: 'link', label: 'Link (nếu có)' },
        ]}
      />

      <SectionList
        title="Giải thưởng"
        items={values.awards ?? []}
        onChange={(v) => update('awards', v)}
        addLabel="Thêm giải thưởng"
        fields={[
          { key: 'name', label: 'Tên giải thưởng' },
          { key: 'year', label: 'Năm' },
          { key: 'description', label: 'Mô tả ngắn' },
        ]}
      />

      <SectionList
        title="Kỹ năng & chứng chỉ"
        items={values.skills ?? []}
        onChange={(v) => update('skills', v)}
        addLabel="Thêm kỹ năng / chứng chỉ"
        fields={[
          { key: 'name', label: 'Tên kỹ năng / chứng chỉ' },
          { key: 'issuer', label: 'Đơn vị cấp (nếu có)' },
        ]}
      />
    </Stack>
  );
};

export default MentorSignupTabProfile;
