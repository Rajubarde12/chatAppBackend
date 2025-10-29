"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/app/hooks/useAuth";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const {mutate:login,isPending}= useLogin()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    

   login({email,password}  ,{onSuccess:(data)=>{

   }})
   

  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <Card className="w-full max-w-sm p-6 shadow-lg border border-border">
        <CardHeader className="flex flex-col items-center space-y-2">
          {/* ✅ Logo */}
          <div className="flex items-center space-x-2">
            {/* If using an image logo: */}
            {/* <Image src="/logo.png" alt="Logo" width={40} height={40} /> */}
            <span className="text-3xl font-bold text-primary">AdminPro</span>
          </div>
          <CardTitle className="text-center text-xl font-semibold">
            Sign in to your account
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isPending}
            >
              {isPending ? "Logging in..." : "Login"}
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-2">
              Forgot password?{" "}
              <a href="#" className="text-primary hover:underline">
                Reset here
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
