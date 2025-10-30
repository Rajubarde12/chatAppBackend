"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { UserDetails } from "@/app/types";
import { useParams } from "next/navigation";
import { useGet } from "@/app/hooks/useGet";
import { Button } from "@/components/ui/button";
import { ComplaintsSection } from "@/components/ComplaintSection/page";
type TableProps = {
  headers: string[];
  rows: any[];
  onAction?: (row: any) => void; // optional callback
  actionLabel?: string; // button label
};
export default function UserDetailsPage() {
  const { id } = useParams() as {
    id:string
  }; 

  // const id = "d2b346ca-4687-485e-8066-193b048968e0"; // static for testing
  // const [user, setUser] = useState<UserDetails | null>(null);
  // const [loading, setLoading] = useState(true);
  const { data: user, isPending: loading } = useGet<UserDetails | null>(
    ["user", id],
    `/admin/getUser/${id}`
  );

  // useEffect(() => {
  //   //  alert(id1)
  //   const fetchUserDetails = async () => {
  //     try {
  //       const token = localStorage.getItem("token");
  //       const res = await api.get(`/admin/getUser/${id}`, {
  //         headers: { Authorization: `Bearer ${token}` },
  //       });
  //       setUser(res.data.data);
  //     } catch (err: any) {
  //       console.error(err);
  //       toast.error("Failed to load user details");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchUserDetails();
  // }, [id]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );

  if (!user)
    return <p className="text-center text-muted-foreground">No user found</p>;

  const complaints = user.complaintsAgainst || [];
  const activities = user.activities || [];
  const blockRecords = user.blockRecords || [];
  const warnings = user.warnings || [];
  {
    console.log(user);
  }

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen space-y-10">
      {/* 🧍 Profile Header */}
      <Card className="p-6 md:p-8 bg-gradient-to-r from-blue-50 via-white to-blue-50 border shadow-md backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <Image
            src={
              user.avatar ||
              "https://cdn-icons-png.flaticon.com/512/9131/9131529.png"
            }
            unoptimized
            alt={user.name}
            width={100}
            height={100}
            className="rounded-full border-4 border-blue-100 shadow-lg"
          />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              {user.name}
            </h1>
            <p className="text-gray-500">{user.email}</p>
            <div className="flex gap-3 mt-3 flex-wrap">
              {user.isDisabled ? (
                <Badge variant="destructive">Disabled</Badge>
              ) : user.isActive ? (
                <Badge variant="default">Active</Badge>
              ) : (
                <Badge variant="secondary">Inactive</Badge>
              )}
              <Badge variant="outline" className="capitalize">
                {user.role}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* 📊 Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <SummaryCard
          title="Complaints"
          value={complaints.length}
          color="blue"
        />
        <SummaryCard
          title="Activities"
          value={activities.length}
          color="purple"
        />
        <SummaryCard title="Blocks" value={blockRecords.length} color="red" />
        <SummaryCard title="Warnings" value={warnings.length} color="yellow" />
      </div>

      {/* 📝 Sections */}
      <ComplaintsSection complaints={complaints} />

      <Section title="Suspicious Activities" count={activities.length}>
        {activities.length ? (
          <Table
            headers={["Type", "Details", "Status", "Date"]}
            rows={activities.map((s) => [
              s.type,
              (() => {
                try {
                  const d = JSON.parse(s.details);
                  return `Reports: ${d.reportCount}, Period: ${d.period}`;
                } catch {
                  return s.details;
                }
              })(),
              s.status,
              new Date(s.createdAt).toLocaleDateString(),
            ])}
          />
        ) : (
          <Empty text="No suspicious activities found." />
        )}
      </Section>

      <Section title="Block History" count={blockRecords.length}>
        {blockRecords.length ? (
          <div className="grid gap-4">
            {blockRecords.map((b) => (
              <Card
                key={b.id}
                className="p-5 shadow-sm hover:shadow-md transition-all"
              >
                <p>
                  <strong>Reason:</strong> {b.reasonCategory}
                </p>
                <p>
                  <strong>Action:</strong> {b.actionTaken}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {b.isBlocked ? "Blocked" : "Unblocked"}
                </p>
              </Card>
            ))}
          </div>
        ) : (
          <Empty text="No block history available." />
        )}
      </Section>

      <Section title="Warnings" count={warnings.length}>
        {warnings.length ? (
          <div className="grid gap-4">
            {warnings.map((w) => (
              <Card
                key={w.id}
                className="p-5 bg-yellow-50 border-yellow-100 shadow-sm hover:shadow-md transition-all"
              >
                <p>
                  <strong>Message:</strong> {w.message}
                </p>
                <p>
                  <strong>Issued by:</strong> {w.adminUser?.name}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(w.createdAt).toLocaleDateString()}
                </p>
              </Card>
            ))}
          </div>
        ) : (
          <Empty text="No warnings issued." />
        )}
      </Section>
    </div>
  );
}

/* 🧩 Helper Components */
function Section({ title, count, children }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-2">
        <h2 className="text-lg font-semibold text-gray-800">
          {title}{" "}
          <span className="text-muted-foreground text-sm">({count})</span>
        </h2>
      </div>
      {children}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  const colorMap: any = {
    blue: "from-blue-100 to-blue-50 text-blue-700",
    purple: "from-purple-100 to-purple-50 text-purple-700",
    red: "from-red-100 to-red-50 text-red-700",
    yellow: "from-yellow-100 to-yellow-50 text-yellow-700",
  };

  return (
    <Card
      className={`p-6 text-center bg-gradient-to-br ${colorMap[color]} border-none shadow-md hover:shadow-lg transition-all rounded-2xl`}
    >
      <CardTitle className="text-sm font-medium text-gray-500">
        {title}
      </CardTitle>
      <CardContent className="pt-2">
        <p className="text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function Table({ headers, rows, onAction, actionLabel }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="p-3 text-left font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              className={`border-t hover:bg-gray-50 transition ${
                i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
              }`}
            >
              {r.map((cell: any, j: number) => (
                <td key={j} className="p-3 text-gray-700">
                  {cell}
                </td>
              ))}

              {/* ✅ Action Button column */}
              {onAction && (
                <td className="p-3 text-right">
                  <Button
                    size="sm"
                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                    onClick={() => onAction(r)}
                  >
                    {actionLabel || "Action"}
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Empty({ text }: any) {
  return (
    <p className="text-muted-foreground text-sm italic text-center py-3">
      {text}
    </p>
  );
}
