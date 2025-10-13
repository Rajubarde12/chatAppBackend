// models/Message.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";
import User from "./User"; // assuming User model exists

// 1. Define attributes
interface MessageAttributes {
  id: number;
  senderId: number;
  receiverId: number;
  message: string;
  messageType: "text" | "image" | "video" | "file";
  attachments?: string[];
  isRead: boolean;
  isDelivered: boolean;
  forwardedFromMessageId?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// 2. Attributes needed for creation
interface MessageCreationAttributes
  extends Optional<
    MessageAttributes,
    | "id"
    | "attachments"
    | "isRead"
    | "isDelivered"
    | "forwardedFromMessageId"
    | "createdAt"
    | "updatedAt"
  > {}

// 3. Model class
class Message
  extends Model<MessageAttributes, MessageCreationAttributes>
  implements MessageAttributes
{
  public id!: number;
  public senderId!: number;
  public receiverId!: number;
  public message!: string;
  public messageType!: "text" | "image" | "video" | "file";
  public attachments?: string[];
  public isRead!: boolean;
  public isDelivered!: boolean;
  forwardedFromMessageId?: number | null | undefined;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// 4. Initialize model
Message.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    senderId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: User, key: "id" }, // foreign key to User
      onDelete: "CASCADE",
    },
    receiverId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: User, key: "id" }, // foreign key to User
      onDelete: "CASCADE",
    },
    message: { type: DataTypes.TEXT, allowNull: false },
    messageType: {
      type: DataTypes.ENUM("text", "image", "video", "file"),
      defaultValue: "text",
    },
    attachments: {
      type: DataTypes.JSON, // store array of strings as JSON
      allowNull: true,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isDelivered: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    forwardedFromMessageId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "messages", key: "id" },
      onDelete: "SET NULL",
    },
  },
  {
    sequelize,
    tableName: "messages",
    timestamps: true, // createdAt & updatedAt
  }
);

// 5. Associations (optional, if you want to use include)
Message.belongsTo(User, { as: "sender", foreignKey: "senderId" });
Message.belongsTo(User, { as: "receiver", foreignKey: "receiverId" });
Message.hasMany(Message, {
  as: "forwards",
  foreignKey: "forwardedFromMessageId",
});

export default Message;
