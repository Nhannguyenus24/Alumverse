export function truncateText(text, maxChars = 120) {
  const normalizedText = String(text ?? "").trim();
  if (!normalizedText) return "";
  if (normalizedText.length <= maxChars) return normalizedText;
  return `${normalizedText.slice(0, maxChars).trimEnd()}...`;
}
