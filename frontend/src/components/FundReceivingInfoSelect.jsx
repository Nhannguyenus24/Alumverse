import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { useSupportedBanks } from '../hooks/fundraising/useSupportedBanks';
import { formatReceivingInfoOptionLabel } from '../utils/bankUtils';

const COUNTDOWN_SECONDS = 5;

const FundReceivingInfoSelect = ({
  value,
  onChange,
  options = [],
  disabled = false,
  error = false,
  helperText,
  labelId = 'fund-receiving-info-label',
  label = 'Tài khoản nhận quỹ',
}) => {
  const { getBankLabel } = useSupportedBanks();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingId, setPendingId] = useState(null);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  const pendingInfo = useMemo(
    () => options.find((item) => Number(item.id) === Number(pendingId)),
    [options, pendingId],
  );

  useEffect(() => {
    if (!dialogOpen) return undefined;
    if (countdown <= 0) return undefined;
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [dialogOpen, countdown]);

  const handleSelectChange = (event) => {
    const nextId = Number(event.target.value);
    if (!nextId || nextId === Number(value)) return;
    setPendingId(nextId);
    setCountdown(COUNTDOWN_SECONDS);
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    if (pendingId != null) {
      onChange(pendingId);
    }
    setDialogOpen(false);
    setPendingId(null);
  };

  const handleCancel = () => {
    setDialogOpen(false);
    setPendingId(null);
  };

  return (
    <>
      <FormControl fullWidth error={error} disabled={disabled}>
        <InputLabel id={labelId}>{label}</InputLabel>
        <Select
          value={value || ''}
          onChange={handleSelectChange}
          labelId={labelId}
          label={label}
          MenuProps={{ disableScrollLock: true }}
        >
          {options.map((info) => (
            <MenuItem key={info.id} value={info.id}>
              {formatReceivingInfoOptionLabel(info, getBankLabel)}
            </MenuItem>
          ))}
        </Select>
        {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
      </FormControl>

      <Dialog open={dialogOpen} onClose={handleCancel} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Xác nhận tài khoản nhận quỹ</DialogTitle>
        <DialogContent>
          <Typography sx={{ lineHeight: 1.7 }}>
            Đây là tài khoản nhận quỹ thuộc ngân hàng{' '}
            <strong>{getBankLabel(pendingInfo?.bankName)}</strong>, số tài khoản là{' '}
            <strong>{pendingInfo?.accountNumber}</strong>, tên người nhận là{' '}
            <strong>{pendingInfo?.accountName}</strong>.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Vui lòng kiểm tra kỹ trước khi tiếp tục. Tiền quyên góp sẽ được chuyển vào tài khoản này.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleCancel} sx={{ textTransform: 'none', fontWeight: 700 }}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={countdown > 0}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {countdown > 0 ? `Xác nhận (${countdown})` : 'Xác nhận'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FundReceivingInfoSelect;
