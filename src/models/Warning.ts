// models/Warning.ts
import { Model, DataTypes } from "sequelize";
import sequelize from "../config/db";

interface WarningAttributes {
  id: number;
  userId: string;          // user who receives the warning
  complaintId: number;     // optional link to complaint
  adminId: string;         // admin issuing the warning
  message: string;         // warning message
  type: "warning" | "info"; // warning type
  readStatus: boolean;     // has user seen it
  createdAt?: Date;
  updatedAt?: Date;
}

interface WarningCreationAttributes extends Omit<WarningAttributes, "id" | "createdAt" | "updatedAt"> {}

class Warning extends Model<WarningAttributes, WarningCreationAttributes> implements WarningAttributes {
  public id!: number;
  public userId!: string;
  public complaintId!: number;
  public adminId!: string;
  public message!: string;
  public type!: "warning" | "info";
  public readStatus!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Warning.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    complaintId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    adminId: { type: DataTypes.UUID, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    type: { type: DataTypes.ENUM("warning", "info"), defaultValue: "warning" },
    readStatus: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { sequelize, tableName: "warnings", timestamps: true }
);

export default Warning;
