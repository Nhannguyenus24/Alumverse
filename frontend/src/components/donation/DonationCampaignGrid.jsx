import { Box } from "@mui/material";
import ArticleDonationCard from "../articles/ArticleDonationCard";

export default function DonationCampaignGrid({
  campaigns,
  isAdmin,
  onNavigate,
  onEdit,
  onClose,
}) {
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
        alignItems: "start",
      }}
    >
      {campaigns.map((campaign) => (
        <Box
          key={campaign.id}
          sx={{
            display: "flex",
            minWidth: 0,
          }}
        >
          <ArticleDonationCard
            campaign={campaign}
            isAdmin={isAdmin}
            onNavigate={() => onNavigate(campaign)}
            onEdit={() => onEdit(campaign)}
            onClose={() => onClose(campaign)}
          />
        </Box>
      ))}
    </Box>
  );
}