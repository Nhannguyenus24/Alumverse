const MAIN_IMAGE_CAPTION_ATTR = "data-main-image-caption";

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
