import { useMutation } from "@tanstack/react-query";
import apiClient from "./axios";

const IMAGE_MAX_SIZE_BYTES = 8 * 1024 * 1024;

export const MAX_JSON_PAYLOAD_BYTES = 19 * 1024 * 1024;

const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png"];

const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png"];

export const IMAGE_ACCEPT = "image/jpeg,image/png,.jpg,.jpeg,.png";

export const FUND_CONTENT_EDITOR_HEIGHT = 320;

export const FUND_LOGO_PREVIEW_SX = {
  width: "100%",
  height: FUND_CONTENT_EDITOR_HEIGHT,
  borderRadius: 1,
  objectFit: "contain",
  bgcolor: "grey.50",
  border: "1px solid",
  borderColor: "divider",
  display: "block",
};

/**
 * Validate an image file (type + max size).
 * @param {File} file
 * @param {Function} [t] - optional i18next t function for translated messages
 * @returns {{ valid: true } | { valid: false, message: string }}
 */
export const validateImageFile = (file, t = null) => {
  if (!file) {
    return { valid: false, message: t ? t('common:no_file_selected') : "Không có file được chọn." };
  }

  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0] ?? "";
  const isAllowedType =
    ALLOWED_IMAGE_MIME_TYPES.includes(file.type) ||
    ALLOWED_IMAGE_EXTENSIONS.includes(extension);

  if (!isAllowedType) {
    return {
      valid: false,
      message: t ? t('common:image_type_error') : "Chỉ hỗ trợ file JPG, JPEG hoặc PNG.",
    };
  }

  if (file.size > IMAGE_MAX_SIZE_BYTES) {
    return {
      valid: false,
      message: t ? t('common:image_size_error') : "Ảnh vượt quá 8MB. Vui lòng chọn file nhỏ hơn.",
    };
  }

  return { valid: true };
};

/**
 * Convert a File object to a Base64 string.
 * @param {File} file 
 * @returns {Promise<string>}
 */
export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error ?? new Error("file_read_error"));
    reader.readAsDataURL(file);
  });

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image_load_error"));
    image.src = src;
  });

export const fileToCroppedCoverBase64 = async (
  file,
  positionY = 50,
  aspectRatio = 16 / 9,
  options = {},
) => {
  if (!file) return null;

  const source = await fileToBase64(file);
  const image = await loadImage(source);
  const safePositionY = Math.min(100, Math.max(0, Number(positionY) || 50));
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;

  let cropWidth = sourceWidth;
  let cropHeight = cropWidth / aspectRatio;

  if (cropHeight > sourceHeight) {
    cropHeight = sourceHeight;
    cropWidth = cropHeight * aspectRatio;
  }

  const cropX = (sourceWidth - cropWidth) / 2;
  const cropY = ((sourceHeight - cropHeight) * safePositionY) / 100;
  const maxWidth = Number(options.maxWidth) || 1920;
  const scale = Math.min(1, maxWidth / cropWidth);
  const targetWidth = Math.round(cropWidth * scale);
  const targetHeight = Math.round(cropHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext("2d");

  context.drawImage(
    image,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    targetWidth,
    targetHeight,
  );

  return canvas.toDataURL(options.mimeType || "image/jpeg", options.quality ?? 0.86);
};

export const getJsonPayloadByteSize = (payload) =>
  new Blob([JSON.stringify(payload)]).size;

// ── Chat attachments (image/video) ──────────────────────────────────────────

const CHAT_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const CHAT_VIDEO_MAX_BYTES = 30 * 1024 * 1024;

const CHAT_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const CHAT_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const CHAT_VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm", ".m4v"];
const CHAT_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-m4v",
];

const CHAT_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif";
const CHAT_VIDEO_ACCEPT = "video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm,.m4v";
export const CHAT_ATTACHMENT_ACCEPT = `${CHAT_IMAGE_ACCEPT},${CHAT_VIDEO_ACCEPT}`;

const getFileExtension = (file) => file.name.toLowerCase().match(/\.[^.]+$/)?.[0] ?? "";

/**
 * Validate an image file for chat attachments (jpg/jpeg/png/webp/gif, ≤10MB).
 * @param {File} file
 * @param {Function} [t] - optional i18next t function for translated messages
 * @returns {{ valid: true } | { valid: false, message: string }}
 */
export const validateChatImageFile = (file, t = null) => {
  if (!file) {
    return { valid: false, message: t ? t("common:no_file_selected") : "Không có file được chọn." };
  }

  const extension = getFileExtension(file);
  const isAllowedType =
    CHAT_IMAGE_MIME_TYPES.includes(file.type) || CHAT_IMAGE_EXTENSIONS.includes(extension);

  if (!isAllowedType) {
    return {
      valid: false,
      message: t ? t("network:chat.file_type_unsupported") : "Định dạng ảnh không được hỗ trợ.",
    };
  }

  if (file.size > CHAT_IMAGE_MAX_BYTES) {
    return {
      valid: false,
      message: t ? t("network:chat.image_too_large") : "Ảnh vượt quá 10MB. Vui lòng chọn file nhỏ hơn.",
    };
  }

  return { valid: true };
};

/**
 * Validate a video file for chat attachments (mp4/mov/webm/m4v, ≤30MB).
 * @param {File} file
 * @param {Function} [t] - optional i18next t function for translated messages
 * @returns {{ valid: true } | { valid: false, message: string }}
 */
export const validateVideoFile = (file, t = null) => {
  if (!file) {
    return { valid: false, message: t ? t("common:no_file_selected") : "Không có file được chọn." };
  }

  const extension = getFileExtension(file);
  const isAllowedType =
    CHAT_VIDEO_MIME_TYPES.includes(file.type) || CHAT_VIDEO_EXTENSIONS.includes(extension);

  if (!isAllowedType) {
    return {
      valid: false,
      message: t ? t("network:chat.file_type_unsupported") : "Định dạng video không được hỗ trợ.",
    };
  }

  if (file.size > CHAT_VIDEO_MAX_BYTES) {
    return {
      valid: false,
      message: t ? t("network:chat.video_too_large") : "Video vượt quá 30MB. Vui lòng chọn file nhỏ hơn.",
    };
  }

  return { valid: true };
};

/** Is this an image file allowed for chat, based on extension? */
export const isChatImageExtension = (fileName = "") =>
  CHAT_IMAGE_EXTENSIONS.some((ext) => fileName.toLowerCase().endsWith(ext));

/** Is this a video file allowed for chat, based on extension? */
export const isChatVideoExtension = (fileName = "") =>
  CHAT_VIDEO_EXTENSIONS.some((ext) => fileName.toLowerCase().endsWith(ext));

/** gif must go through the raw /files/upload endpoint to preserve animation. */
export const isAnimatedGif = (fileName = "") => fileName.toLowerCase().endsWith(".gif");

/**
 * Upload an image as a Base64 string to the server.
 * @param {string} base64String 
 * @returns {Promise<string|null>} The uploaded image URL or null.
 */
const uploadImageBase64 = async (base64String) => {
  const res = await apiClient.post("/images/upload", { base64String });
  return res?.data?.data ?? null;
};

/**
 * Hook for uploading images.
 * @returns {object} { uploadFile, uploadBase64, isPending, isError, errorMessage }
 */
export const useUploadImage = () => {
  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: uploadImageBase64,
  });

  const uploadFile = async (file) => {
    if (!file) return null;
    const base64 = await fileToBase64(file);
    return mutateAsync(base64);
  };

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "image_upload_error"
      : null;

  return { uploadFile, uploadBase64: mutateAsync, isPending, isError, errorMessage };
};
