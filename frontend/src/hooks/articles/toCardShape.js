// Convert a normalized article (from useArticleById/normalizeX) into the shape
// ArticleCard / FeaturedArticleCard components expect: { title, description, date, image }
import { normalizePreviewText } from "../../utils/text";

export const toCardShape = (article) => {
  if (!article) return null;
  const raw = article.content ?? "";
  const plain = normalizePreviewText(raw);
  const description = plain.length > 180 ? `${plain.slice(0, 180)}…` : plain;
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
    image: article.thumbnailUrl ?? "/placeholder-image.png",
    url: article.url || article.linkUrl,
  };
};
