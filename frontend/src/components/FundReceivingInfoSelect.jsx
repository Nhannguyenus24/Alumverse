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
import { useTranslation } from 'react-i18next';

const COUNTDOWN_SECONDS = 5;

const FundReceivingInfoSelect = ({
  value,
  onChange,
  options = [],
  disabled = false,
  error = false,
  helperText,
  labelId = 'fund-receiving-info-label',
  label,
}) => {
  const { t } = useTranslation('donation');
  const { getBankLabel } = useSupportedBanks();
  const resolvedLabel = label ?? t('fund_receiving_account_label');
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
        <InputLabel id={labelId}>{resolvedLabel}</InputLabel>
        <Select
          value={value || ''}
          onChange={handleSelectChange}
          labelId={labelId}
          label={resolvedLabel}
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
        <DialogTitle sx={{ fontWeight: 800 }}>{t('confirm_account_title')}</DialogTitle>
        <DialogContent>
          <Typography sx={{ lineHeight: 1.7 }}>
            {t('confirm_account_bank_prefix')}{' '}
            <strong>{getBankLabel(pendingInfo?.bankName)}</strong>
            {t('confirm_account_number_prefix')}{' '}
            <strong>{pendingInfo?.accountNumber}</strong>
            {t('confirm_account_name_prefix')}{' '}
            <strong>{pendingInfo?.accountName}</strong>.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {t('confirm_account_warning')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleCancel} sx={{ textTransform: 'none', fontWeight: 700 }}>
            {t('close_fund_cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={countdown > 0}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {countdown > 0 ? t('confirm_with_countdown', { count: countdown }) : t('close_fund_confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FundReceivingInfoSelect;
