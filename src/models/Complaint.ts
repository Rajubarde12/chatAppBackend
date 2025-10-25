import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

// Attributes
export interface ComplaintAttributes {
  id: number;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  category: "spam" | "harassment" | "scam" | "fakeProfile" | "other";
  evidence?: Record<string, any> | null;
  status: "pending" | "reviewed" | "actionTaken" | "dismissed";
  actionTaken?: string | null;
  handledBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Creation attributes
export type ComplaintCreationAttributes = Optional<
  ComplaintAttributes,
  "id" | "evidence" | "actionTaken" | "handledBy" | "createdAt" | "updatedAt"
>;

// Model
class Complaint
  extends Model<ComplaintAttributes, ComplaintCreationAttributes>
  implements ComplaintAttributes
{
  public id!: number;
  public reporterId!: string;
  public reportedUserId!: string;
  public reason!: string;
  public category!: "spam" | "harassment" | "scam" | "fakeProfile" | "other";
  public evidence?: Record<string, any> | null;
  public status!: "pending" | "reviewed" | "actionTaken" | "dismissed";
  public actionTaken?: string | null;
  public handledBy?: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Complaint.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    reporterId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    reportedUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },

    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM(
        "spam",
        "harassment",
        "scam",
        "fakeProfile",
        "other"
      ),
      defaultValue: "other",
    },
    evidence: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "reviewed", "actionTaken", "dismissed"),
      defaultValue: "pending",
    },
    actionTaken: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    modelName: "Complaint",
    tableName: "complaints",
    timestamps: true,
  }
);

export default Complaint;
