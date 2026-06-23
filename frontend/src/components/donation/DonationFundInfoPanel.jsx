import { Box, Grid, LinearProgress, Typography } from "@mui/material";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

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
  const donorCountValue = Number(fundDetail?.donorCount ?? 0);
  const averageDonationValue = donorCountValue > 0 ? Number(fundDetail?.currentAmount ?? 0) / donorCountValue : 0;
  const progressValue = Math.min(100, Math.round(((fundDetail?.currentAmount ?? 0) / Math.max(fundDetail?.targetAmount ?? 1, 1)) * 100));

  return (
    <Box sx={{ p: { xs: 0, md: 1 }, height: "100%", display: "flex", flexDirection: "column" }}>
      <Typography sx={{ color: "#113f86", fontWeight: 800, fontSize: { xs: "1.2rem", md: "1.3rem" }, mb: 1.2 }}>
        {t("fund_info")}
      </Typography>
      <Typography sx={{ mt: 1.2, color: "#365886", fontSize: "0.94rem", fontWeight: 600 }}>
        {t("manager_label")}: {fundDetail?.managerName || "--"}
      </Typography>
      <Typography sx={{ mt: 1.2, color: "#5f78a4", fontSize: "0.92rem" }}>
        {t("start_date_label")}: {fundDetail?.timeStarted ? dayjs(fundDetail.timeStarted).format("DD/MM/YYYY") : "--"}
      </Typography>
      <Typography sx={{ mt: 0.4, color: "#5f78a4", fontSize: "0.92rem" }}>
        {t("end_date_label")}: {fundDetail?.timeEnded ? dayjs(fundDetail.timeEnded).format("DD/MM/YYYY") : "--"}
      </Typography>

      <Box sx={{ mt: 1.4 }}>
        <Box sx={{ mb: 0.7, display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 0.8 }}>
          <Typography sx={{ color: "#5f78a4", fontSize: "0.82rem", fontStyle: "italic" }}>
            {t("progress_label")}
          </Typography>
          <Typography sx={{ color: "#2f4b75", fontWeight: 700, fontSize: "0.84rem" }}>
            {formatVndDisplay(fundDetail?.currentAmount)} / {formatVndDisplay(fundDetail?.targetAmount)}
          </Typography>
        </Box>
        <LinearProgress variant="determinate" value={progressValue} sx={{ height: 28, borderRadius: 999, backgroundColor: "#e4e7ef", overflow: "hidden", "& .MuiLinearProgress-bar": { borderRadius: 999, backgroundColor: "#123b7a" } }} />
      </Box>

      <Grid container spacing={2} sx={{ mt: 1.8 }}>
        <Grid size={6}>
          <Typography sx={{ fontWeight: 800, color: "#102f59", fontSize: "1.5rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {formatDonorCountDisplay(donorCountValue)}
          </Typography>
          <Typography sx={{ color: "#5f78a4", fontSize: "0.9rem" }}>{t("donor_count_label")}</Typography>
        </Grid>
        <Grid size={6}>
          <Typography sx={{ fontWeight: 800, color: "#102f59", fontSize: "1.2rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {formatAverageDonationDisplay(averageDonationValue)}
          </Typography>
          <Typography sx={{ color: "#5f78a4", fontSize: "0.9rem" }}>{t("average_label")}</Typography>
        </Grid>
      </Grid>
    </Box>
  );
}
