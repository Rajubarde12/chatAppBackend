

import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "sonner";

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role?: string;
  };
}

export const useLogin = () => {
  return useMutation<LoginResponse, any, LoginPayload>({
    // ✅ API Call
    mutationFn: async (data) => {
        
      const res = await api.post("/admin/login", data, {
        headers: { Authorization: "efdfshufghjgfuffgiufufifuffu" },
      });
      return res.data;
    },

    // ✅ On Success: Save Token & Redirect
    onSuccess: (data) => {
      toast.success(data.message || "Login successful!");

      if (typeof window !== "undefined") {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      // Optional: redirect after login
      window.location.href = "/dashboard";
    },

    // ✅ On Error
    onError: (error: any) => {
      const msg =
        error.response?.data?.message || "❌ Login failed. Please try again.";
      toast.error(msg);
    },
  });
};
