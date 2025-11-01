import { BelongsToManyAddAssociationsMixin, DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

interface ChatAttributes {
  id: number;
  lastMessageId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ChatCreationAttributes extends Optional<ChatAttributes, "id"> {}

class Chat extends Model<ChatAttributes, ChatCreationAttributes> implements ChatAttributes {
  public id!: number;
  public lastMessageId?: number;
  public createdAt!: Date;
  public updatedAt!: Date;

  public addParticipants!: BelongsToManyAddAssociationsMixin<any, string>;
}

Chat.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    lastMessageId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "messages", key: "id" },
    },
  },
  { tableName: "chats", sequelize, timestamps: true }
);

export default Chat;
