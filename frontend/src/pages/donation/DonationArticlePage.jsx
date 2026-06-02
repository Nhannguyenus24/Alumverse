import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Box, Button, CircularProgress, Container, Typography } from "@mui/material";
import DOMPurify from "dompurify";
import dayjs from "dayjs";
import Page from "../../components/Page";
import Breadcrumb from "../../components/Breadcrumb";
import { fundApi } from "../../utils/api";
import { useOrgNavigate } from "../../hooks/useOrgNavigate";

const BANNER_IMG = "https://www.islamic-relief.org.uk/wp-content/uploads/2022/10/Fundraising-ideas-.jpg";
const ARTICLE_IMG_FALLBACK = "https://placehold.co/1200x720/eef3ff/0f3a7a?text=Fund";

const DONOR_COUNT_DISPLAY_MAX = 999999;
const AVERAGE_DONATION_DISPLAY_MAX = 999999999;

const formatDateRange = (start, end) => {
  if (!start && !end) return "--";
  const s = start ? dayjs(start).format("DD/MM/YYYY") : "--";
  const e = end ? dayjs(end).format("DD/MM/YYYY") : "--";
  return `${s} - ${e}`;
};

const formatDonorCountDisplay = (value) =>
  value > DONOR_COUNT_DISPLAY_MAX ? `> ${DONOR_COUNT_DISPLAY_MAX.toLocaleString("vi-VN")}` : value.toLocaleString("vi-VN");

const formatAverageDonationDisplay = (value) =>
  value > AVERAGE_DONATION_DISPLAY_MAX ? `> ${AVERAGE_DONATION_DISPLAY_MAX.toLocaleString("vi-VN")} VNĐ` : `${value.toLocaleString("vi-VN")} VNĐ`;

const DonationHighlightCard = ({ data, onDonate, isClosed }) => (
  <Box sx={{ mt: 3, mb: 6, p: 5, bgcolor: "primary.light", borderRadius: 2, display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3 }}>
    <Box sx={{ flex: 1 }}>
      <Typography variant="h4" sx={{ color: "primary.main" }}>{data.channel}</Typography>
      <Typography variant="h2" sx={{ color: "primary.main" }}>{data.title}</Typography>
      <Typography variant="body1" color="text.primary">{data.organizer}</Typography>
      <Typography variant="body2" color="text.secondary">{data.date}</Typography>
    </Box>

    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-around" }}>
        {data.stats.map((item, i) => (
          <Box key={i} textAlign="center">
            <Typography variant="h2" fontWeight={700}>{item.value}</Typography>
            <Typography variant="body2" color="text.secondary">{item.label}</Typography>
          </Box>
        ))}
      </Box>

      <Button
        fullWidth variant="contained" color={isClosed ? "secondary" : "primary"}
        onClick={isClosed ? undefined : onDonate} disabled={isClosed}
        sx={{
          textTransform: "none", fontWeight: 700, cursor: isClosed ? "not-allowed" : "pointer",
          ...(isClosed && {
            color: "#fff", opacity: 1,
            "&.Mui-disabled": { backgroundColor: "secondary.main", color: "#fff", opacity: 1, cursor: "not-allowed" },
          }),
        }}
      >
        {isClosed ? "Đã kết thúc" : "Quyên góp"}
      </Button>
    </Box>
  </Box>
);

export default function DonationArticlePage() {
  const { id } = useParams();
  const navigate = useOrgNavigate();

  const [fundDetail, setFundDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!id) return;
    let ignore = false;

    const fetchDetail = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const detail = await fundApi.getFundDetail(id);
        if (ignore) return;
        setFundDetail(detail);
      } catch (error) {
        if (ignore) return;
        setFundDetail(null);
        setErrorMessage(error?.response?.data?.message ?? "Không thể tải chi tiết quỹ.");
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    fetchDetail();
    return () => { ignore = true; };
  }, [id]);

  const handleDonate = () => { navigate(`/donations/${id}/contribute`); };

  const cleanDescription = fundDetail?.descriptionFull ? DOMPurify.sanitize(fundDetail.descriptionFull) : "";
  const donorCount = Number(fundDetail?.donorCount ?? 0);
  const avgAmount = donorCount > 0 ? Number(fundDetail?.currentAmount ?? 0) / donorCount : 0;

  const now = dayjs();
  const startTime = fundDetail?.timeStarted ? dayjs(fundDetail.timeStarted) : null;
  const endTime = fundDetail?.timeEnded ? dayjs(fundDetail.timeEnded) : null;

  const isEnded = Boolean(startTime && endTime && startTime.isValid() && endTime.isValid()) &&
    startTime.isBefore(endTime) && endTime.isBefore(now);

  const isClosed = isEnded || fundDetail?.status === "CLOSED" || fundDetail?.statusName === "CLOSED" || fundDetail?.statusName === "Đã đóng";

  const highlightData = fundDetail ? {
    channel: "Quyên góp",
    title: fundDetail.name,
    organizer: fundDetail.managerName || "Chưa cập nhật",
    date: formatDateRange(fundDetail.timeStarted, fundDetail.timeEnded),
    stats: [
      { value: formatDonorCountDisplay(donorCount), label: "người quyên góp" },
      { value: formatAverageDonationDisplay(avgAmount), label: "trung bình quyên góp" },
    ],
  } : null;

  const articleImg = fundDetail?.logoUrl || ARTICLE_IMG_FALLBACK;
  const pageTitle = fundDetail?.name || "Chi tiết quỹ";

  return (
    <Page title={pageTitle} meta={<meta name="description" content="Chi tiết quỹ quyên góp cộng đồng cựu sinh viên." />}>
      <Container maxWidth={false} disableGutters sx={{ display: "flex", flexDirection: "column" }}>
        <Box sx={{ position: "relative", height: { xs: "70vh", sm: "75vh", md: "85vh" }, minHeight: { xs: 360, md: 480 } }}>
          <Box sx={{ position: "absolute", inset: 0, backgroundImage: `url(${BANNER_IMG})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }} />

          <Box sx={{ position: "absolute", top: { xs: "50%", sm: "52%", md: "55%" }, left: 0, right: 0, display: "flex", justifyContent: "center", px: { xs: 2, sm: 3 } }}>
            <Box sx={{ width: "100%", maxWidth: 1200, backgroundColor: "#fff", borderRadius: 2, boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)", overflow: "hidden", py: { xs: 5, md: 6 }, px: { xs: 4, md: 6 } }}>
              <Breadcrumb items={[{ label: "QUYÊN GÓP", path: "/donations" }, { label: pageTitle }]} fontSize="0.8rem" />

              {isLoading && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
              )}

              {!isLoading && errorMessage && (
                <Box sx={{ p: 3, borderRadius: 2, border: "1px solid #f2b8b5", backgroundColor: "#fff4f2" }}>
                  <Typography sx={{ color: "#9f2f2f", fontWeight: 600 }}>{errorMessage}</Typography>
                </Box>
              )}

              {!isLoading && !errorMessage && fundDetail && (
                <>
                  <Typography variant="h1" component="h1" fontWeight={700} color="primary.main" textAlign="center" sx={{ mb: 1, fontSize: { xs: "1.8rem", md: "2.1rem" } }}>
                    {fundDetail.name}
                  </Typography>

                  <Typography variant="body2" sx={{ textAlign: "center", color: "text.secondary", mb: 4 }}>
                    {fundDetail.managerName || "Chưa cập nhật"} • {fundDetail.timeStarted ? dayjs(fundDetail.timeStarted).format("DD/MM/YYYY") : "--"}
                  </Typography>

                  <DonationHighlightCard data={highlightData} onDonate={handleDonate} isClosed={isClosed} />

                  <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
                    <Box component="img" src={articleImg} alt={fundDetail.name} sx={{ width: { xs: "100%", md: "60%" }, borderRadius: 2, boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }} />
                  </Box>

                  <Box
                    sx={{ lineHeight: 1.8, color: "text.primary", "& p": { mb: 2, textAlign: "justify" }, "& img": { maxWidth: "100%" } }}
                    dangerouslySetInnerHTML={{ __html: cleanDescription }}
                  />
                </>
              )}
            </Box>
          </Box>
        </Box>

        <Box sx={{ minHeight: { xs: 1200, md: 800 } }} />
      </Container>
    </Page>
  );
}