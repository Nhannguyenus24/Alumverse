import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const createFund = async (payload) => {
  const res = await apiClient.post("/funds", payload);
  return res?.data?.data ?? null;
};

export const useCreateFund = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: createFund,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funds"] });
    },
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Không thể tạo quỹ quyên góp"
      : null;

  return { createFund: mutateAsync, isPending, isError, errorMessage };
};
