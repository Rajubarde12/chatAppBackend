import { BelongsToManyAddAssociationsMixin, DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";
import User from "./User";
import Message from "./Message";

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

  public participants?: User[];
  public lastMessage?: Message;
  public addParticipants!: BelongsToManyAddAssociationsMixin<User, number>;
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

// Associations
Chat.belongsToMany(User, { through: "ChatParticipants", as: "participants" });
User.belongsToMany(Chat, { through: "ChatParticipants", as: "chats" });

Chat.belongsTo(Message, { as: "lastMessage", foreignKey: "lastMessageId" });
Message.hasOne(Chat, { as: "chat", foreignKey: "lastMessageId" });

export default Chat;
