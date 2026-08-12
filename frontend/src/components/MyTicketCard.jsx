import { useState, useMemo } from "react";
import { Box, Typography, Button, Chip, TextField, Stack } from "@mui/material";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import { QRCodeSVG } from "qrcode.react";

import { eventApi } from "../utils/api";
import useOrganizationStore from "../stores/organizationStore";
import { canCancelEventTicketStatus } from "../utils/eventRegistration";

const formatDate = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("vi-VN");
};

const MyTicketCard = ({ ticket, onCancelled, highlighted = false }) => {
  const { t } = useTranslation(["event", "common"]);
  const organization = useOrganizationStore((state) => state.organization);

  const STATUS_CONFIG = useMemo(() => ({
    PENDING:   { label: t("event:status_pending"),   color: "default" },
    ISSUED:    { label: t("event:status_issued"),    color: "tertiary" },
    ACTIVE:    { label: t("event:status_active"),    color: "warning" },
    USED:      { label: t("event:status_used"),      color: "success" },
    CHECKED_IN:{ label: t("event:status_used"),      color: "success" },
    EXPIRED:   { label: t("event:status_expired"),   color: "default" },
    CANCELLED: { label: t("event:status_cancelled"), color: "error" },
  }), [t]);

  const statusCfg = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.PENDING;
  const canCancelTicket = canCancelEventTicketStatus(ticket.status);
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
        // Highlight uses a translucent primary wash (opacity tuned per mode), the
        // same convention as the other highlighted surfaces (NetworkChatPanel,
        // NetworkSearchMemberCard). A solid `primary.light` fill reads as a harsh
        // bright block on dark, so it is not used here.
        bgcolor: highlighted
          ? (theme) =>
              alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.16 : 0.08)
          : "background.paper",
        border: "1px solid",
        borderColor: highlighted ? "primary.main" : "divider",
        boxShadow: highlighted ? 4 : undefined,
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        overflow: "hidden",
        transition: "all 0.2s ease",
        "&:hover": { borderColor: "primary.main", boxShadow: 2 },
      }}
    >
      {/* TICKET STRIP */}
      <Box
        sx={{
          width: { xs: "100%", sm: 36 },
          height: { xs: 8, sm: "auto" },
          bgcolor: "primary.main",
          flexShrink: 0,
        }}
      />

      {/* CONTENT */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          gap: { xs: 2, md: 3 },
          p: { xs: 2, sm: 3 },
        }}
      >

        {/* LEFT */}
        <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 700 }}>
            {formatDate(ticket.registeredAt)}
          </Typography>

          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              fontSize: { xs: "1.18rem", sm: "1.45rem", md: "1.75rem" },
              lineHeight: { xs: 1.32, md: 1.25 },
              overflowWrap: "anywhere",
            }}
          >
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
            minWidth: { xs: 0, md: 180 },
            width: { xs: "100%", md: "auto" },
            display: "flex",
            flexDirection: "column",
            alignItems: { xs: "stretch", md: "flex-end" },
            justifyContent: "space-between",
            gap: { xs: 1.5, md: 2 },
            mt: { xs: "auto", md: 0 },
          }}
        >
          <Stack
            spacing={1}
            alignItems={{ xs: "stretch", md: "flex-end" }}
            sx={{
              width: { xs: "100%", md: "auto" },
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: { xs: "stretch", md: "flex-end" },
              gap: 1,
              display: { xs: "grid", sm: "flex" },
              gridTemplateColumns: {
                xs: canCancelTicket ? "minmax(0, 1fr) minmax(0, 1fr)" : "1fr",
                sm: "unset",
              },
              "& .MuiButton-root": {
                width: { xs: "100%", sm: "auto" },
                minWidth: 0,
                whiteSpace: "nowrap",
              },
            }}
          >
            {canCancelTicket && (
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<EventBusyOutlinedIcon />}
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
            sx={{
              alignSelf: "flex-end",
              fontWeight: 700,
              p: 2,
            }}
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
            <Box sx={{ p: 1.5, bgcolor: "common.white", borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
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
