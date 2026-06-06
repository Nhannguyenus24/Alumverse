import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Box,
  Container,
  Typography,
  Button,
  Tabs,
  Tab,
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
  const { organization } = useOrganization();
  const [introduction, setIntroduction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

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
            Hình ảnh hoạt động
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
          <Grid container spacing={3}>
            {introduction?.vision && (
              <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={{ p: 3, height: "100%", bgcolor: "grey.50", borderRadius: 2, border: "1px solid", borderColor: "grey.200" }}>
                  <Typography variant="h6" color="primary" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Tầm nhìn
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.7, color: 'text.secondary' }}>
                    {introduction.vision}
                  </Typography>
                </Paper>
              </Grid>
            )}
            {introduction?.mission && (
              <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={{ p: 3, height: "100%", bgcolor: "grey.50", borderRadius: 2, border: "1px solid", borderColor: "grey.200" }}>
                  <Typography variant="h6" color="primary" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Sứ mệnh
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.7, color: 'text.secondary' }}>
                    {introduction.mission}
                  </Typography>
                </Paper>
              </Grid>
            )}
            {introduction?.coreValues && (
              <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={{ p: 3, height: "100%", bgcolor: "grey.50", borderRadius: 2, border: "1px solid", borderColor: "grey.200" }}>
                  <Typography variant="h6" color="primary" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Giá trị cốt lõi
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.7, color: 'text.secondary' }}>
                    {introduction.coreValues}
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
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
            Ban Lãnh đạo
          </Typography>
          <Grid container spacing={2}>
            {introduction.leaders.map((leader, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Paper sx={{ p: 3, textAlign: "center", height: "100%", borderRadius: 2, transition: 'all 0.3s', '&:hover': { boxShadow: 4 } }}>
                  <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                    {leader}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
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
            Thành viên tiêu biểu
          </Typography>
          <Grid container spacing={2}>
            {introduction.teamMembers.map((member, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Paper sx={{ p: 3, textAlign: "center", height: "100%", borderRadius: 2, transition: 'all 0.3s', '&:hover': { boxShadow: 4 } }}>
                  <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                    {member}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );

  return (
    <Page
      title="Giới thiệu"
      meta={
        <meta
          name="description"
          content={`Giới thiệu về ${organization?.name || "tổ chức"}`}
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
                mb: 4,
                fontSize: { xs: "2rem", md: "3rem" },
                textTransform: "uppercase",
                letterSpacing: 1
              }}
            >
              GIỚI THIỆU
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 6 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                centered
                textColor="primary"
                indicatorColor="primary"
                variant="fullWidth"
                sx={{
                  '& .MuiTab-root': {
                    fontSize: { xs: '0.9rem', md: '1.1rem' },
                    py: 2,
                    transition: 'all 0.2s'
                  }
                }}
              >
                <Tab label="Thông tin chung" sx={{ fontWeight: 800 }} />
                <Tab label="Lãnh đạo" sx={{ fontWeight: 800 }} />
                <Tab label="Thành viên" sx={{ fontWeight: 800 }} />
              </Tabs>
            </Box>

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 15 }}>
                <CircularProgress size={60} thickness={4} />
              </Box>
            ) : (
              <Box sx={{ minHeight: 400 }}>
                {!introduction ? (
                  <Stack alignItems="center" spacing={2} sx={{ py: 10 }}>
                    <Typography variant="h5" color="text.secondary">
                      Chưa có thông tin giới thiệu
                    </Typography>
                    <Typography variant="body1" color="text.secondary" textAlign="center">
                      Tổ chức này chưa cập nhật nội dung giới thiệu. Vui lòng quay lại sau.
                    </Typography>
                  </Stack>
                ) : (
                  <>
                    {tabValue === 0 && renderGeneralInfo()}
                    {tabValue === 1 && renderLeaders()}
                    {tabValue === 2 && renderMembers()}
                  </>
                )}
              </Box>
            )}

            {/* CTA: Introduce Faculties */}
            <Box sx={{ textAlign: "center", mt: 10, pt: 6, borderTop: "1px solid", borderColor: "grey.100" }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Bạn muốn khám phá thêm về các Khoa?
              </Typography>
              <Button
                component={Link}
                to={`/${organization?.slug}/faculties`}
                variant="contained"
                size="large"
                sx={{
                  fontWeight: 700,
                  px: 8,
                  py: 2,
                  borderRadius: 2,
                  fontSize: '1.1rem',
                  boxShadow: 3,
                  '&:hover': {
                    boxShadow: 6
                  }
                }}
              >
                Giới thiệu các Khoa
              </Button>
            </Box>
          </Box>
        </Box>
      </Container>
    </Page>
  );
};

export default IntroducePage;