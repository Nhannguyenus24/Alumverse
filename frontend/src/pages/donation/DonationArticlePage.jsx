import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Box, Button, Container, Divider, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VolunteerActivismOutlinedIcon from "@mui/icons-material/VolunteerActivismOutlined";
import DOMPurify from "dompurify";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import Page from "../../components/Page";
import Breadcrumb from "../../components/Breadcrumb";
import Scrollbar from "../../components/Scrollbar";
import DonationFundInfoPanel from "../../components/donation/DonationFundInfoPanel";
import DonationListSection from "../../components/donation/DonationListSection";
import {
  ScrollReveal,
  ScrollRevealGroup,
  ScrollRevealItem,
} from "../../components/animations/ScrollReveal";
import { fundApi } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import { useOrgNavigate } from "../../hooks/useOrgNavigate";
const ARTICLE_IMG_FALLBACK = "https://placehold.co/1200x720/eef3ff/0f3a7a?text=Fund";
const ARTICLE_IMAGE_ASPECT_RATIO = "16 / 9";
const DESCRIPTION_MAX_HEIGHT = { xs: 360, md: 480 };

const descriptionContentSx = {
  lineHeight: 1.8,
  color: "text.primary",
  "& p": { mb: 2, textAlign: "justify" },
  "& img": {
    width: "100%",
    aspectRatio: ARTICLE_IMAGE_ASPECT_RATIO,
    objectFit: "cover",
    borderRadius: 2,
    display: "block",
    mb: 2,
  },
};

const sanitizeDonationContent = (html) => (
  DOMPurify.sanitize(html || "").replace(/&amp;nbsp;|&nbsp;|&#160;|\u00a0/gi, " ")
);

export default function DonationArticlePage() {
  const { t } = useTranslation('donation');
  const { id } = useParams();
  const navigate = useOrgNavigate();
  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && user?.role === "ADMIN";
  const canEditFund = isAuthenticated && (user?.role === "ADMIN" || user?.role === "STAFF");

  const [fundDetail, setFundDetail] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!id) return;
    let ignore = false;

    const fetchDetail = async () => {
      setErrorMessage("");
      try {
        const detail = await fundApi.getFundDetail(id);
        if (ignore) return;
        setFundDetail(detail);
      } catch (error) {
        if (ignore) return;
        setFundDetail(null);
        setErrorMessage(error?.response?.data?.message ?? t('error_load_fund_detail'));
      }
    };

    fetchDetail();
    return () => { ignore = true; };
  }, [id]);

  const handleDonate = () => { navigate(`/donations/${id}/contribute`); };

  const cleanDescription = fundDetail?.descriptionFull ? sanitizeDonationContent(fundDetail.descriptionFull) : "";

  const now = dayjs();
  const startTime = fundDetail?.timeStarted ? dayjs(fundDetail.timeStarted) : null;
  const endTime = fundDetail?.timeEnded ? dayjs(fundDetail.timeEnded) : null;

  const isEnded = Boolean(startTime && endTime && startTime.isValid() && endTime.isValid()) &&
    startTime.isBefore(endTime) && endTime.isBefore(now);

  const isClosed = isEnded;

  const articleImg = fundDetail?.logoUrl || ARTICLE_IMG_FALLBACK;
  const pageTitle = fundDetail?.name || t('fund_detail');

  return (
    <Page title={pageTitle} meta={<meta name="description" content={t('meta_description')} />}>
      <Container maxWidth={false} disableGutters sx={{ display: "flex", flexDirection: "column" }}>
        <ScrollReveal
          direction="none"
          duration={0.8}
          sx={{
            height: { xs: "32vh", sm: "36vh", md: "40vh" },
            minHeight: { xs: 200, sm: 240, md: 280 },
            backgroundColor: "primary.main",
            backgroundImage: `linear-gradient(rgba(4, 43, 86, 0.35), rgba(4, 43, 86, 0.35)), url(${articleImg})`,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
          }}
        />

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            px: { xs: 2, sm: 3 },
            mt: { xs: -4, sm: -5, md: -6 },
            mb: { xs: 4, md: 6 },
          }}
        >
          <ScrollRevealGroup
            stagger={0.09}
            sx={{
              width: "100%",
              maxWidth: 1200,
              backgroundColor: "background.paper",
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "none",
              py: { xs: 5, md: 6 },
              px: { xs: 4, md: 6 },
            }}
          >
            <ScrollRevealItem sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: { xs: 4, md: 5 }, flexWrap: "wrap" }}>
              <Breadcrumb items={[{ label: t('title').toUpperCase(), path: "/donations" }, { label: pageTitle }]} fontSize="0.8rem" />
              <Box sx={{ flexGrow: 1 }} />
              {(canEditFund || isAdmin) && (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {canEditFund && (
                    <Button
                      variant="contained"
                      color="secondary"
                      size="medium"
                      startIcon={<EditOutlinedIcon />}
                      onClick={() => navigate(`/donations/${id}/edit`)}
                      sx={{ textTransform: "none", fontWeight: 700 }}
                    >
                      {t('edit_fund_short')}
                    </Button>
                  )}
                  {isAdmin && (
                    <Button
                      variant="outlined"
                      color="primary"
                      size="medium"
                      startIcon={<VolunteerActivismOutlinedIcon />}
                      onClick={() => navigate("/admin/donations")}
                      sx={{ textTransform: "none", fontWeight: 700 }}
                    >
                      {t('manage_fund')}
                    </Button>
                  )}
                </Stack>
              )}
            </ScrollRevealItem>

            {errorMessage && (
              <ScrollRevealItem
                sx={(theme) => ({
                  p: 3,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: alpha(theme.palette.error.main, theme.palette.mode === "dark" ? 0.32 : 0.22),
                  backgroundColor: alpha(theme.palette.error.main, theme.palette.mode === "dark" ? 0.14 : 0.08),
                })}
              >
                <Typography sx={{ color: "error.main", fontWeight: 600 }}>{errorMessage}</Typography>
              </ScrollRevealItem>
            )}

            {!errorMessage && fundDetail && (
              <ScrollRevealGroup stagger={0.09}>
                <ScrollRevealItem>
                <Typography variant="h1" component="h1" fontWeight={700} color="primary.main" textAlign="center" sx={{ mb: 4, fontSize: { xs: "1.8rem", md: "2.1rem" } }}>
                  {fundDetail.name}
                </Typography>
                </ScrollRevealItem>

                <ScrollRevealItem
                  sx={(theme) => ({
                    mt: 3,
                    mb: 6,
                    p: { xs: 3, md: 5 },
                    bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.12 : 0.08),
                    border: "1px solid",
                    borderColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.24 : 0.16),
                    borderRadius: 2,
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    gap: 3,
                    alignItems: { md: "stretch" },
                  })}
                >
                  <Box sx={{ flex: 1 }}>
                    <DonationFundInfoPanel fundDetail={fundDetail} />
                  </Box>

                  {!isAdmin && (
                    <Box sx={{ flex: { md: "0 0 240px" }, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                      <Button
                        fullWidth
                        variant="contained"
                        color={isClosed ? "secondary" : "primary"}
                        onClick={isClosed ? undefined : handleDonate}
                        disabled={isClosed}
                        sx={{
                          textTransform: "none",
                          fontWeight: 700,
                          cursor: isClosed ? "not-allowed" : "pointer",
                          ...(isClosed && {
                            color: "#fff",
                            opacity: 1,
                            "&.Mui-disabled": { backgroundColor: "secondary.main", color: "#fff", opacity: 1, cursor: "not-allowed" },
                          }),
                        }}
                      >
                        {isClosed ? t('article_fund_closed') : t('donate_btn')}
                      </Button>
                    </Box>
                  )}
                </ScrollRevealItem>

                <ScrollRevealItem sx={{ display: "flex", alignItems: "center", gap: 2, my: 3 }}>
                  <Divider sx={{ flex: 1 }} />
                  <Typography variant="h1" component="h2" fontWeight={700} color="primary.main" sx={{ whiteSpace: "nowrap", fontSize: { xs: "1.8rem", md: "2.1rem" } }}>
                    {t('article_section_title')}
                  </Typography>
                  <Divider sx={{ flex: 1 }} />
                </ScrollRevealItem>

                <ScrollRevealItem>
                  <Scrollbar sx={{ maxHeight: DESCRIPTION_MAX_HEIGHT, pr: 1 }}>
                    <Box sx={descriptionContentSx} dangerouslySetInnerHTML={{ __html: cleanDescription }} />
                  </Scrollbar>
                </ScrollRevealItem>
              </ScrollRevealGroup>
            )}
          </ScrollRevealGroup>
        </Box>

        {!errorMessage && fundDetail && isAdmin ? (
          <ScrollReveal sx={{ px: { xs: 2, sm: 3 }, py: 6, backgroundColor: "background.default" }}>
            <Box sx={{ width: "100%", maxWidth: 1200, mx: "auto" }}>
              <DonationListSection fundId={id} />
            </Box>
          </ScrollReveal>
        ) : null}
      </Container>
    </Page>
  );
}
