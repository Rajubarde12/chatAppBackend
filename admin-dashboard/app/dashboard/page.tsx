"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, AlertTriangle, Ban, MessageSquare } from "lucide-react";
import { useGet } from "../hooks/useGet";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";

export default function AdminDashboard() {
  const router = useRouter();

  type DashboardStats = {
    users: number;
    complaints: number;
    warnings: number;
    blocked: number;
  };

  const { data: stats } = useGet<DashboardStats>("counts", "admin/counts");

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data.data?.users || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const tiles = [
    {
      title: "Total Users",
      value: stats?.users,
      icon: <Users className="h-7 w-7 text-blue-600" />,
      gradient: "from-blue-100 via-blue-50 to-white",
      link: "users",
    },
    {
      title: "Complaints",
      value: stats?.complaints,
      icon: <MessageSquare className="h-7 w-7 text-yellow-600" />,
      gradient: "from-yellow-100 via-yellow-50 to-white",
      link: "complaints",
    },
    {
      title: "Warnings",
      value: stats?.warnings,
      icon: <AlertTriangle className="h-7 w-7 text-orange-600" />,
      gradient: "from-orange-100 via-orange-50 to-white",
      link: "warnings",
    },
    {
      title: "Blocked Users",
      value: stats?.blocked,
      icon: <Ban className="h-7 w-7 text-red-600" />,
      gradient: "from-red-100 via-red-50 to-white",
      link: "blocked",
    },
  ];

  return (
    <div className="p-6 space-y-10 bg-gray-50 min-h-screen">
      {/* ✅ Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-gray-500 mt-2 sm:mt-0">
          Overview of system statistics
        </p>
      </div>

      {/* ✅ Tiles Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiles.map((tile, index) => (
          <Card
            onClick={() => router.push(`dashboard/${tile?.link}`)}
            key={index}
            className={`cursor-pointer bg-gradient-to-br ${tile.gradient} shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
          >
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-gray-700">
                {tile.title}
              </CardTitle>
              <div className="p-2 rounded-xl bg-white shadow-inner">
                {tile.icon}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-extrabold text-gray-900 mt-2">
                {tile.value ?? "-"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ✅ User List Section */}
      <Card className="shadow-sm hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700">
            Recent Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-400 text-sm">Loading users...</p>
          ) : users.length ? (
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted text-left">
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b hover:bg-muted/40 transition-all"
                  >
                    <td className="p-3 font-medium">{u.name}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3 capitalize">{u.role}</td>
                    <td className="p-3 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/dashboard/user/${u.id}`)
                        }
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 text-sm">
              No users found — please add some users.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
