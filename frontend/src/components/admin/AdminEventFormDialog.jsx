import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import AdminEventQuestionSection from './AdminEventQuestionSection';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  TextField,
} from '@mui/material';

const emptyForm = {
  title: '',
  description: '',
  bannerUrl: '',
  location: '',
  startTime: '',
  endTime: '',
  registrationStartAt: '',
  registrationEndAt: '',
  maxCapacity: '',
};

const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromLocalInput = (value) => {
  if (!value) return null;
  return value.length === 16 ? `${value}:00` : value;
};

const AdminEventFormDialog = ({ open, event, onClose, onSubmit }) => {
  const { t } = useTranslation(['admin', 'common']);
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      if (event) {
        setForm({
          title: event.title || '',
          description: event.description || '',
          bannerUrl: event.bannerUrl || '',
          location: event.location || '',
          startTime: toLocalInput(event.startTime),
          endTime: toLocalInput(event.endTime),
          registrationStartAt: toLocalInput(event.registrationStartAt),
          registrationEndAt: toLocalInput(event.registrationEndAt),
          maxCapacity: event.maxCapacity != null ? String(event.maxCapacity) : '',
        });
      } else {
        setForm(emptyForm);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [open, event]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = t('admin:error_title_required');
    else if (form.title.trim().length < 3) next.title = t('admin:error_title_min_length');
    if (!form.startTime) next.startTime = t('admin:error_start_time_required');
    if (!form.endTime) next.endTime = t('admin:error_end_time_required');
    if (form.startTime && form.endTime && form.startTime >= form.endTime) {
      next.endTime = t('admin:error_end_time_after_start');
    }
    if (form.maxCapacity !== '' && (Number.isNaN(Number(form.maxCapacity)) || Number(form.maxCapacity) < 1)) {
      next.maxCapacity = t('admin:error_capacity_positive');
    }
    setErrors(next);
    const keys = Object.keys(next);
    if (keys.length > 0) {
      enqueueSnackbar(next[keys[0]], { variant: 'error' });
    }
    return keys.length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const payload = {
      title: form.title.trim(),
      description: form.description?.trim() || null,
      bannerUrl: form.bannerUrl?.trim() || null,
      location: form.location?.trim() || null,
      startTime: fromLocalInput(form.startTime),
      endTime: fromLocalInput(form.endTime),
      registrationStartAt: fromLocalInput(form.registrationStartAt),
      registrationEndAt: fromLocalInput(form.registrationEndAt),
      maxCapacity: form.maxCapacity === '' ? null : Number(form.maxCapacity),
    };
    setSubmitting(true);
    const ok = await onSubmit?.(payload);
    setSubmitting(false);
    if (ok !== false) onClose?.();
  };

  const inputLabelSlotProps = { shrink: true };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" scroll="body">
      <DialogTitle sx={{ color: 'primary.main', fontWeight: 700 }}>
        {event ? t('admin:edit_event_title', { id: event.id }) : t('admin:create_event_title')}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1, overflow: 'visible' }}>
        <TextField
          label={t('admin:event_field_title')}
          value={form.title}
          onChange={handleChange('title')}
          error={!!errors.title}
          helperText={errors.title}
          fullWidth
          required
          slotProps={{ inputLabel: inputLabelSlotProps }}
        />
        <TextField
          label={t('admin:event_field_description')}
          value={form.description}
          onChange={handleChange('description')}
          fullWidth
          multiline
          minRows={3}
          slotProps={{ inputLabel: inputLabelSlotProps }}
        />
        <TextField
          label={t('admin:event_field_banner_url')}
          value={form.bannerUrl}
          onChange={handleChange('bannerUrl')}
          fullWidth
          slotProps={{ inputLabel: inputLabelSlotProps }}
        />
        <TextField
          label={t('admin:event_field_location')}
          value={form.location}
          onChange={handleChange('location')}
          fullWidth
          slotProps={{ inputLabel: inputLabelSlotProps }}
        />
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
          <TextField
            label={t('admin:event_field_start_time')}
            type="datetime-local"
            value={form.startTime}
            onChange={handleChange('startTime')}
            error={!!errors.startTime}
            helperText={errors.startTime}
            fullWidth
            required
            slotProps={{ inputLabel: inputLabelSlotProps }}
          />
          <TextField
            label={t('admin:event_field_end_time')}
            type="datetime-local"
            value={form.endTime}
            onChange={handleChange('endTime')}
            error={!!errors.endTime}
            helperText={errors.endTime}
            fullWidth
            required
            slotProps={{ inputLabel: inputLabelSlotProps }}
          />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
          <TextField
            label={t('admin:event_field_registration_starts')}
            type="datetime-local"
            value={form.registrationStartAt}
            onChange={handleChange('registrationStartAt')}
            fullWidth
            slotProps={{ inputLabel: inputLabelSlotProps }}
          />
          <TextField
            label={t('admin:event_field_registration_ends')}
            type="datetime-local"
            value={form.registrationEndAt}
            onChange={handleChange('registrationEndAt')}
            fullWidth
            slotProps={{ inputLabel: inputLabelSlotProps }}
          />
        </Box>
        <TextField
          label={t('admin:event_field_max_capacity')}
          type="number"
          value={form.maxCapacity}
          onChange={handleChange('maxCapacity')}
          error={!!errors.maxCapacity}
          helperText={errors.maxCapacity}
          fullWidth
          slotProps={{ inputLabel: inputLabelSlotProps, htmlInput: { min: 1 } }}
        />
        {event?.id && (
          <>
            <Divider sx={{ my: 1 }} />
            <AdminEventQuestionSection eventId={event.id} />
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>{t('common:cancel')}</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          {t('common:save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminEventFormDialog;
