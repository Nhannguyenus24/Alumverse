import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import apiClient from '../../utils/axios';

const ChangeEmailModal = ({ open, onClose, userId, currentEmail, onEmailChanged }) => {
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleClose = () => {
    setStep(1);
    setOtp('');
    setNewEmail('');
    setError(null);
    setSuccess(null);
    onClose();
  };

  const requestOldOtp = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await apiClient.post(`/auth/change-email/${userId}/request-otp-old`);
      setStep(2);
      setSuccess(`Mã OTP đã được gửi đến email ${currentEmail}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi gửi OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOldOtp = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await apiClient.post(`/auth/change-email/${userId}/verify-otp-old`, { otp });
      setStep(3);
      setOtp('');
    } catch (err) {
      setError(err.response?.data?.message || 'Mã OTP không hợp lệ');
    } finally {
      setLoading(false);
    }
  };

  const requestNewOtp = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await apiClient.post(`/auth/change-email/${userId}/request-otp-new`, { email: newEmail });
      setStep(4);
      setSuccess(`Mã OTP đã được gửi đến email mới ${newEmail}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi gửi OTP đến email mới');
    } finally {
      setLoading(false);
    }
  };

  const verifyNewOtp = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await apiClient.post(`/auth/change-email/${userId}/verify-otp-new`, { email: newEmail, otp });
      setSuccess('Đổi email thành công!');
      if (onEmailChanged) {
        onEmailChanged(newEmail);
      }
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Mã OTP không hợp lệ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={!loading ? handleClose : undefined} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>Đổi địa chỉ Email</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          {step === 1 && (
            <Typography>
              Để tiếp tục, hệ thống cần gửi một mã OTP đến email hiện tại của bạn <b>{currentEmail}</b> để xác thực.
            </Typography>
          )}

          {step === 2 && (
            <>
              <Typography sx={{ mb: 2 }}>
                Vui lòng nhập mã OTP gồm 6 chữ số vừa được gửi đến <b>{currentEmail}</b>.
              </Typography>
              <TextField
                fullWidth
                label="Mã OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={loading}
              />
            </>
          )}

          {step === 3 && (
            <>
              <Typography sx={{ mb: 2 }}>
                Xác thực thành công. Vui lòng nhập địa chỉ email mới.
              </Typography>
              <TextField
                fullWidth
                label="Email mới"
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
                Vui lòng nhập mã OTP gồm 6 chữ số vừa được gửi đến <b>{newEmail}</b>.
              </Typography>
              <TextField
                fullWidth
                label="Mã OTP"
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
          Hủy
        </Button>
        {step === 1 && (
          <Button onClick={requestOldOtp} disabled={loading} variant="contained">
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Gửi mã OTP'}
          </Button>
        )}
        {step === 2 && (
          <Button onClick={verifyOldOtp} disabled={loading || otp.length !== 6} variant="contained">
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Xác nhận'}
          </Button>
        )}
        {step === 3 && (
          <Button onClick={requestNewOtp} disabled={loading || !newEmail} variant="contained">
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Gửi mã OTP'}
          </Button>
        )}
        {step === 4 && (
          <Button onClick={verifyNewOtp} disabled={loading || otp.length !== 6} variant="contained">
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Hoàn tất'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ChangeEmailModal;
