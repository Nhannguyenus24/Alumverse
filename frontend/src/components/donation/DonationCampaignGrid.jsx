import { Box, Button, Card, CardContent, CardMedia, LinearProgress, Stack, Typography } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import styled from "@emotion/styled";
import dayjs from "dayjs";
import { truncateText } from "../../utils/text";
import DonationCampaignCardV2 from "./DonationCampaignCardV2";

const CAMPAIGN_DESCRIPTION_MAX_CHARS = 120;
const LOGO_FALLBACK_URL = "https://placehold.co/800x450/eef3ff/0f3a7a?text=Fund";

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN").format(Number(value ?? 0));
}

const ProgressActionRoot = styled(Box)({
  marginTop: "auto",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "end",
  gap: 10,
});

const ProgressTrack = styled(LinearProgress)({
  height: 32,
  borderRadius: 999,
  backgroundColor: "#e4e7ef",
  overflow: "hidden",
  "& .MuiLinearProgress-bar": {
    borderRadius: 999,
    backgroundColor: "#123b7a",
  },
});

function ProgressActionBar({ progress, amountLabel, onEdit, onClose }) {
  return (
    <ProgressActionRoot>
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        <Typography sx={{ mb: 0.7, color: "#2f4b75", fontWeight: 700, fontSize: "0.84rem" }}>{amountLabel}</Typography>
        <ProgressTrack variant="determinate" value={progress} />
      </Box>
      <Stack direction="row" spacing={1} sx={{ alignItems: "flex-end" }}>
        <Button
          variant="outlined"
          startIcon={<EditOutlinedIcon />}
          onClick={onEdit}
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
          onClick={onClose}
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
    </ProgressActionRoot>
  );
}

function CampaignCard({ campaign, onNavigate, onEdit, onClose, isAdmin }) {
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
        height: 470,
        width: "100%",
        minWidth: 0,
        cursor: "pointer",
        borderRadius: 3,
        border: isEnded ? "6px solid #0f3a7a" : "1px solid #e4ebfa",
        overflow: "hidden",
        transition: "all 0.25s ease",
        boxShadow: "0 8px 24px rgba(18, 59, 122, 0.08)",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 14px 30px rgba(18, 59, 122, 0.15)",
        },
      }}
    >
      <CardMedia component="img" image={campaign.logoUrl || LOGO_FALLBACK_URL} alt={campaign.name} sx={{ height: 170, width: "100%" }} />
      <CardContent sx={{ p: 2.2, display: "flex", flexDirection: "column", gap: 0.9, minWidth: 0, height: 300 }}>
        <Typography variant="caption" sx={{ color: "#5c75a4", fontWeight: 600 }}>
          {`${startedAt} - ${endedAt}`}
        </Typography>
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
          variant="h6"
          sx={{
            fontWeight: 700,
            fontSize: "1.02rem",
            color: "#0f2f5e",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            minWidth: 0,
            overflowWrap: "anywhere",
          }}
        >
          {campaign.name}
        </Typography>
        <Typography
          sx={{
            color: "#4b6088",
            fontSize: "0.92rem",
            fontWeight: 500,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            minWidth: 0,
          }}
        >
          {campaign.managerName || "Chưa cập nhật"}
        </Typography>
        <Typography sx={{ color: "#6480b2", fontSize: "0.86rem" }}>{campaign.donorCount ?? 0} người đã quyên góp</Typography>
        <Typography
          sx={{
            color: "#334968",
            lineHeight: 1.5,
            minHeight: 64,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            minWidth: 0,
            overflowWrap: "anywhere",
          }}
        >
          {truncateText(campaign.descriptionShort || "", CAMPAIGN_DESCRIPTION_MAX_CHARS)}
        </Typography>
        {isAdmin ? (
          <ProgressActionBar
            progress={progressValue}
            amountLabel={`${formatCurrency(campaign.currentAmount)} / ${formatCurrency(campaign.targetAmount)} (VND)`}
            onEdit={(event) => {
              event.stopPropagation();
              onEdit?.();
            }}
            onClose={(event) => {
              event.stopPropagation();
              onClose?.();
            }}
          />
        ) : (
          <Button
            variant="contained"
            onClick={(event) => {
              event.stopPropagation();
              onNavigate();
            }}
            sx={{
              mt: "auto",
              borderRadius: 999,
              py: 1,
              textTransform: "none",
              fontWeight: 700,
              backgroundColor: "#1155cc",
              "&:hover": { backgroundColor: "#0d45a3" },
            }}
          >
            Quyên góp
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function DonationCampaignGrid({ campaigns, isAdmin, onNavigate, onEdit, onClose, useV2Card = false }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "minmax(0, 1fr)",
          sm: "repeat(2, minmax(0, 1fr))",
          md: "repeat(3, minmax(0, 1fr))",
        },
        gap: 2.5,
      }}
    >
      {campaigns.map((campaign) => (
        <Box key={campaign.id} sx={{ display: "flex", minWidth: 0 }}>
          {useV2Card ? (
            <DonationCampaignCardV2
              campaign={campaign}
              onNavigate={() => onNavigate(campaign)}
              onEdit={() => onEdit(campaign)}
              onClose={() => onClose(campaign)}
              isAdmin={isAdmin}
            />
          ) : (
            <CampaignCard
              campaign={campaign}
              onNavigate={() => onNavigate(campaign)}
              onEdit={() => onEdit(campaign)}
              onClose={() => onClose(campaign)}
              isAdmin={isAdmin}
            />
          )}
        </Box>
      ))}
    </Box>
  );
}
