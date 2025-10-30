"use client";

import { useRouter, usePathname } from "next/navigation";
import { Bell, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { useUser } from "@/lib/UserContext";

const navLinks = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Users", href: "/dashboard/users" },
  { name: "Complaints", href: "/dashboard/complaints" },
  { name: "Warnings", href: "/dashboard/warnings" },
  { name: "Blocked", href: "/dashboard/blocked" },
];

export default function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const {user}=useUser()

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 backdrop-blur-md bg-white/70 border-b border-gray-200 shadow-sm">
      {/* ✅ Left: Logo */}
      <div className="flex items-center gap-3">
        <Image
          src="https://cdn-icons-png.flaticon.com/512/9131/9131529.png"
          alt="Logo"
          width={36}
          height={36}
          className="rounded-md"
        />
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          AdminPro
        </h1>
      </div>

      {/* ✅ Center: Navigation */}
      <nav className="hidden md:flex items-center gap-8">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {link.name}
              {isActive && (
                <span className="absolute left-0 -bottom-1 h-[2px] w-full bg-blue-600 rounded-full"></span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ✅ Right: Actions */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-gray-100"
        >
          <Bell className="h-5 w-5 text-gray-600" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
        </Button>

        {/* User Avatar (optional placeholder) */}
        <div className="hidden sm:flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full cursor-pointer hover:bg-gray-200 transition">
          <Image
          src={
              user?.avatar ||
              "https://cdn-icons-png.flaticon.com/512/9131/9131529.png"
            }
            unoptimized
            alt="Admin Avatar"
            width={28}
            height={28}
            className="rounded-full"
          />
          <span className="text-sm font-medium text-gray-700">{user?.name}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="hidden sm:flex items-center"
        >
          <LogOut className="h-4 w-4 mr-2 text-gray-600" />
          Logout
        </Button>

        {/* ✅ Mobile Menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden hover:bg-gray-100"
            >
              <Menu className="h-6 w-6 text-gray-700" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <div className="flex flex-col gap-4 mt-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`block px-4 py-2 rounded-lg text-base font-medium transition ${
                    pathname === link.href
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
