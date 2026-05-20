import { useMutation } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error ?? new Error("Không thể đọc file"));
    reader.readAsDataURL(file);
  });

const uploadImageBase64 = async (base64String) => {
  const res = await apiClient.post("/images/upload", { base64String });
  return res?.data?.data ?? null;
};

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
      ? error.response?.data?.message ?? error.message ?? "Không thể tải ảnh lên"
      : null;

  return { uploadFile, uploadBase64: mutateAsync, isPending, isError, errorMessage };
};
