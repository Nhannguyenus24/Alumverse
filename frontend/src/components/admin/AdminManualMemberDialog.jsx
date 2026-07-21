import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Divider,
  Stack,
  Avatar,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { fileToBase64 } from '../../utils/imageUtils';

const AdminManualMemberDialog = ({ open, onClose, member, onConfirm, title }) => {
  const { t } = useTranslation(['admin', 'common']);
  const [formData, setFormData] = useState({
    name: '',
    positions: '',
    email: '',
    image: '',
    content: '',
  });

  useEffect(() => {
    if (open) {
      if (member) {
        setFormData({
          name: member.name || '',
          positions: member.positions || '',
          email: member.email || '',
          image: member.image || '',
          content: member.content || '',
        });
      } else {
        setFormData({
          name: '',
          positions: '',
          email: '',
          image: '',
          content: '',
        });
      }
    }
  }, [open, member]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) return;
    onConfirm(formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ p: 3, pb: 1 }}>
        <Typography variant="h6" fontWeight={800}>{title ?? t('admin:manual_member_dialog_title')}</Typography>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 1 }}>
            <Avatar
              src={formData.image}
              sx={{ width: 80, height: 80, border: 1, borderColor: 'divider', mb: 1 }}
            >
              <PersonOutlineIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Button
              component="label"
              variant="outlined"
              size="small"
              startIcon={<CloudUploadIcon />}
              sx={{ textTransform: 'none' }}
            >
              {t('admin:upload_portrait_photo')}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const base64 = await fileToBase64(file);
                    setFormData(prev => ({ ...prev, image: base64 }));
                  }
                }}
              />
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>{t('admin:image_accept_base64_only')}</Typography>
          </Box>

          <TextField
            fullWidth
            label={t('common:full_name')}
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            size="small"
            placeholder={t('admin:full_name_placeholder')}
            error={!formData.name.trim()}
            helperText={!formData.name.trim() ? t('common:please_enter_full_name') : ""}
          />

          <TextField
            fullWidth
            label={t('admin:position')}
            name="positions"
            value={formData.positions}
            onChange={handleChange}
            size="small"
            placeholder={t('admin:position_placeholder')}
          />

          <TextField
            fullWidth
            label={t('common:email', 'Email')}
            name="email"
            value={formData.email}
            onChange={handleChange}
            size="small"
            placeholder={t('admin:manual_member_email_placeholder', 'nguyenvana@hcmus.edu.vn')}
          />

          <TextField
            fullWidth
            label={t('common:description_additional_info')}
            name="content"
            value={formData.content}
            onChange={handleChange}
            multiline
            rows={3}
            size="small"
            placeholder={t('admin:bio_summary_placeholder')}
          />
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 2, px: 3 }}>
        <Button onClick={onClose} variant="outlined" color="secondary">{t('common:cancel')}</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!formData.name.trim()}
          startIcon={<SaveOutlinedIcon />}
        >
          {t('common:save_info')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminManualMemberDialog;
