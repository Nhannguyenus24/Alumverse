import { Box, Typography, Button, LinearProgress, Stack } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import dayjs from "dayjs";
import { truncateText } from "../../utils/text";

const CAMPAIGN_DESCRIPTION_MAX_CHARS = 120;
const LOGO_FALLBACK_URL = "https://placehold.co/800x450/eef3ff/0f3a7a?text=Fund";

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN").format(Number(value ?? 0));
}

const ArticleDonationCard = ({ campaign, onNavigate, onEdit, onClose, isAdmin }) => {
  const now = dayjs();
  const startTime = campaign.timeStarted ? dayjs(campaign.timeStarted) : null;
  const endTime = campaign.timeEnded ? dayjs(campaign.timeEnded) : null;

  const isEnded = Boolean(startTime && endTime && startTime.isValid() && endTime.isValid()) &&
    startTime.isBefore(endTime) && endTime.isBefore(now);

  const progressValue = Math.min(100, Math.round(((campaign.currentAmount ?? 0) / Math.max(campaign.targetAmount ?? 1, 1)) * 100));
  const startedAt = campaign.timeStarted ? dayjs(campaign.timeStarted).format("DD/MM/YYYY") : "--";
  const endedAt = campaign.timeEnded ? dayjs(campaign.timeEnded).format("DD/MM/YYYY") : "--";

  return (
    <Box onClick={onNavigate} sx={{ display: "flex", flexDirection: "column", gap: 2, cursor: "pointer", width: "100%" }}>
      {/* IMAGE */}
      <Box component="img" src={campaign.logoUrl || LOGO_FALLBACK_URL} alt={campaign.name} sx={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 1 }} />

      {/* MAIN INFO */}
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {/* DATE */}
        <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 600 }}>
          {`${startedAt} - ${endedAt}`}
        </Typography>

        {/* FUND NAME */}
        <Typography
          variant="h4" fontWeight={700}
          sx={{
            overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box",
            WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflowWrap: "anywhere",
          }}
        >
          {campaign.name}
        </Typography>

        {/* ORGANIZER */}
        <Typography variant="body2" color="text.secondary" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {campaign.managerName || "Ban tổ chức"}
        </Typography>

        {/* STATS */}
        <Typography variant="caption" color="text.secondary">
          {campaign.donorCount ?? 0} người đã quyên góp
        </Typography>

        {/* ENDED STATUS */}
        {isEnded && (
          <Box sx={{ mt: 1, alignSelf: "flex-start", px: 1, py: 0.35, borderRadius: 999, border: "1px solid #d7e5fb", backgroundColor: "#f3f8ff", color: "#5f79a4", fontSize: "0.72rem", fontWeight: 800, letterSpacing: 0.2 }}>
            Đã kết thúc
          </Box>
        )}
      </Box>

      {/* DESCRIPTION */}
      <Typography variant="body2">
        {truncateText(campaign.descriptionShort || "", CAMPAIGN_DESCRIPTION_MAX_CHARS)}
      </Typography>

      {/* ADMIN PROGRESS */}
      {isAdmin && (
        <Box>
          <Typography sx={{ mb: 0.7, color: "text.primary", fontWeight: 600, fontSize: "0.84rem" }}>
            {`${formatCurrency(campaign.currentAmount)} / ${formatCurrency(campaign.targetAmount)} (VND)`}
          </Typography>
          <LinearProgress variant="determinate" value={progressValue} sx={{ height: 10, borderRadius: 999, overflow: "hidden" }} />
        </Box>
      )}

      {/* ACTION BUTTON */}
      {isAdmin ? (
        <Stack direction="row" spacing={1}>
          <Button fullWidth variant="outlined" startIcon={<EditOutlinedIcon />} sx={{ textTransform: "none", fontWeight: 600 }} onClick={(e) => { e.stopPropagation(); onEdit?.(); }}>
            Huỷ
          </Button>
          <Button fullWidth variant="contained" startIcon={<LockOutlinedIcon />} sx={{ textTransform: "none", fontWeight: 600 }} onClick={(e) => { e.stopPropagation(); onClose?.(); }}>
            Đóng
          </Button>
        </Stack>
      ) : (
        <Button fullWidth variant="contained" color="primary" sx={{ textTransform: "none", fontWeight: 600 }} onClick={(e) => { e.stopPropagation(); onNavigate?.(); }}>
          Quyên góp
        </Button>
      )}
    </Box>
  );
};

export default ArticleDonationCard;