import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  FormControlLabel,
  Stack
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { fileToBase64 } from '../../utils/imageUtils';

const AdminOrganizationEditDialog = ({ open, onClose, organization, onConfirm, loading = false }) => {
  const { t } = useTranslation(['admin', 'common']);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    logoUrl: '',
    status: 'ACTIVE',
    programs: '',
    majors: '',
    featuresConfig: '',
    contactPhone: '',
    contactEmail: '',
    departmentName: '',
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
        contactPhone: organization.contactPhone || '',
        contactEmail: organization.contactEmail || '',
        departmentName: organization.departmentName || '',
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
      featuresConfig: formData.featuresConfig && typeof formData.featuresConfig === 'object'
        ? JSON.stringify(formData.featuresConfig)
        : null,
    });
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle component="div" sx={{ p: 3, pb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
          {organization ? t('admin:edit_organization') : t('admin:add_organization')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {t('admin:edit_organization_subtitle')}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ p: 3, pt: 1 }}>
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 1 }}>
            {formData.logoUrl ? (
              <Box
                component="img"
                src={formData.logoUrl}
                alt="Organization Logo"
                sx={{ 
                  maxHeight: 90, 
                  maxWidth: '100%', 
                  height: 'auto',
                  objectFit: 'contain',
                  borderRadius: 1.5,
                  p: 1,
                  border: `1px solid ${theme => theme.palette.divider}`,
                  bgcolor: 'background.paper'
                }}
              />
            ) : (
              <Box
                sx={{
                  width: 100,
                  height: 70,
                  borderRadius: 1.5,
                  border: `1px dashed ${theme => theme.palette.divider}`,
                  bgcolor: 'background.paper',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <BusinessIcon sx={{ fontSize: 36, color: 'text.disabled' }} />
              </Box>
            )}
            <Button
              component="label"
              variant="outlined"
              size="small"
              startIcon={<CloudUploadIcon />}
              sx={{ mt: 2, textTransform: 'none' }}
            >
              {t('admin:upload_logo')}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const base64 = await fileToBase64(file);
                    setFormData(prev => ({ ...prev, logoUrl: base64 }));
                  }
                }}
              />
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              {t('admin:upload_image_base64_hint')}
            </Typography>
          </Box>

          <TextField
            fullWidth
            label={t('admin:organization_name')}
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={t('admin:organization_name_placeholder')}
            variant="outlined"
          />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('admin:organization_slug_label')}
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder={t('admin:organization_slug_placeholder')}
                helperText={t('admin:slug_helper_text')}
              />
            </Grid>
            <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.status === 'ACTIVE'}
                    onChange={(e) => handleChange({
                      target: { name: 'status', value: e.target.checked ? 'ACTIVE' : 'INACTIVE' }
                    })}
                    name="status"
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body1">
                    {t('admin:status_label')}: <b>{formData.status === 'ACTIVE' ? t('common:status_active') : t('common:status_inactive')}</b>
                  </Typography>
                }
              />
            </Grid>
          </Grid>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label={t('admin:organization_contact_phone')}
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              placeholder={t('admin:organization_contact_phone_placeholder')}
            />
            <TextField
              fullWidth
              label={t('admin:organization_contact_email')}
              name="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={handleChange}
              placeholder={t('admin:organization_contact_email_placeholder')}
            />
            <TextField
              fullWidth
              label={t('admin:organization_department_name')}
              name="departmentName"
              value={formData.departmentName}
              onChange={handleChange}
              placeholder={t('admin:organization_department_name_placeholder')}
            />
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 2, bgcolor: 'action.hover' }}>
        <Button onClick={onClose} variant="outlined" color="secondary" disabled={loading}>
          {t('common:cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
        >
          {organization ? t('common:save_changes') : t('admin:create_organization')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminOrganizationEditDialog;
