import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import {
  Box,
  Container,
  Stack,
  Typography,
  Avatar,
  Button,
  Card,
  CardContent,
  CardMedia,
  useTheme,
  useMediaQuery,
  
} from "@mui/material";
import Page from "../../components/Page";
import { usePublishedAchievements } from "../../hooks/articles/usePublishedAchievements";
import { eventApi } from "../../utils/api";
import useOrganizationStore from "../../stores/organizationStore";
import Logo from "../../components/Logo";
import FitBot from "../../components/FitBot";
import { useOrgNavigate } from "../../hooks/useOrgNavigate";

const HERO_BG = "/home_page/home_page.png";
const HERO_LOGO = "/alumverse_logo/Logo_White.svg";

const EXPLORE_ITEMS = [
  {
    iconSrc: "/icons/ho_tro_tu_van.svg",
    title: "Cố vấn",
    description: "Giải đáp nhanh chóng và tư vấn cùng đội ngũ cựu sinh viên.",
    path: "/development/mentorship",
  },
  {
    iconSrc: "/icons/ket_noi_csv.svg",
    title: "Kết nối cựu sinh viên",
    description:
      "Kết nối cộng đồng cựu sinh viên, chia sẻ kiến thức và kinh nghiệm.",
    path: "/forum",
  },
  {
    iconSrc: "/icons/tim_kiem_csv.svg",
    title: "Tìm kiếm cựu sinh viên",
    description: "Dễ dàng tìm kiếm và kết nối với cựu sinh viên.",
    path: "/search",
  },
  {
    iconSrc: "/icons/su_kien_hoi_thao.svg",
    title: "Sự kiện & Hội thảo",
    description: "Tham gia sự kiện mở rộng mối quan hệ và cơ hội nghề nghiệp.",
    path: "/activities/events",
  },
];

const PARTNER_LOGOS = [
  { name: "VNG", src: "/company_logo/vng.png" },
  { name: "FPT", src: "/company_logo/fpt.png" },
  { name: "TMA", src: "/company_logo/tma.png" },
  { name: "KMS", src: "/company_logo/kms.png" },
  { name: "HLC", src: "/company_logo/hlc.png" },
  { name: "BOSCH", src: "/company_logo/bosch.png" },
  { name: "Shopee", src: "/company_logo/shopee.png" },
  { name: "ELCA", src: "/company_logo/elca.png" },
  { name: "dek", src: "/company_logo/dek.png" },
  { name: "AXON", src: "/company_logo/axon.png" },
];

const HomePage = () => {
  const { slug } = useParams();
  const { achievements } = usePublishedAchievements(0, 5);
  const [events, setEvents] = useState([]);
  const navigate = useOrgNavigate();

  const organizationId = useOrganizationStore((state) => state.organization?.id);

  useEffect(() => {
    if (!organizationId) return;
    const fetchEvents = async () => {
      try {
        const data = await eventApi.getUpcomingEvents({ organizationId, limit: 6 });
        setEvents(data?.items || []);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      }
    };
    fetchEvents();
  }, [organizationId]);

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  return (
    <Page
      title="AlumVerse - Nền tảng kết nối Sinh viên & Cựu sinh viên"
      meta={
        <meta
          name="description"
          content="AlumVerse - Hệ thống kết nối Sinh viên & Cựu sinh viên, Trường Đại học Khoa học Tự nhiên, ĐHQG-HCM"
        />
      }
    >
      <Container maxWidth={false} disableGutters sx={{ display: "flex", flexDirection: "column" }}>
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
            backgroundColor: "rgba(0,0,0,0.6)",
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
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 3, md: 4 }}
            alignItems="center"
            sx={{ width: "100%" }}
          >
            <Box sx={{ textAlign: { xs: "center", md: "left" }, flex: { md: "1 1 50%" } }}>
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
                  onClick={() => navigate("/introduction")}
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
              <Box sx={{ display: "flex", justifyContent: "center", flex: "1 1 50%" }}>
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
          </Stack>
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
          <Stack
            direction="row"
            flexWrap="wrap"
            useFlexGap
            spacing={{ xs: 2, sm: 3 }}
            sx={{ alignItems: "stretch" }}
          >
            {EXPLORE_ITEMS.map((item) => {
              const { iconSrc, title, description, path } = item;
              return (
                <Box
                  key={item.title}
                  sx={{
                    flex: "1 1 100%",
                    minWidth: 0,
                    "@media (min-width:600px)": { flex: "1 1 calc(50% - 12px)" },
                    "@media (min-width:900px)": { flex: "1 1 calc(25% - 18px)" },
                  }}
                >
                <Card
                  onClick={() => navigate(path)}
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
                    cursor: "pointer",
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
                </Box>
              );
            })}
          </Stack>
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
          <Stack
            direction="row"
            flexWrap="wrap"
            useFlexGap
            spacing={{ xs: 2, sm: 3 }}
          >
            {events.map((event) => (
              <Box
                key={event.id}
                sx={{
                  flex: "1 1 100%",
                  minWidth: 0,
                  "@media (min-width:600px)": { flex: "1 1 calc(50% - 12px)" },
                  "@media (min-width:900px)": { flex: "1 1 calc(33.333% - 16px)" },
                }}
              >
              <Card
                component={Link}
                to={`/${slug}/article/event/${event.id}`}
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
                  image={event.bannerUrl}
                  sx={{
                    height: { xs: 140, sm: 160, md: 180 },
                    backgroundColor: "grey.200",
                    backgroundSize: "cover",
                  }}
                />
                <CardContent sx={{ py: { xs: 1.5, md: 2 }, px: { xs: 1.5, md: 2 } }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    noWrap
                    sx={{ mb: 0.5, fontSize: { xs: "0.9375rem", md: "1rem" } }}
                  >
                    {event.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.8125rem", md: "0.875rem" } }}>
                    {new Date(event.startTime).toLocaleDateString("vi-VN")}
                  </Typography>
                </CardContent>
              </Card>
              </Box>
            ))}
          </Stack>
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
          <Stack
            direction="row"
            flexWrap="nowrap"
            useFlexGap
            spacing={{ xs: 1.5, sm: 2, md: 4 }}
            sx={{ overflow: "hidden" }}
          >
            {achievements.map((item) => (
              <Box
                key={item.id}
                sx={{
                  flex: "1 1 0",
                  minWidth: { xs: 160, sm: 200, md: 0 },
                }}
              >
              <Card
                elevation={0}
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 2,
                  textAlign: "center",
                  py: { xs: 2.5, md: 3 },
                  px: { xs: 1.5, md: 2 },
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Avatar
                  src={item.memberAvatar}
                  sx={{
                    width: { xs: 64, md: 80 },
                    height: { xs: 64, md: 80 },
                    mb: { xs: 1, md: 1.5 },
                  }}
                >
                  {item.memberName?.charAt(0)}
                </Avatar>
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  sx={{ 
                    mb: 0.25, 
                    fontSize: { xs: "0.9375rem", md: "1rem" },
                    display: "-webkit-box",
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {item.memberName || "Alumnus"}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ 
                    fontSize: { xs: "0.75rem", md: "0.8125rem" },
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    minHeight: "2.5em",
                  }}
                >
                  {item.memberJobTitle}{item.memberCompany ? `, ${item.memberCompany}` : ""}
                </Typography>
              </Card>
              </Box>
            ))}
          </Stack>
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
      </Container>
      <FitBot />
    </Page>
  );
};

export default HomePage;
