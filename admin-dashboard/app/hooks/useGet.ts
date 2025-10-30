// 📁 hooks/useGet.ts

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import api from "@/lib/axios";

export const useGet = <T>(
  key: string | string[],        // unique query key
  url: string,                   // API endpoint
  options?: Omit<UseQueryOptions<T>, "queryKey" | "queryFn"> // optional overrides
) => {
  return useQuery<T>({
    queryKey: Array.isArray(key) ? key : [key], // normalize key
    queryFn: async () => {
      const res = await api.get(url);
      return res.data?.data as T;
    },
    staleTime: 0,                 // ensures invalidateQueries refetches
    refetchOnMount: true,         // refetch when remounting component
    refetchOnWindowFocus: false,  // avoids unwanted refetch when switching tabs
    retry: 1,                     // one retry on failure
    ...options,                   // allow custom overrides
  });
};
