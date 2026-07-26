import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Container,
  Stack,
  Typography,
  Button,
  Card,
  Divider,
  useTheme,
  useMediaQuery,
  Skeleton,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import Page from "../../components/Page";
import { usePublishedAchievements } from "../../hooks/articles/usePublishedAchievements";
import { usePublishedAlumniPosts } from "../../hooks/articles/usePublishedAlumniPosts";
import { usePublishedEvents } from "../../hooks/articles/usePublishedEvents";
import { usePublishedNews } from "../../hooks/news/usePublishedNews";
import { normalizeNews } from "../../hooks/articles/normalizeArticle";
import { toCardShape } from "../../hooks/articles/toCardShape";
import { toEventCardShape } from "../../hooks/articles/toEventCardShape";
import Logo from "../../components/Logo";
import { useOrgNavigate } from "../../hooks/useOrgNavigate";
import { useAuth } from "../../hooks/useAuth";
import { keyframes } from "@emotion/react";
import { alpha } from "@mui/material/styles";
import apiClient from "../../utils/axios";
import ArticleCard from "../../components/articles/ArticleCard";
import useOrganizationStore from "../../stores/organizationStore";
import { HEADER_HEIGHT } from "../../constants/layout";

const HERO_LOGO = "/alumverse_logo/Logo_White.svg";

const HERO_SLIDES = [
  { src: "/home_page/home_page.png", position: "center" },
  { src: "https://images2.thanhnien.vn/528068263637045248/2025/4/22/khtn-2-ha-17453026107771619419934.jpg", position: "center" },
  { src: "https://scontent.fsgn2-11.fna.fbcdn.net/v/t39.30808-6/487507539_1058186603009135_6357086051884551363_n.jpg?stp=dst-jpg_tt6&cstp=mx2048x762&ctp=s2048x762&_nc_cat=105&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=1UfRFlHN83YQ7kNvwHoyTg7&_nc_oc=Adq2m8o6dhuwrU2R37Mj8a5lfyrHHmP-nE9JlnW_66LLICPiqUGvetgmPfKF_pCRr2c_k6irHvVvsJNfTAYZzqHH&_nc_zt=23&_nc_ht=scontent.fsgn2-11.fna&_nc_gid=NNV0IKQtDLWn3nHG6SGg_Q&_nc_ss=7b2a8&oh=00_Af_ZItqt5a1YFlMpNMswiFZ3Be75VlzAD_YOleqnctF_Rg&oe=6A41F916", position: "center" },
  { src: "https://thongtintuyensinh.net/wp-content/uploads/2020/06/dai_hoc_khoa_hoc_tu_nhien_tp_hcm1.jpg", position: "center" },
  { src: "https://jobtest.vn/hrblog/wp-content/uploads/2022/08/hoc-phi-dai-hoc-khoa-hoc-tu-nhien-1.jpg", position: "center" },
];

const scrollAnimation = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`;

const heroSlideAnimation = keyframes`
  0% { opacity: 0; transform: scale(1); }
  8% { opacity: 1; }
  28% { opacity: 1; }
  40% { opacity: 0; transform: scale(1.075); }
  100% { opacity: 0; transform: scale(1.075); }
`;

const floatIconAnimation = keyframes`
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-8px) rotate(2deg); }
`;

const alumniFlipIn = keyframes`
  0% { opacity: 0; transform: perspective(900px) rotateY(38deg) translateY(14px); }
  100% { opacity: 1; transform: perspective(900px) rotateY(0) translateY(0); }
`;

const sectionRevealAnimation = keyframes`
  0% { opacity: 0; transform: translateY(26px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const mainSectionTitleSx = {
  mb: { xs: 3.5, md: 5 },
  fontSize: { xs: "1.75rem", sm: "2.05rem", md: "2.5rem" },
  lineHeight: 1.15,
  fontWeight: 800,
};

const marqueeTitleSx = {
  mb: { xs: 2.5, md: 3.5 },
  fontSize: { xs: "1.45rem", sm: "1.7rem", md: "2.1rem" },
  fontWeight: 800,
};

const RevealBox = ({ children, delay = 0, revealAnimation = sectionRevealAnimation, sx, ...props }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Box
      ref={ref}
      {...props}
      sx={{
        opacity: 0,
        ...(visible && {
          animation: `${revealAnimation} 0.62s ease both`,
          animationDelay: `${delay}ms`,
        }),
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

const buildPagedCards = (items, pageSize = 2) => {
  if (!items.length) return [];
  const pages = [];
  for (let i = 0; i < items.length; i += pageSize) {
    const group = items.slice(i, i + pageSize);
    if (group.length === pageSize) pages.push(group);
  }
  return pages;
};

const getHomeNewsLimit = (count) => {
  if (count >= 6) return 6;
  if (count >= 3) return 3;
  return count;
};

const getEvenCardLimit = (count, max = 6) => {
  const capped = Math.min(count, max);
  return capped < 2 ? capped : capped - (capped % 2);
};

const HomeSectionHeader = ({
  eyebrow,
  title,
  description,
  actionLabel,
  onAction,
  align = "center",
  titleColor = "primary.main",
  actionColor = "primary",
}) => (
  <Stack
    direction={{ xs: "column", md: align === "split" ? "row" : "column" }}
    spacing={{ xs: 2, md: 3 }}
    alignItems={{ xs: "stretch", md: align === "split" ? "flex-end" : "center" }}
    justifyContent="space-between"
    sx={{ mb: { xs: 3.5, md: 5 } }}
  >
    <Box sx={{ textAlign: { xs: "center", md: align === "split" ? "left" : "center" }, maxWidth: 760 }}>
      {eyebrow && (
        <Typography
          variant="overline"
          sx={{ color: "accent.main", fontWeight: 800, lineHeight: 1.6 }}
        >
          {eyebrow}
        </Typography>
      )}
      <Typography variant="h1" color={titleColor} sx={{ ...mainSectionTitleSx, mb: description ? 1.5 : 0 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.65 }}>
          {description}
        </Typography>
      )}
    </Box>
    {actionLabel && (
      <Button
        variant="contained"
        color={actionColor}
        endIcon={<ArrowForwardIcon />}
        onClick={onAction}
        sx={{ alignSelf: { xs: "center", md: "flex-end" }, px: 2.5, fontWeight: 800 }}
      >
        {actionLabel}
      </Button>
    )}
  </Stack>
);

const HomeEventImage = ({ src, alt, sx }) => (
  <Box
    component="img"
    src={src}
    alt={alt}
    sx={{
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
      transition: "transform 0.35s ease",
      ...sx,
    }}
  />
);

const EventFeaturedCard = ({ event, onClick }) => (
  <Card
    elevation={0}
    onClick={onClick}
    sx={{
      height: "100%",
      minHeight: { xs: 275, md: 325 },
      maxWidth: { md: 510 },
      borderRadius: 2,
      overflow: "hidden",
      cursor: "pointer",
      position: "relative",
      bgcolor: "transparent",
      boxShadow: "none",
      "&:hover img": { transform: "scale(1.045)" },
      "&:hover h3": { transform: "translateX(4px)" },
    }}
  >
    <Box sx={{ height: { xs: 185, md: 220 }, overflow: "hidden", borderRadius: 2 }}>
      <HomeEventImage src={event.image} alt={event.title} />
    </Box>
    <Stack spacing={0.8} sx={{ mt: 1.5 }}>
      {event.date && (
        <Typography variant="body2" sx={{ color: alpha("#fff", 0.82), lineHeight: 1.5 }}>
          {event.date}
        </Typography>
      )}
      <Typography
        variant="h3"
        sx={{
          color: "#fff",
          fontWeight: 800,
          lineHeight: 1.22,
          fontSize: { xs: "1.3rem", md: "1.58rem" },
          transition: "transform 0.25s ease",
        }}
      >
        {event.title}
      </Typography>
      {event.organizer && (
        <Typography variant="body2" sx={{ color: alpha("#fff", 0.76), lineHeight: 1.55 }}>
          {event.organizer}
        </Typography>
      )}
    </Stack>
  </Card>
);

const FeatureStep = ({ number, title, description }) => (
  <Stack direction="row" spacing={1.5} alignItems="flex-start">
    <Typography variant="h5" sx={{ color: "primary.main", fontWeight: 800, minWidth: 38 }}>
      {number}
    </Typography>
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "text.primary" }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.7 }}>
        {description}
      </Typography>
    </Box>
  </Stack>
);

const GatewayCard = ({ icon, color = "secondary", title, description, bullets, cta, onClick }) => (
  <Card
    elevation={0}
    sx={{
      p: { xs: 2.5, md: 3 },
      borderRadius: 2,
      border: 1,
      borderColor: "divider",
      bgcolor: "background.paper",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      gap: 2,
      transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
      "&:hover": {
        transform: "translateY(-6px)",
        borderColor: `${color}.main`,
        boxShadow: "0 18px 34px rgba(15, 23, 42, 0.12)",
      },
    }}
  >
    <Box>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.25 }}>
        <Box sx={{ width: 52, height: 52, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: (theme) => alpha(theme.palette[color].main, theme.palette.mode === "dark" ? 0.2 : 0.1), color: `${color}.main` }}>
          {icon}
        </Box>
        <Typography variant="h3" color={`${color}.main`} sx={{ fontWeight: 800 }}>
          {title}
        </Typography>
      </Stack>
      <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.75 }}>
        {description}
      </Typography>
    </Box>
    <Stack spacing={1}>
      {bullets.map((item) => (
        <Stack direction="row" spacing={1} alignItems="center" key={item}>
          <CheckCircleOutlineIcon sx={{ fontSize: 18, color: `${color}.main` }} />
          <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
            {item}
          </Typography>
        </Stack>
      ))}
    </Stack>
    <Button variant="contained" color={color} endIcon={<ArrowForwardIcon />} onClick={onClick} sx={{ mt: "auto", alignSelf: { xs: "flex-start", sm: "flex-end" }, fontWeight: 800 }}>
      {cta}
    </Button>
  </Card>
);

const getExploreItems = (t) => [
  {
    iconSrc: "/icons/ho_tro_tu_van.svg",
    title: t("home:explore_mentorship_title"),
    description: t("home:explore_mentorship_desc"),
    path: "/mentorship",
  },
  {
    iconSrc: "/icons/ket_noi_csv.svg",
    title: t("home:explore_connect_title"),
    description: t("home:explore_connect_desc"),
    path: "/forum",
  },
  {
    iconSrc: "/icons/tim_kiem_csv.svg",
    title: t("home:explore_find_title"),
    description: t("home:explore_find_desc"),
    path: "/network",
  },
  {
    iconSrc: "/icons/su_kien_hoi_thao.svg",
    title: t("home:explore_events_title"),
    description: t("home:explore_events_desc"),
    path: "/events",
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
  const { t } = useTranslation(['home', 'common']);
  const { achievements } = usePublishedAchievements(0, 6);
  const { articles: alumniArticles } = usePublishedAlumniPosts(0, 6);
  const { events: upcomingEvents, isPending: eventsPending } = usePublishedEvents("upcoming", 0, 3);
  const { news: rawNews } = usePublishedNews(0, 6);
  const [featuredPage, setFeaturedPage] = useState(0);
  const [eventPage, setEventPage] = useState(0);
  const [organizations, setOrganizations] = useState([]);
  const navigate = useOrgNavigate();
  const { isAuthenticated } = useAuth();
  const { organization } = useOrganizationStore();
  const exploreSectionRef = useRef(null);

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const res = await apiClient.get('/organizations');
        if (res?.data?.data) {
          setOrganizations(res.data.data);
        }
      } catch (error) {
        if (error?.response?.status !== 429) {
          console.error("Failed to fetch organizations:", error);
        }
      }
    };
    fetchOrgs();
  }, []);

  const exploreItems = getExploreItems(t);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const handleExploreClick = () => {
    const section = exploreSectionRef.current;
    if (!section) return;

    const headerOffset = isDesktop ? HEADER_HEIGHT.md : HEADER_HEIGHT.xs;
    const targetTop = section.getBoundingClientRect().top + window.scrollY - headerOffset;

    window.scrollTo({
      top: Math.max(targetTop, 0),
      behavior: "smooth",
    });
  };
  const newsCards = rawNews
    .map(normalizeNews)
    .filter(Boolean)
    .map(toCardShape)
    .filter(Boolean);
  const visibleNewsCards = newsCards.slice(0, getHomeNewsLimit(newsCards.length));
  const eventCards = upcomingEvents.map(toEventCardShape).filter(Boolean);
  const visibleEvent = eventCards[eventPage] ?? eventCards[0] ?? null;
  const featuredArticleGroups = useMemo(() => {
    const combined = [...alumniArticles, ...achievements]
      .filter(Boolean)
      .sort((left, right) => new Date(right.updatedAt ?? right.createdAt ?? right.publishedAt ?? 0) - new Date(left.updatedAt ?? left.createdAt ?? left.publishedAt ?? 0))
      .map(toCardShape)
      .filter(Boolean);

    return buildPagedCards(combined.slice(0, getEvenCardLimit(combined.length)), 2);
  }, [achievements, alumniArticles]);
  const visibleFeaturedArticles = featuredArticleGroups[featuredPage] ?? featuredArticleGroups[0] ?? [];

  useEffect(() => {
    const pageCount = featuredArticleGroups.length;
    if (pageCount <= 1) return undefined;
    const timer = window.setInterval(() => {
      setFeaturedPage((current) => (current + 1) % pageCount);
    }, 3600);
    return () => window.clearInterval(timer);
  }, [featuredArticleGroups.length]);

  useEffect(() => {
    const pageCount = eventCards.length;
    if (pageCount <= 1) return undefined;
    const timer = window.setInterval(() => {
      setEventPage((current) => (current + 1) % pageCount);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [eventCards.length]);
  const repeatedPartners = [...PARTNER_LOGOS, ...PARTNER_LOGOS];
  const softSectionBg = theme.palette.mode === "dark"
    ? "background.paper"
    : alpha(theme.palette.primary.main, 0.035);
  const plainSectionBg = "background.default";
  const featuredAlumniBg = "accent.main";

  const activeHeroSlides = useMemo(() => {
    if (!organization) return HERO_SLIDES;
    let customSlides = null;

    try {
      if (organization.brandConfig) {
        const b = typeof organization.brandConfig === 'string' ? JSON.parse(organization.brandConfig) : organization.brandConfig;
        if (Array.isArray(b?.hero_slides) && b.hero_slides.length > 0) customSlides = b.hero_slides;
        else if (Array.isArray(b?.heroSlides) && b.heroSlides.length > 0) customSlides = b.heroSlides;
      }
    } catch {
      customSlides = null;
    }

    if (!customSlides && organization.featuresConfig) {
      try {
        const f = typeof organization.featuresConfig === 'string' ? JSON.parse(organization.featuresConfig) : organization.featuresConfig;
        const b = f?.brand_config || f?.brandConfig;
        if (Array.isArray(b?.hero_slides) && b.hero_slides.length > 0) customSlides = b.hero_slides;
        else if (Array.isArray(b?.heroSlides) && b.heroSlides.length > 0) customSlides = b.heroSlides;
      } catch {
        customSlides = null;
      }
    }

    if (customSlides && customSlides.length > 0) {
      return customSlides.map((url) => (typeof url === 'string' ? { src: url, position: 'center' } : url));
    }

    return HERO_SLIDES;
  }, [organization]);

  return (
    <Page
      title={t("home:page_title")}
      meta={
        <meta
          name="description"
          content={t("home:page_meta_desc")}
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
          backgroundImage: `url(${activeHeroSlides[0]?.src || HERO_SLIDES[0].src})`,
          backgroundSize: "cover",
          backgroundPosition: activeHeroSlides[0]?.position || "center",
          backgroundRepeat: "no-repeat",
          display: "flex",
          alignItems: "center",
          color: "#fff",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            background: theme.palette.mode === "dark"
              ? "linear-gradient(90deg, rgba(0,0,0,0.84) 0%, rgba(0,0,0,0.64) 45%, rgba(0,0,0,0.48) 100%)"
              : "linear-gradient(90deg, rgba(0,0,0,0.76) 0%, rgba(0,0,0,0.54) 45%, rgba(0,0,0,0.38) 100%)",
            zIndex: 1,
          },
        }}
      >
        {activeHeroSlides.map((slide, index) => (
          <Box
            key={slide.src}
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${slide.src})`,
              backgroundSize: "cover",
              backgroundPosition: slide.position || "center",
              opacity: index === 0 ? 1 : 0,
              animation: `${heroSlideAnimation} ${activeHeroSlides.length * 9}s ease-in-out infinite`,
              animationDelay: `${index * 9}s`,
              transformOrigin: "center",
            }}
          />
        ))}
        <Container
          sx={{
            position: "relative",
            zIndex: 2,
            py: { xs: 4, sm: 5, md: 6 },
            px: { xs: 2, sm: 3 },
            "@media (max-height: 680px) and (min-width: 900px)": {
              py: 3,
            },
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 3, md: 4 }}
            alignItems="center"
            sx={{
              width: "100%",
            }}
          >
            <Box sx={{ textAlign: { xs: "center", md: "left" }, flex: { md: "1 1 50%" } }}>
              <RevealBox>
                <Typography
                  variant="h2"
                  component="h1"
                  fontWeight={800}
                  sx={{
                    fontSize: { xs: "1.75rem", sm: "2.5rem", md: "3.5rem", lg: "4rem" },
                    lineHeight: 1.04,
                    letterSpacing: { xs: 1, md: 2 },
                    mb: 2,
                    textTransform: 'uppercase',
                    "@media (max-height: 680px) and (min-width: 900px)": {
                      fontSize: { md: "3rem", lg: "3.35rem" },
                      mb: 1.5,
                    },
                    "@media (max-height: 600px) and (min-width: 900px)": {
                      fontSize: { md: "2.5rem", lg: "2.85rem" },
                      mb: 1,
                    },
                  }}
                >
                  {organization?.name || "ALUMVERSE"}
                </Typography>
              </RevealBox>
              <RevealBox delay={120}>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: { xs: "0.875rem", sm: "1rem", md: "1.125rem" },
                    lineHeight: 1.7,
                    mb: 3,
                    maxWidth: 520,
                    mx: { xs: "auto", md: 0 },
                    color: "rgba(255,255,255,0.95)",
                    "@media (max-height: 680px) and (min-width: 900px)": {
                      fontSize: "1rem",
                      lineHeight: 1.55,
                      mb: 2,
                    },
                    "@media (max-height: 600px) and (min-width: 900px)": {
                      fontSize: "0.95rem",
                      lineHeight: 1.45,
                      mb: 1.5,
                    },
                  }}
                >
                  {t("home:hero_body")}
                </Typography>
              </RevealBox>
              <RevealBox delay={220} sx={{ display: "flex", justifyContent: { xs: "center", md: "flex-start" } }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ width: { xs: "100%", sm: "auto" } }}>
                  <Button
                    onClick={() => navigate("/introduction")}
                    variant="outlined"
                    size="large"
                    sx={{
                      width: { xs: "100%", sm: 150 },
                      borderColor: "#fff",
                      color: "#fff",
                      fontWeight: 700,
                      px: { xs: 2.5, md: 3 },
                      "&:hover": {
                        borderColor: "#fff",
                        color: "#fff",
                        backgroundColor: "rgba(255,255,255,0.14)",
                      },
                    }}
                  >
                    {t("home:hero_intro_btn")}
                  </Button>
                  <Button
                    onClick={handleExploreClick}
                    variant="contained"
                    size="large"
                    sx={{
                      width: { xs: "100%", sm: 150 },
                      bgcolor: "#fff",
                      color: "secondary.main",
                      fontWeight: 700,
                      px: { xs: 2.5, md: 3 },
                      "&:hover": {
                        bgcolor: "#fff",
                        color: "secondary.main",
                      },
                    }}
                  >
                    {t("home:hero_explore_btn")}
                  </Button>
                </Stack>
              </RevealBox>
            </Box>
            {isDesktop && (
              <RevealBox delay={180} sx={{ display: "flex", justifyContent: "center", flex: "1 1 50%" }}>
                <Logo
                  variant="image"
                  src={HERO_LOGO}
                  alt="AlumVerse HCMUS"
                  sx={{
                    maxWidth: 600,
                    width: "100%",
                    height: "auto",
                    cursor: "default",
                    filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.35))",
                    animation: `${floatIconAnimation} 5s ease-in-out infinite`,
                    "@media (max-height: 680px)": {
                      maxWidth: 520,
                      maxHeight: "48svh",
                      objectFit: "contain",
                    },
                    "@media (max-height: 600px)": {
                      maxWidth: 440,
                      maxHeight: "42svh",
                    },
                  }}
                />
              </RevealBox>
            )}
          </Stack>
        </Container>
      </Box>

      {/* Khám phá */}
      <Box ref={exploreSectionRef} sx={{ py: { xs: 7, sm: 9, md: 12 }, backgroundColor: softSectionBg }}>
        <Container sx={{ px: { xs: 2, sm: 3 } }}>
          <RevealBox>
            <Typography
              variant="h1"
              color="primary.main"
              textAlign="center"
              sx={mainSectionTitleSx}
            >
              {t("home:section_explore")}
            </Typography>
          </RevealBox>
          <Stack
            direction="row"
            flexWrap="wrap"
            useFlexGap
            spacing={{ xs: 2, sm: 3 }}
            sx={{ alignItems: "stretch" }}
          >
            {exploreItems.map((item, index) => {
              const { iconSrc, title, description, path } = item;
              return (
                <RevealBox
                  key={item.iconSrc}
                  delay={index * 90}
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
                    borderColor: "divider",
                    borderRadius: 2,
                    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)",
                    textAlign: "center",
                    py: { xs: 2.5, md: 3 },
                    px: { xs: 2, md: 2.5 },
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    height: "100%",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                    backgroundColor: "background.paper",
                    transition: "transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      inset: 0,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}1A, transparent 58%)`,
                      opacity: 0,
                      transition: "opacity 0.28s ease",
                    },
                    "&:hover": {
                      transform: "translateY(-10px)",
                      borderColor: "primary.main",
                      boxShadow: "0 18px 36px rgba(15, 23, 42, 0.16)",
                    },
                    "&:hover::before": {
                      opacity: 1,
                    },
                    "&:hover .explore-icon": {
                      transform: "scale(1.14) rotate(-4deg)",
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
                      flexShrink: 0,
                    }}
                  >
                    <Box
                      className="explore-icon"
                      aria-hidden
                      sx={{
                        width: { xs: 40, md: 48 },
                        height: { xs: 40, md: 48 },
                        bgcolor: theme.palette.mode === "dark" ? "primary.light" : "primary.main",
                        mask: `url(${iconSrc}) center / contain no-repeat`,
                        WebkitMask: `url(${iconSrc}) center / contain no-repeat`,
                        transition: "transform 0.28s ease",
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
                      flex: 1,
                    }}
                  >
                    {description}
                  </Typography>
                </Card>
                </RevealBox>
              );
            })}
          </Stack>
        </Container>
      </Box>

      {/* Sự kiện nổi bật */}
      <Box sx={{ py: { xs: 5.5, sm: 7, md: 8 }, backgroundColor: "primary.main" }}>
        <Container sx={{ px: { xs: 2, sm: 3 } }}>
          {eventsPending ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.28fr) minmax(0, 0.72fr)" },
                gap: { xs: 3, md: 6.5 },
                alignItems: "center",
                minHeight: { xs: 270, md: 300 },
              }}
            >
              <Stack spacing={2}>
                <Skeleton variant="text" sx={{ width: "70%", height: 64 }} />
                <Skeleton variant="text" sx={{ width: "100%", height: 28 }} />
                <Skeleton variant="text" sx={{ width: "85%", height: 28 }} />
                <Skeleton variant="rounded" sx={{ width: 180, height: 44, borderRadius: 1 }} />
              </Stack>
              <Skeleton variant="rounded" sx={{ height: { xs: 245, md: 280 }, borderRadius: 2 }} />
            </Box>
          ) : visibleEvent ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.28fr) minmax(0, 0.72fr)" },
                gap: { xs: 3, md: 6.5 },
                alignItems: "center",
              }}
            >
              <RevealBox>
                <Stack
                  spacing={2.25}
                  sx={{
                    textAlign: { xs: "center", md: "left" },
                    alignItems: { xs: "center", md: "flex-start" },
                  }}
                >
                  <Typography
                    variant="h1"
                    sx={{
                      ...mainSectionTitleSx,
                      mb: 0,
                      color: "#fff",
                    }}
                  >
                    {t("home:events_title")}
                  </Typography>
                  <Typography variant="body1" sx={{ maxWidth: 640, lineHeight: 1.65, color: alpha("#fff", 0.88) }}>
                    {t("home:events_desc")}
                  </Typography>
                  <Button
                    variant="contained"
                    color="inherit"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate("/events")}
                    sx={{
                      px: 2.5,
                      fontWeight: 800,
                      bgcolor: "#fff",
                      color: "primary.main",
                      "&:hover": { bgcolor: "#fff", color: "primary.main" },
                    }}
                  >
                    {t("home:events_all_cta")}
                  </Button>
                </Stack>
              </RevealBox>
              <RevealBox
                key={`${eventPage}-${visibleEvent.id}`}
                delay={120}
                revealAnimation={alumniFlipIn}
                sx={{ display: "flex", justifyContent: { xs: "center", md: "flex-end" } }}
              >
                <EventFeaturedCard
                  event={visibleEvent}
                  onClick={() => navigate(`/article/event/${visibleEvent.id}`)}
                />
              </RevealBox>
            </Box>
          ) : (
            <RevealBox>
              <Card
                elevation={0}
                sx={{
                  minHeight: 220,
                  borderRadius: 2,
                  border: 1,
                  borderColor: "divider",
                  bgcolor: "background.paper",
                  display: "grid",
                  placeItems: "center",
                  textAlign: "center",
                  px: 3,
                }}
              >
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560, lineHeight: 1.8 }}>
                  {t("home:events_empty")}
                </Typography>
              </Card>
            </RevealBox>
          )}
        </Container>
      </Box>

      {/* Kết nối và đồng hành */}
      <Box sx={{ py: { xs: 7, sm: 9, md: 12 }, backgroundColor: "background.paper" }}>
        <Container sx={{ px: { xs: 2, sm: 3 } }}>
          <RevealBox>
            <Box sx={{ maxWidth: 820, ml: "auto", mb: { xs: 3.5, md: 5 }, textAlign: { xs: "center", md: "right" } }}>
              <Typography variant="h1" color="accent.main" sx={{ ...mainSectionTitleSx, mb: 1.5 }}>
                {t("home:connection_title_line_1")}
                <Box component="span" sx={{ display: "block" }}>
                  {t("home:connection_title_line_2")}
                </Box>
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                {t("home:connection_desc")}
              </Typography>
            </Box>
          </RevealBox>
          <Stack spacing={{ xs: 2.5, md: 3 }}>
            <RevealBox revealAnimation={alumniFlipIn}>
              <Card
                elevation={0}
                sx={{
                  p: { xs: 2.5, md: 3.5 },
                  borderRadius: 2,
                  border: 1,
                  borderColor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.36 : 0.18),
                  bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.16 : 0.06),
                  height: "100%",
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "minmax(0, 0.85fr) minmax(0, 1.15fr)" },
                    gap: { xs: 2.5, md: 4 },
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                      <SchoolOutlinedIcon sx={{ color: "primary.main", fontSize: 34 }} />
                      <Typography variant="h3" color="primary.main" sx={{ fontWeight: 800 }}>
                        {t("home:mentorship_label")}
                      </Typography>
                    </Stack>
                    <Typography variant="subtitle1" color="primary.main" sx={{ fontWeight: 800, mb: 1 }}>
                      {t("home:mentorship_preview_title")}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.65, mb: 2.5 }}>
                      {t("home:mentorship_preview_desc")}
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => navigate("/mentorship")}
                      sx={{ fontWeight: 800 }}
                    >
                      {isAuthenticated ? t("home:mentorship_auth_cta") : t("home:mentorship_guest_cta")}
                    </Button>
                  </Box>
                  <Stack spacing={2} divider={<Divider flexItem />}>
                    <FeatureStep number="01" title={t("home:mentorship_step_1_title")} description={t("home:mentorship_step_1_desc")} />
                    <FeatureStep number="02" title={t("home:mentorship_step_2_title")} description={t("home:mentorship_step_2_desc")} />
                    <FeatureStep number="03" title={t("home:mentorship_step_3_title")} description={t("home:mentorship_step_3_desc")} />
                  </Stack>
                </Box>
              </Card>
            </RevealBox>
            <RevealBox delay={100} revealAnimation={alumniFlipIn}>
              <Card
                elevation={0}
                sx={{
                  p: { xs: 2.5, md: 3 },
                  borderRadius: 2,
                  border: 1,
                  borderColor: (theme) => alpha(theme.palette.secondary.main, theme.palette.mode === "dark" ? 0.34 : 0.16),
                  bgcolor: "background.paper",
                  height: "100%",
                }}
              >
                <Stack spacing={2.25}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <ForumOutlinedIcon sx={{ color: "secondary.main", fontSize: 34, flexShrink: 0 }} />
                    <Box>
                      <Typography variant="h3" color="secondary.main" sx={{ fontWeight: 800 }}>
                        {t("home:forum_preview_title")}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        {t("home:forum_preview_desc")}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
                    {[
                      ["forum_category_study", "warning"],
                      ["forum_category_career", "accent"],
                      ["forum_category_alumni", "primary"],
                    ].map(([key, color]) => (
                      <Card
                        key={key}
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: 1,
                          borderColor: "divider",
                          bgcolor: "background.default",
                          minHeight: 150,
                          transition: "transform 0.22s ease, border-color 0.22s ease",
                          "&:hover": { transform: "translateY(-5px)", borderColor: `${color}.main` },
                        }}
                      >
                        <Stack spacing={1.25}>
                          <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: `${color}.main`, flexShrink: 0 }} />
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "text.primary" }}>
                              {t(`home:${key}_title`)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                              {t(`home:${key}_desc`)}
                            </Typography>
                          </Box>
                        </Stack>
                      </Card>
                    ))}
                  </Box>
                  <Button variant="contained" color="secondary" endIcon={<ArrowForwardIcon />} onClick={() => navigate("/forum")} sx={{ alignSelf: "flex-start", fontWeight: 800 }}>
                    {t("home:forum_preview_cta")}
                  </Button>
                </Stack>
              </Card>
            </RevealBox>
          </Stack>
        </Container>
      </Box>

      {/* Phát triển cùng AlumVerse */}
      <Box sx={{ py: { xs: 7, sm: 9, md: 12 }, backgroundColor: softSectionBg }}>
        <Container sx={{ px: { xs: 2, sm: 3 } }}>
          <RevealBox>
            <HomeSectionHeader
              title={t("home:development_title")}
              description={t("home:development_desc")}
              titleColor="secondary.main"
            />
          </RevealBox>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: { xs: 2, md: 3 } }}>
            <RevealBox revealAnimation={alumniFlipIn}>
              <GatewayCard
                icon={<MenuBookOutlinedIcon />}
                color="primary"
                title={t("home:learning_gateway_title")}
                description={t("home:learning_gateway_desc")}
                bullets={[t("home:learning_bullet_docs"), t("home:learning_bullet_subjects"), t("home:learning_bullet_orientation")]}
                cta={t("home:learning_gateway_cta")}
                onClick={() => navigate("/development/academics")}
              />
            </RevealBox>
            <RevealBox delay={100} revealAnimation={alumniFlipIn}>
              <GatewayCard
                icon={<WorkOutlineOutlinedIcon />}
                color="accent"
                title={t("home:jobs_gateway_title")}
                description={t("home:jobs_gateway_desc")}
                bullets={[t("home:jobs_bullet_posts"), t("home:jobs_bullet_internship"), t("home:jobs_bullet_apply")]}
                cta={t("home:jobs_gateway_cta")}
                onClick={() => navigate("/development/jobs")}
              />
            </RevealBox>
          </Box>
        </Container>
      </Box>

      {/* Tin tức */}
      <Box sx={{ py: { xs: 7, sm: 9, md: 12 }, backgroundColor: plainSectionBg }}>
        <Container sx={{ px: { xs: 2, sm: 3 } }}>
          <RevealBox>
            <Typography
              variant="h1"
              color="primary.main"
              textAlign="center"
              sx={mainSectionTitleSx}
            >
              {t("home:section_news")}
            </Typography>
          </RevealBox>
          <RevealBox delay={100}>
            <Typography
              variant="body1"
              color="text.secondary"
              textAlign="center"
              sx={{ maxWidth: 720, mx: "auto", mb: { xs: 3, md: 5 }, lineHeight: 1.7 }}
            >
              {t("home:section_news_desc")}
            </Typography>
          </RevealBox>
          <Stack
            direction="row"
            flexWrap="wrap"
            useFlexGap
            spacing={{ xs: 2, sm: 3 }}
          >
            {visibleNewsCards.map((article, index) => (
                <RevealBox
                  key={article.id}
                  delay={index * 90}
                  revealAnimation={alumniFlipIn}
                onClick={() => navigate(`/article/news/${article.id}`)}
                sx={{
                  flex: "1 1 100%",
                  minWidth: 0,
                  "@media (min-width:600px)": { flex: "1 1 calc(50% - 12px)" },
                  "@media (min-width:900px)": { flex: "1 1 calc(33.333% - 16px)" },
                  cursor: "pointer",
                }}
              >
                <ArticleCard article={article} />
              </RevealBox>
            ))}
          </Stack>
          <RevealBox delay={120} sx={{ display: "flex", justifyContent: "center", mt: { xs: 3, md: 5 } }}>
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate("/news")}
              sx={{ px: 3, py: 1.1, fontWeight: 800 }}
            >
              {t("home:news_all_cta")}
            </Button>
          </RevealBox>
        </Container>
      </Box>

      {/* Cựu sinh viên tiêu biểu */}
      <Box sx={{
        py: { xs: 8, sm: 10, md: 13 },
        backgroundColor: featuredAlumniBg,
        minHeight: { xs: 'calc(100svh - 64px)', md: 'calc(100vh - 64px)' },
        display: 'flex',
        alignItems: 'center',
      }}>
        <Container sx={{ px: { xs: 2, sm: 3 } }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 3, md: 6 }}
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <Box sx={{ flex: { md: "0 0 34%" }, textAlign: { xs: "center", md: "left" } }}>
              <RevealBox>
                <Typography
                  variant="h1"
                  sx={{
                    ...mainSectionTitleSx,
                    mb: 2,
                    color: "#fff",
                    textAlign: { xs: "center", md: "left" },
                  }}
                >
                  {t("home:section_featured_alumni_line_1")}
                  <Box component="span" sx={{ display: "block" }}>
                    {t("home:section_featured_alumni_line_2")}
                  </Box>
                </Typography>
              </RevealBox>
              <RevealBox delay={100}>
                <Typography variant="body1" sx={{ color: alpha("#fff", 0.9), lineHeight: 1.8, mb: 3 }}>
                  {t("home:section_featured_alumni_desc")}
                </Typography>
              </RevealBox>
              <RevealBox delay={180}>
                <Button
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate("/honors/achievements")}
                  sx={{
                    px: 2.5,
                    fontWeight: 700,
                    bgcolor: "#fff",
                    color: "accent.main",
                    "&:hover": { bgcolor: "#fff", color: "accent.main" },
                  }}
                >
                  {t("home:featured_alumni_cta")}
                </Button>
              </RevealBox>
            </Box>
            <Box
              sx={{
                flex: 1,
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                gap: { xs: 2, md: 3 },
              }}
            >
              {visibleFeaturedArticles.map((article, index) => (
                <RevealBox
                  key={`${featuredPage}-${article.channel}-${article.id}`}
                  delay={index * 110}
                  revealAnimation={alumniFlipIn}
                  onClick={() => navigate(`/article/${article.channel}/${article.id}`)}
                  sx={{
                    minWidth: 0,
                    cursor: "pointer",
                    "& > div": {
                      height: "auto",
                      minHeight: 0,
                      p: 0,
                      borderRadius: 2,
                      bgcolor: "transparent",
                      boxShadow: "none",
                    },
                    "& > div > div:first-of-type": {
                      height: { xs: 150, sm: 170, md: 180, lg: 190 },
                      borderRadius: 1.5,
                    },
                    "& > div > div:nth-of-type(2)": {
                      minHeight: 0,
                      gap: 1,
                    },
                    "& h4": {
                      color: "#fff",
                      lineHeight: 1.28,
                    },
                    "& p": {
                      color: alpha("#fff", 0.9),
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    },
                    "& .MuiTypography-caption": {
                      color: alpha("#fff", 0.72),
                    },
                    "& .MuiButton-root": {
                      color: "accent.light",
                    },
                    "& svg": {
                      color: "accent.light",
                    },
                  }}
                >
                  <ArticleCard article={article} stretch={false} />
                </RevealBox>
              ))}
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* Đối tác */}
      <Box sx={{ py: { xs: 8, sm: 10, md: 12 }, backgroundColor: softSectionBg, overflow: "hidden" }}>
        <Container sx={{ px: { xs: 2, sm: 3 } }}>
          <RevealBox>
            <Typography
              variant="h5"
              textAlign="center"
              color="primary.main"
              sx={marqueeTitleSx}
            >
              {t("common:partners_count")}
            </Typography>
          </RevealBox>
          <Box sx={{ position: "relative", overflow: "hidden", py: 2 }}>
            <Box
              sx={{
                display: "flex",
                width: "max-content",
                gap: { xs: 4, md: 6 },
                animation: `${scrollAnimation} ${PARTNER_LOGOS.length * 2.4}s linear infinite`,
                animationDirection: "reverse",
                "&:hover": {
                  animationPlayState: "paused",
                },
              }}
            >
              {repeatedPartners.map(({ name, src }, index) => (
                <Box
                  key={`${name}-${index}`}
                  component="img"
                  src={src}
                  alt={name}
                  sx={{
                    width: { xs: 72, sm: 86, md: 104 },
                    height: { xs: 36, sm: 42, md: 48 },
                    objectFit: "contain",
                    flexShrink: 0,
                    filter: theme.palette.mode === "dark" ? "brightness(1.15)" : "none",
                  }}
                />
              ))}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Các tổ chức trên hệ thống */}
      {organizations.length > 0 && (
        <Box sx={{ py: { xs: 8, sm: 10, md: 12 }, backgroundColor: "background.paper", overflow: "hidden" }}>
          <Container sx={{ px: { xs: 2, sm: 3 } }}>
            <RevealBox>
              <Typography
                variant="h5"
                textAlign="center"
                color="accent.main"
                sx={marqueeTitleSx}
              >
                {t("home:section_other_orgs")}
              </Typography>
            </RevealBox>
            <RevealBox delay={100}>
              <Typography
                variant="body1"
                color="text.secondary"
                textAlign="center"
                sx={{ maxWidth: 680, mx: "auto", mb: { xs: 3, md: 4 }, lineHeight: 1.8, fontSize: { xs: "0.95rem", md: "1rem" } }}
              >
                {t("home:section_other_orgs_desc")}
              </Typography>
            </RevealBox>
            <Box sx={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
              <Box
                sx={{
                  display: "flex",
                  width: "max-content",
                  animation: `${scrollAnimation} ${Math.max(organizations.length * 3, 10)}s linear infinite`,
                  gap: { xs: 2, md: 4 },
                  "&:hover": {
                    animationPlayState: "paused",
                  },
                }}
              >
                {[...organizations, ...organizations].map((org, idx) => (
                  (() => {
                    const departmentName = String(org.departmentName || '').trim();
                    const displayName = String(org.name || '').trim();
                    const slugName = String(org.slug || '').trim();
                    const primaryName = departmentName || displayName;
                    const secondaryName = slugName || (departmentName ? displayName : '');

                    return (
                  <Card
                    key={`${org.id}-${idx}`}
                    component="a"
                    href={`/${org.slug}`}
                    sx={{
                      width: { xs: 240, sm: 260 },
                      minHeight: 168,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      p: 2,
                      textDecoration: "none",
                      flexShrink: 0,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      backgroundColor: "background.paper",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: 4,
                      },
                    }}
                  >
                    {org.logoUrl ? (
                      <Box
                        component="img"
                        src={org.logoUrl}
                        alt={displayName}
                        sx={{ height: 64, maxWidth: "100%", objectFit: "contain", mb: 1.25 }}
                      />
                    ) : (
                      <Logo disabledLink sx={{ width: 64, height: 64, mb: 1.25 }} />
                    )}
                    <Typography
                      variant="subtitle1"
                      textAlign="center"
                      fontWeight={800}
                      color="text.primary"
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        lineHeight: 1.25,
                      }}
                    >
                      {primaryName}
                    </Typography>
                    {secondaryName && (
                        <Typography
                          variant="caption"
                          textAlign="center"
                          fontWeight={600}
                        color="text.secondary"
                        sx={{
                          display: "-webkit-box",
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          lineHeight: 1.35,
                          mt: 0.5,
                          maxWidth: "100%",
                        }}
                      >
                        {secondaryName}
                      </Typography>
                    )}
                  </Card>
                    );
                  })()
                ))}
              </Box>
            </Box>
          </Container>
        </Box>
      )}
      </Container>
    </Page>
  );
};

export default HomePage;
