import { useMutation } from "@tanstack/react-query";
import apiClient from "./axios";

const IMAGE_MAX_SIZE_BYTES = 2 * 1024 * 1024;

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
      message: t ? t('common:image_size_error') : "Ảnh vượt quá 2MB. Vui lòng chọn file nhỏ hơn.",
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
