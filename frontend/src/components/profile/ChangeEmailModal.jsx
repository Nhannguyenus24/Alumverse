import { useState } from 'react';


import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import apiClient from '../../utils/axios';

const ChangeEmailModal = ({ open, onClose, userId, currentEmail, onEmailChanged }) => {
  const { t } = useTranslation(['profile', 'common']);
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handleClose = () => {
    setStep(1);
    setOtp('');
    setNewEmail('');
    onClose();
  };

  const requestOldOtp = async () => {
    setLoading(true);
    try {
      await apiClient.post(`/auth/change-email/${userId}/request-otp-old`);
      setStep(2);
      enqueueSnackbar(t('profile:otp_sent_old', { email: currentEmail }), { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || t('profile:otp_send_error'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const verifyOldOtp = async () => {
    setLoading(true);
    try {
      await apiClient.post(`/auth/change-email/${userId}/verify-otp-old`, { otp });
      setStep(3);
      setOtp('');
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || t('profile:otp_invalid'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const requestNewOtp = async () => {
    setLoading(true);
    try {
      await apiClient.post(`/auth/change-email/${userId}/request-otp-new`, { email: newEmail });
      setStep(4);
      enqueueSnackbar(t('profile:otp_sent_new', { email: newEmail }), { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || t('profile:otp_send_new_error'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const verifyNewOtp = async () => {
    setLoading(true);
    try {
      await apiClient.post(`/auth/change-email/${userId}/verify-otp-new`, { email: newEmail, otp });
      enqueueSnackbar(t('profile:change_email_success'), { variant: 'success' });
      if (onEmailChanged) {
        onEmailChanged(newEmail);
      }
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || t('profile:otp_invalid'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={!loading ? handleClose : undefined} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>{t('profile:change_email')}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {step === 1 && (
            <Typography>
              <Trans i18nKey="profile:change_email_step1_desc" values={{ email: currentEmail }} components={[<b key="0" />]}/>
            </Typography>
          )}

          {step === 2 && (
            <>
              <Typography sx={{ mb: 2 }}>
                <Trans i18nKey="profile:change_email_step2_desc" values={{ email: currentEmail }} components={[<b key="0" />]}/>
              </Typography>
              <TextField
                fullWidth
                label={t('profile:otp_code')}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={loading}
              />
            </>
          )}

          {step === 3 && (
            <>
              <Typography sx={{ mb: 2 }}>
                {t('profile:change_email_step3_desc')}
              </Typography>
              <TextField
                fullWidth
                label={t('profile:new_email')}
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                disabled={loading}
              />
            </>
          )}

          {step === 4 && (
            <>
              <Typography sx={{ mb: 2 }}>
                <Trans i18nKey="profile:change_email_step4_desc" values={{ email: newEmail }} components={[<b key="0" />]}/>
              </Typography>
              <TextField
                fullWidth
                label={t('profile:otp_code')}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={loading}
              />
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={loading} color="inherit">
          {t('common:cancel')}
        </Button>
        {step === 1 && (
          <Button onClick={requestOldOtp} disabled={loading} variant="contained">
            {loading ? <CircularProgress size={24} color="inherit" /> : t('profile:send_otp')}
          </Button>
        )}
        {step === 2 && (
          <Button onClick={verifyOldOtp} disabled={loading || otp.length !== 6} variant="contained">
            {loading ? <CircularProgress size={24} color="inherit" /> : t('common:confirm')}
          </Button>
        )}
        {step === 3 && (
          <Button onClick={requestNewOtp} disabled={loading || !newEmail} variant="contained">
            {loading ? <CircularProgress size={24} color="inherit" /> : t('profile:send_otp')}
          </Button>
        )}
        {step === 4 && (
          <Button onClick={verifyNewOtp} disabled={loading || otp.length !== 6} variant="contained">
            {loading ? <CircularProgress size={24} color="inherit" /> : t('profile:finish')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ChangeEmailModal;
