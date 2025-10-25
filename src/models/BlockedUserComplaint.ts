import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

export interface BlockedUserComplaintAttributes {
  id: number;
  blockedUserId: number;  // UUID
  complaintId: number;    // UUID
  createdAt?: Date;
  updatedAt?: Date;
}

export type BlockedUserComplaintCreationAttributes = Optional<
  BlockedUserComplaintAttributes,
  "id" | "createdAt" | "updatedAt"
>;

class BlockedUserComplaint extends Model<
  BlockedUserComplaintAttributes,
  BlockedUserComplaintCreationAttributes
> implements BlockedUserComplaintAttributes {
  public id!: number;
  public blockedUserId!: number;
  public complaintId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

BlockedUserComplaint.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    blockedUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "blocked_users", key: "id" },
      onDelete: "CASCADE",
    },
    complaintId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "complaints", key: "id" },
      onDelete: "CASCADE",
    },
  },
  {
    sequelize,
    modelName: "BlockedUserComplaint",
    tableName: "blocked_user_complaints",
    timestamps: true,
  }
);

export default BlockedUserComplaint;
