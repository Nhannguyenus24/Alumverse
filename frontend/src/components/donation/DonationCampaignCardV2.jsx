import { Box, Button, Card, CardContent, CardMedia, LinearProgress, Stack, Typography } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import dayjs from "dayjs";
import { truncateText } from "../../utils/text";

const CAMPAIGN_DESCRIPTION_MAX_CHARS = 120;
const LOGO_FALLBACK_URL = "https://placehold.co/800x450/eef3ff/0f3a7a?text=Fund";

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN").format(Number(value ?? 0));
}

export default function DonationCampaignCardV2({ campaign, onNavigate, onEdit, onClose, isAdmin }) {
  const now = dayjs();
  const startTime = campaign.timeStarted ? dayjs(campaign.timeStarted) : null;
  const endTime = campaign.timeEnded ? dayjs(campaign.timeEnded) : null;
  const isEnded =
    Boolean(startTime && endTime && startTime.isValid() && endTime.isValid()) && startTime.isBefore(endTime) && endTime.isBefore(now);
  const progressValue = Math.min(
    100,
    Math.round(((campaign.currentAmount ?? 0) / Math.max(campaign.targetAmount ?? 1, 1)) * 100)
  );
  const startedAt = campaign.timeStarted ? dayjs(campaign.timeStarted).format("DD/MM/YYYY") : "--";
  const endedAt = campaign.timeEnded ? dayjs(campaign.timeEnded).format("DD/MM/YYYY") : "--";

  return (
    <Card
      elevation={0}
      onClick={onNavigate}
      sx={{
        height: { xs: "auto", md: 470 },
        width: "100%",
        cursor: "pointer",
        borderRadius: 3,
        border: isEnded ? "2px solid #0f3a7a" : "1px solid #dbe5f5",
        overflow: "hidden",
        transition: "all 0.25s ease",
        boxShadow: "0 8px 24px rgba(18, 59, 122, 0.08)",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 14px 30px rgba(18, 59, 122, 0.15)",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "stretch",
          gap: 3,
          p: 2.2,
          height: { xs: "auto", md: "100%" },
        }}
      >
        <CardMedia
          component="img"
          image={campaign.logoUrl || LOGO_FALLBACK_URL}
          alt={campaign.name}
          sx={{
            width: { xs: "100%", md: "40%" },
            height: { xs: 190, md: "100%" },
            borderRadius: 2,
            objectFit: "cover",
            flexShrink: 0,
          }}
        />

        <CardContent
          sx={{
            p: 0,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 0.9,
            minWidth: 0,
            height: { xs: "auto", md: "100%" },
          }}
        >
          <Typography variant="caption" sx={{ color: "#5c75a4", fontWeight: 600 }}>
            {`${startedAt} - ${endedAt}`}
          </Typography>

          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: "#0f2f5e",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflowWrap: "anywhere",
            }}
          >
            {campaign.name}
          </Typography>

          <Typography sx={{ color: "#4b6088", fontSize: "0.92rem", fontWeight: 500 }}>
            {campaign.managerName || "Chưa cập nhật"}
          </Typography>

          <Typography sx={{ color: "#6480b2", fontSize: "0.86rem" }}>{campaign.donorCount ?? 0} người đã quyên góp</Typography>

          {isEnded ? (
            <Box
              sx={{
                alignSelf: "flex-start",
                px: 1,
                py: 0.35,
                borderRadius: 999,
                border: "1px solid #d7e5fb",
                backgroundColor: "#f3f8ff",
                color: "#5f79a4",
                fontSize: "0.72rem",
                fontWeight: 800,
                letterSpacing: 0.2,
              }}
            >
              Đã kết thúc
            </Box>
          ) : null}

          <Typography
            sx={{
              color: "#334968",
              lineHeight: 1.5,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflowWrap: "anywhere",
            }}
          >
            {truncateText(campaign.descriptionShort || "", CAMPAIGN_DESCRIPTION_MAX_CHARS)}
          </Typography>

          <Box sx={{ mt: { xs: 0.8, md: "auto" }, pt: 1 }}>
            <Typography sx={{ mb: 0.7, color: "#2f4b75", fontWeight: 700, fontSize: "0.84rem" }}>
              {`${formatCurrency(campaign.currentAmount)} / ${formatCurrency(campaign.targetAmount)} (VND)`}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progressValue}
              sx={{
                height: 14,
                borderRadius: 999,
                backgroundColor: "#e4e7ef",
                overflow: "hidden",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 999,
                  backgroundColor: "#123b7a",
                },
              }}
            />
          </Box>

          {isAdmin ? (
            <Stack direction="row" spacing={1} sx={{ mt: 1.4 }}>
              <Button
                variant="outlined"
                startIcon={<EditOutlinedIcon />}
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit?.();
                }}
                sx={{
                  borderRadius: 2,
                  px: 1.6,
                  minHeight: 36,
                  textTransform: "none",
                  fontWeight: 700,
                  color: "#2f3643",
                  borderColor: "#cdd3e1",
                }}
              >
                Sửa
              </Button>
              <Button
                variant="contained"
                startIcon={<LockOutlinedIcon />}
                onClick={(event) => {
                  event.stopPropagation();
                  onClose?.();
                }}
                sx={{
                  borderRadius: 2,
                  px: 1.6,
                  minHeight: 36,
                  textTransform: "none",
                  fontWeight: 700,
                  backgroundColor: "#f2cd3c",
                  color: "#29231a",
                  boxShadow: "none",
                  "&:hover": {
                    backgroundColor: "#e2bd2f",
                    boxShadow: "none",
                  },
                }}
              >
                Đóng
              </Button>
            </Stack>
          ) : (
            <Box sx={{ mt: 1.4 }}>
              <Button
                variant="contained"
                onClick={(event) => {
                  event.stopPropagation();
                  onNavigate?.();
                }}
                sx={{
                  borderRadius: 999,
                  px: 2.4,
                  py: 1,
                  textTransform: "none",
                  fontWeight: 700,
                  backgroundColor: "#1155cc",
                  "&:hover": { backgroundColor: "#0d45a3" },
                }}
              >
                Quyên góp
              </Button>
            </Box>
          )}
        </CardContent>
      </Box>
    </Card>
  );
}
