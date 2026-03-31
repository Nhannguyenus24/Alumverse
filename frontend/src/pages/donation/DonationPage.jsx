import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Card,
  CardMedia,
  CardContent,
  Grid,
  Container,
  Stack,
  Paper,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import Page from "../../components/Page";
import Dropdown from "../../components/Dropdown";

// --- Featured Campaign Banner ---
const FeaturedBanner = () => (
  <Paper
    elevation={0}
    sx={{
      display: "flex",
      flexDirection: { xs: "column", sm: "row" },
      borderRadius: 2,
      overflow: "hidden",
      border: "1px solid #e0e0e0",
      mb: 4,
      minHeight: { xs: "auto", sm: 200 },
    }}
  >
    {/* Left: Image / Logo side */}
    <Box
      sx={{
        width: { xs: "100%", sm: "40%" },
        background: "linear-gradient(135deg, #f0f4ff 0%, #dde6f5 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
        gap: 1,
      }}
    >
      {/* SVG Alumni Badge */}
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="38" fill="#1a3a6b" />
        <circle cx="40" cy="40" r="34" fill="none" stroke="#e87722" strokeWidth="3" />
        <text
          x="40"
          y="26"
          textAnchor="middle"
          fill="white"
          fontSize="11"
          fontWeight="800"
          fontFamily="sans-serif"
        >
          HCM
        </text>
        <text
          x="40"
          y="42"
          textAnchor="middle"
          fill="white"
          fontSize="14"
          fontWeight="900"
          fontFamily="sans-serif"
        >
          US
        </text>
        <text
          x="40"
          y="56"
          textAnchor="middle"
          fill="#e87722"
          fontSize="10"
          fontWeight="700"
          fontFamily="sans-serif"
        >
          Alumni
        </text>
      </svg>
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: "11px",
          letterSpacing: 1,
          color: "#1a3a6b",
          textAlign: "center",
        }}
      >
        CỘNG ĐỒNG CỰU SINH VIÊN KHOA HỌC
      </Typography>
    </Box>

    {/* Right: Info */}
    <Box sx={{ flex: 1, p: { xs: 2, sm: 3 }, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <Box>
        <Typography
          variant="caption"
          sx={{
            color: "#e87722",
            fontWeight: 700,
            fontSize: "0.8rem",
          }}
        >
          March 1, 2026 - March 5, 2026
        </Typography>
        <Typography
          sx={{
            mt: 0.5,
            mb: 0.5,
            fontSize: "1.2rem",
            fontWeight: 700,
            color: "#1a1a1a",
          }}
        >
          Quỹ Cộng đồng Cựu sinh viên Khoa học
        </Typography>
        <Typography sx={{ color: "#666", mb: 0.3, fontSize: "0.9rem" }}>Giáo vụ</Typography>
        <Typography sx={{ color: "#888", mb: 1.5, fontSize: "0.9rem" }}>100 người đã quyên góp</Typography>
        <Typography
          sx={{
            color: "#444",
            lineHeight: 1.6,
            fontSize: "0.9rem",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          Là một trong hai nhà khoa học nữ xuất sắc nhận Giải thưởng Kovalevskaia năm 2021, GS.TS.
          Nguyễn Thị Thanh Mai được biết đến như một nhà giáo, nhà khoa học say mê nghiên cứu, luôn dấn
          thân tìm kiếm những điều mới mẻ và có nhiều sáng kiến khoa học…
        </Typography>
      </Box>
      <Button
        variant="contained"
        color="primary"
        sx={{
          mt: 2,
          alignSelf: "flex-start",
          px: 4,
          py: 1.2,
          textTransform: "none",
          fontWeight: 600,
        }}
      >
        Quyên góp
      </Button>
    </Box>
  </Paper>
);

// --- Campaign Card ---
const campaigns = [
  { id: 1, title: "Quỹ Nuôi trẻ", org: "HURC Metro", donors: 50, dates: "January 21, 2026 - January 24, 2026", donated: false, img: "https://placehold.co/400x220/e8d5b0/7a6040?text=Fund" },
  { id: 2, title: "Quỹ Học tập Nâng cao", org: "Giáo vụ", donors: 100, dates: "March 1, 2026 - March 5, 2026", donated: false, img: "https://placehold.co/400x220/c8dfc8/3a6040?text=Fund" },
  { id: 3, title: "Quỹ Nuôi trẻ", org: "HURC Metro", donors: 50, dates: "January 21, 2026 - January 24, 2026", donated: false, img: "https://placehold.co/400x220/e8d5b0/7a6040?text=Fund" },
  { id: 4, title: "Quỹ Học tập Nâng cao", org: "Giáo vụ", donors: 100, dates: "March 1, 2026 - March 5, 2026", donated: false, img: "https://placehold.co/400x220/c8dfc8/3a6040?text=Fund" },
  { id: 5, title: "Quỹ Nuôi trẻ", org: "HURC Metro", donors: 50, dates: "January 21, 2026 - January 24, 2026", donated: true, img: "https://placehold.co/400x220/e8d5b0/7a6040?text=Fund" },
  { id: 6, title: "Quỹ Học tập Nâng cao", org: "Giáo vụ", donors: 100, dates: "March 1, 2026 - March 5, 2026", donated: false, img: "https://placehold.co/400x220/c8dfc8/3a6040?text=Fund" },
];

const CampaignCard = ({ title, org, donors, dates, donated, img }) => (
  <Card
    elevation={0}
    sx={{
      border: "1px solid #e5e5e5",
      borderRadius: 2,
      height: "100%",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      transition: "box-shadow 0.2s",
      "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.1)" },
    }}
  >
    <CardMedia component="img" height="110" image={img} alt={title} sx={{ objectFit: "cover" }} />
    <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", p: { xs: 1, sm: 1.5 } }}>
      <Typography
        variant="caption"
        sx={{
          color: "#e87722",
          fontWeight: 700,
          mb: 0.3,
          display: "block",
          fontSize: "0.75rem",
        }}
      >
        {dates}
      </Typography>
      <Typography
        sx={{
          mb: 0.3,
          fontSize: "0.95rem",
          fontWeight: 700,
          color: "#1a1a1a",
          lineHeight: 1.2,
        }}
      >
        {title}
      </Typography>
      <Typography sx={{ color: "#666", mb: 0.2, fontSize: "0.85rem" }}>{org}</Typography>
      <Typography sx={{ color: "#888", mb: 1, fontSize: "0.85rem" }}>{donors} người đã quyên góp</Typography>
      <Typography
        sx={{
          color: "#444",
          lineHeight: 1.5,
          mb: 1,
          flexGrow: 1,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          fontSize: "0.85rem",
        }}
      >
        Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Cum sociis natoque penatibus et magnis
        dis parturient montes, nascetur.
      </Typography>
      <Button
        variant={donated ? "outlined" : "contained"}
        color="primary"
        fullWidth
        sx={{
          py: 0.8,
          mt: "auto",
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.85rem",
        }}
      >
        {donated ? "Đã quyên góp" : "Quyên góp"}
      </Button>
    </CardContent>
  </Card>
);

// --- Section ---
const SectionGrid = ({ title, items }) => (
  <Box sx={{ mb: 5 }}>
    <Typography
      sx={{
        mb: 3,
        fontSize: "1.1rem",
        fontWeight: 700,
        color: "primary.main",
      }}
    >
      {title}
    </Typography>
    <Grid container spacing={{ xs: 1.5, sm: 2, md: 2 }} sx={{ width: "100%" }}>
      {items.map((item) => (
        <Grid item xs={12} sm={6} lg={4} key={item.id} sx={{ display: "flex" }}>
          <CampaignCard {...item} />
        </Grid>
      ))}
    </Grid>
  </Box>
);

// --- Main Page ---
export default function DonationPage() {
  const [activeFilter, setActiveFilter] = useState("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [importanceFilter, setImportanceFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [trendingFilter, setTrendingFilter] = useState("");
  const [amountFilter, setAmountFilter] = useState("");

  // Filter options
  const importanceOptions = [
    { value: "high", label: "Quan trọng cao" },
    { value: "medium", label: "Quan trọng vừa" },
    { value: "low", label: "Quan trọng thấp" },
  ];

  const locationOptions = [
    { value: "hcm", label: "TP. Hồ Chí Minh" },
    { value: "hanoi", label: "Hà Nội" },
    { value: "danang", label: "Đà Nẵng" },
    { value: "other", label: "Khác" },
  ];

  const dateOptions = [
    { value: "today", label: "Hôm nay" },
    { value: "week", label: "Tuần này" },
    { value: "month", label: "Tháng này" },
    { value: "all", label: "Tất cả" },
  ];

  const trendingOptions = [
    { value: "trending", label: "Đang thịnh hành" },
    { value: "new", label: "Mới nhất" },
    { value: "popular", label: "Phổ biến" },
  ];

  const amountOptions = [
    { value: "under1m", label: "Dưới 1 triệu VNĐ" },
    { value: "1m5m", label: "1-5 triệu VNĐ" },
    { value: "5m50m", label: "5-50 triệu VNĐ" },
    { value: "over50m", label: "Trên 50 triệu VNĐ" },
  ];

  return (
    <Page
      title="Quyên Góp"
      meta={<meta name="description" content="Quyên góp để hỗ trợ cộng đồng cựu sinh viên" />}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4, md: 5 } }}>
        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h3"
            component="h1"
            fontWeight={700}
            sx={{
              fontSize: { xs: "24px", sm: "28px", md: "32px" },
              color: "primary.main",
              mb: 1,
            }}
          >
            QUYÊN GÓP
          </Typography>
          <Typography
            sx={{
              fontSize: "14px",
              color: "#666",
              maxWidth: "800px",
            }}
          >
            Quyên góp để giúp đỡ và hỗ trợ những đồng bào, mạnh thường quân, hoàn cảnh đặc biệt.
          </Typography>
        </Box>

        {/* Filter Bar */}
        <Stack
          direction="row"
          spacing={2}
          sx={{
            mb: 3,
            flexWrap: { xs: "wrap", md: "nowrap" },
            gap: { xs: 1.5, md: 2 },
          }}
        >
          <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: "auto" } }}>
            <Dropdown
              label="Quan trọng"
              placeholder="Chọn mức độ"
              options={importanceOptions}
              value={importanceFilter}
              onChange={(e) => setImportanceFilter(e.target.value)}
              fullWidth
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: "auto" } }}>
            <Dropdown
              label="Địa điểm"
              placeholder="Chọn địa điểm"
              options={locationOptions}
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              fullWidth
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: "auto" } }}>
            <Dropdown
              label="Ngày diễn ra"
              placeholder="Chọn thời gian"
              options={dateOptions}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              fullWidth
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: "auto" } }}>
            <Dropdown
              label="Thịnh hành"
              placeholder="Chọn loại"
              options={trendingOptions}
              value={trendingFilter}
              onChange={(e) => setTrendingFilter(e.target.value)}
              fullWidth
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: "auto" } }}>
            <Dropdown
              label="Mức quyên góp"
              placeholder="Chọn mức"
              options={amountOptions}
              value={amountFilter}
              onChange={(e) => setAmountFilter(e.target.value)}
              fullWidth
            />
          </Box>
        </Stack>

        {/* Search Bar */}
        <TextField
          placeholder="Tìm kiếm"
          fullWidth
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            mb: 4,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              backgroundColor: "#f7f7f7",
              "& fieldset": { borderColor: "#e0e0e0" },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#999", fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />

        {/* Featured Banner */}
        <FeaturedBanner />

        {/* Campaign Sections */}
        <SectionGrid title="Quan trọng" items={campaigns.slice(0, 3)} />
        <SectionGrid title="Vùng sâu vùng xa" items={campaigns.slice(3, 6)} />
      </Container>
    </Page>
  );
}