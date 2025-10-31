import { useMutation, UseMutationOptions, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

type PutParams<T> = {
  url: string;
  data?: T;
};

export const usePut = <TData = any, TVariables = any>(
  options?: UseMutationOptions<TData, Error, PutParams<TVariables>>
) => {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, PutParams<TVariables>>({
    mutationFn: async ({ url, data }) => {
      const res = await api.put(url, data);
      return res.data;
    },

    onSuccess: (data, variables, context) => {
      // ✅ Refetch all queries (you can narrow this down later)
      queryClient.invalidateQueries();
      options?.onSuccess?.(data, variables, context, undefined as any);
    },

    onError: (error, variables, context) => {
      console.error("PUT request failed:", error);
      options?.onError?.(error, variables, context, undefined as any);
    },

    ...options,
  });
};
