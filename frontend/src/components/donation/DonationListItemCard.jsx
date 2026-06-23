import { Avatar, Badge, Box, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  DONATION_AVATAR_FALLBACK,
  formatDonationAmount,
  formatDonationTimestamp,
} from "../../utils/regexUtils";

export default function DonationListItemCard({ item }) {
  const { t } = useTranslation('donation');

  return (
    <Box
      sx={{
        border: "1px solid #e4e9f4",
        borderRadius: 2.5,
        backgroundColor: "#ffffff",
        px: { xs: 1.4, sm: 2 },
        py: 1.4,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.2,
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
        "&:hover": {
          boxShadow: "0 10px 22px rgba(15, 58, 122, 0.12)",
          transform: "translateY(-1px)",
        },
      }}
    >
      <Stack direction="row" spacing={1.4} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          badgeContent={
            <Box
              sx={{
                width: 11,
                height: 11,
                borderRadius: "50%",
                backgroundColor: "#22c55e",
                border: "2px solid #ffffff",
              }}
            />
          }
        >
          <Avatar src={item.avatarUrl || DONATION_AVATAR_FALLBACK} alt={item.donorName} sx={{ width: 52, height: 52 }} />
        </Badge>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: "#0f2f5f", fontWeight: 800, fontSize: "1rem", lineHeight: 1.3 }} noWrap>
            {item.donorName}
          </Typography>
          <Typography
            sx={{
              color: "#7184a3",
              fontSize: "0.88rem",
              mt: 0.3,
              lineHeight: 1.35,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.message || "--"}
          </Typography>
          <Typography
            sx={{
              color: "#5f7395",
              fontSize: "0.8rem",
              mt: 0.5,
              lineHeight: 1.45,
            }}
          >
            {t('donation:donor_phone_email', { phone: item.phone || '--', email: item.email || '--' })}
          </Typography>
          <Typography
            sx={{
              color: "#5f7395",
              fontSize: "0.8rem",
              mt: 0.15,
              lineHeight: 1.45,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={item.address || "--"}
          >
            {t('donation:donor_address', { address: item.address || '--' })}
          </Typography>
          <Typography sx={{ color: "#8c9ab2", fontSize: "0.78rem", mt: 0.45 }}>
            {formatDonationTimestamp(item.createdAt)}
          </Typography>
        </Box>
      </Stack>

      <Typography
        sx={{
          color: "#1155cc",
          fontWeight: 800,
          fontSize: { xs: "1rem", sm: "1.15rem" },
          whiteSpace: "nowrap",
          ml: 1,
        }}
      >
        {formatDonationAmount(item.amount)}
      </Typography>
    </Box>
  );
}
