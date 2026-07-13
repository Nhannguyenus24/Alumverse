import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Container,
  Stack,
  Typography,
  Button,
  Card,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Page from "../../components/Page";
import { usePublishedAchievements } from "../../hooks/articles/usePublishedAchievements";
import { usePublishedAlumniPosts } from "../../hooks/articles/usePublishedAlumniPosts";
import { usePublishedNews } from "../../hooks/news/usePublishedNews";
import { normalizeNews } from "../../hooks/articles/normalizeArticle";
import { toCardShape } from "../../hooks/articles/toCardShape";
import Logo from "../../components/Logo";
import { useOrgNavigate } from "../../hooks/useOrgNavigate";
import { keyframes } from "@emotion/react";
import { alpha } from "@mui/material/styles";
import apiClient from "../../utils/axios";
import ArticleCard from "../../components/articles/ArticleCard";
import useOrganizationStore from "../../stores/organizationStore";

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
  fontSize: { xs: "1.35rem", sm: "1.55rem", md: "1.9rem" },
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
    if (group.length < pageSize && items.length > group.length) {
      group.push(...items.slice(0, pageSize - group.length));
    }
    pages.push(group);
  }
  return pages;
};

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
  const { news: rawNews } = usePublishedNews(0, 6);
  const [featuredPage, setFeaturedPage] = useState(0);
  const [organizations, setOrganizations] = useState([]);
  const navigate = useOrgNavigate();
  const { organization } = useOrganizationStore();

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

  useEffect(() => {
    const pageCount = Math.ceil(Math.min(achievements.length + alumniArticles.length, 6) / 2);
    if (pageCount <= 1) return undefined;
    const timer = window.setInterval(() => {
      setFeaturedPage((current) => (current + 1) % pageCount);
    }, 3600);
    return () => window.clearInterval(timer);
  }, [achievements.length, alumniArticles.length]);

  const exploreItems = getExploreItems(t);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const newsCards = rawNews.map(normalizeNews).filter(Boolean).map(toCardShape).filter(Boolean);
  const featuredArticleGroups = useMemo(() => {
    const combined = [...alumniArticles, ...achievements]
      .filter(Boolean)
      .sort((left, right) => new Date(right.publishedAt || 0) - new Date(left.publishedAt || 0))
      .slice(0, 6)
      .map(toCardShape)
      .filter(Boolean);

    return buildPagedCards(combined, 2);
  }, [achievements, alumniArticles]);
  const visibleFeaturedArticles = featuredArticleGroups[featuredPage] ?? featuredArticleGroups[0] ?? [];
  const repeatedPartners = [...PARTNER_LOGOS, ...PARTNER_LOGOS];
  const softSectionBg = theme.palette.mode === "dark"
    ? "background.paper"
    : alpha(theme.palette.primary.main, 0.035);
  const plainSectionBg = "background.default";
  const featuredAlumniBg = theme.palette.mode === "dark" ? "primary.dark" : "primary.main";

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
          backgroundImage: `url(${HERO_SLIDES[0].src})`,
          backgroundSize: "cover",
          backgroundPosition: HERO_SLIDES[0].position,
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
        {HERO_SLIDES.map((slide, index) => (
          <Box
            key={slide.src}
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${slide.src})`,
              backgroundSize: "cover",
              backgroundPosition: slide.position,
              opacity: index === 0 ? 1 : 0,
              animation: `${heroSlideAnimation} ${HERO_SLIDES.length * 9}s ease-in-out infinite`,
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
                      color: "#fff",
                      backgroundColor: "rgba(255,255,255,0.1)",
                    },
                  }}
                >
                  {t("home:hero_intro_btn")}
                </Button>
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
      <Box sx={{ py: { xs: 7, sm: 9, md: 12 }, backgroundColor: softSectionBg }}>
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
            {newsCards.map((article, index) => (
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
      <Box sx={{ py: { xs: 8, sm: 10, md: 13 }, backgroundColor: featuredAlumniBg }}>
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
                  {t("home:section_featured_alumni")}
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
                  color="accent"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate("/honors/achievements")}
                  sx={{
                    px: 2.5,
                    fontWeight: 700,
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
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      fontSize: { xs: "1.15rem", md: "1.28rem", lg: "1.35rem" },
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
        <Box sx={{ py: { xs: 8, sm: 10, md: 12 }, backgroundColor: plainSectionBg, overflow: "hidden" }}>
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
                  <Card
                    key={`${org.id}-${idx}`}
                    component="a"
                    href={`/${org.slug}`}
                    sx={{
                      width: 220,
                      minHeight: 130,
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
                      <>
                        <Box
                          component="img"
                          src={org.logoUrl}
                          alt={org.name}
                          sx={{ height: 60, maxWidth: "100%", objectFit: "contain", mb: 1.5 }}
                        />
                        <Typography
                          variant="body2"
                          textAlign="center"
                          fontWeight={600}
                          color="text.secondary"
                          sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            lineHeight: 1.4,
                          }}
                        >
                          {org.name}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="subtitle1" textAlign="center" fontWeight={600} color="primary.main">
                        {org.name}
                      </Typography>
                    )}
                  </Card>
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
