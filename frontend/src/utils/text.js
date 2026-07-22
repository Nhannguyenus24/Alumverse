export function truncateText(text, maxChars = 120) {
  const normalizedText = normalizePreviewText(text);
  if (!normalizedText) return "";
  if (normalizedText.length <= maxChars) return normalizedText;
  return `${normalizedText.slice(0, maxChars).trimEnd()}...`;
}

export function normalizePreviewText(text) {
  return String(text ?? "")
    .replace(/&amp;nbsp;|&nbsp;|&#160;|\u00a0/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getFeaturedTitleFontSize(text) {
  const len = normalizePreviewText(text).length;
  if (len > 80) {
    return { xs: "1.1rem", sm: "1.2rem", md: "1.3rem" };
  }
  if (len > 45) {
    return { xs: "1.2rem", sm: "1.35rem", md: "1.48rem" };
  }
  return { xs: "1.3rem", sm: "1.5rem", md: "1.68rem" };
}

// For regular (non-featured) cards — mirrors getFeaturedTitleFontSize breakpoints (>80, >45)
// but scaled down proportionally for the smaller card layout
export function getCardTitleFontSize(text) {
  const len = normalizePreviewText(text).length;
  if (len > 80) {
    return { xs: "0.88rem", sm: "0.92rem", md: "0.96rem" };
  }
  if (len > 45) {
    return { xs: "0.95rem", sm: "1.0rem", md: "1.08rem" };
  }
  return { xs: "1.05rem", sm: "1.1rem", md: "1.18rem" };
}
