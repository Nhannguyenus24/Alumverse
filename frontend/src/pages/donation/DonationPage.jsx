import { useState } from "react";
import { Box, Container, Stack, Typography } from "@mui/material";
import Page from "../../components/Page";
import DynamicFilterBar from "../../components/DynamicFilterBar";
import SearchBar from "../../components/SearchBar";
import FeaturedArticleDonationCard from "../../components/articles/FeaturedArticleDonationCard";
import ArticleDonationCard from "../../components/articles/ArticleDonationCard";

/* ================= MOCK DATA ================= */

const FILTERS = [
  { type: "dropdown", key: "importance", label: "Quan trọng", options: ["Cao", "Trung bình", "Thấp"] },
  { type: "dropdown", key: "location", label: "Địa điểm", options: ["TP.HCM", "Hà Nội", "Đà Nẵng", "Khác"] },
  { type: "dropdown", key: "date", label: "Ngày", options: ["Hôm nay", "Tuần này", "Tháng này"] },
  { type: "dropdown", key: "trending", label: "Thịnh hành", options: ["Thịnh hành", "Mới nhất", "Phổ biến"] },
  { type: "dropdown", key: "amount", label: "Mức quyên góp", options: ["<1tr", "1-5tr", "5-50tr", ">50tr"] },
];

const campaigns = [
  { id: 1, title: "Quỹ Nuôi trẻ", organizer: "HURC Metro", donors: 50, date: "21/01/2026 - 24/01/2026", description: "Hỗ trợ trẻ em vùng sâu vùng xa bằng cách cung cấp nhu yếu phẩm và cải thiện điều kiện sống.", image: "https://placehold.co/600x400" },
  { id: 2, title: "Quỹ Học tập", organizer: "Giáo vụ", donors: 120, date: "01/03/2026 - 05/03/2026", description: "Hỗ trợ học sinh khó khăn vượt khó học giỏi, trao tặng học bổng cho các em có thành tích xuất sắc.", image: "https://placehold.co/600x400" },
  { id: 3, title: "Quỹ Y tế", organizer: "Bệnh viện", donors: 80, date: "10/03/2026", description: "Hỗ trợ chi phí điều trị cho các bệnh nhân có hoàn cảnh đặc biệt khó khăn.", image: "https://placehold.co/600x400" },
  { id: 4, title: "Quỹ Sinh viên", organizer: "HCMUS", donors: 200, date: "15/03/2026", description: "Học bổng sinh viên dành cho các thế hệ đàn em tại trường Đại học Khoa học Tự nhiên.", image: "https://placehold.co/600x400" },
  { id: 5, title: "Quỹ Môi trường xanh", organizer: "Green Earth", donors: 45, date: "20/03/2026", description: "Chiến dịch trồng cây gây rừng và làm sạch bờ biển khu vực miền Trung.", image: "https://placehold.co/600x400" },
];

/* ================= PAGE ================= */

export default function DonationPage() {
  const [filters, setFilters] = useState({});
  const [featured, ...rest] = campaigns;
  
  // Grid 1 lấy 3 item đầu của phần còn lại (id 2, 3, 4)
  const grid1 = rest.slice(0, 3);
  // Grid 2 lấy các item tiếp theo (id 3, 4, 5) để hiển thị đủ 3 card
  const grid2 = rest.slice(1, 4);

  return (
    <Page title="Quyên góp">
      <Container maxWidth="lg" sx={{ pt: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3, lg: 6 }, pb: 6 }}>
        <Stack spacing={5} sx={{ width: "100%" }}>
          {/* HEADER */}
          <Stack gap={2}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="h1" fontWeight={800} color="primary.main" sx={{ fontSize: { xs: "1.8rem", md: "2.3rem" } }}>QUYÊN GÓP</Typography>
            </Box>
            <Typography color="text.secondary">Hàng trăm cơ hội đóng góp và hỗ trợ cộng đồng từ cựu sinh viên và tổ chức.</Typography>
            <DynamicFilterBar config={FILTERS} value={filters} onChange={setFilters} />
            <SearchBar value={filters.search} onChange={(val) => setFilters((prev) => ({ ...prev, search: val }))} />
          </Stack>

          {/* FEATURED */}
          {featured && <FeaturedArticleDonationCard article={featured} />}

          {/* SECTION 1 */}
          <Box>
            <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>Chiến dịch nổi bật</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" }, gap: 4 }}>
              {grid1.map((item) => <ArticleDonationCard key={item.id} article={item} />)}
            </Box>
          </Box>

          {/* SECTION 2 */}
          <Box>
            <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>Chiến dịch khác</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" }, gap: 4 }}>
              {grid2.map((item) => <ArticleDonationCard key={item.id} article={item} />)}
            </Box>
          </Box>
        </Stack>
      </Container>
    </Page>
  );
}