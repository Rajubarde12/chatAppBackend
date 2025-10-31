"use client";
import { useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { UserDetails } from "@/app/types";
import { toast } from "sonner";

export default function UserCard({
  user,
  onUnblock,
}: {
  user: UserDetails;
  onUnblock: (userId: string, reason: string) => {};
}) {
  const [showDialog, setShowDialog] = useState(false);
  const [reason, setReason] = useState("");

  const handleUnblockConfirm = () => {
    if (!reason.trim()) return toast.error("Please enter a reason for unblocking.");
    onUnblock(user.id, reason);
    setShowDialog(false);
    setReason("");
  };

  return (
    <>
      <Card className="p-6 md:p-8 bg-gradient-to-r from-blue-50 via-white to-blue-50 border shadow-md backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left: Avatar + Info */}
          <div className="flex items-center gap-6">
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

          {/* Right: Button — only show if user is blocked */}
          {user.isDisabled && (
            <Button
              onClick={() => setShowDialog(true)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Unblock User
            </Button>
          )}
        </div>
      </Card>

      {/* 🔓 Unblock Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unblock {user.name}?</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Please provide a reason for unblocking this user:
            </p>
            <Input
              placeholder="Enter reason..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUnblockConfirm}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Confirm Unblock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
