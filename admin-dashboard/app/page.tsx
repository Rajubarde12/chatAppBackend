"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      router.replace("/dashboard"); // ✅ logged in → dashboard
    } else {
      router.replace("/login"); // 🚪 not logged in → login page
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-500">Redirecting...</p>
    </div>
  );
}
