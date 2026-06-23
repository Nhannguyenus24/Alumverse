import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Box, Button, CircularProgress, Container, Divider, Typography } from "@mui/material";
import DOMPurify from "dompurify";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import Page from "../../components/Page";
import Breadcrumb from "../../components/Breadcrumb";
import Scrollbar from "../../components/Scrollbar";
import DonationFundInfoPanel from "../../components/donation/DonationFundInfoPanel";
import DonationListSection from "../../components/donation/DonationListSection";
import { fundApi } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import { useOrgNavigate } from "../../hooks/useOrgNavigate";
const ARTICLE_IMG_FALLBACK = "https://placehold.co/1200x720/eef3ff/0f3a7a?text=Fund";
const ARTICLE_IMAGE_ASPECT_RATIO = "16 / 9";
const DESCRIPTION_MAX_HEIGHT = { xs: 360, md: 480 };

const articleImageSx = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

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

export default function DonationArticlePage() {
  const { t } = useTranslation('donation');
  const { id } = useParams();
  const navigate = useOrgNavigate();
  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && user?.role === "ADMIN";

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

  const cleanDescription = fundDetail?.descriptionFull ? DOMPurify.sanitize(fundDetail.descriptionFull) : "";

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
        <Box
          sx={{
            height: { xs: "32vh", sm: "36vh", md: "40vh" },
            minHeight: { xs: 200, sm: 240, md: 280 },
            backgroundColor: "primary.main",
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
          <Box
            sx={{
              width: "100%",
              maxWidth: 1200,
              backgroundColor: "#fff",
              borderRadius: 2,
              boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)",
              py: { xs: 5, md: 6 },
              px: { xs: 4, md: 6 },
            }}
          >
            <Breadcrumb items={[{ label: t('title').toUpperCase(), path: "/donations" }, { label: pageTitle }]} fontSize="0.8rem" />

            {errorMessage && (
              <Box sx={{ p: 3, borderRadius: 2, border: "1px solid #f2b8b5", backgroundColor: "#fff4f2" }}>
                <Typography sx={{ color: "#9f2f2f", fontWeight: 600 }}>{errorMessage}</Typography>
              </Box>
            )}

            {!errorMessage && fundDetail && (
              <>
                <Typography variant="h1" component="h1" fontWeight={700} color="primary.main" textAlign="center" sx={{ mb: 4, fontSize: { xs: "1.8rem", md: "2.1rem" } }}>
                  {fundDetail.name}
                </Typography>

                <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
                  <Box
                    sx={{
                      width: { xs: "100%", md: "60%" },
                      aspectRatio: ARTICLE_IMAGE_ASPECT_RATIO,
                      borderRadius: 2,
                      overflow: "hidden",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                    }}
                  >
                    <Box component="img" src={articleImg} alt={fundDetail.name} sx={articleImageSx} />
                  </Box>
                </Box>

                <Box sx={{ mt: 3, mb: 6, p: 5, bgcolor: "primary.light", borderRadius: 2, display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3, alignItems: { md: "stretch" } }}>
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
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2, my: 3 }}>
                  <Divider sx={{ flex: 1 }} />
                  <Typography variant="h1" component="h2" fontWeight={700} color="primary.main" sx={{ whiteSpace: "nowrap", fontSize: { xs: "1.8rem", md: "2.1rem" } }}>
                    {t('article_section_title')}
                  </Typography>
                  <Divider sx={{ flex: 1 }} />
                </Box>

                <Scrollbar sx={{ maxHeight: DESCRIPTION_MAX_HEIGHT, pr: 1 }}>
                  <Box sx={descriptionContentSx} dangerouslySetInnerHTML={{ __html: cleanDescription }} />
                </Scrollbar>
              </>
            )}
          </Box>
        </Box>

        {!errorMessage && fundDetail && isAdmin ? (
          <Box sx={{ px: { xs: 2, sm: 3 }, py: 6, backgroundColor: "#f3f5f9" }}>
            <Box sx={{ width: "100%", maxWidth: 1200, mx: "auto" }}>
              <DonationListSection fundId={id} />
            </Box>
          </Box>
        ) : null}
      </Container>
    </Page>
  );
}