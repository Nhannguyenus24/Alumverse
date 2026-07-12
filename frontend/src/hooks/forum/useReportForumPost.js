import { useMutation } from '@tanstack/react-query';
import apiClient from '../../utils/axios';

const reportPost = async ({ id, reporterMemberId, reason }) => {
  const payload = { reporterMemberId, reason };
  const response = await apiClient.post(`/forum/post/${id}/report`, payload);
  return response.data;
};

export const useReportForumPost = () => {


  const mutation = useMutation({
    mutationFn: reportPost,
    onSuccess: () => {
      // Not strictly necessary to invalidate posts
    },
  });

  const errorMessage =
    mutation.isError && mutation.error
      ? mutation.error.response?.data?.message ??
        mutation.error.message ??
        'Failed to report post'
      : null;

  return {
    reportPost: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    errorMessage,
  };
};
