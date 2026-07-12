import { useTranslation } from "react-i18next";

export default function DonationCloseDialog({
  open,
  campaign,
  onClose,
  onConfirm,
  isSubmitting = false,
}) {
  const { t } = useTranslation('donation');

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      disableScrollLock
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ color: "text.primary", fontWeight: 700 }}>
        {t('donation:close_fund_dialog_title')}
      </DialogTitle>

      <DialogContent>
        <Typography sx={{ color: "text.secondary", lineHeight: 1.7 }}>
          {t('donation:close_fund_dialog_message')}{" "}
          <Box component="span" sx={{ color: "primary.main", fontWeight: 700 }}>
            {campaign?.name}
          </Box>{" "}
          {t('donation:close_fund_dialog_question')}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="secondary"
          disabled={isSubmitting}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          {t('donation:close_fund_cancel')}
        </Button>

        <Button
          onClick={onConfirm}
          variant="contained"
          color="warning"
          disabled={isSubmitting}
          sx={{ textTransform: "none", fontWeight: 700, color: "common.white" }}
        >
          {isSubmitting ? t('donation:close_fund_closing') : t('donation:close_fund_confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
