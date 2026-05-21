import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";

export default function DonationCloseDialog({
  open,
  campaign,
  onClose,
  onConfirm,
  isSubmitting = false,
}) {
  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      disableScrollLock
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ color: "text.primary", fontWeight: 700 }}>
        Xác nhận đóng quỹ sớm
      </DialogTitle>

      <DialogContent>
        <Typography sx={{ color: "text.secondary", lineHeight: 1.7 }}>
          Bạn có chắc muốn đóng sớm quỹ{" "}
          <Box component="span" sx={{ color: "primary.main", fontWeight: 700 }}>
            {campaign?.name}
          </Box>{" "}
          không?
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
          Hủy
        </Button>

        <Button
          onClick={onConfirm}
          variant="contained"
          color="warning"
          disabled={isSubmitting}
          sx={{ textTransform: "none", fontWeight: 700, color: "common.white" }}
        >
          {isSubmitting ? "Đang đóng..." : "Xác nhận đóng"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}