import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";

export default function DonationCloseDialog({ open, campaign, onClose, onConfirm, isSubmitting = false }) {
  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      disableScrollLock
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: "1px solid #d6e5ff",
          boxShadow: "0 14px 36px rgba(18, 59, 122, 0.2)",
          background: "linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%)",
        },
      }}
    >
      <DialogTitle sx={{ color: "#0f2f5e", fontWeight: 800, pb: 1 }}>Xác nhận đóng quỹ sớm</DialogTitle>
      <DialogContent sx={{ pt: "8px !important" }}>
        <Typography sx={{ color: "#33527d", lineHeight: 1.7 }}>
          Bạn có chắc muốn đóng sớm quỹ{" "}
          <Box component="span" sx={{ color: "#0d3f8f", fontWeight: 700 }}>
            {campaign?.name}
          </Box>{" "}
          không?
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.4, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={isSubmitting}
          sx={{
            borderRadius: 999,
            textTransform: "none",
            fontWeight: 700,
            color: "#2b4d81",
            borderColor: "#b6cdee",
            "&:hover": { borderColor: "#95b6e7", backgroundColor: "#edf4ff" },
          }}
        >
          Hủy
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={isSubmitting}
          sx={{
            borderRadius: 999,
            textTransform: "none",
            fontWeight: 700,
            backgroundColor: "#1155cc",
            boxShadow: "none",
            "&:hover": {
              backgroundColor: "#0d45a3",
              boxShadow: "none",
            },
          }}
        >
          {isSubmitting ? "Đang đóng..." : "Xác nhận đóng"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
