import { useState } from "react";
import { useLocation } from "react-router";
import { Box, Button, Chip, Grid, LinearProgress, Typography } from "@mui/material";
import ConnectWithoutContactOutlinedIcon from "@mui/icons-material/ConnectWithoutContactOutlined";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import NetworkMessageDrawer from "../network/NetworkMessageDrawer";
import { useCheckConversationRequestStatus } from "../../hooks/network/useCheckConversationRequestStatus";
import { useNetworkCurrentMemberId } from "../../hooks/network/useNetworkCurrentMemberId";
import { useOrgNavigate } from "../../hooks/useOrgNavigate";

const DONOR_COUNT_DISPLAY_MAX = 999999;
const AVERAGE_DONATION_DISPLAY_MAX = 999999999;

const formatDonorCountDisplay = (value) =>
  value > DONOR_COUNT_DISPLAY_MAX ? `> ${DONOR_COUNT_DISPLAY_MAX.toLocaleString("vi-VN")}` : value.toLocaleString("vi-VN");

const formatAverageDonationDisplay = (value) =>
  value > AVERAGE_DONATION_DISPLAY_MAX
    ? `> ${AVERAGE_DONATION_DISPLAY_MAX.toLocaleString("vi-VN")} VND`
    : `${value.toLocaleString("vi-VN")} VND`;

const formatVndDisplay = (value) => `${Number(value ?? 0).toLocaleString("vi-VN")} VND`;

export default function DonationFundInfoPanel({ fundDetail }) {
  const { t } = useTranslation("donation");
  const navigate = useOrgNavigate();
  const location = useLocation();
  const currentUserId = useNetworkCurrentMemberId();

  const donorCountValue = Number(fundDetail?.donorCount ?? 0);
  const averageDonationValue = donorCountValue > 0 ? Number(fundDetail?.currentAmount ?? 0) / donorCountValue : 0;
  const progressValue = Math.min(100, Math.round(((fundDetail?.currentAmount ?? 0) / Math.max(fundDetail?.targetAmount ?? 1, 1)) * 100));

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [peer, setPeer] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const { checkStatus } = useCheckConversationRequestStatus();

  const managerUserId = fundDetail?.managerUserId ?? null;
  const isManagerExists = managerUserId != null;
  const isCurrentUserManager = isManagerExists && currentUserId != null && managerUserId === currentUserId;
  const showConnectBtn = isManagerExists && !isCurrentUserManager;

  const handleConnect = async () => {
    if (currentUserId == null) {
      navigate('/auth/login', { state: { from: location } });
      return;
    }
    const status = await checkStatus(managerUserId);
    setPeer({ userId: managerUserId, avatarUrl: fundDetail.managerAvatarUrl ?? null });
    setConnectionStatus(status);
    setDrawerOpen(true);
  };

  return (
    <Box sx={{ p: { xs: 0, md: 1 }, height: "100%", display: "flex", flexDirection: "column" }}>
      <Typography sx={{ color: "primary.main", fontWeight: 800, fontSize: { xs: "1.2rem", md: "1.3rem" }, mb: 1.2 }}>
        {t("fund_info")}
      </Typography>
      <Typography sx={{ mt: 1.2, color: "text.secondary", fontSize: "0.98rem", fontWeight: 600 }}>
        {t("manager_label")}:{" "}
        <Box component="span" sx={{ color: "text.primary", fontWeight: 700 }}>
          {fundDetail?.managerName || "--"}
        </Box>
      </Typography>

      {/* Email + nút Kết nối / chip "bạn là manager" */}
      <Box sx={{ mt: 1.2, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Typography sx={{ color: "text.secondary", fontSize: "0.98rem", fontWeight: 600 }}>
          {t("manager_email_label")}:{" "}
          <Box component="span" sx={{ color: "text.primary", fontWeight: 700 }}>
            {fundDetail?.managerEmail || "--"}
          </Box>
        </Typography>
        {isCurrentUserManager && (
          <Chip
            label={t("manager_is_you")}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontSize: "0.78rem" }}
          />
        )}
        {showConnectBtn && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<ConnectWithoutContactOutlinedIcon fontSize="small" />}
            onClick={handleConnect}
            sx={{ textTransform: "none", fontSize: "0.82rem", py: 0.3, px: 1.2 }}
          >
            {t("connect_btn")}
          </Button>
        )}
      </Box>

      <Typography sx={{ mt: 1.2, color: "text.secondary", fontSize: "0.98rem", fontWeight: 600 }}>
        {t("start_date_label")}:{" "}
        <Box component="span" sx={{ color: "text.primary", fontWeight: 700 }}>
          {fundDetail?.timeStarted ? dayjs(fundDetail.timeStarted).format("DD/MM/YYYY") : "--"}
        </Box>
      </Typography>
      <Typography sx={{ mt: 0.4, color: "text.secondary", fontSize: "0.98rem", fontWeight: 600 }}>
        {t("end_date_label")}:{" "}
        <Box component="span" sx={{ color: "text.primary", fontWeight: 700 }}>
          {fundDetail?.timeEnded ? dayjs(fundDetail.timeEnded).format("DD/MM/YYYY") : "--"}
        </Box>
      </Typography>

      <Box sx={{ mt: 1.4 }}>
        <Box sx={{ mb: 0.7, display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 0.8 }}>
          <Typography sx={{ color: "text.secondary", fontSize: "0.88rem", fontWeight: 600, fontStyle: "italic" }}>
            {t("progress_label")}
          </Typography>
          <Typography sx={{ color: "text.primary", fontWeight: 800, fontSize: "0.92rem" }}>
            {formatVndDisplay(fundDetail?.currentAmount)} / {formatVndDisplay(fundDetail?.targetAmount)}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progressValue}
          sx={{
            height: 28,
            borderRadius: 999,
            backgroundColor: "action.hover",
            overflow: "hidden",
            "& .MuiLinearProgress-bar": { borderRadius: 999, backgroundColor: "primary.main" },
          }}
        />
      </Box>

      <Grid container spacing={2} sx={{ mt: 1.8 }}>
        <Grid size={6}>
          <Typography sx={{ fontWeight: 800, color: "text.primary", fontSize: "1.5rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {formatDonorCountDisplay(donorCountValue)}
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: "0.92rem", fontWeight: 600 }}>{t("donor_count_label")}</Typography>
        </Grid>
        <Grid size={6}>
          <Typography sx={{ fontWeight: 800, color: "text.primary", fontSize: "1.2rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {formatAverageDonationDisplay(averageDonationValue)}
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: "0.92rem", fontWeight: 600 }}>{t("average_label")}</Typography>
        </Grid>
      </Grid>

      <NetworkMessageDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        peer={peer}
        connectionStatus={connectionStatus}
        variant="connect"
        contextTitle={t("connect_drawer_title")}
        contextSubtitle={fundDetail?.managerEmail}
        contextNote={t("connect_drawer_note")}
      />
    </Box>
  );
}
