// models/SuspiciousActivity.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

export interface SuspiciousActivityAttributes {
  id: number;
  userId: string;
  type: "spam" | "harassment" | "loginAnomaly" | "massReports" | "other";
  details?: string; // JSON string with context
  status: "pending" | "reviewed" | "actionTaken"|"resolved";
  handledBy?: string | null; // admin who handled
  createdAt?: Date;
  updatedAt?: Date;
}

export type SuspiciousActivityCreationAttributes = Optional<
  SuspiciousActivityAttributes,
  "id" | "details" | "handledBy" | "createdAt" | "updatedAt"
>;

class SuspiciousActivity
  extends Model<
    SuspiciousActivityAttributes,
    SuspiciousActivityCreationAttributes
  >
  implements SuspiciousActivityAttributes
{
  public id!: number;
  public userId!: string;
  public adminId!: string;
  public type!:
    | "spam"
    | "harassment"
    | "loginAnomaly"
    | "massReports"
    | "other";
  public details?: string;
  public status!: "pending" | "reviewed" | "actionTaken"|"resolved";
  public handledBy?: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SuspiciousActivity.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    type: {
      type: DataTypes.ENUM(
        "spam",
        "harassment",
        "loginAnomaly",
        "massReports",
        "other"
      ),
      allowNull: false,
    },
    details: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM("pending", "reviewed", "actionTaken","resolved"),
      defaultValue: "pending",
    },
    handledBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    sequelize,
    tableName: "suspicious_activities",
    modelName: "SuspiciousActivity",
    timestamps: true,
  }
);

export default SuspiciousActivity;
