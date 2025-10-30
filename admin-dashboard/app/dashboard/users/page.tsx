"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2, UserPlus, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  isActive: number;
  isDisabled: number;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data.data.users || []);
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      {/* 🌟 Header Section */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-2xl shadow-md p-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-sm text-white/80 mt-1">
            Manage registered users, view details, or block/unblock accounts.
          </p>
        </div>
        <Button
          className="bg-white text-indigo-600 hover:bg-indigo-50"
          size="sm"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* 💠 User Table */}
      <Card className="shadow-lg border-0">
        <CardHeader className="pb-0">
          <CardTitle className="text-xl font-semibold text-foreground">
            All Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">
              No users found
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/50 text-left">
                    <th className="p-4 font-medium text-muted-foreground">
                      User
                    </th>
                    <th className="p-4 font-medium text-muted-foreground">
                      Email
                    </th>
                    <th className="p-4 font-medium text-muted-foreground">
                      Role
                    </th>
                    <th className="p-4 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="p-4 font-medium text-muted-foreground">
                      Created
                    </th>
                    <th className="p-4 text-right font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b hover:bg-muted/30 transition-all duration-200"
                    >
                      {/* 👤 Avatar + Name */}
                      <td className="p-4 flex items-center gap-3">
                        <Image
                          src={
                            user.avatar ||
                            "https://cdn-icons-png.flaticon.com/512/9131/9131529.png"
                          }
                          alt={user.name}
                          width={40}
                          height={40}
                          className="rounded-full border shadow-sm"
                        />
                        <div>
                          <p className="font-medium text-foreground">
                            {user.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ID: {user.id.slice(0, 8)}...
                          </p>
                        </div>
                      </td>

                      {/* ✉️ Email */}
                      <td className="p-4 text-muted-foreground">
                        {user.email}
                      </td>

                      {/* 🧩 Role */}
                      <td className="p-4 capitalize">{user.role}</td>

                      {/* 🟢 Status */}
                      <td className="p-4">
                        {user.isDisabled ? (
                          <Badge
                            variant="destructive"
                            className="rounded-full px-3 py-1 text-xs"
                          >
                            Disabled
                          </Badge>
                        ) : user.isActive ? (
                          <Badge
                            variant="default"
                            className="bg-green-500 hover:bg-green-600 text-white rounded-full px-3 py-1 text-xs"
                          >
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="rounded-full px-3 py-1 text-xs"
                          >
                            Inactive
                          </Badge>
                        )}
                      </td>

                      {/* 📅 Created Date */}
                      <td className="p-4 text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>

                      {/* 🧭 Actions */}
                      <td className="p-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-28 border-indigo-600 text-indigo-600 hover:bg-indigo-50 flex items-center justify-center gap-1"
                            onClick={() =>
                              router.push(`/dashboard/user/${user.id}`)
                            }
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>

                          {user.isDisabled ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-28 border-green-600 text-green-600 hover:bg-green-50 font-medium"
                            >
                              Unblock
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="destructive"
                              className="w-28 hover:bg-red-600 font-medium"
                            >
                              Block
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
