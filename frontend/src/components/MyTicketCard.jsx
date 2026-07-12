import { useState, useMemo } from "react";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import { eventApi } from "../utils/api";
import useOrganizationStore from "../stores/organizationStore";

const formatDate = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("vi-VN");
};

const MyTicketCard = ({ ticket, onCancelled, highlighted = false }) => {
  const { t } = useTranslation(["event", "common"]);
  const organization = useOrganizationStore((state) => state.organization);

  const STATUS_CONFIG = useMemo(() => ({
    PENDING:   { label: t("event:status_pending"),   color: "default",   canCancel: true  },
    ISSUED:    { label: t("event:status_issued"),    color: "tertiary",  canCancel: true  },
    ACTIVE:    { label: t("event:status_active"),    color: "warning",   canCancel: false },
    USED:      { label: t("event:status_used"),      color: "success",   canCancel: false },
    CHECKED_IN:{ label: t("event:status_used"),      color: "success",   canCancel: false },
    EXPIRED:   { label: t("event:status_expired"),   color: "default",   canCancel: false },
    CANCELLED: { label: t("event:status_cancelled"), color: "error",     canCancel: false },
  }), [t]);

  const statusCfg = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.PENDING;
  const eventTitle = ticket.eventTitle
    ?? ticket.eventName
    ?? ticket.event?.title
    ?? ticket.title
    ?? t('event:event_id_fallback', { id: ticket.eventId });
  const organizerName = ticket.organizer
    ?? ticket.organizationName
    ?? ticket.event?.organizer
    ?? ticket.event?.organizationName
    ?? organization?.name
    ?? organization?.departmentName
    ?? t("event:default_organizer");
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
      enqueueSnackbar(t("event:cancel_ticket_success"), { variant: "info" });
      onCancelled?.();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || t("event:cancel_ticket_error"), { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Prefer the server-issued encrypted token (hides the code + tamper-proof).
  // Fall back to the legacy plaintext format only for tickets issued before the
  // backend started returning `qrToken`.
  const qrData = ticket.qrToken
    || (ticket.ticketCode ? `ALUMVERSE-TICKET-${ticket.ticketCode}` : "ALUMVERSE-TICKET-DEMO");

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
            {eventTitle}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {organizerName}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            {t("event:ticket_code")}: {ticket.ticketCode ?? "—"}
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
                {t("event:cancel_ticket")}
              </Button>
            )}
            <Button
              variant="contained"
              size="small"
              startIcon={<ConfirmationNumberOutlinedIcon />}
              onClick={() => setOpenTicket(true)}
            >
              {t("event:view_ticket")}
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
          {t("event:ticket_dialog_title")}
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 1 }}>
            <Typography variant="h5" fontWeight={700} color="primary.main" textAlign="center" sx={{ mb: 3 }}>
              {eventTitle}
            </Typography>

            {/* QR generated client-side (self-hosted) — the code never leaves
                the app to a third-party QR service. */}
            <Box sx={{ p: 1.5, bgcolor: "#fff", borderRadius: 2, border: "1px solid #e0e0e0" }}>
              <QRCodeSVG value={qrData} size={220} level="M" />
            </Box>

            <Box sx={{ mt: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {t("event:join_code")}
              </Typography>
              <Typography variant="h5" fontWeight={800} letterSpacing={2} color="primary.main">
                {ticket.ticketCode ?? "—"}
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" color="primary" onClick={() => setOpenTicket(false)}>
            {t("common:close")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CANCEL TICKET DIALOG */}
      <Dialog open={openCancelDialog} onClose={() => setOpenCancelDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{t("event:cancel_ticket")}</DialogTitle>

        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t("event:cancel_ticket_reason_prompt")}
          </Typography>

          <TextField
            fullWidth
            multiline
            minRows={4}
            required
            label={t("event:cancel_reason_label")}
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
            {t("common:close")}
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={!cancelReason.trim() || loading}
            onClick={handleConfirmCancel}
          >
            {t("event:confirm_cancel_ticket")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyTicketCard;
