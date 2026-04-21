// Convert a normalized article (from useArticleById/normalizeX) into the shape
// ArticleCard / FeaturedArticleCard components expect: { title, description, date, image }
export const toCardShape = (article) => {
  if (!article) return null;
  const raw = article.content ?? "";
  const plain = typeof raw === "string" ? raw.replace(/<[^>]+>/g, " ").trim() : "";
  const description = plain.length > 180 ? `${plain.slice(0, 180)}…` : plain;
  const date = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("vi-VN")
    : "";
  return {
    id: article.id,
    channel: article.channel,
    title: article.title ?? "",
    description,
    date,
    image: article.thumbnailUrl ?? "/placeholder-image.png",
  };
};
