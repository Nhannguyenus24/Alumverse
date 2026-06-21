import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { useSnackbar } from "notistack";
import { Box, Container, Typography, CircularProgress, Button, Stack, IconButton, Tooltip } from "@mui/material";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import Page from "../../components/Page";
import Breadcrumb from "../../components/Breadcrumb";
import { useArticleById } from "../../hooks/articles/useArticleById";
import DOMPurify from "dompurify";
import { formatDate, formatDateRange } from "../../utils/dateFormatter";
import { formatNumberVi } from "../../utils/numberFormatter";
import JoinEventDialog from "../../components/event/JoinEventDialog";
import { eventApi, savedItemApi } from "../../utils/api";
import { useEventQuestions, formatAnswersForApi } from "../../hooks/events/useEventQuestions";

/** Heart toggle to save ("quan tâm") an article. itemType is fixed to NEWS. */
const SaveArticleButton = ({ itemId }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    savedItemApi
      .check("NEWS", itemId)
      .then((v) => { if (active) setSaved(Boolean(v)); })
      .catch(() => {});
    return () => { active = false; };
  }, [itemId]);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (saved) {
        await savedItemApi.unsave("NEWS", itemId);
        setSaved(false);
        enqueueSnackbar("Đã bỏ quan tâm bài viết.", { variant: "info" });
      } else {
        await savedItemApi.save("NEWS", itemId);
        setSaved(true);
        enqueueSnackbar("Đã quan tâm bài viết.", { variant: "success" });
      }
    } catch {
      enqueueSnackbar("Thao tác thất bại.", { variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Tooltip title={saved ? "Bỏ quan tâm" : "Quan tâm"}>
      <IconButton onClick={toggle} disabled={busy} color={saved ? "primary" : "default"}>
        {saved ? <FavoriteIcon /> : <FavoriteBorderIcon />}
      </IconButton>
    </Tooltip>
  );
};

const ArticleHighlightCard = ({ data, channel, eventId }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [isInterested, setIsInterested] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [interestedCount, setInterestedCount] = useState(data.stats?.[0]?.value ?? 0);
  const [joinedCount, setJoinedCount] = useState(data.stats?.[1]?.value ?? 0);
  const [loadingInterest, setLoadingInterest] = useState(false);
  const [loadingJoin, setLoadingJoin] = useState(false);
  const [openJoinDialog, setOpenJoinDialog] = useState(false);
  const { data: questions = [] } = useEventQuestions(eventId, channel === "event" && Boolean(eventId));

  useEffect(() => {
    if (channel !== "event" || !eventId) return;
    eventApi.checkInterest(eventId)
      .then((res) => {
        const checked = res?.isInterested ?? res?.data?.isInterested ?? false;
        setIsInterested(checked);
      })
      .catch(() => {});
    eventApi.checkRegistered(eventId)
      .then((res) => {
        if (res?.isRegistered) setIsJoined(true);
      })
      .catch(() => {});
    eventApi.getEventStatisticsById(eventId)
      .then((res) => {
        if (res?.interestedCount != null) setInterestedCount(res.interestedCount);
        if (res?.registeredCount != null) setJoinedCount(res.registeredCount);
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

  const handleJoinClick = () => {
    if (loadingJoin || isJoined) return;
    setOpenJoinDialog(true);
  };

  const handleConfirmJoin = async (answerMap) => {
    if (loadingJoin || isJoined) return;
    setLoadingJoin(true);
    try {
      const payload = questions.length > 0
        ? { answers: formatAnswersForApi(answerMap, questions) }
        : {};
      await eventApi.registerForEvent(eventId, payload);
      setIsJoined(true);
      setJoinedCount((c) => c + 1);
      setOpenJoinDialog(false);
      enqueueSnackbar("Đăng ký tham gia thành công! Xem vé trong Vé của tôi.", { variant: "success" });
    } catch (err) {
      if (err?.response?.status === 409) {
        setIsJoined(true);
        enqueueSnackbar("Bạn đã đăng ký sự kiện này rồi.", { variant: "info" });
      } else {
        enqueueSnackbar(err?.response?.data?.message || "Đăng ký thất bại", { variant: "error" });
      }
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
    <Box sx={{ mt: 3, mb: 6, p: 5, bgcolor: "primary.light", borderRadius: 2, display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3 }}>
      {/* LEFT */}
      <Box sx={{ flex: 1 }}>
        <Typography variant="h4" sx={{ color: "primary.main" }}>{data.channel}</Typography>
        <Typography variant="h2" sx={{ color: "primary.main" }}>{data.title}</Typography>
        <Typography variant="body1">{data.organizer}</Typography>
        <Typography variant="body2" color="text.secondary">{data.date}</Typography>
      </Box>

      {/* RIGHT */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 2 }}>
        {/* STATS */}
        <Box sx={{ display: "flex", justifyContent: "space-around" }}>
          {displayStats?.map((item, i) => (
            <Box key={i} textAlign="center">
              <Typography variant="h2" fontWeight={700}>{item.value}</Typography>
              <Typography variant="body2" color="text.secondary">{item.label}</Typography>
            </Box>
          ))}
        </Box>

        {/* BUTTONS */}
        {channel === "donation" ? (
          <Button fullWidth variant="contained">Quyên góp</Button>
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
                bgcolor: isJoined ? "transparent" : "success.main",
                color: isJoined ? "success.main" : "common.white",
                "&:hover": {
                  bgcolor: isJoined ? "transparent" : "success.dark",
                },
              }}
              onClick={handleJoinClick}
            >
              {isJoined ? "Đã đăng ký" : "Tham gia"}
            </Button>
          </Stack>
        )}
      </Box>
      
      {/* EVENT QUESTIONS */}
      <JoinEventDialog
        open={openJoinDialog}
        onClose={() => setOpenJoinDialog(false)}
        eventTitle={data.title}
        questions={questions}
        loading={loadingJoin}
        onConfirm={handleConfirmJoin}
      />
    </Box>
    
  );
};

const ArticlePage = () => {
  const { channel, id } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const loadErrorShownRef = useRef(false);
  const { article, isPending, isError, errorMessage } = useArticleById(channel, id);

  const cleanContent = article?.content ? DOMPurify.sanitize(article.content) : "";
  
  const navigate = useNavigate();
  const contentRef = useRef(null);
  const heroRef = useRef(null);
  const [placeholderHeight, setPlaceholderHeight] = useState(600);

  const recalcPlaceholder = useCallback(() => {
    if (!contentRef.current || !heroRef.current) return;
    const heroH = heroRef.current.getBoundingClientRect().height;
    const contentH = contentRef.current.getBoundingClientRect().height;
    const contentTopInHero = heroH * 0.55;
    const overflow = contentH - (heroH - contentTopInHero);
    setPlaceholderHeight(Math.max(overflow + 100, 100));
  }, []);

  useEffect(() => {
    if (!contentRef.current) return;
    const ro = new ResizeObserver(recalcPlaceholder);
    ro.observe(contentRef.current);
    return () => ro.disconnect();
  }, [article, recalcPlaceholder]);

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
          stats: [{ value: article.interestedCount ?? 0, label: "người quan tâm" }, { value: article.joinedCount ?? 0, label: "người tham gia" }],
        }
      : resolvedChannel === "donation"
      ? {
          channel: "Quyên góp",
          title: article.title,
          organizer: article.organizer ?? "",
          date: formatDateRange(article.donationDate, article.donationEndDate),
          stats: [{ value: article.donorCount ?? 0, label: "người quyên góp" }, { value: article.targetAmount != null ? `${formatNumberVi(article.targetAmount)} VNĐ` : "0 VNĐ", label: "mục tiêu" }],
        }
      : null;
  
  return (
    <Page title={article.title} meta={<meta name="description" content={`${article.title} - AlumVerse`} />}>
      <Container maxWidth={false} disableGutters sx={{ display: "flex", flexDirection: "column" }}>
        {/* Hero + absolute content frame wrapper */}
        <Box ref={heroRef} sx={{ position: "relative", top: "-1px", pt: "1px", height: { xs: "35vh", sm: "40vh", md: "50vh" }, minHeight: { xs: 260, sm: 300, md: 380 } }}>
          {/* Hero banner */}
          <Box sx={{ position: "absolute", inset: 0, top: "-1px", backgroundColor: "primary.dark", backgroundImage: article.thumbnailUrl ? `url(${article.thumbnailUrl})` : "none", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }} />
          {/* Main content frame */}
          <Box ref={contentRef} sx={{ position: "absolute", top: { xs: "60%", sm: "65%", md: "60%" }, left: 0, right: 0, display: "flex", justifyContent: "center", px: { xs: 2, sm: 3 } }}>
            <Box sx={{ width: "100%", maxWidth: 1200, backgroundColor: "#fff", borderRadius: 2, boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)", overflow: "hidden", py: { xs: 5, md: 6 }, px: { xs: 4, md: 6 } }}>
              {/* Breadcrumb */}
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Button startIcon={<NavigateBeforeIcon />} onClick={() => navigate(-1)} size="small" sx={{ color: "text.secondary", textTransform: "none", pl: 0 }}>
                  Quay lại
                </Button>
                <Box sx={{ flexGrow: 1 }} />
                <SaveArticleButton itemId={Number(id)} />
              </Box>

              {/* Title */}
              <Typography variant="h1" component="h1" fontWeight={700} color="primary.main" textAlign="center" sx={{ mb: 1, fontSize: { xs: "1.8rem", md: "2.1rem" } }}>
                {article.title}
              </Typography>

              {/* Date */}
              {article.publishedAt && (
                <Typography variant="body2" sx={{ textAlign: "center", color: "text.secondary", mb: 4 }}>
                  {formatDate(article.publishedAt)}
                </Typography>
              )}

              {/* HIGHLIGHT */}
              {highlightData && (
                <ArticleHighlightCard data={highlightData} channel={resolvedChannel} eventId={id} />
              )}

              {/* Thumbnail */}
              {article.thumbnailUrl && (
                <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
                  <Box component="img" src={article.thumbnailUrl} alt={article.title} sx={{ width: { xs: "100%", md: "60%" }, borderRadius: 2, boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }} />
                </Box>
              )}

              {/* Article Content */}
              <Box dangerouslySetInnerHTML={{ __html: cleanContent }} />
            </Box>
          </Box>
        </Box>

        {/* Placeholder space */}
        <Box sx={{ height: placeholderHeight }} />
      </Container>
    </Page>
  );
};

export default ArticlePage;
