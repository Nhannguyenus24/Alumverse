import { Box, Stack, Typography } from "@mui/material";
import styled from "@emotion/styled";

export default function DonationHeader({ isAdmin, adminBannerItems }) {
  return (
    <Stack spacing={4} sx={{ flex: 1, minWidth: 0, width: "100%", px: { xs: 1.5, sm: 2, md: 2.75 }, }}>
      <Stack spacing={2}>
        <Typography variant="h1" fontWeight={800} color="primary.main" sx={{ fontSize: { xs: "1.8rem", md: "2.3rem" }, }}>
          QUYÊN GÓP
        </Typography>

        <Typography color="text.secondary">
          Chung tay giúp đỡ cộng đồng, đồng hành cùng những hoàn cảnh đặc biệt
          và lan tỏa tinh thần sẻ chia của cựu sinh viên qua từng chiến dịch ý nghĩa.
        </Typography>
      </Stack>

      {isAdmin && (
        <Box sx={{ backgroundColor: "primary.main", borderRadius: 2, px: { xs: 3, md: 6 }, py: { xs: 3, md: 4 }, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr 1fr", }, gap: 3, textAlign: "center", }}>
          {adminBannerItems.map((item) => (
            <Box key={item.label}>
              <Typography variant="h2" fontWeight={700} color="common.white">
                {item.value}
              </Typography>

              <Typography variant="body2" color="common.white" sx={{ opacity: 0.9 }}>
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Stack>
  );
}