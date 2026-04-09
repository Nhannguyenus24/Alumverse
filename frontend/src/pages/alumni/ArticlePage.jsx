import { useParams } from "react-router";
import { Box, Container, Typography, CircularProgress } from "@mui/material";
import Page from "../../components/Page";
import Breadcrumb from "../../components/Breadcrumb";
import { useNewsById } from "../../hooks/news/useNewsById";

const ArticlePage = () => {
  const { id } = useParams();
  const { article, isPending, isError, errorMessage } = useNewsById(id);

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
        <Typography color="error">{errorMessage ?? "Không tìm thấy bài viết"}</Typography>
      </Box>
    );
  }

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
              <Typography
                variant="body1"
                sx={{
                  lineHeight: 1.8,
                  textAlign: "justify",
                  color: "text.primary",
                  whiteSpace: "pre-wrap",
                }}
              >
                {article.content}
              </Typography>
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
