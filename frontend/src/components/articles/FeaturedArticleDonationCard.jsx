import { Box, Typography, Button, LinearProgress, Stack } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import dayjs from "dayjs";
import { truncateText } from "../../utils/text";
import { formatCurrency } from "../../utils/numberFormatter";
import { formatDate } from "../../utils/dateFormatter";

const LOGO_FALLBACK_URL = "https://placehold.co/1200x700/eef3ff/0f3a7a?text=Fund";
const CAMPAIGN_DESCRIPTION_MAX_CHARS = 220;

const FeaturedArticleDonationCard = ({ campaign, article, onNavigate, onEdit, onClose, isAdmin }) => {
  const data = campaign || article;

  const now = dayjs();
  const startTime = data?.timeStarted ? dayjs(data.timeStarted) : null;
  const endTime = data?.timeEnded ? dayjs(data.timeEnded) : null;

  const isEnded = Boolean(startTime && endTime && startTime.isValid() && endTime.isValid()) &&
    startTime.isBefore(endTime) && endTime.isBefore(now);

  const isClosed =
    isEnded ||
    data?.status === "CLOSED" ||
    data?.statusName === "CLOSED" ||
    data?.statusName === "Đã đóng";

  const progressValue = Math.min(100, Math.round(((data?.currentAmount ?? 0) / Math.max(data?.targetAmount ?? 1, 1)) * 100));
  const startedAt = formatDate(data?.timeStarted);
  const endedAt = formatDate(data?.timeEnded);

  return (
    <Box onClick={onNavigate} sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { xs: "stretch", md: "center" }, width: "100%", gap: 3, cursor: "pointer" }}>
      {/* IMAGE */}
      <Box
        component="img" src={data?.logoUrl || data?.image || LOGO_FALLBACK_URL} alt={data?.name || data?.title}
        sx={{ width: { xs: "100%", md: "45%" }, height: { xs: 220, md: 280 }, objectFit: "cover", borderRadius: 2, flexShrink: 0 }}
      />

      {/* CONTENT */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1.5, minWidth: 0 }}>
        {/* INFO BLOCK */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.7 }}>
          {/* DATE */}
          <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 700 }}>
            {`${startedAt} - ${endedAt}`}
          </Typography>

          {/* TITLE */}
          <Typography
            variant="h2" fontWeight={700}
            sx={{
              fontSize: { xs: "1.5rem", md: "2rem" }, lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis",
              display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflowWrap: "anywhere",
            }}
          >
            {data?.name || data?.title}
          </Typography>

          {/* ORGANIZER */}
          <Typography variant="body2" color="text.secondary" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {data?.managerName || data?.organizer || "Ban tổ chức"}
          </Typography>

          {/* STATS */}
          <Typography variant="caption" color="text.secondary">
            {data?.donorCount || data?.donors || 0} người đã quyên góp
          </Typography>

          {/* CLOSED STATUS */}
          {isEnded && (
            <Box sx={{ mt: 0.5, alignSelf: "flex-start", px: 1.2, py: 0.45, borderRadius: 999, border: "1px solid #d7e5fb", backgroundColor: "#f3f8ff", color: "#5f79a4", fontSize: "0.72rem", fontWeight: 800, letterSpacing: 0.2 }}>
              Đã kết thúc
            </Box>
          )}
        </Box>

        {/* DESCRIPTION */}
        <Typography sx={{ mt: 0.5 }}>
          {truncateText(data?.descriptionShort || data?.description || "", CAMPAIGN_DESCRIPTION_MAX_CHARS)}
        </Typography>

        {/* ADMIN PROGRESS */}
        {isAdmin && (
          <Box sx={{ mt: 0.5 }}>
            <Typography sx={{ mb: 0.8, color: "primary.main", fontWeight: 700, fontSize: "0.92rem" }}>
              {`${formatCurrency(data?.currentAmount)} / ${formatCurrency(data?.targetAmount)} (VND)`}
            </Typography>

            <LinearProgress variant="determinate" value={progressValue} sx={{ height: 12, borderRadius: 999, overflow: "hidden" }} />
          </Box>
        )}

        {/* ACTION BUTTONS */}
        <Box sx={{ mt: 2, display: "flex" }}>
          {isClosed ? (
            <Button
              fullWidth variant="outlined" color="primary" sx={{ textTransform: "none", fontWeight: 600, py: 1.2 }}
              onClick={(e) => { e.stopPropagation(); onNavigate?.(); }}
            >
              Xem
            </Button>
          ) : isAdmin ? (
            <Stack direction="row" spacing={1.2} sx={{ width: "100%" }}>
              <Button
                fullWidth variant="outlined" color="secondary" startIcon={<EditOutlinedIcon />} sx={{ textTransform: "none", fontWeight: 600, py: 1.2 }}
                onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
              >
                Sửa
              </Button>

              <Button
                fullWidth variant="contained" startIcon={<LockOutlinedIcon />}
                sx={{
                  textTransform: "none", fontWeight: 600, py: 1.2, backgroundColor: "warning.main", color: "common.white",
                  "&:hover": { backgroundColor: "warning.dark" },
                }}
                onClick={(e) => { e.stopPropagation(); onClose?.(); }}
              >
                Đóng
              </Button>
            </Stack>
          ) : (
            <Button
              fullWidth variant="contained" color="primary" sx={{ textTransform: "none", fontWeight: 600, py: 1.2 }}
              onClick={(e) => { e.stopPropagation(); onNavigate?.(); }}
            >
              Quyên góp
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default FeaturedArticleDonationCard;