import { Box, Typography, Button, LinearProgress, Stack } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useState } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { truncateText } from "../../utils/text";
import { formatCurrency } from "../../utils/numberFormatter";
import { formatDate } from "../../utils/dateFormatter";

const CAMPAIGN_DESCRIPTION_MAX_CHARS = 120;
const LOGO_FALLBACK_URL = "https://placehold.co/800x450/eef3ff/0f3a7a?text=Fund";

const ArticleDonationCard = ({ campaign, onNavigate, onEdit, onClose, isAdmin }) => {
  const { t } = useTranslation(['common', 'donation']);
  const now = dayjs();
  const startTime = campaign.timeStarted ? dayjs(campaign.timeStarted) : null;
  const endTime = campaign.timeEnded ? dayjs(campaign.timeEnded) : null;

  const isEnded = Boolean(startTime && endTime && startTime.isValid() && endTime.isValid()) &&
    startTime.isBefore(endTime) && endTime.isBefore(now);
  const isClosed = isEnded;

  const progressValue = Math.min(100, Math.round(((campaign.currentAmount ?? 0) / Math.max(campaign.targetAmount ?? 1, 1)) * 100));
  const startedAt = formatDate(campaign.timeStarted);
  const endedAt = formatDate(campaign.timeEnded);
  
  const [hovered, setHovered] = useState(false);

  return (
    <Box
      onClick={onNavigate}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        gap: 1,
        cursor: "pointer",
        width: "100%",
        transition: "transform 0.25s ease",
        transform: hovered
          ? "translateY(-4px)"
          : "translateY(0)",
      }}
    >
      {/* IMAGE */}
      <Box
        sx={{
          width: "100%",
          height: 180,
          borderRadius: 1,
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <Box
          component="img"
          src={campaign.logoUrl || LOGO_FALLBACK_URL}
          alt={campaign.name}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.4s ease",
            transform: hovered
              ? "scale(1.06)"
              : "scale(1)",
          }}
        />
      </Box>

      {/* MAIN INFO */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          gap: 0.5,
        }}
      >
        {/* DATE */}
        <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 600 }}>
          {`${startedAt} - ${endedAt}`}
        </Typography>

        {/* FUND NAME */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 0.5,
          }}
        >
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflowWrap: "anywhere",

              color: hovered
                ? "primary.main"
                : "text.primary",

              transition: "color 0.2s ease",
            }}
          >
            {campaign.name}
          </Typography>

          <ArrowForwardIcon
            fontSize="small"
            sx={{
              mt: "3px",
              flexShrink: 0,
              color: "primary.main",
              opacity: hovered ? 1 : 0,
              transform: hovered
                ? "translateX(0)"
                : "translateX(-6px)",
              transition:
                "opacity 0.2s ease, transform 0.2s ease",
            }}
          />
        </Box>

        {/* ORGANIZER */}
        <Typography variant="body2" color="text.secondary" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {campaign.managerName || t('donation:organizer_fallback')}
        </Typography>

        {/* STATS */}
        <Typography variant="caption" color="text.secondary">
          {t('donation:donor_count', { count: campaign.donorCount ?? 0 })}
        </Typography>

        {/* ENDED STATUS */}
        {isEnded && (
          <Box sx={{ mt: 1, alignSelf: "flex-start", px: 1, py: 0.35, borderRadius: 999, border: "1px solid #d7e5fb", backgroundColor: "#f3f8ff", color: "#5f79a4", fontSize: "0.72rem", fontWeight: 800, letterSpacing: 0.2 }}>
            {t('common:ended')}
          </Box>
        )}
      </Box>

      {/* DESCRIPTION */}
      <Typography
          variant="body2"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
      >
        {truncateText(campaign.descriptionShort || "", CAMPAIGN_DESCRIPTION_MAX_CHARS)}
      </Typography>

      <Box sx={{ flex: 1 }} />

      {/* ADMIN PROGRESS */}
      {isAdmin && (
        <Box>
          <Typography sx={{ mb: 0.7, color: "primary.main", fontWeight: 700, fontSize: "0.84rem" }}>
            {`${formatCurrency(campaign.currentAmount)} / ${formatCurrency(campaign.targetAmount)} (VND)`}
          </Typography>

          <LinearProgress variant="determinate" value={progressValue} sx={{ height: 10, borderRadius: 999, overflow: "hidden" }} />
        </Box>
      )}

      {/* ACTION BUTTON */}
      {isClosed ? (
        <Button
          fullWidth variant="outlined" color="primary" sx={{ textTransform: "none", fontWeight: 600 }}
          onClick={(e) => { e.stopPropagation(); onNavigate?.(); }}
        >
          {t('common:view')}
        </Button>
      ) : isAdmin ? (
        <Stack spacing={1}>
          <Button
            fullWidth variant="outlined" color="primary" startIcon={<InfoOutlinedIcon />} sx={{ textTransform: "none", fontWeight: 600 }}
            onClick={(e) => { e.stopPropagation(); onNavigate?.(); }}
          >
            {t('donation:fund_info')}
          </Button>

          <Stack direction="row" spacing={1}>
            <Button
              fullWidth variant="outlined" color="secondary" startIcon={<EditOutlinedIcon />} sx={{ textTransform: "none", fontWeight: 600 }}
              onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
            >
              {t('common:edit')}
            </Button>

            <Button
              fullWidth variant="contained" startIcon={<LockOutlinedIcon />}
              sx={{
                textTransform: "none", fontWeight: 600, backgroundColor: "warning.main", color: "common.white",
                "&:hover": { backgroundColor: "warning.dark" },
              }}
              onClick={(e) => { e.stopPropagation(); onClose?.(); }}
            >
              {t('common:close')}
            </Button>
          </Stack>
        </Stack>
      ) : (
        <Button
          fullWidth variant="contained" color="primary" sx={{ textTransform: "none", fontWeight: 600 }}
          onClick={(e) => { e.stopPropagation(); onNavigate?.(); }}
        >
          {t('donation:donate')}
        </Button>
      )}
    </Box>
  );
};

export default ArticleDonationCard;