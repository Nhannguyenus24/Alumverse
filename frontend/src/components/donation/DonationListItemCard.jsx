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
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper",
        px: { xs: 1.4, sm: 2 },
        py: 1.4,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.2,
        transition: "background-color 0.2s ease, border-color 0.2s ease",
        "&:hover": {
          backgroundColor: "action.hover",
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
                backgroundColor: "success.main",
                border: "2px solid",
                borderColor: "background.paper",
              }}
            />
          }
        >
          <Avatar src={item.avatarUrl || DONATION_AVATAR_FALLBACK} alt={item.donorName} sx={{ width: 52, height: 52 }} />
        </Badge>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: "text.primary", fontWeight: 800, fontSize: "1rem", lineHeight: 1.3 }} noWrap>
            {item.donorName}
          </Typography>
          <Typography
            sx={{
              color: "text.secondary",
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
              color: "text.secondary",
              fontSize: "0.8rem",
              mt: 0.5,
              lineHeight: 1.45,
            }}
          >
            {t('donation:donor_phone_email', { phone: item.phone || '--', email: item.email || '--' })}
          </Typography>
          <Typography
            sx={{
              color: "text.secondary",
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
          <Typography sx={{ color: "text.disabled", fontSize: "0.78rem", mt: 0.45 }}>
            {formatDonationTimestamp(item.createdAt)}
          </Typography>
        </Box>
      </Stack>

      <Typography
        sx={{
          color: "primary.main",
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
