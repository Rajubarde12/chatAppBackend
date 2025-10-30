"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { usePost } from "@/app/hooks/usePost";
import { queryClient } from "@/lib/queryClient";
import { Complaint } from "@/app/types";

/* ✅ Complaints Section */
export function ComplaintsSection({ complaints }: { complaints: Complaint[] }) {
  const [selectedEvidence, setSelectedEvidence] = useState<any | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null
  );
  const [action, setAction] = useState("");
  const [message, setMessage] = useState("");
  const [reasonCategory, setReasonCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const { mutate, isPending } = usePost(
    `/admin/reviewComplaint/${selectedComplaint?.id}`,
    [
      "complaints", // query key to refetch
    ]
  );

  const handleSubmit = () => {
    if (!selectedComplaint || !action)
      return toast.error("Please choose an action.");

    setLoading(true);

    mutate(
      {
        action,
        warningMessage: message,
        blockReasonCategory: reasonCategory,
      },
      {
        onSuccess: (data) => {
          setLoading(false);
          setSelectedComplaint(null);
          console.log(selectedComplaint.reportedUserId)
          queryClient.invalidateQueries({
            queryKey: ["user", selectedComplaint.reportedUserId],
          });
        },
        onError: (err) => {
          console.error(err);
          //   toast.error("Something went wrong!");
          setLoading(false);
        },
      }
    );
  };

  return (
    <>
      <Section title="Complaints" count={complaints.length}>
        {complaints.length ? (
          <div className="overflow-x-auto rounded-xl border shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="p-3 text-left font-semibold">Reason</th>
                  <th className="p-3 text-left font-semibold">Category</th>
                  <th className="p-3 text-left font-semibold">Evidence</th>
                  <th className="p-3 text-left font-semibold">Status</th>
                  <th className="p-3 text-left font-semibold">Action Taken</th>
                  <th className="p-3 text-left font-semibold">Date</th>
                  <th className="p-3 text-right font-semibold">Action</th>
                </tr>
              </thead>

              <tbody>
                {complaints.map((c, i) => (
                  <tr
                    key={c.id}
                    className={`border-t hover:bg-gray-50 transition ${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    }`}
                  >
                    <td className="p-3">{c.reason}</td>
                    <td className="p-3 capitalize">{c.category}</td>
                    <td className="p-3">
                      {c.evidence ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedEvidence(c.evidence)}
                        >
                          View Evidence
                        </Button>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3">
                      <Badge
                        className={
                          c.status === "pending"
                            ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                            : c.status === "reviewed"
                              ? "bg-blue-100 text-blue-800 border border-blue-300"
                              : c.status === "actionTaken"
                                ? "bg-green-100 text-green-800 border border-green-300"
                                : "bg-gray-100 text-gray-700 border border-gray-300"
                        }
                      >
                        {c.status}
                      </Badge>
                    </td>
                    <td className="p-3">{c.actionTaken || "—"}</td>
                    <td className="p-3">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        size="sm"
                        disabled={c.status !== "pending"}
                        className={`rounded-md transition-all ${
                          c.status === "pending"
                            ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                        onClick={() => {
                          setReasonCategory(c.category);
                          setSelectedComplaint(c);
                        }}
                      >
                        {c.status === "pending" ? "Take Action" : "Done"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty text="No complaints found." />
        )}
      </Section>

      {/* 🧾 Evidence Dialog */}
      <Dialog
        open={!!selectedEvidence}
        onOpenChange={() => setSelectedEvidence(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Evidence Details</DialogTitle>
          </DialogHeader>

          {selectedEvidence && (
            <div className="space-y-5 mt-4 max-h-[70vh] overflow-y-auto">
              {Object.entries(selectedEvidence).map(([key, value]: any, i) => (
                <div
                  key={i}
                  className="border rounded-lg p-3 shadow-sm bg-gray-50"
                >
                  <h4 className="font-medium text-gray-800 mb-2">{key}</h4>
                  {renderEvidenceViewer(value)}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ⚙️ Admin Action Dialog */}
      <Dialog
        open={!!selectedComplaint}
        onOpenChange={() => setSelectedComplaint(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Handle Complaint</DialogTitle>
          </DialogHeader>

          {selectedComplaint && (
            <div className="space-y-4 mt-3">
              <p className="text-sm text-gray-600">
                Complaint Reason: <b>{selectedComplaint.reason}</b>
              </p>

              <div className="space-y-2">
                <Label>Action</Label>
                <select
                  className="border rounded-md p-2 w-full"
                  value={action}
                  onChange={(e) => {
                    setAction(e.target.value);
                    setMessage("");
                    setReasonCategory("");
                  }}
                >
                  <option value="">Select action</option>
                  <option value="dismiss">Dismiss</option>
                  <option value="warn">Warn</option>
                  <option value="block">Block</option>
                </select>
              </div>

              {/* Conditional Inputs */}
              {action === "warn" && (
                <div className="space-y-2">
                  <Label>Warning Message</Label>
                  <Input
                    placeholder="Enter warning message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
              )}

              {action === "block" && (
                <div className="space-y-2">
                  <Label>Block Reason Category</Label>
                  <Input
                    placeholder="Enter block reason category"
                    value={reasonCategory}
                    onChange={(e) => setReasonCategory(e.target.value)}
                  />
                </div>
              )}

              <div className="flex justify-end pt-3">
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {loading ? "Applying..." : "Submit Action"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/* 🎥 Evidence Viewer */
function renderEvidenceViewer(value: any) {
  const url = String(value);

  if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return (
      <Image
        src={url}
        alt="Evidence image"
        width={600}
        height={400}
        className="rounded-lg shadow-md w-full object-contain"
        unoptimized
      />
    );
  }

  if (url.match(/\.(mp4|webm|ogg)$/i)) {
    return (
      <video
        controls
        className="rounded-lg shadow-md w-full max-h-[400px] bg-black"
        src={url}
      />
    );
  }

  if (url.match(/\.(pdf)$/i)) {
    return (
      <iframe
        src={url}
        className="w-full h-[500px] border rounded-lg shadow"
        title="PDF Evidence"
      />
    );
  }

  if (url.startsWith("http")) {
    return (
      <Button
        size="sm"
        variant="secondary"
        onClick={() => window.open(url, "_blank")}
      >
        Open File
      </Button>
    );
  }

  return (
    <pre className="bg-white border p-3 rounded-md text-sm text-gray-700 overflow-x-auto">
      {typeof value === "object"
        ? JSON.stringify(value, null, 2)
        : String(value)}
    </pre>
  );
}

/* 🧱 Section Wrapper */
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

/* 💤 Empty State */
function Empty({ text }: any) {
  return (
    <p className="text-muted-foreground text-sm italic text-center py-3">
      {text}
    </p>
  );
}
