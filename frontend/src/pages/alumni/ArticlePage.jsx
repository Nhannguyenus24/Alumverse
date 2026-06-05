import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router";
import { useSnackbar } from "notistack";
import { Box, Container, Typography, CircularProgress, Button, Stack } from "@mui/material";
import Page from "../../components/Page";
import Breadcrumb from "../../components/Breadcrumb";
import { useArticleById } from "../../hooks/articles/useArticleById";
import DOMPurify from "dompurify";
import { formatDate, formatDateRange } from "../../utils/dateFormatter";
import { formatNumberVi } from "../../utils/numberFormatter";
import { eventApi } from "../../utils/api";

const ArticleHighlightCard = ({ data, channel, eventId }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [isInterested, setIsInterested] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [interestedCount, setInterestedCount] = useState(data.stats?.[0]?.value ?? 0);
  const [joinedCount, setJoinedCount] = useState(data.stats?.[1]?.value ?? 0);
  const [loadingInterest, setLoadingInterest] = useState(false);
  const [loadingJoin, setLoadingJoin] = useState(false);

  useEffect(() => {
    if (channel !== "event" || !eventId) return;
    eventApi.checkInterest(eventId)
      .then((res) => {
        const checked = res?.isInterested ?? res?.data?.isInterested ?? false;
        setIsInterested(checked);
      })
      .catch(() => {});
  }, [channel, eventId]);

  const handleInterest = async () => {
    if (loadingInterest) return;
    setLoadingInterest(true);
    try {
      if (isInterested) {
        await eventApi.removeInterest(eventId);
        setIsInterested(false);
        setInterestedCount((c) => Math.max(0, c - 1));
      } else {
        await eventApi.addInterest(eventId);
        setIsInterested(true);
        setInterestedCount((c) => c + 1);
      }
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || "Thao tác thất bại", { variant: "error" });
    } finally {
      setLoadingInterest(false);
    }
  };

  const handleJoin = async () => {
    if (loadingJoin || isJoined) return;
    setLoadingJoin(true);
    try {
      await eventApi.registerForEvent(eventId);
      setIsJoined(true);
      setJoinedCount((c) => c + 1);
      enqueueSnackbar("Đăng ký tham gia thành công! Chờ admin duyệt.", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || "Đăng ký thất bại", { variant: "error" });
    } finally {
      setLoadingJoin(false);
    }
  };

  const displayStats = channel === "event"
    ? [
        { value: interestedCount, label: "người quan tâm" },
        { value: joinedCount, label: "người tham gia" },
      ]
    : data.stats;

  return (
    <Box
      sx={{
        mt: 3,
        mb: 6,
        p: 5,
        bgcolor: "primary.light",
        borderRadius: 2,
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: 3,
      }}
    >
      {/* LEFT */}
      <Box sx={{ flex: 1 }}>
        <Typography variant="h4" sx={{ color: "primary.main" }}>
          {data.channel}
        </Typography>

        <Typography variant="h2" sx={{ color: "primary.main" }}>
          {data.title}
        </Typography>

        <Typography variant="body1">{data.organizer}</Typography>

        <Typography variant="body2" color="text.secondary">
          {data.date}
        </Typography>
      </Box>

      {/* RIGHT */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 2,
        }}
      >
        {/* STATS */}
        <Box sx={{ display: "flex", justifyContent: "space-around" }}>
          {displayStats?.map((item, i) => (
            <Box key={i} textAlign="center">
              <Typography variant="h2" fontWeight={700}>
                {item.value}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* BUTTONS */}
        {channel === "donation" ? (
          <Button fullWidth variant="contained">
            Quyên góp
          </Button>
        ) : (
          <Stack direction="row" spacing={1}>
            <Button
              fullWidth
              variant={isInterested ? "outlined" : "contained"}
              disabled={loadingInterest}
              onClick={handleInterest}
            >
              {isInterested ? "Đã quan tâm" : "Quan tâm"}
            </Button>

            <Button
              fullWidth
              variant={isJoined ? "outlined" : "contained"}
              disabled={loadingJoin || isJoined}
              sx={{
                bgcolor: isJoined ? "transparent" : "grey.700",
                color: isJoined ? "grey.700" : "common.white",
              }}
              onClick={handleJoin}
            >
              {isJoined ? "Đã đăng ký" : "Tham gia"}
            </Button>
          </Stack>
        )}
      </Box>
    </Box>
  );
};

const ArticlePage = () => {
  const { channel, id } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const loadErrorShownRef = useRef(false);
  const { article, isPending, isError, errorMessage } = useArticleById(channel, id);

  const cleanContent = article?.content
  ? DOMPurify.sanitize(article.content)
  : "";

  useEffect(() => {
    if (isPending) return;
    if (isError || !article) {
      if (!loadErrorShownRef.current) {
        enqueueSnackbar(errorMessage ?? "Không tìm thấy bài viết", { variant: "error" });
        loadErrorShownRef.current = true;
      }
      return;
    }
    loadErrorShownRef.current = false;
  }, [isPending, isError, article, errorMessage, enqueueSnackbar]);

  if (isPending) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !article) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Typography color="text.secondary">Không thể hiển thị bài viết.</Typography>
      </Box>
    );
  }

  const resolvedChannel = article.channel;

  const highlightData =
    resolvedChannel === "event"
      ? {
          channel: "Sự kiện",
          title: article.title,
          organizer: article.organizer ?? article.location ?? "",
          date: formatDateRange(article.eventDate, article.eventEndDate),
          stats: [
            { value: article.interestedCount ?? 0, label: "người quan tâm" },
            { value: article.joinedCount ?? 0, label: "người tham gia" },
          ],
        }
      : resolvedChannel === "donation"
      ? {
          channel: "Quyên góp",
          title: article.title,
          organizer: article.organizer ?? "",
          date: formatDateRange(article.donationDate, article.donationEndDate),
          stats: [
            { value: article.donorCount ?? 0, label: "người quyên góp" },
            {
              value:
                article.targetAmount != null
                  ? `${formatNumberVi(article.targetAmount)} VNĐ`
                  : "0 VNĐ",
              label: "mục tiêu",
            },
          ],
        }
      : null;
  
  return (
    <Page
      title={article.title}
      meta={
        <meta
          name="description"
          content={`${article.title} - AlumVerse`}
        />
      }
    >
      <Container
        maxWidth={false}
        disableGutters
        sx={{ display: "flex", flexDirection: "column" }}
      >
        {/* Hero + absolute content frame wrapper */}
        <Box
          sx={{
            position: "relative",
            height: { xs: "70vh", sm: "75vh", md: "85vh" },
            minHeight: { xs: 360, md: 480 },
          }}
        >
          {/* Hero banner */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              backgroundColor: "primary.dark",
              backgroundImage: article.thumbnailUrl ? `url(${article.thumbnailUrl})` : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />

          {/* Main content frame */}
          <Box
            sx={{
              position: "absolute",
              top: { xs: "50%", sm: "52%", md: "55%" },
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              px: { xs: 2, sm: 3 },
            }}
          >
            <Box
              sx={{
                width: "100%",
                maxWidth: 1200,
                backgroundColor: "#fff",
                borderRadius: 2,
                boxShadow:
                  "0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)",
                overflow: "hidden",
                py: { xs: 5, md: 6 },
                px: { xs: 4, md: 6 },
              }}
            >
              {/* Breadcrumb */}
              <Breadcrumb
                items={[
                  { label: "VINH DANH", path: "/honors" },
                  { label: article.title },
                ]}
                fontSize="0.8rem"
              />

              {/* Title */}
              <Typography
                variant="h1"
                component="h1"
                fontWeight={700}
                color="primary.main"
                textAlign="center"
                sx={{
                  mb: 1,
                  fontSize: { xs: "1.8rem", md: "2.1rem" },
                }}
              >
                {article.title}
              </Typography>

              {/* Date */}
              {article.publishedAt && (
                <Typography
                  variant="body2"
                  sx={{
                    textAlign: "center",
                    color: "text.secondary",
                    mb: 4,
                  }}
                >
                  {formatDate(article.publishedAt)}
                </Typography>
              )}

              {/* HIGHLIGHT */}
              {highlightData && (
                <ArticleHighlightCard data={highlightData} channel={resolvedChannel} eventId={id} />
              )}

              {/* Thumbnail */}
              {article.thumbnailUrl && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    mb: 4,
                  }}
                >
                  <Box
                    component="img"
                    src={article.thumbnailUrl}
                    alt={article.title}
                    sx={{
                      width: { xs: "100%", md: "60%" },
                      borderRadius: 2,
                      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                    }}
                  />
                </Box>
              )}

              {/* Article Content */}
              <Box dangerouslySetInnerHTML={{ __html: cleanContent }} />
            </Box>
          </Box>
        </Box>

        {/* Placeholder space */}
        <Box sx={{ minHeight: { xs: 1200, md: 800 } }} />
      </Container>
    </Page>
  );
};

export default ArticlePage;
