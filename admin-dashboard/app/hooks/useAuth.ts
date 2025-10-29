"use client";

import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "sonner";

export const useLogin = () => {
  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await api.post("/users/login", data, {
        headers: { Authorization: "efdfshufghjgfuffgiufufifuffu" },
      });
      return res.data;
    },
    onSuccess: (data) => {
    console.log(data)
      toast.success(data.message);
      if (typeof window !== "undefined") {
        localStorage.setItem("token", data.token);
      }
    },
    onError: (error: any) => {
      console.log("this isierrop", error);

      toast.error(error.response?.data?.message || "❌ Login failed!");
    },
  });
};
