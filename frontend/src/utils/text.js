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
