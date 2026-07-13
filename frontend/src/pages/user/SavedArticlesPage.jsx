import LoadingSkeleton from '../../components/LoadingSkeleton';
import { useEffect, useState } from "react";
import { Container, Box, Typography, Card, CardActionArea, IconButton, Tooltip } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import Page from "../../components/Page";
import { savedItemApi } from "../../utils/api";
import apiClient from "../../utils/axios";
import { useOrgNavigate } from "../../hooks/useOrgNavigate";
import { ScrollReveal, getStaggerDelay } from "../../components/animations/ScrollReveal";

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
  const { t } = useTranslation('article');
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
      enqueueSnackbar(t('saved_load_error'), { variant: "error" });
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
      enqueueSnackbar(t('saved_unsave_success'), { variant: "info" });
    } catch {
      enqueueSnackbar(t('saved_action_failed'), { variant: "error" });
    }
  };

  return (
    <Page title={t('saved_articles')}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <ScrollReveal><Typography
          variant="h1"
          fontWeight={800}
          color="primary.main"
          sx={{ fontSize: { xs: "1.8rem", md: "2.3rem" }, mb: 3 }}
        >
          {t('saved_articles').toUpperCase()}
        </Typography></ScrollReveal>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <LoadingSkeleton />
          </Box>
        ) : items.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
            <FavoriteIcon sx={{ fontSize: 48, opacity: 0.4 }} />
            <Typography mt={1}>{t('no_saved_articles')}</Typography>
            <Typography variant="body2">
              {t('saved_empty_hint')}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {items.map((s, index) => {
              const title = s.article?.title ?? t('saved_article_fallback_title', { id: s.itemId });
              const thumb = s.article?.thumbnailUrl;
              return (
                <ScrollReveal key={s.id ?? s.itemId} delay={getStaggerDelay(index, 0.07)}><Card variant="outlined" sx={{ borderRadius: 2 }}>
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
                      <Tooltip title={t('unsave_article')}>
                        <IconButton color="primary" onClick={(e) => handleUnsave(e, s.itemId)}>
                          <FavoriteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Card></ScrollReveal>
              );
            })}
          </Box>
        )}
      </Container>
    </Page>
  );
};

export default SavedArticlesPage;
