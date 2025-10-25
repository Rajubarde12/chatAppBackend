// models/FailedLoginAttempt.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

interface FailedLoginAttemptAttributes {
  id: number;
  userId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt?: Date;
}

type FailedLoginAttemptCreation = Optional<
  FailedLoginAttemptAttributes,
  "id" | "ipAddress" | "userAgent" | "createdAt"
>;

class FailedLoginAttempt
  extends Model<FailedLoginAttemptAttributes, FailedLoginAttemptCreation>
  implements FailedLoginAttemptAttributes
{
  public id!: number;
  public userId!: string;
  public ipAddress?: string | null;
  public userAgent?: string | null;
  public readonly createdAt!: Date;
}

FailedLoginAttempt.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    ipAddress: { type: DataTypes.STRING, allowNull: true },
    userAgent: { type: DataTypes.STRING, allowNull: true },
  },
  { sequelize, modelName: "FailedLoginAttempt", tableName: "failed_login_attempts", timestamps: true }
);

export default FailedLoginAttempt;
