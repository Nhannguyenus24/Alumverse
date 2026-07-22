import { Box, Typography, Button, LinearProgress, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VolunteerActivismOutlinedIcon from "@mui/icons-material/VolunteerActivismOutlined";
import { useState } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { normalizePreviewText, truncateText, getFeaturedTitleFontSize } from "../../utils/text";
import { formatCurrency } from "../../utils/numberFormatter";
import { formatDate } from "../../utils/dateFormatter";

const LOGO_FALLBACK_URL = "https://placehold.co/1200x700/eef3ff/0f3a7a?text=Fund";
const CAMPAIGN_DESCRIPTION_MAX_CHARS = 220;

const FeaturedArticleDonationCard = ({ campaign, article, onNavigate, onEdit, onClose, isAdmin }) => {
  const { t } = useTranslation(['common', 'donation']);
  const data = campaign || article;

  const now = dayjs();
  const startTime = data?.timeStarted ? dayjs(data.timeStarted) : null;
  const endTime = data?.timeEnded ? dayjs(data.timeEnded) : null;

  const isEnded = Boolean(startTime && endTime && startTime.isValid() && endTime.isValid()) &&
    startTime.isBefore(endTime) && endTime.isBefore(now);

  const isClosed = isEnded;

  const progressValue = Math.min(100, Math.round(((data?.currentAmount ?? 0) / Math.max(data?.targetAmount ?? 1, 1)) * 100));
  const startedAt = formatDate(data?.timeStarted);
  const endedAt = formatDate(data?.timeEnded);

  const [hovered, setHovered] = useState(false);

  return (
    <Box
      onClick={onNavigate}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: { xs: "stretch", md: "stretch" },
        width: "100%",
        gap: { xs: 1.25, md: 3 },
        cursor: "pointer",

        transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: hovered
          ? "translateY(-4px)"
          : "translateY(0)",
      }}
    >
      {/* IMAGE */}
      <Box
        sx={{
          position: "relative",
          width: { xs: "100%", md: "45%" },
          height: { xs: 180, sm: 220, md: "auto" },
          minHeight: { xs: 180, sm: 220, md: isAdmin ? 330 : 280 },
          alignSelf: { md: "stretch" },

          borderRadius: 2,
          overflow: "hidden",

          flexShrink: 0,
          boxShadow: hovered
            ? "0 8px 20px rgba(0,0,0,0.12)"
            : "0 2px 8px rgba(0,0,0,0.04)",
          transition: "box-shadow 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          "&::after": {
            content: '""',
            position: "absolute",
            top: 0,
            right: 0,
            width: "140%",
            height: "140%",
            transformOrigin: "100% 0%",
            background: (theme) =>
              `radial-gradient(circle at 100% 0%, ${alpha(theme.palette.primary.main, 0.34)} 0%, ${alpha(
                theme.palette.primary.main,
                0.12
              )} 40%, transparent 75%)`,
            opacity: hovered ? 1 : 0,
            transform: hovered ? "scale(1.15)" : "scale(0.2)",
            transition: "opacity 0.65s cubic-bezier(0.25, 1, 0.5, 1), transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)",
            pointerEvents: "none",
            zIndex: 2,
          },
        }}
      >
        <Box
          component="img"
          src={data?.logoUrl || data?.image || LOGO_FALLBACK_URL}
          alt={data?.name || data?.title}
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

      {/* CONTENT */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          minHeight: { md: isAdmin ? 330 : 280 },
        }}
      >
        {/* INFO BLOCK */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 0.5, md: 1 } }}>
          {/* DATE */}
          <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 700 }}>
            {`${startedAt} - ${endedAt}`}
          </Typography>

          {/* TITLE */}
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 0.5,
              my: { xs: 0, md: 0.5 },
            }}
          >
            <Typography
              variant="h2"
              fontWeight={700}
              sx={{
                flex: 1,

                fontSize: getFeaturedTitleFontSize(data?.name || data?.title),

                color: hovered
                  ? "primary.main"
                  : "text.primary",

                transition: "color 0.2s ease",

                wordBreak: "break-word",
              }}
            >
              {normalizePreviewText(data?.name || data?.title)}
            </Typography>

            <ArrowForwardIcon
              sx={{
                mt: "6px",

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
          <Typography variant="body2" color="text.secondary" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.5 }}>
            {data?.managerName || data?.organizer || t('donation:organizer_fallback')}
          </Typography>

          {/* STATS */}
          <Typography variant="caption" color="text.secondary">
            {t('donation:donor_count', { count: data?.donorCount || data?.donors || 0 })}
          </Typography>

        </Box>

        {/* DESCRIPTION */}
        <Typography
          sx={{
            mt: { xs: 0.75, md: 1.8 },

            display: "-webkit-box",
            WebkitLineClamp: (data?.name || data?.title || "").length > 75 ? 2 : 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            lineHeight: { xs: 1.4, md: 1.6 },
          }}
        >
          {truncateText(
            data?.descriptionShort ||
            data?.description ||
            "",
            CAMPAIGN_DESCRIPTION_MAX_CHARS
          )}
        </Typography>

        {isAdmin && (
          <Box sx={{ mt: { xs: 1, md: 1.5 } }}>
            <Typography sx={{ mb: 0.8, color: "primary.main", fontWeight: 700, fontSize: "0.92rem" }}>
              {`${formatCurrency(data?.currentAmount)} / ${formatCurrency(data?.targetAmount)} (VND)`}
            </Typography>

            <LinearProgress variant="determinate" value={progressValue} sx={{ height: 12, borderRadius: 999, overflow: "hidden" }} />
          </Box>
        )}

        {isEnded && (
          <Box sx={{ mt: 1, alignSelf: "flex-start", px: 1.2, py: 0.45, borderRadius: 999, border: "1px solid", borderColor: "divider", backgroundColor: "action.hover", color: "text.secondary", fontSize: "0.72rem", fontWeight: 800, letterSpacing: 0.2 }}>
            {t('common:ended')}
          </Box>
        )}

        {/* ACTION BLOCK */}
        <Box sx={{ mt: "auto", pt: { xs: 1.25, md: 2.5 }, display: "flex", flexDirection: "column", gap: { xs: 1.5, md: 2.5 } }}>

          {isClosed ? (
            <Button
              fullWidth variant="outlined" color="primary" sx={{ textTransform: "none", fontWeight: 600, py: 1.2 }}
              startIcon={<VisibilityOutlinedIcon />}
              onClick={(e) => { e.stopPropagation(); onNavigate?.(); }}
            >
              {t('common:view')}
            </Button>
          ) : isAdmin ? (
            <Stack spacing={1.2} sx={{ width: "100%" }}>
              <Button
                fullWidth variant="outlined" color="primary" startIcon={<InfoOutlinedIcon />} sx={{ textTransform: "none", fontWeight: 600, py: 1.2 }}
                onClick={(e) => { e.stopPropagation(); onNavigate?.(); }}
              >
                {t('donation:fund_info')}
              </Button>

              <Stack direction="row" spacing={1.2}>
                <Button
                  fullWidth variant="outlined" color="secondary" startIcon={<EditOutlinedIcon />} sx={{ textTransform: "none", fontWeight: 600, py: 1.2 }}
                  onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
                >
                  {t('common:edit')}
                </Button>

                <Button
                  fullWidth variant="contained" startIcon={<LockOutlinedIcon />}
                  sx={{
                    textTransform: "none", fontWeight: 600, py: 1.2, backgroundColor: "warning.main", color: "common.white",
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
              fullWidth variant="contained" color="accent" sx={{ textTransform: "none", fontWeight: 600, py: 1.2 }}
              startIcon={<VolunteerActivismOutlinedIcon />}
              onClick={(e) => { e.stopPropagation(); onNavigate?.(); }}
            >
              {t('donation:donate')}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default FeaturedArticleDonationCard;
