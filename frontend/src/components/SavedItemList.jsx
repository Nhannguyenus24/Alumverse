import { Box, Card, CardActionArea, IconButton, Tooltip, Typography } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import { useTranslation } from "react-i18next";
import LoadingSkeleton from "./LoadingSkeleton";
import { ScrollReveal, getStaggerDelay } from "./animations/ScrollReveal";

/**
 * Shared row list for saved-item pages (articles/events): thumbnail + title + unsave heart.
 * `items` entries: { key, title, thumbnailUrl, onOpen, onUnsave }.
 */
const SavedItemList = ({ items, loading, emptyHint }) => {
  const { t } = useTranslation("article");

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <LoadingSkeleton />
      </Box>
    );
  }

  if (items.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
        <FavoriteIcon sx={{ fontSize: 48, opacity: 0.4 }} />
        <Typography mt={1}>{t("no_saved_articles")}</Typography>
        <Typography variant="body2">{emptyHint ?? t("saved_empty_hint")}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {items.map((item, index) => (
        <ScrollReveal key={item.key} delay={getStaggerDelay(index, 0.07)}>
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "stretch" }}>
              <CardActionArea
                onClick={item.onOpen}
                sx={{ display: "flex", justifyContent: "flex-start", p: 1.5, gap: 1.5 }}
              >
                <Box
                  sx={{
                    width: 96,
                    height: 72,
                    borderRadius: 1.5,
                    flexShrink: 0,
                    bgcolor: "primary.light",
                    backgroundImage: item.thumbnailUrl ? `url(${item.thumbnailUrl})` : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {!item.thumbnailUrl && <ArticleOutlinedIcon color="primary" />}
                </Box>
                <Typography fontWeight={600} sx={{ flex: 1 }}>
                  {item.title}
                </Typography>
              </CardActionArea>
              <Box sx={{ display: "flex", alignItems: "center", pr: 1 }}>
                <Tooltip title={t("unsave_article")}>
                  <IconButton color="primary" onClick={item.onUnsave}>
                    <FavoriteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Card>
        </ScrollReveal>
      ))}
    </Box>
  );
};

export default SavedItemList;
