import { useState } from "react";
import { Box, Typography, Button, Chip, TextField, Stack } from "@mui/material";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { useSnackbar } from "notistack";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import { eventApi } from "../utils/api";

const STATUS_CONFIG = {
  PENDING:   { label: "Chờ duyệt",    color: "default",   canCancel: true  },
  ISSUED:    { label: "Đã cấp vé",    color: "tertiary",  canCancel: true  },
  ACTIVE:    { label: "Đang diễn ra", color: "warning",   canCancel: false },
  USED:      { label: "Đã tham gia",  color: "success",   canCancel: false },
  CHECKED_IN:{ label: "Đã tham gia",  color: "success",   canCancel: false },
  EXPIRED:   { label: "Đã hết hạn",   color: "default",   canCancel: false },
  CANCELLED: { label: "Đã huỷ",       color: "error",     canCancel: false },
};

const formatDate = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("vi-VN");
};

const MyTicketCard = ({ ticket, onCancelled, highlighted = false }) => {
  const statusCfg = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.PENDING;
  const [openTicket, setOpenTicket] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim() || loading) return;
    setLoading(true);
    try {
      await eventApi.cancelTicketByCode(ticket.ticketCode, cancelReason.trim());
      setOpenCancelDialog(false);
      setCancelReason("");
      enqueueSnackbar("Vé của bạn đã được huỷ.", { variant: "info" });
      onCancelled?.();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || "Huỷ vé thất bại.", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const qrData = ticket.ticketCode
    ? `ALUMVERSE-TICKET-${ticket.ticketCode}`
    : "ALUMVERSE-TICKET-DEMO";

  return (
    <Box
      id={ticket.ticketCode ? `ticket-${ticket.ticketCode}` : undefined}
      sx={{
        borderRadius: 1.5,
        bgcolor: highlighted ? "primary.light" : "background.paper",
        border: "1px solid",
        borderColor: highlighted ? "primary.main" : "divider",
        boxShadow: highlighted ? 4 : undefined,
        display: "flex",
        overflow: "hidden",
        transition: "all 0.2s ease",
        "&:hover": { borderColor: "primary.main", boxShadow: 2 },
      }}
    >
      {/* TICKET STRIP */}
      <Box sx={{ width: 36, bgcolor: "primary.main", flexShrink: 0 }} />

      {/* CONTENT */}
      <Box sx={{ flex: 1, display: "flex", justifyContent: "space-between", gap: 3, p: 3 }}>

        {/* LEFT */}
        <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 700 }}>
            {formatDate(ticket.registeredAt)}
          </Typography>

          <Typography variant="h4" fontWeight={700}>
            {ticket.eventTitle ?? `Sự kiện #${ticket.eventId}`}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {ticket.organizer ?? "Ban tổ chức"}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            Mã vé: {ticket.ticketCode ?? "—"}
          </Typography>
        </Box>

        {/* RIGHT */}
        <Box
          sx={{
            minWidth: 180,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <Stack spacing={1} alignItems="flex-end" sx={{ flexDirection: { xs: "column", md: "row" }, gap: 1 }}>
            {statusCfg.canCancel && (
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<CancelOutlinedIcon />}
                onClick={() => setOpenCancelDialog(true)}
              >
                Huỷ vé
              </Button>
            )}
            <Button
              variant="contained"
              size="small"
              startIcon={<ConfirmationNumberOutlinedIcon />}
              onClick={() => setOpenTicket(true)}
            >
              Xem vé
            </Button>
          </Stack>

          <Chip
            label={statusCfg.label}
            color={statusCfg.color}
            size="small"
            sx={{ fontWeight: 700, p: 2 }}
          />
        </Box>
      </Box>

      {/* VIEW TICKET DIALOG */}
      <Dialog open={openTicket} onClose={() => setOpenTicket(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: "center", fontWeight: 700 }}>
          Vé tham gia sự kiện
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 1 }}>
            <Typography variant="h5" fontWeight={700} color="primary.main" textAlign="center" sx={{ mb: 3 }}>
              {ticket.eventTitle ?? `Sự kiện #${ticket.eventId}`}
            </Typography>

            <Box
              component="img"
              src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrData)}`}
              alt="QR Code"
              sx={{ width: 220, height: 220 }}
            />

            <Box sx={{ mt: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Mã tham gia
              </Typography>
              <Typography variant="h5" fontWeight={800} letterSpacing={2} color="primary.main">
                {ticket.ticketCode ?? "—"}
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" color="primary" onClick={() => setOpenTicket(false)}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* CANCEL TICKET DIALOG */}
      <Dialog open={openCancelDialog} onClose={() => setOpenCancelDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Huỷ vé</DialogTitle>

        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Vui lòng cho biết lý do bạn không thể tham gia sự kiện.
          </Typography>

          <TextField
            fullWidth
            multiline
            minRows={4}
            required
            label="Lý do không tham gia"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => {
              setOpenCancelDialog(false);
              setCancelReason("");
            }}
          >
            Đóng
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={!cancelReason.trim() || loading}
            onClick={handleConfirmCancel}
          >
            Xác nhận huỷ vé
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyTicketCard;
