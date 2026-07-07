const MAIN_IMAGE_CAPTION_ATTR = "data-main-image-caption";

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export const extractMainImageCaption = (html = "") => {
  if (!html || typeof document === "undefined") {
    return { content: html ?? "", caption: "" };
  }

  const container = document.createElement("div");
  container.innerHTML = html;
  const captionNode = container.querySelector(`[${MAIN_IMAGE_CAPTION_ATTR}="true"]`);
  const caption = captionNode?.textContent?.trim() ?? "";
  captionNode?.remove();

  return {
    content: container.innerHTML,
    caption,
  };
};

export const withMainImageCaption = (html = "", caption = "") => {
  const { content } = extractMainImageCaption(html);
  const cleanCaption = caption.trim();

  if (!cleanCaption) return content;

  return `<p ${MAIN_IMAGE_CAPTION_ATTR}="true" class="article-main-image-caption">${escapeHtml(cleanCaption)}</p>${content}`;
};
