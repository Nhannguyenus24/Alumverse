import { Box, Container, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import Page from "../../components/Page";

const BANNER_IMG = "/faculty_img/cntt.png";
const BANNER_BLUE = "#012B59";

const INTRO_BULLET_KEYS = [
  "cntt_bullet_cs",
  "cntt_bullet_se",
  "cntt_bullet_is",
  "cntt_bullet_network",
  "cntt_bullet_kt",
  "cntt_bullet_cv",
];

const TRAINING_AREA_KEYS = [
  { titleKey: "cntt_area_kt_title", paragraphKeys: ["cntt_area_kt_p1", "cntt_area_kt_p2"] },
  { titleKey: "cntt_area_cs_title", paragraphKeys: ["cntt_area_cs_p1", "cntt_area_cs_p2"] },
  { titleKey: "cntt_area_se_title", paragraphKeys: ["cntt_area_se_p1", "cntt_area_se_p2"] },
  { titleKey: "cntt_area_is_title", paragraphKeys: ["cntt_area_is_p1", "cntt_area_is_p2"] },
  { titleKey: "cntt_area_network_title", paragraphKeys: ["cntt_area_network_p1", "cntt_area_network_p2"] },
  { titleKey: "cntt_area_cv_title", paragraphKeys: ["cntt_area_cv_p1", "cntt_area_cv_p2"] },
];

const FacultyCNTTPage = () => {
  const { t } = useTranslation('home');
  return (
    <Page
      title={t('cntt_page_title')}
      meta={
        <meta
          name="description"
          content={t('cntt_page_meta_desc')}
        />
      }
    >
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          px: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxHeight: { xs: 280, md: 360 },
            overflow: "hidden",
            backgroundColor: "#f5f5f5",
          }}
        >
          <Box
            component="img"
            src={BANNER_IMG}
            alt={t('cntt_page_title')}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </Box>

        <Container maxWidth="lg" sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
        <Typography
          variant="h1"
          component="h1"
          sx={{
            color: BANNER_BLUE,
            fontWeight: 700,
            textAlign: "center",
            fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
            textTransform: "uppercase",
            mb: 4,
          }}
        >
          {t('cntt_page_title')}
        </Typography>

        <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary", mb: 1.5 }}>
          {t('cntt_section_intro')}
        </Typography>
        <Typography variant="body1" sx={{ mb: 1.5, textAlign: "justify", lineHeight: 1.8 }}>
          {t('cntt_intro_p1')}
        </Typography>
        <Typography variant="body1" sx={{ mb: 1.5, textAlign: "justify", lineHeight: 1.8 }}>
          {t('cntt_intro_p2')}
        </Typography>
        <Typography variant="body1" sx={{ mb: 0.5, textAlign: "justify", lineHeight: 1.8 }}>
          {t('cntt_intro_departments_intro')}
        </Typography>
        <Box component="ul" sx={{ pl: 2.5, mb: 1.5 }}>
          {INTRO_BULLET_KEYS.map((key) => (
            <Typography key={key} component="li" sx={{ mb: 0.5, lineHeight: 1.7 }}>
              {t(key)}
            </Typography>
          ))}
        </Box>
        <Typography variant="body1" sx={{ mb: 3, textAlign: "justify", lineHeight: 1.8 }}>
          {t('cntt_intro_partnerships')}
        </Typography>

        <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary", mb: 1.5 }}>
          {t('cntt_section_mission')}
        </Typography>
        <Typography variant="body1" sx={{ mb: 1.5, textAlign: "justify", lineHeight: 1.8 }}>
          {t('cntt_mission_p1')}
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, textAlign: "justify", lineHeight: 1.8 }}>
          {t('cntt_mission_p2')}
        </Typography>

        <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary", mb: 1.5 }}>
          {t('cntt_section_vision')}
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, textAlign: "justify", lineHeight: 1.8 }}>
          {t('cntt_vision_p1')}
        </Typography>

        <Typography
          variant="h2"
          component="h2"
          sx={{
            color: BANNER_BLUE,
            fontWeight: 700,
            textAlign: "center",
            fontSize: { xs: "1.25rem", md: "1.5rem" },
            textTransform: "uppercase",
            mb: 3,
          }}
        >
          {t('cntt_section_training_areas')}
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {TRAINING_AREA_KEYS.map((area) => (
            <Box key={area.titleKey}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary", mb: 0.5 }}>
                {t(area.titleKey)}
              </Typography>
              {area.paragraphKeys.map((key, i) => (
                <Typography
                  key={key}
                  variant="body2"
                  sx={{ textAlign: "justify", lineHeight: 1.7, color: "text.secondary", mb: i < area.paragraphKeys.length - 1 ? 1 : 0 }}
                >
                  {t(key)}
                </Typography>
              ))}
            </Box>
          ))}
        </Box>
        </Container>
      </Container>
    </Page>
  );
};

export default FacultyCNTTPage;
