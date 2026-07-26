import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Stack,
  Grid,
  Paper,
  Card,
  Avatar,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import Page from "../../components/Page";
import { useOrganization } from "../../hooks/useOrganization";
import { getIntroduction } from "../../utils/api";
import {
  ScrollReveal,
  ScrollRevealGroup,
  ScrollRevealItem,
  getStaggerDelay,
} from "../../components/animations/ScrollReveal";
import { normalizeRichTextHtml } from "../../utils/stringUtils";

const BANNER_IMG = "/home_page/home_page.png";

const IntroducePage = () => {
  const { t } = useTranslation('home');
  const theme = useTheme();
  const { organization } = useOrganization();
  const location = useLocation();
  const [introduction, setIntroduction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("general"); // general, leaders, team
  const contentRef = useRef(null);
  const heroRef = useRef(null);
  const [placeholderHeight, setPlaceholderHeight] = useState(600);

  useEffect(() => {
    const path = location.pathname;
    if (path.endsWith("/leaders")) {
      setMode("leaders");
    } else if (path.endsWith("/team")) {
      setMode("team");
    } else {
      setMode("general");
    }
  }, [location.pathname]);

  useEffect(() => {
    const fetchIntro = async () => {
      if (organization?.id) {
        setLoading(true);
        try {
          const data = await getIntroduction(organization.id);
          setIntroduction(data);
        } catch (error) {
          console.error("Failed to fetch introduction:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchIntro();
  }, [organization?.id]);

  const getPageConfig = () => {
    switch (mode) {
      case "leaders":
        return { title: t('intro_leaders_title') };
      case "team":
        return { title: t('intro_team_title') };
      default:
        return { title: t('intro_title') };
    }
  };

  const config = getPageConfig();
  const isDark = theme.palette.mode === "dark";
  const contentFrameShadow = isDark
    ? `0 18px 46px ${alpha(theme.palette.common.black, 0.46)}, 0 0 0 1px ${alpha(theme.palette.common.white, 0.08)}`
    : "0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)";

  const recalcPlaceholder = useCallback(() => {
    if (!contentRef.current || !heroRef.current) return;
    const heroH = heroRef.current.getBoundingClientRect().height;
    const contentH = contentRef.current.getBoundingClientRect().height;
    const contentTopInHero = heroH * 0.54;
    const overflow = contentH - (heroH - contentTopInHero);
    setPlaceholderHeight(Math.max(overflow + 140, 140));
  }, []);

  useEffect(() => {
    if (!contentRef.current) return;
    const ro = new ResizeObserver(recalcPlaceholder);
    ro.observe(contentRef.current);
    return () => ro.disconnect();
  }, [introduction, mode, loading, recalcPlaceholder]);

  const renderHTML = (html) => {
    if (!html) return null;
    const cleanHtml = normalizeRichTextHtml(html);
    return (
      <ScrollReveal
        sx={{
          lineHeight: 1.6,
          "& img, & img.rich-content-image, & img.ql-content-image": {
            display: "block",
            maxWidth: "min(100%, 520px) !important",
            width: "auto !important",
            height: "auto !important",
            maxHeight: "560px !important",
            objectFit: "contain",
            borderRadius: 2,
            mx: "auto",
            my: 2,
          },
          "& p": { m: 0, textAlign: "justify", minHeight: "1.5em", "&:not(:last-child)": { mb: "0.5em" } },
          "& p.ql-empty-line, & p:has(> br:only-child)": { display: "block", minHeight: "1.5em", lineHeight: "1.5em", my: 0 },
          "& h1, & h2, & h3, & h4, & h5, & h6": { color: "primary.main", mb: 2, mt: 3 },
          "& ul, & ol": { mb: 2, pl: 4 },
          "& li": { mb: 1 },
          "& .ql-size-small": { fontSize: "0.85em" },
          "& .ql-size-large": { fontSize: "1.25em" },
          "& .ql-size-huge": { fontSize: "1.6em" },
          "& .ql-align-left": { textAlign: "left !important" },
          "& .ql-align-center": { textAlign: "center !important" },
          "& .ql-align-right": { textAlign: "right !important" },
          "& .ql-align-justify": { textAlign: "justify !important" },
          color: "text.primary",
          overflowWrap: "break-word",
          wordBreak: "break-word",
        }}
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    );
  };

  const renderGeneralInfo = () => (
    <Box>
      {renderHTML(introduction?.content)}

      {(introduction?.vision || introduction?.mission || introduction?.coreValues) && (
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 2.5,
            alignItems: "stretch",
            width: "100%",
            mt: 5,
            mb: 5,
          }}
        >
          {introduction?.vision && (
            <Box sx={{ flex: 1, minWidth: 0, display: "flex" }}>
              <ScrollReveal delay={0.05} sx={{ width: "100%", display: "flex", flexDirection: "column" }}>
                <Card
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    bgcolor: alpha(theme.palette.secondary.main, theme.palette.mode === "dark" ? 0.16 : 0.04),
                    border: `1px solid ${alpha(theme.palette.secondary.main, theme.palette.mode === "dark" ? 0.38 : 0.18)}`,
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                    <Avatar sx={{ bgcolor: "secondary.main", color: "secondary.contrastText", width: 34, height: 34 }}>
                      <VisibilityRoundedIcon sx={{ fontSize: 19, color: "#fff" }} />
                    </Avatar>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "secondary.main", fontSize: "1.05rem" }}>
                      {t('intro_vision')}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      fontWeight: 500,
                      lineHeight: 1.65,
                      textAlign: "justify",
                      whiteSpace: "pre-line",
                      flex: 1,
                      fontSize: "0.92rem",
                    }}
                  >
                    {introduction.vision}
                  </Typography>
                </Card>
              </ScrollReveal>
            </Box>
          )}

          {introduction?.mission && (
            <Box sx={{ flex: 1, minWidth: 0, display: "flex" }}>
              <ScrollReveal delay={0.1} sx={{ width: "100%", display: "flex", flexDirection: "column" }}>
                <Card
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    bgcolor: alpha(theme.palette.primary.main, 0.03),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                    <Avatar sx={{ bgcolor: "primary.main", width: 34, height: 34 }}>
                      <RocketLaunchRoundedIcon sx={{ fontSize: 19, color: "#fff" }} />
                    </Avatar>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "primary.dark", fontSize: "1.05rem" }}>
                      {t('intro_mission')}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      fontWeight: 500,
                      lineHeight: 1.65,
                      textAlign: "justify",
                      whiteSpace: "pre-line",
                      flex: 1,
                      fontSize: "0.92rem",
                    }}
                  >
                    {introduction.mission}
                  </Typography>
                </Card>
              </ScrollReveal>
            </Box>
          )}

          {introduction?.coreValues && (
            <Box sx={{ flex: 1, minWidth: 0, display: "flex" }}>
              <ScrollReveal delay={0.15} sx={{ width: "100%", display: "flex", flexDirection: "column" }}>
                <Card
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    bgcolor: alpha(theme.palette.accent.main, theme.palette.mode === "dark" ? 0.15 : 0.06),
                    border: `1px solid ${alpha(theme.palette.accent.main, theme.palette.mode === "dark" ? 0.42 : 0.24)}`,
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                    <Avatar sx={{ bgcolor: "accent.main", color: "accent.contrastText", width: 34, height: 34 }}>
                      <FavoriteRoundedIcon sx={{ fontSize: 19 }} />
                    </Avatar>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "accent.dark", fontSize: "1.05rem" }}>
                      {t('intro_core_values')}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      fontWeight: 500,
                      lineHeight: 1.65,
                      textAlign: "justify",
                      whiteSpace: "pre-line",
                      flex: 1,
                      fontSize: "0.92rem",
                    }}
                  >
                    {introduction.coreValues}
                  </Typography>
                </Card>
              </ScrollReveal>
            </Box>
          )}
        </Box>
      )}

      {introduction?.imageUrls && introduction.imageUrls.length > 0 && (
        <Box sx={{ mt: 5, mb: 4 }}>
          <Typography
            variant="h5"
            color="primary.main"
            fontWeight={800}
            sx={{ mb: 3, fontSize: "1.25rem" }}
          >
            {t('intro_activity_images')}
          </Typography>
          <Grid container spacing={2}>
            {introduction.imageUrls.map((url, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <ScrollReveal delay={getStaggerDelay(index)}>
                  <Box
                    component="img"
                    src={url}
                    alt={`Introduction ${index}`}
                    sx={{
                      width: "100%",
                      height: 240,
                      objectFit: "cover",
                      borderRadius: 2,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      transition: "transform 0.3s ease",
                      "&:hover": {
                        transform: "scale(1.02)",
                      },
                    }}
                  />
                </ScrollReveal>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );

  const renderLeaders = () => (
    <Box>
      {introduction?.leaders && introduction.leaders.length > 0 && (
        <Box>
          <Stack spacing={2}>
            {introduction.leaders.map((leader, index) => (
              <ScrollReveal key={index} delay={getStaggerDelay(index)}>
                <Paper
                  sx={{
                    p: { xs: 2, sm: 2.5 },
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 2, sm: 3 },
                    width: '100%',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.22 : 0.12),
                    boxShadow: 'none',
                    transition: 'all 0.3s',
                    '&:hover': {
                      borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.34 : 0.2),
                      boxShadow: theme.palette.mode === 'dark'
                        ? `0 18px 40px ${alpha(theme.palette.common.black, 0.26)}, 0 0 0 1px ${alpha(theme.palette.common.white, 0.06)}`
                        : `0 16px 42px ${alpha(theme.palette.primary.main, 0.12)}`,
                    },
                  }}
                >
                  <Box sx={{ width: { xs: 112, sm: 124 }, height: { xs: 112, sm: 124 }, flexShrink: 0 }}>
                    <Box
                      component="img"
                      src={leader.image || "/default_avatar.png"}
                      alt={leader.name}
                      sx={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        objectFit: "cover",
                        border: '3px solid',
                        borderColor: 'background.paper',
                        boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.18)}, 0 8px 24px ${alpha(theme.palette.common.black, 0.12)}`,
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h6" fontWeight={800} color="primary.main" sx={{ lineHeight: 1.25, fontSize: { xs: '1.12rem', sm: '1.2rem' } }}>
                      {leader.name}
                    </Typography>
                    {leader.positions && (
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mt: 0.25, fontSize: '0.96rem', lineHeight: 1.4 }}>
                        {leader.positions}
                      </Typography>
                    )}
                    {leader.email && (
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'block', mt: 0.25, fontSize: '0.92rem', lineHeight: 1.4 }}>
                        {leader.email}
                      </Typography>
                    )}
                    {leader.content && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: 'block',
                          mt: 1.75,
                          whiteSpace: 'pre-line',
                          textAlign: 'justify',
                          lineHeight: 1.65,
                          fontSize: '0.92rem',
                          overflowWrap: 'break-word',
                          wordBreak: 'break-word',
                        }}
                      >
                        {leader.content}
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </ScrollReveal>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );

  const renderMembers = () => (
    <Box>
      {introduction?.teamMembers && introduction.teamMembers.length > 0 && (
        <Box>
          <Stack spacing={2}>
            {introduction.teamMembers.map((member, index) => (
              <ScrollReveal key={index} delay={getStaggerDelay(index)}>
                <Paper
                  sx={{
                    p: { xs: 2, sm: 2.5 },
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 2, sm: 3 },
                    width: '100%',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.22 : 0.12),
                    boxShadow: 'none',
                    transition: 'all 0.3s',
                    '&:hover': {
                      borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.34 : 0.2),
                      boxShadow: theme.palette.mode === 'dark'
                        ? `0 18px 40px ${alpha(theme.palette.common.black, 0.26)}, 0 0 0 1px ${alpha(theme.palette.common.white, 0.06)}`
                        : `0 16px 42px ${alpha(theme.palette.primary.main, 0.12)}`,
                    }
                  }}
                >
                  <Box sx={{ width: { xs: 112, sm: 124 }, height: { xs: 112, sm: 124 }, flexShrink: 0 }}>
                    <Box
                      component="img"
                      src={member.image || "/default_avatar.png"}
                      alt={member.name}
                      sx={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        objectFit: "cover",
                        border: '3px solid',
                        borderColor: 'background.paper',
                        boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.18)}, 0 8px 24px ${alpha(theme.palette.common.black, 0.12)}`,
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h6" fontWeight={800} color="primary.main" sx={{ lineHeight: 1.25, fontSize: { xs: '1.12rem', sm: '1.2rem' } }}>
                      {member.name}
                    </Typography>
                    {member.positions && (
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mt: 0.25, fontSize: '0.96rem', lineHeight: 1.4 }}>
                        {member.positions}
                      </Typography>
                    )}
                    {member.email && (
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'block', mt: 0.25, fontSize: '0.92rem', lineHeight: 1.4 }}>
                        {member.email}
                      </Typography>
                    )}
                    {member.content && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: 'block',
                          mt: 1.75,
                          whiteSpace: 'pre-line',
                          textAlign: 'justify',
                          lineHeight: 1.65,
                          fontSize: '0.92rem',
                          overflowWrap: 'break-word',
                          wordBreak: 'break-word',
                        }}
                      >
                        {member.content}
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </ScrollReveal>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );

  const renderContent = () => {
    switch (mode) {
      case "leaders":
        return renderLeaders();
      case "team":
        return renderMembers();
      default:
        return renderGeneralInfo();
    }
  };

  const getHeroBannerSrc = () => {
    let url = introduction?.bannerUrl || null;

    if (!url && organization?.brandConfig) {
      try {
        const b = typeof organization.brandConfig === 'string' ? JSON.parse(organization.brandConfig) : organization.brandConfig;
        url = b?.hero_banner_url || b?.heroBannerUrl;
      } catch (e) {}
    }

    if (!url && organization?.featuresConfig) {
      try {
        const f = typeof organization.featuresConfig === 'string' ? JSON.parse(organization.featuresConfig) : organization.featuresConfig;
        const b = f?.brand_config || f?.brandConfig;
        url = b?.hero_banner_url || b?.heroBannerUrl;
      } catch (e) {}
    }

    return (
      url ||
      organization?.heroBannerUrl ||
      organization?.hero_banner_url ||
      BANNER_IMG
    );
  };

  const activeBanner = getHeroBannerSrc();

  return (
    <Page
      key={location.pathname}
      title={config.title}
      meta={
        <meta
          name="description"
          content={t('intro_meta_desc', { name: organization?.name || t('intro_org_fallback') })}
        />
      }
    >
      <Container maxWidth={false} disableGutters sx={{ display: "flex", flexDirection: "column" }}>
        {/* Hero + absolute content frame wrapper */}
        <Box
          ref={heroRef}
          sx={{
            position: "relative",
            top: "-1px",
            pt: "1px",
            height: { xs: "42vh", sm: "50vh", md: "62vh" },
            minHeight: { xs: 300, sm: 380, md: 480 },
          }}
        >
          {/* Top Hero Banner - NO DARK OVERLAY LAYER */}
          <ScrollReveal
            direction="none"
            duration={0.8}
            sx={{
              position: "absolute",
              inset: 0,
              top: "-1px",
              backgroundColor: "primary.dark",
              backgroundImage: `url(${activeBanner})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />

          {/* Main content frame */}
          <Box
            ref={contentRef}
            sx={{
              position: "absolute",
              top: { xs: "54%", sm: "56%", md: "54%" },
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              px: { xs: 2, sm: 3 },
            }}
          >
            <ScrollRevealGroup
              stagger={0.1}
              sx={{
                width: "100%",
                maxWidth: 1200,
                backgroundColor: "background.paper",
                borderRadius: 2,
                boxShadow: contentFrameShadow,
                overflow: "hidden",
                py: { xs: 6, md: 8 },
                px: { xs: 3, sm: 4, md: 6 },
              }}
            >
              {/* Title */}
              <ScrollRevealItem>
                <Typography
                  variant="h1"
                  component="h1"
                  fontWeight={800}
                  color="primary.main"
                  textAlign="center"
                  sx={{
                    mb: { xs: 3, md: 4 },
                    fontSize: { xs: "1.65rem", md: "2.1rem" },
                    lineHeight: 1.22,
                    overflowWrap: "break-word",
                    wordBreak: "normal",
                  }}
                >
                  {config.title}
                </Typography>
              </ScrollRevealItem>

              {/* Full-width cover image directly under title */}
              {!loading && activeBanner && (
                <ScrollRevealItem>
                  <Box
                    component="img"
                    src={activeBanner}
                    alt={config.title}
                    sx={{
                      width: "100%",
                      maxHeight: { xs: 260, sm: 360, md: 440 },
                      objectFit: "cover",
                      borderRadius: 2,
                      mb: { xs: 4, md: 5 },
                      boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                      display: "block",
                    }}
                  />
                </ScrollRevealItem>
              )}

              {/* Article content */}
              <ScrollRevealItem>
                {loading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 15 }}>
                    <CircularProgress size={60} thickness={4} />
                  </Box>
                ) : (
                  <Box sx={{ minHeight: 400 }}>
                    {!introduction ? (
                      <Stack alignItems="center" spacing={2} sx={{ py: 10 }}>
                        <Typography variant="h5" color="text.secondary">
                          {t('intro_empty_title')}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" textAlign="center">
                          {t('intro_empty_desc')}
                        </Typography>
                      </Stack>
                    ) : (
                      renderContent()
                    )}
                  </Box>
                )}
              </ScrollRevealItem>
            </ScrollRevealGroup>
          </Box>
        </Box>

        {/* Placeholder space */}
        <Box sx={{ height: placeholderHeight }} />
      </Container>
    </Page>
  );
};

export default IntroducePage;
