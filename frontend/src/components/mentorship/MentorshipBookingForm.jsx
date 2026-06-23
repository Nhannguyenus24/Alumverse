import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import dayjs from 'dayjs';

const getSessionOptions = (t) => [
  { value: 'CAREER', label: t('mentorship:session_type_career') },
  { value: 'ACADEMIC', label: t('mentorship:session_type_academic') },
  { value: 'SOFT_SKILLS', label: t('mentorship:session_type_soft_skills') },
];

const MentorshipBookingForm = ({
  slot,
  values,
  onChange,
  onBack,
  onSubmit,
  submitting = false,
}) => {
  const { t } = useTranslation(['mentorship', 'common']);
  const fileInputRef = useRef(null);

  const SESSION_OPTIONS = getSessionOptions(t);

  const update = (key, value) => onChange({ ...values, [key]: value });

  const handlePickFile = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) update('cv', file);
    e.target.value = null;
  };

  const handleRemoveFile = () => update('cv', null);

  const isValid = values.sessionType && values.introduction.trim();

  return (
    <Stack spacing={3}>
      {/* SLOT SUMMARY */}
      <Box
        sx={{
          p: 2,
          border: '1px solid',
          borderColor: 'primary.lighter',
          borderRadius: 2,
          bgcolor: 'primary.lighter',
        }}
      >
        <Typography fontWeight={700} color="primary.main" mb={1}>
          {t('mentorship:selected_slot')}
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <EventAvailableOutlinedIcon fontSize="small" color="primary" />
            <Typography>{dayjs(slot.startTime).format('dddd, DD/MM/YYYY')}</Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <AccessTimeOutlinedIcon fontSize="small" color="primary" />
            <Typography>
              {dayjs(slot.startTime).format('HH:mm')} – {dayjs(slot.endTime).format('HH:mm')}
            </Typography>
          </Stack>
        </Stack>
      </Box>

      {/* SESSION TYPE */}
      <TextField
        select
        label={t('mentorship:session_type')}
        value={values.sessionType}
        onChange={(e) => update('sessionType', e.target.value)}
        required
        fullWidth
      >
        {SESSION_OPTIONS.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </TextField>

      {/* INTRODUCTION */}
      <TextField
        label={t('mentorship:self_introduction')}
        placeholder={t('mentorship:self_introduction_placeholder')}
        value={values.introduction}
        onChange={(e) => update('introduction', e.target.value)}
        required
        multiline
        minRows={3}
        fullWidth
      />

      {/* DESCRIPTION */}
      <TextField
        label={t('mentorship:meeting_purpose')}
        placeholder={t('mentorship:meeting_purpose_placeholder')}
        value={values.description}
        onChange={(e) => update('description', e.target.value)}
        multiline
        minRows={4}
        fullWidth
      />

      {/* CV UPLOAD */}
      <Box>
        <Typography fontWeight={600} mb={1}>
          {t('mentorship:cv_optional')}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
          {t('mentorship:cv_hint')}
        </Typography>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          hidden
          onChange={handleFileChange}
        />

        {values.cv ? (
          <Chip
            label={values.cv.name}
            onDelete={handleRemoveFile}
            deleteIcon={<DeleteOutlineIcon />}
            color="primary"
            variant="outlined"
            sx={{ maxWidth: '100%' }}
          />
        ) : (
          <Button
            variant="outlined"
            startIcon={<UploadFileOutlinedIcon />}
            onClick={handlePickFile}
          >
            {t('mentorship:pick_cv_file')}
          </Button>
        )}
      </Box>

      {/* ACTIONS */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="flex-end"
        spacing={1.5}
        pt={1}
      >
        <Button variant="outlined" color="inherit" onClick={onBack} disabled={submitting}>
          {t('common:back')}
        </Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={!isValid || submitting}
        >
          {submitting ? t('mentorship:submitting') : t('mentorship:confirm_booking')}
        </Button>
      </Stack>
    </Stack>
  );
};

export default MentorshipBookingForm;
