import { Link } from "react-router";
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import Page from "../components/Page";
import Logo from "../components/Logo";

const HERO_BG = "/home_page.png";
const HERO_LOGO = "/home_page_alum.png";

const EXPLORE_ITEMS = [
  {
    iconSrc: "/ho_tro_tu_van.svg",
    title: "Hỗ trợ & Tư vấn",
    description: "Giải đáp nhanh chóng và tư vấn cùng đội ngũ cựu sinh viên.",
  },
  {
    iconSrc: "/ket_noi_csv.svg",
    title: "Kết nối cựu sinh viên",
    description:
      "Kết nối cộng đồng cựu sinh viên, chia sẻ kiến thức và kinh nghiệm.",
  },
  {
    iconSrc: "/tim_kiem_csv.svg",
    title: "Tìm kiếm cựu sinh viên",
    description: "Dễ dàng tìm kiếm và kết nối với cựu sinh viên.",
  },
  {
    iconSrc: "/su_kien_hoi_thao.svg",
    title: "Sự kiện & Hội thảo",
    description: "Tham gia sự kiện mở rộng mối quan hệ và cơ hội nghề nghiệp.",
  },
];

const PLACEHOLDER_NEWS = [
  {
    title: "Hội thảo kết nối doanh nghiệp 2026",
    date: "15/01/2026",
    image: null,
  },
  { title: "Ngày hội tuyển dụng FIT", date: "20/01/2026", image: null },
  { title: "Gặp gỡ cựu sinh viên thành đạt", date: "25/01/2026", image: null },
  { title: "Chương trình học bổng sinh viên", date: "01/02/2026", image: null },
  { title: "Hội nghị khoa học công nghệ", date: "10/02/2026", image: null },
  { title: "Lễ ký kết hợp tác doanh nghiệp", date: "15/02/2026", image: null },
];

const PLACEHOLDER_ALUMNI = [
  { name: "Nguyễn Văn A", role: "Tech Lead, FPT Software" },
  { name: "Trần Thị B", role: "Founder, Startup XYZ" },
  { name: "Lê Văn C", role: "Giám đốc R&D, VNG" },
];

const PARTNER_LOGOS = [
  { name: "VNG", src: "/vng.png" },
  { name: "FPT", src: "/fpt.png" },
  { name: "TMA", src: "/tma.png" },
  { name: "KMS", src: "/kms.png" },
  { name: "HLC", src: "/hlc.png" },
  { name: "BOSCH", src: "/bosch.png" },
  { name: "Shopee", src: "/shopee.png" },
  { name: "ELCA", src: "/elca.png" },
  { name: "dek", src: "/dek.png" },
  { name: "AXON", src: "/axon.png" },
];

const HomePage = () => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  return (
    <Page
      title="Trang chủ"
      meta={
        <meta
          name="description"
          content="AlumVerse - Hệ thống kết nối Sinh viên & Cựu sinh viên, Trường Đại học Khoa học Tự nhiên, ĐHQG-HCM"
        />
      }
    >
      {/* Hero */}
      <Box
        sx={{
          position: "relative",
          height: { xs: "100svh", md: "100vh" },
          minHeight: { xs: 480, md: "100vh" },
          backgroundImage: `url(${HERO_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          display: "flex",
          alignItems: "center",
          color: "#fff",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.35)",
            zIndex: 0,
          },
        }}
      >
        <Container
          sx={{
            position: "relative",
            zIndex: 1,
            py: { xs: 4, sm: 5, md: 6 },
            px: { xs: 2, sm: 3 },
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: { xs: 3, md: 4 },
              alignItems: "center",
            }}
          >
            <Box sx={{ textAlign: { xs: "center", md: "left" } }}>
              <Typography
                variant="h2"
                component="h1"
                fontWeight={800}
                sx={{
                  fontSize: { xs: "1.75rem", sm: "2.5rem", md: "3.5rem", lg: "4rem" },
                  letterSpacing: { xs: 1, md: 2 },
                  mb: 2,
                }}
              >
                ALUMVERSE
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontSize: { xs: "0.875rem", sm: "1rem", md: "1.125rem" },
                  lineHeight: 1.7,
                  mb: 3,
                  maxWidth: 520,
                  mx: { xs: "auto", md: 0 },
                  color: "rgba(255,255,255,0.95)",
                }}
              >
                Hệ thống kết nối cựu sinh viên và doanh nghiệp, tạo cầu nối giữa
                sinh viên và các cơ hội nghề nghiệp. Đồng hành cùng Trường Đại
                học Khoa học Tự nhiên, ĐHQG-HCM.
              </Typography>
              <Box sx={{ display: "flex", justifyContent: { xs: "center", md: "flex-start" } }}>
                <Button
                  component={Link}
                  to="/gioi-thieu"
                  variant="outlined"
                  size="large"
                  sx={{
                    borderColor: "#fff",
                    color: "#fff",
                    fontWeight: 600,
                    px: { xs: 2.5, md: 3 },
                    "&:hover": {
                      borderColor: "#fff",
                      backgroundColor: "rgba(255,255,255,0.1)",
                    },
                  }}
                >
                  Giới thiệu
                </Button>
              </Box>
            </Box>
            {isDesktop && (
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Logo
                  variant="image"
                  src={HERO_LOGO}
                  alt="AlumVerse HCMUS"
                  sx={{
                    maxWidth: 600,
                    width: "100%",
                    height: "auto",
                    cursor: "default",
                  }}
                />
              </Box>
            )}
          </Box>
        </Container>
      </Box>

      {/* Khám phá */}
      <Box sx={{ py: { xs: 4, sm: 6, md: 8 }, backgroundColor: "#fff" }}>
        <Container sx={{ px: { xs: 2, sm: 3 } }}>
          <Typography
            variant="h1"
            fontWeight={700}
            color="primary.main"
            textAlign="center"
            sx={{ mb: { xs: 3, md: 4 }, fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" } }}
          >
            KHÁM PHÁ
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(4, 1fr)",
              },
              gap: { xs: 2, sm: 3 },
              alignItems: "stretch",
            }}
          >
            {EXPLORE_ITEMS.map((item) => {
              const { iconSrc, title, description } = item;
              return (
                <Card
                  key={item.title}
                  elevation={0}
                  sx={{
                    border: 1,
                    borderColor: "grey.300",
                    borderRadius: 2,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    textAlign: "center",
                    py: { xs: 2.5, md: 3 },
                    px: { xs: 2, md: 2.5 },
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    "&:hover": {
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: { xs: 1.5, md: 2 },
                      minHeight: { xs: 48, md: 56 },
                    }}
                  >
                    <Box
                      component="img"
                      src={iconSrc}
                      alt=""
                      sx={{
                        width: { xs: 40, md: 48 },
                        height: { xs: 40, md: 48 },
                        objectFit: "contain",
                      }}
                    />
                  </Box>
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    color="primary.main"
                    sx={{ mb: { xs: 1, md: 1.5 }, fontSize: { xs: "0.9375rem", md: "1rem" } }}
                  >
                    {title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      lineHeight: 1.6,
                      fontSize: { xs: "0.8125rem", md: "0.875rem" },
                      maxWidth: 240,
                      mx: "auto",
                    }}
                  >
                    {description}
                  </Typography>
                </Card>
              );
            })}
          </Box>
        </Container>
      </Box>

      {/* Tin tức & Sự kiện */}
      <Box sx={{ py: { xs: 4, sm: 6, md: 8 }, backgroundColor: "#fff" }}>
        <Container sx={{ px: { xs: 2, sm: 3 } }}>
          <Typography
            variant="h1"
            fontWeight={700}
            color="primary.main"
            textAlign="center"
            sx={{ mb: { xs: 3, md: 4 }, fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" } }}
          >
            TIN TỨC & SỰ KIỆN
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
              },
              gap: { xs: 2, sm: 3 },
            }}
          >
            {PLACEHOLDER_NEWS.map(({ title, date }) => (
              <Card
                key={title}
                component={Link}
                to="/hoat-dong/tin-tuc"
                sx={{
                  textDecoration: "none",
                  color: "inherit",
                  borderRadius: 2,
                  overflow: "hidden",
                  transition: "box-shadow 0.2s",
                  "&:hover": { boxShadow: 4 },
                }}
              >
                <CardMedia
                  component="div"
                  sx={{
                    height: { xs: 140, sm: 160, md: 180 },
                    backgroundColor: "grey.200",
                  }}
                />
                <CardContent sx={{ py: { xs: 1.5, md: 2 }, px: { xs: 1.5, md: 2 } }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    sx={{ mb: 0.5, fontSize: { xs: "0.9375rem", md: "1rem" } }}
                  >
                    {title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.8125rem", md: "0.875rem" } }}>
                    {date}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Cựu sinh viên tiêu biểu */}
      <Box sx={{ py: { xs: 4, sm: 6, md: 8 }, backgroundColor: "#fff" }}>
        <Container sx={{ px: { xs: 2, sm: 3 } }}>
          <Typography
            variant="h1"
            fontWeight={700}
            color="primary.main"
            textAlign="center"
            sx={{ mb: { xs: 3, md: 4 }, fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" } }}
          >
            CỰU SINH VIÊN TIÊU BIỂU
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
              gap: { xs: 2, sm: 3, md: 4 },
            }}
          >
            {PLACEHOLDER_ALUMNI.map(({ name, role }) => (
              <Card
                key={name}
                elevation={0}
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 2,
                  textAlign: "center",
                  py: { xs: 2.5, md: 3 },
                  px: { xs: 1.5, md: 2 },
                }}
              >
                <Box
                  sx={{
                    width: { xs: 64, md: 80 },
                    height: { xs: 64, md: 80 },
                    borderRadius: "50%",
                    bgcolor: "grey.300",
                    mx: "auto",
                    mb: { xs: 1, md: 1.5 },
                  }}
                />
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  sx={{ mb: 0.5, fontSize: { xs: "0.9375rem", md: "1rem" } }}
                >
                  {name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.8125rem", md: "0.875rem" } }}>
                  {role}
                </Typography>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Đối tác */}
      <Box sx={{ py: { xs: 4, sm: 5, md: 6 }, backgroundColor: "#fff" }}>
        <Container sx={{ px: { xs: 2, sm: 3 } }}>
          <Typography
            variant="h5"
            textAlign="center"
            color="text.primary"
            sx={{ mb: { xs: 2, md: 3 }, fontSize: { xs: "1.125rem", sm: "1.25rem", md: "1.5rem" } }}
          >
            Hơn 100+ doanh nghiệp liên kết
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexWrap: { xs: "wrap", md: "nowrap" },
              justifyContent: { xs: "center", md: "space-evenly" },
              alignItems: "center",
              gap: { xs: 2, sm: 2.5, md: 3 },
              py: 2,
              px: 0,
            }}
          >
            {PARTNER_LOGOS.map(({ name, src }) => (
              <Box
                key={name}
                component="img"
                src={src}
                alt={name}
                sx={{
                  width: { xs: 56, sm: 64, md: 72 },
                  height: { xs: 28, sm: 32, md: 36 },
                  objectFit: "contain",
                  flexShrink: 0,
                }}
              />
            ))}
          </Box>
        </Container>
      </Box>
    </Page>
  );
};

export default HomePage;
