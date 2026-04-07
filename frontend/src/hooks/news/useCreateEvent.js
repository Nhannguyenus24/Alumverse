import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const createEvent = async (payload) => {
  const res = await apiClient.post("/events", payload);
  return res?.data?.data ?? null;
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Không thể tạo sự kiện"
      : null;

  return { createEvent: mutateAsync, isPending, isError, errorMessage };
};
