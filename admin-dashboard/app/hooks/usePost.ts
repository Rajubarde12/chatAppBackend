// 📁 hooks/usePost.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "sonner";

interface ApiResponse<T> {
  status?: boolean;
  message?: string;
  data?: T;
}

export const usePost = <T = any>(
  url: string,
  invalidateKeys: string[] = []
) => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<T>, any, Record<string, any>>({
    mutationFn: async (payload) => {
      const res = await api.post<ApiResponse<T>>(url, payload);
      return res.data;
    },

    onSuccess: (data) => {
      toast.success(data?.message ?? "✅ Success");

      // 🔁 Invalidate all given queries
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    },

    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "❌ Something went wrong";
      toast.error(msg);
    },
  });
};
