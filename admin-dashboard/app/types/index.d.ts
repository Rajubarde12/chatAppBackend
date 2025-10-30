export interface ApiResponse {
  status: boolean;
  message: string;
  data: UserDetails;
}

export interface UserDetails {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  isActive: boolean;
  lastLogin: string | null;
  bio: string;
  isDisabled: boolean;
  createdAt: string;
  updatedAt: string;
  complaintsAgainst: Complaint[];
  activities: Activity[];
  blockRecords: BlockRecord[];
  warnings: Warning[];
  failedAttempts: any[];
}

export interface Complaint {
  id: number;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  category: string;
  evidence: Record<string, any>;
  status: "pending" | "reviewed" | "actionTaken";
  actionTaken: string | null;
  handledBy: string | null;
  createdAt: string;
  updatedAt: string;
  reporter: Reporter;
  handledByAdmin: Admin | null;
}

export interface Reporter {
  id: string;
  name: string;
  email: string;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
}

export interface Activity {
  id: number;
  userId: string;
  type: string;
  details: string; // JSON string (example: {"reportCount":5,"period":"24h"})
  status: string;
  handledBy: string;
  createdAt: string;
  updatedAt: string;
  handledByAdmin: Admin;
}

export interface BlockRecord {
  id: number;
  userId: string;
  blockedBy: string;
  reason: string;
  reasonCategory: string;
  isBlocked: boolean;
  blockedAt: string;
  unblockedAt: string | null;
  unblockedBy: string | null;
  unblockedReason: string | null;
  actionTaken: string;
  createdAt: string;
  updatedAt: string;
  blockedByAdmin: Admin;
  unblockedByAdmin: Admin | null;
  complaints: Complaint[];
}

export interface Warning {
  id: number;
  userId: string;
  complaintId: number | null;
  adminId: string;
  message: string;
  type: "warning" | string;
  readStatus: boolean;
  createdAt: string;
  updatedAt: string;
  adminUser: Admin;
  complaint: Complaint | null;
}
