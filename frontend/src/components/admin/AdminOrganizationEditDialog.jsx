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
} from '@mui/material';

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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 800, color: 'primary.main' }}>
        Chỉnh sửa thông tin tổ chức
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            fullWidth
            label="Tên tổ chức"
            name="name"
            value={formData.name}
            onChange={handleChange}
            size="small"
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                size="small"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                select
                fullWidth
                label="Trạng thái"
                name="status"
                value={formData.status}
                onChange={handleChange}
                size="small"
              >
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
              </TextField>
            </Grid>
          </Grid>
          <TextField
            fullWidth
            label="Logo URL"
            name="logoUrl"
            value={formData.logoUrl}
            onChange={handleChange}
            size="small"
          />
          <TextField
            fullWidth
            label="Chương trình đào tạo (phân tách bằng dấu phẩy)"
            name="programs"
            value={formData.programs}
            onChange={handleChange}
            size="small"
            multiline
            rows={2}
          />
          <TextField
            fullWidth
            label="Chuyên ngành (phân tách bằng dấu phẩy)"
            name="majors"
            value={formData.majors}
            onChange={handleChange}
            size="small"
            multiline
            rows={2}
          />
          <TextField
            fullWidth
            label="Cấu hình tính năng (JSON)"
            name="featuresConfig"
            value={formData.featuresConfig}
            onChange={handleChange}
            size="small"
            multiline
            rows={3}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 600 }}>
          Hủy
        </Button>
        <Button variant="contained" onClick={handleSubmit} sx={{ textTransform: 'none', fontWeight: 700 }}>
          Lưu thay đổi
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminOrganizationEditDialog;
