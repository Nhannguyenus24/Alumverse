import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import {
  Box,
  Card,
  Container,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { keyframes } from "@emotion/react";
import Page from "../../components/Page";
import Logo from "../../components/Logo";
import { organizationApi } from "../../utils/api";

const LOGO_MAIN = "/alumverse_logo/Logo_Main_Full.svg";
const LOGO_WHITE = "/alumverse_logo/Logo_White_Full.svg";

const riseIn = keyframes`
  0% { opacity: 0; transform: translateY(24px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const logoIn = keyframes`
  0% { opacity: 0; transform: translateY(12px) scale(0.96); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`;

const getOrganizationNames = (org) => {
  const departmentName = String(org?.departmentName || "").trim();
  const displayName = String(org?.name || "").trim();
  const slugName = String(org?.slug || "").trim();

  return {
    primaryName: departmentName || displayName || slugName,
    secondaryName: slugName || (departmentName ? displayName : ""),
  };
};

const OrganizationSelectionPage = () => {
  const { t } = useTranslation("home");
  const theme = useTheme();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const loadOrganizations = async () => {
      try {
        setLoading(true);
        const data = await organizationApi.getAllOrganizations();
        if (active) setOrganizations(Array.isArray(data) ? data : []);
      } catch (err) {
        if (active) setError(err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadOrganizations();
    return () => {
      active = false;
    };
  }, []);

  const visibleOrganizations = useMemo(
    () => organizations.filter((org) => org?.slug),
    [organizations],
  );

  return (
    <Page title={t("org_selection_page_title")}>
      <Box
        sx={{
          minHeight: "100svh",
          display: "grid",
          placeItems: "center",
          bgcolor: "background.default",
          px: { xs: 2, sm: 3 },
          py: { xs: 6, md: 8 },
        }}
      >
        <Container maxWidth="lg" disableGutters>
          <Stack spacing={{ xs: 3.5, md: 5 }} alignItems="center" textAlign="center">
            <Logo
              variant="image"
              src={theme.palette.mode === "dark" ? LOGO_WHITE : LOGO_MAIN}
              alt="AlumVerse"
              sx={{
                height: { xs: 44, sm: 52, md: 60 },
                cursor: "default",
                opacity: 0,
                animation: `${logoIn} 0.62s ease both`,
              }}
            />

            <Box sx={{ opacity: 0, animation: `${riseIn} 0.68s ease 120ms both` }}>
              <Typography
                variant="h1"
                color="primary.main"
                sx={{
                  fontSize: { xs: "1.75rem", sm: "2.25rem", md: "2.65rem" },
                  lineHeight: 1.15,
                  fontWeight: 800,
                  mb: 2,
                }}
              >
                {t("org_selection_title")}
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  maxWidth: 760,
                  mx: "auto",
                  lineHeight: 1.75,
                  fontSize: { xs: "1rem", md: "1.08rem" },
                }}
              >
                {t("org_selection_desc")}
              </Typography>
            </Box>

            <Box
              sx={{
                width: "100%",
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  lg: "repeat(4, minmax(0, 1fr))",
                },
                gap: { xs: 2, md: 2.5 },
              }}
            >
              {loading && Array.from({ length: 4 }).map((_, index) => (
                <Skeleton
                  key={index}
                  variant="rounded"
                  sx={{
                    height: 168,
                    borderRadius: 2,
                    opacity: 0,
                    animation: `${riseIn} 0.58s ease ${220 + index * 90}ms both`,
                  }}
                />
              ))}

              {!loading && !error && visibleOrganizations.map((org, index) => {
                const { primaryName, secondaryName } = getOrganizationNames(org);

                return (
                  <Card
                    key={org.id || org.slug}
                    component={RouterLink}
                    to={`/${org.slug}`}
                    elevation={0}
                    sx={{
                      minHeight: 168,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      textDecoration: "none",
                      p: 2.5,
                      borderRadius: 2,
                      border: 1,
                      borderColor: "divider",
                      bgcolor: "background.paper",
                      boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)",
                      opacity: 0,
                      animation: `${riseIn} 0.62s ease ${220 + index * 95}ms both`,
                      transition: "transform 0.24s ease, box-shadow 0.24s ease, border-color 0.24s ease",
                      "&:hover": {
                        transform: "translateY(-6px)",
                        borderColor: "primary.main",
                        boxShadow: `0 18px 34px ${alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.24 : 0.16)}`,
                      },
                    }}
                  >
                    {org.logoUrl ? (
                      <Box
                        component="img"
                        src={org.logoUrl}
                        alt={primaryName}
                        sx={{ height: 64, maxWidth: "100%", objectFit: "contain", mb: 1.25 }}
                      />
                    ) : (
                      <Logo disabledLink sx={{ width: 64, height: 64, mb: 1.25 }} />
                    )}
                    <Typography
                      variant="subtitle1"
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
              })}
            </Box>

            {!loading && error && (
              <Typography variant="body2" color="text.secondary">
                {t("org_selection_load_error")}
              </Typography>
            )}
          </Stack>
        </Container>
      </Box>
    </Page>
  );
};

export default OrganizationSelectionPage;
