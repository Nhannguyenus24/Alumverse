import { Box, Typography } from "@mui/material";
import styled from "@emotion/styled";

const StatsSummaryRoot = styled(Box)({
  width: "100%",
  background: "#0f2f5e",
  borderRadius: 12,
  padding: "16px 20px",
  color: "#ffffff",
  boxShadow: "0 8px 18px rgba(14, 38, 80, 0.24)",
});

const StatsGrid = styled(Box)({
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 8,
  "@media (max-width: 900px)": {
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    rowGap: 12,
  },
  "@media (max-width: 600px)": {
    gridTemplateColumns: "1fr",
  },
});

const StatsCell = styled(Box)({
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  minHeight: 62,
  padding: "2px 6px",
});

function StatsSummaryBar({ items }) {
  return (
    <StatsSummaryRoot>
      <StatsGrid>
        {items.map((item) => (
          <StatsCell key={item.label}>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: "1.02rem", md: "1.16rem" }, lineHeight: 1.2 }}>
              {item.value}
            </Typography>
            <Typography sx={{ mt: 0.4, opacity: 0.85, fontSize: "0.78rem", textTransform: "lowercase" }}>
              {item.label}
            </Typography>
          </StatsCell>
        ))}
      </StatsGrid>
    </StatsSummaryRoot>
  );
}

export default function DonationHeader({ isAdmin, adminBannerItems }) {
  return (
    <>
      <Typography
        variant="h2"
        sx={{
          fontSize: { xs: "2rem", md: "2.8rem" },
          fontWeight: 800,
          color: "#102f5f",
          mb: 1,
        }}
      >
        Quyên góp
      </Typography>
      <Typography sx={{ color: "#4f678d", mb: 3.5, maxWidth: 860, lineHeight: 1.7 }}>
        Chung tay giúp đỡ cộng đồng, đồng hành cùng những hoàn cảnh đặc biệt và lan tỏa tinh thần sẻ chia của cựu sinh
        viên qua từng chiến dịch ý nghĩa.
      </Typography>

      {isAdmin && (
        <Box sx={{ mb: 2.8 }}>
          <StatsSummaryBar items={adminBannerItems} />
        </Box>
      )}

    </>
  );
}
