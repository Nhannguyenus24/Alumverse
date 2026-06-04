import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Box,
  Grid,
  Typography,
  Divider,
  Avatar,
  Switch,
  FormControlLabel
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
const AdminOrganizationEditDialog = ({ open, onClose, organization, onConfirm }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    logoUrl: '',
    status: 'ACTIVE',
    programs: '',
    majors: '',
    featuresConfig: '',
  });


useEffect(() => {
  if (organization && open) {
    const timer = setTimeout(() => {
      const parseJsonArray = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
          try {
            return JSON.parse(val);
          } catch (e) {
            console.error("Failed to parse JSON array", e);
            return val;
          }
        }
        return val;
      };

      const programsArr = parseJsonArray(organization.programs);
      const majorsArr = parseJsonArray(organization.majors);

      const config = organization.featuresConfig
        ? (typeof organization.featuresConfig === 'string' ? JSON.parse(organization.featuresConfig) : organization.featuresConfig)
        : { mentorship: true, job: true, fund: true, events: true, forum: true };

      setFormData({
        name: organization.name || '',
        slug: organization.slug || '',
        logoUrl: organization.logoUrl || '',
        status: organization.status || 'ACTIVE',
        programs: Array.isArray(programsArr) ? programsArr.join(', ') : (programsArr || ''),
        majors: Array.isArray(majorsArr) ? majorsArr.join(', ') : (majorsArr || ''),
        featuresConfig: config,
      });
    }, 0);
    return () => clearTimeout(timer);
  }
}, [organization, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onConfirm({
      ...formData,
      programs: formData.programs.split(',').map(s => s.trim()).filter(Boolean),
      majors: formData.majors.split(',').map(s => s.trim()).filter(Boolean),
      featuresConfig: JSON.stringify(formData.featuresConfig),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ p: 3, pb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
          {organization ? 'Chỉnh sửa tổ chức' : 'Thêm tổ chức mới'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Cập nhật thông tin cơ bản và cấu hình cho tổ chức.
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ p: 3, pt: 1 }}>
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 1 }}>
            <Avatar
              src={formData.logoUrl}
              sx={{ 
                width: 100, 
                height: 100, 
                border: `2px solid ${theme => theme.palette.divider}`,
                bgcolor: 'background.paper'
              }}
            >
              {!formData.logoUrl && <BusinessIcon sx={{ fontSize: 40, color: 'text.disabled' }} />}
            </Avatar>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Xem trước logo tổ chức
            </Typography>
          </Box>

          <TextField
            fullWidth
            label="Logo URL"
            name="logoUrl"
            value={formData.logoUrl}
            onChange={handleChange}
            placeholder="https://example.com/logo.png"
            helperText="Nhập URL logo tổ chức (định dạng PNG, SVG, JPG)"
          />

          <TextField
            fullWidth
            label="Tên tổ chức"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ví dụ: Trường Đại học Khoa học Tự nhiên"
            variant="outlined"
          />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Slug (Alias)"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="hcmus"
                helperText="Dùng cho đường dẫn URL"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Trạng thái"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <MenuItem value="ACTIVE">Active (Đang hoạt động)</MenuItem>
                <MenuItem value="INACTIVE">Inactive (Tạm ngưng)</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <Divider sx={{ my: 1 }}>
            <Typography variant="caption" color="text.disabled" fontWeight={700}>DỮ LIỆU ĐÀO TẠO</Typography>
          </Divider>
          <TextField
            fullWidth
            label="Chương trình đào tạo"
            name="programs"
            value={formData.programs}
            onChange={handleChange}
            multiline
            rows={2}
            helperText="Các chương trình phân tách bằng dấu phẩy"
          />
          <TextField
            fullWidth
            label="Chuyên ngành"
            name="majors"
            value={formData.majors}
            onChange={handleChange}
            multiline
            rows={2}
            helperText="Các chuyên ngành phân tách bằng dấu phẩy"
          />
          <Divider sx={{ my: 1 }}>
            <Typography variant="caption" color="text.disabled" fontWeight={700}>CẤU HÌNH TÍNH NĂNG</Typography>
          </Divider>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            {[
              { key: 'mentorship', label: 'Cố vấn' },
              { key: 'job', label: 'Việc làm' },
              { key: 'fund', label: 'Gây quỹ' },
              { key: 'events', label: 'Sự kiện' },
              { key: 'forum', label: 'Diễn đàn' },
            ].map((f) => (
              <FormControlLabel
                key={f.key}
                control={
                  <Switch
                    checked={formData.featuresConfig[f.key] ?? true}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        featuresConfig: {
                          ...prev.featuresConfig,
                          [f.key]: e.target.checked
                        }
                      }));
                    }}
                  />
                }
                label={<Typography variant="body2">{f.label}</Typography>}
              />
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 2, bgcolor: 'action.hover' }}>
        <Button onClick={onClose} variant="outlined" color="secondary">
          Huỷ
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
        >
          {organization ? 'Lưu thay đổi' : 'Tạo tổ chức'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminOrganizationEditDialog;
