// Convert a normalized article (from useArticleById/normalizeX) into the shape
// ArticleCard / FeaturedArticleCard components expect: { title, description, date, image }
import { normalizePreviewText } from "../../utils/text";

const resolveCardImage = (primary, fallback) => primary || fallback || "/placeholder-image.png";

export const toCardShape = (article, fallbackImage = null) => {
  if (!article) return null;
  const raw = article.content ?? "";
  const plain = normalizePreviewText(raw);
  const description = plain.length > 260 ? `${plain.slice(0, 260)}…` : plain;
  const displayDate = article.updatedAt ?? article.createdAt ?? article.publishedAt;
  const date = displayDate
    ? new Date(displayDate).toLocaleDateString("vi-VN")
    : "";
  return {
    id: article.id,
    channel: article.channel,
    title: normalizePreviewText(article.title),
    description,
    date,
    image: resolveCardImage(article.thumbnailUrl, fallbackImage),
    url: article.url || article.linkUrl,
  };
};
