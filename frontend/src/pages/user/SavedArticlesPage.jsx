import { useEffect, useState } from "react";
import { Container, Box, Typography, CircularProgress, Card, CardActionArea, IconButton, Tooltip } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import { useSnackbar } from "notistack";
import Page from "../../components/Page";
import { savedItemApi } from "../../utils/api";
import apiClient from "../../utils/axios";
import { useOrgNavigate } from "../../hooks/useOrgNavigate";

/** Resolve a saved NEWS item's title/thumbnail from its id. */
const fetchNews = async (id) => {
  try {
    const res = await apiClient.get(`/articles/news/${id}`);
    return res?.data?.data ?? null;
  } catch {
    return null;
  }
};

const SavedArticlesPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useOrgNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const page = await savedItemApi.listByType("NEWS", { page: 0, limit: 50 });
      const saved = page?.items ?? page?.content ?? page?.data ?? [];
      // Resolve each article's display info.
      const resolved = await Promise.all(
        saved.map(async (s) => {
          const article = await fetchNews(s.itemId);
          return { ...s, article };
        })
      );
      setItems(resolved);
    } catch {
      enqueueSnackbar("Không tải được bài viết đã lưu.", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUnsave = async (e, itemId) => {
    e.stopPropagation();
    try {
      await savedItemApi.unsave("NEWS", itemId);
      setItems((list) => list.filter((x) => x.itemId !== itemId));
      enqueueSnackbar("Đã bỏ quan tâm bài viết.", { variant: "info" });
    } catch {
      enqueueSnackbar("Thao tác thất bại.", { variant: "error" });
    }
  };

  return (
    <Page title="Bài viết đã lưu">
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" fontWeight={700} color="primary.main" mb={3}>
          Bài viết đã lưu
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : items.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
            <FavoriteIcon sx={{ fontSize: 48, opacity: 0.4 }} />
            <Typography mt={1}>Chưa có bài viết đã lưu</Typography>
            <Typography variant="body2">
              Nhấn biểu tượng quan tâm trên một bài viết để xem lại ở đây.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {items.map((s) => {
              const title = s.article?.title ?? `Bài viết #${s.itemId}`;
              const thumb = s.article?.thumbnailUrl;
              return (
                <Card key={s.id ?? s.itemId} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "stretch" }}>
                    <CardActionArea
                      onClick={() => navigate(`/article/news/${s.itemId}`)}
                      sx={{ display: "flex", justifyContent: "flex-start", p: 1.5, gap: 1.5 }}
                    >
                      <Box
                        sx={{
                          width: 96,
                          height: 72,
                          borderRadius: 1.5,
                          flexShrink: 0,
                          bgcolor: "primary.light",
                          backgroundImage: thumb ? `url(${thumb})` : "none",
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {!thumb && <ArticleOutlinedIcon color="primary" />}
                      </Box>
                      <Typography fontWeight={600} sx={{ flex: 1 }}>
                        {title}
                      </Typography>
                    </CardActionArea>
                    <Box sx={{ display: "flex", alignItems: "center", pr: 1 }}>
                      <Tooltip title="Bỏ quan tâm">
                        <IconButton color="primary" onClick={(e) => handleUnsave(e, s.itemId)}>
                          <FavoriteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Card>
              );
            })}
          </Box>
        )}
      </Container>
    </Page>
  );
};

export default SavedArticlesPage;
