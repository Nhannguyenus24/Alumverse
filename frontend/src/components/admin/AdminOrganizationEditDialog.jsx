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
  IconButton,
  Avatar,
  CircularProgress
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import BusinessIcon from '@mui/icons-material/Business';
import { useUploadImage } from '../../hooks/images/useUploadImage';
import { useRef } from 'react';

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

  const { uploadFile, isPending: uploading } = useUploadImage();
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || '',
        slug: organization.slug || '',
        logoUrl: organization.logoUrl || '',
        status: organization.status || 'ACTIVE',
        programs: Array.isArray(organization.programs) ? organization.programs.join(', ') : (organization.programs || ''),
        majors: Array.isArray(organization.majors) ? organization.majors.join(', ') : (organization.majors || ''),
        featuresConfig: organization.featuresConfig || '',
      });
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
            <Box sx={{ position: 'relative' }}>
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
              <IconButton
                size="small"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                  boxShadow: 2
                }}
              >
                {uploading ? <CircularProgress size={20} color="inherit" /> : <PhotoCameraIcon fontSize="small" />}
              </IconButton>
              <input
                type="file"
                hidden
                ref={fileInputRef}
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      const url = await uploadFile(file);
                      setFormData(prev => ({ ...prev, logoUrl: url }));
                    } catch (err) {
                      console.error("Logo upload failed", err);
                    }
                  }
                }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Logo tổ chức (nên dùng định dạng PNG/SVG)
            </Typography>
          </Box>

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
            <Typography variant="caption" color="text.disabled" fontWeight={700}>CẤU HÌNH HỆ THỐNG</Typography>
          </Divider>
          <TextField
            fullWidth
            label="Features Configuration (JSON)"
            name="featuresConfig"
            value={formData.featuresConfig}
            onChange={handleChange}
            multiline
            rows={4}
            sx={{ '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: 13 } }}
            placeholder='{ "mentorship": true, "fundraising": true }'
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 2, bgcolor: 'action.hover' }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}>
          Hủy bỏ
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            px: 4,
            borderRadius: 2,
            boxShadow: (theme) => theme.customShadows?.primary,
          }}
        >
          {organization ? 'Lưu thay đổi' : 'Tạo tổ chức'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminOrganizationEditDialog;
