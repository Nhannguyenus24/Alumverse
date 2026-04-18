import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router";
import { useSnackbar } from "notistack";
import { Box, Container, Typography, CircularProgress, Button, Stack } from "@mui/material";
import Page from "../../components/Page";
import Breadcrumb from "../../components/Breadcrumb";
import { useNewsById } from "../../hooks/news/useNewsById";
import DOMPurify from "dompurify";

const ArticleHighlightCard = ({ data, channel }) => {
  const [isInterested, setIsInterested] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

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
          {data.stats?.map((item, i) => (
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
              onClick={() => setIsInterested(!isInterested)}
            >
              {isInterested ? "Đã quan tâm" : "Quan tâm"}
            </Button>

            <Button
              fullWidth
              variant={isJoined ? "outlined" : "contained"}
              sx={{
                bgcolor: isJoined ? "transparent" : "grey.700",
                color: isJoined ? "grey.700" : "common.white",
              }}
              onClick={() => setIsJoined(!isJoined)}
            >
              {isJoined ? "Đã tham gia" : "Tham gia"}
            </Button>
          </Stack>
        )}
      </Box>
    </Box>
  );
};

const ArticlePage = () => {
  const { id } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const loadErrorShownRef = useRef(false);
  const { article, isPending, isError, errorMessage } = useNewsById(id);
  
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

  const channel = article.channel; // 🔥 IMPORTANT: backend must send this

  const highlightData =
    channel === "event"
      ? {
          channel: "Sự kiện",
          title: article.title,
          organizer: article.organizer ?? "Unknown",
          date: article.eventDate ?? "",
          stats: [
            { value: article.interestedCount ?? 0, label: "người quan tâm" },
            { value: article.joinedCount ?? 0, label: "người tham gia" },
          ],
        }
      : channel === "donation"
      ? {
          channel: "Quyên góp",
          title: article.title,
          organizer: article.organizer ?? "Unknown",
          date: article.donationDate ?? "",
          stats: [
            { value: article.donorCount ?? 0, label: "người quyên góp" },
            {
              value: article.avgDonation ?? "0 VNĐ",
              label: "trung bình quyên góp",
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
                  {new Date(article.publishedAt).toLocaleDateString("vi-VN")}
                </Typography>
              )}

              {/* HIGHLIGHT */}
              {highlightData && (
                <ArticleHighlightCard data={highlightData} channel={channel} />
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
