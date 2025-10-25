import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";
import Complaint from "./Complaint";


export interface BlockedUserAttributes {
  id: number;
  userId: string;
  blockedBy: string;
  reason?: string | null;
  reasonCategory: "spam" | "harassment" | "scam" | "fakeProfile" | "policyViolation" | "other";
  isBlocked: boolean;
  blockedAt?: Date;
  unblockedAt?: Date | null;
  unblockedBy?: string | null;
  unblockedReason?: string | null;
  actionTaken: "warned" | "temporaryBan" | "permanentBan" | "none";
  createdAt?: Date;
  updatedAt?: Date;
}

export type BlockedUserCreationAttributes = Optional<
  BlockedUserAttributes,
  | "id"
  | "reason"
  | "blockedAt"
  | "unblockedAt"
  | "unblockedBy"
  | "unblockedReason"
  | "createdAt"
  | "updatedAt"
>;

class BlockedUser extends Model<BlockedUserAttributes, BlockedUserCreationAttributes>
  implements BlockedUserAttributes {
  public id!: number;
  public userId!: string;
  public blockedBy!: string;
  public reason?: string | null;
  public reasonCategory!: "spam" | "harassment" | "scam" | "fakeProfile" | "policyViolation" | "other";
  public isBlocked!: boolean;
  public blockedAt?: Date;
  public unblockedAt?: Date | null;
  public unblockedBy?: string | null;
  public unblockedReason?: string | null;
  public actionTaken!: "warned" | "temporaryBan" | "permanentBan" | "none";

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly complaints?: Complaint[];
}

BlockedUser.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    blockedBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reasonCategory: {
      type: DataTypes.ENUM("spam", "harassment", "scam", "fakeProfile", "policyViolation", "other"),
      defaultValue: "other",
    },
    isBlocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    blockedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    unblockedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    unblockedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    unblockedReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    actionTaken: {
      type: DataTypes.ENUM("warned", "temporaryBan", "permanentBan", "none"),
      defaultValue: "none",
    },
  },
  {
    sequelize,
    modelName: "BlockedUser",
    tableName: "blocked_users",
    timestamps: true,
  }
);

export default BlockedUser;
