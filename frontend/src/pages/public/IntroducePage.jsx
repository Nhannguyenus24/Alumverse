import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useParams } from "react-router";
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Stack,
  Grid,
  Paper,
} from "@mui/material";
import Page from "../../components/Page";
import { useOrganization } from "../../hooks/useOrganization";
import { getIntroduction } from "../../utils/api";

const BANNER_IMG = "/home_page/home_page.png";

const IntroducePage = () => {
  const { t } = useTranslation('home');
  const { organization } = useOrganization();
  const location = useLocation();
  const [introduction, setIntroduction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("general"); // general, leaders, team

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

  const renderHTML = (html) => {
    if (!html) return null;
    return (
      <Box
        sx={{
          "& img": { maxWidth: "100%", height: "auto", borderRadius: 1, my: 2 },
          "& p": { mb: 2, textAlign: "justify", lineHeight: 1.8 },
          "& h1, & h2, & h3, & h4, & h5, & h6": { color: "primary.main", mb: 2, mt: 3 },
          "& ul, & ol": { mb: 2, pl: 4 },
          "& li": { mb: 1 },
          color: "text.primary",
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  };

  const renderGeneralInfo = () => (
    <Box>
      {renderHTML(introduction?.content)}

      {introduction?.imageUrls && introduction.imageUrls.length > 0 && (
        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h6" color="primary" fontWeight={700} sx={{ mb: 3 }}>
            {t('intro_activity_images')}
          </Typography>
          <Grid container spacing={2}>
            {introduction.imageUrls.map((url, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
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
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {(introduction?.vision || introduction?.mission || introduction?.coreValues) && (
        <Box sx={{ mt: 6 }}>
<Stack
  direction={{ xs: "column", md: "column" }}                                            
  spacing={3}
>
  {introduction?.vision && (
    <Box flex={1}>
      <Typography
        variant="h6"
        color="primary"
        fontWeight={700}
        gutterBottom
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        {t('intro_vision')}
      </Typography>
      <Typography
        variant="body2"
        sx={{ lineHeight: 1.7, color: "text.secondary" }}
      >
        {introduction.vision}
      </Typography>
    </Box>
  )}

  {introduction?.mission && (
    <Box flex={1}>
      <Typography
        variant="h6"
        color="primary"
        fontWeight={700}
        gutterBottom
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        {t('intro_mission')}
      </Typography>
      <Typography
        variant="body2"
        sx={{ lineHeight: 1.7, color: "text.secondary" }}
      >
        {introduction.mission}
      </Typography>
    </Box>
  )}

  {introduction?.coreValues && (
    <Box flex={1}>
      <Typography
        variant="h6"
        color="primary"
        fontWeight={700}
        gutterBottom
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        {t('intro_core_values')}
      </Typography>
      <Typography
        variant="body2"
        sx={{ lineHeight: 1.7, color: "text.secondary" }}
      >
        {introduction.coreValues}
      </Typography>
    </Box>
  )}
</Stack>
        </Box>
      )}
    </Box>
  );

  const renderLeaders = () => (
    <Box>
      {renderHTML(introduction?.leadersContent)}
      {introduction?.leaders && introduction.leaders.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" color="primary" fontWeight={700} sx={{ mb: 3 }}>
            {t('intro_leaders_title')}
          </Typography>
          <Stack spacing={2}>
            {introduction.leaders.map((leader, index) => (
              <Paper
                key={index}
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  width: '100%',
                  borderRadius: 2,
                  transition: 'all 0.3s',
                }}
              >
                <Box sx={{ width: 100, height: 100, flexShrink: 0 }}>
                  <Box
                    component="img"
                    src={leader.image || "/default_avatar.png"}
                    alt={leader.name}
                    sx={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 2,
                      objectFit: "cover",
                      border: '1px solid',
                      borderColor: 'grey.200'
                    }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                    {leader.name}
                  </Typography>
                  {leader.positions && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mt: 0.5 }}>
                      {leader.positions}
                    </Typography>
                  )}
                  {leader.email && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      {leader.email}
                    </Typography>
                  )}
                  {leader.content && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      {leader.content}
                    </Typography>
                  )}
                </Box>
              </Paper>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );

  const renderMembers = () => (
    <Box>
      {renderHTML(introduction?.teamMembersContent)}
      {introduction?.teamMembers && introduction.teamMembers.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" color="primary" fontWeight={700} sx={{ mb: 3 }}>
            {t('intro_team_title')}
          </Typography>
          <Stack spacing={2}>
            {introduction.teamMembers.map((member, index) => (
              <Paper
                key={index}
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  width: '100%',
                  borderRadius: 2,
                  transition: 'all 0.3s',
                  '&:hover': { boxShadow: 4 }
                }}
              >
                <Box sx={{ width: 100, height: 100, flexShrink: 0 }}>
                  <Box
                    component="img"
                    src={member.image || "/default_avatar.png"}
                    alt={member.name}
                    sx={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 2,
                      objectFit: "cover",
                      border: '1px solid',
                      borderColor: 'grey.200'
                    }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                    {member.name}
                  </Typography>
                  {member.positions && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {member.positions}
                    </Typography>
                  )}
                  {member.email && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      {member.email}
                    </Typography>
                  )}
                  {member.content && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      {member.content}
                    </Typography>
                  )}
                </Box>
              </Paper>
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

  return (
    <Page
      title={config.title}
      meta={
        <meta
          name="description"
          content={t('intro_meta_desc', { name: organization?.name || t('intro_org_fallback') })}
        />
      }
    >
      <Container maxWidth={false} disableGutters sx={{ display: "flex", flexDirection: "column" }}>
        {/* HERO COVER */}
        <Box
          sx={{
            height: { xs: 260, md: 500 },
            backgroundImage: `url(${introduction?.bannerUrl || BANNER_IMG})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.3)',
            }
          }}
        />

        {/* CONTENT WRAPPER */}
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            mt: { xs: -10, md: -20 },
            mb: 8,
            position: "relative",
            zIndex: 1,
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: 1200,
              mx: "auto",
              backgroundColor: "#fff",
              borderRadius: 3,
              boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
              overflow: "hidden",
              p: { xs: 3, md: 8 },
            }}
          >

            <Typography
              variant="h3"
              component="h1"
              fontWeight={800}
              color="primary.main"
              textAlign="center"
              sx={{
                mb: 6,
                fontSize: { xs: "2rem", md: "3rem" },
                textTransform: "uppercase",
                letterSpacing: 1
              }}
            >
              {config.title}
            </Typography>

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
          </Box>
        </Box>
      </Container>
    </Page>
  );
};

export default IntroducePage;