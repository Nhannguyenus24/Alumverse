import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Box,
} from '@mui/material';

const AdminOrganizationIntroductionDialog = ({ open, onClose, introduction, onConfirm }) => {
  const [formData, setFormData] = useState({
    content: '',
    vision: '',
    mission: '',
    coreValues: '',
  });

  useEffect(() => {
    if (introduction) {
      setFormData({
        content: introduction.content || '',
        vision: introduction.vision || '',
        mission: introduction.mission || '',
        coreValues: introduction.coreValues || '',
      });
    } else {
      setFormData({
        content: '',
        vision: '',
        mission: '',
        coreValues: '',
      });
    }
  }, [introduction, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onConfirm(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 800, color: 'primary.main' }}>
        Cập nhật thông tin giới thiệu tổ chức
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            fullWidth
            label="Giới thiệu chung"
            name="content"
            value={formData.content}
            onChange={handleChange}
            size="small"
            multiline
            rows={6}
            placeholder="Mô tả tóm tắt về lịch sử, quy mô, thành tựu..."
          />
          <TextField
            fullWidth
            label="Tầm nhìn"
            name="vision"
            value={formData.vision}
            onChange={handleChange}
            size="small"
            multiline
            rows={3}
          />
          <TextField
            fullWidth
            label="Sứ mạng"
            name="mission"
            value={formData.mission}
            onChange={handleChange}
            size="small"
            multiline
            rows={3}
          />
          <TextField
            fullWidth
            label="Giá trị cốt lõi"
            name="coreValues"
            value={formData.coreValues}
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
          Cập nhật giới thiệu
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminOrganizationIntroductionDialog;
