// models/index.ts
import User from "./User";
import BlockedUser from "./BlockedUsers";
import Complaint from "./Complaint";
import BlockedUserComplaint from "./BlockedUserComplaint";
import SuspiciousActivity from "./SuspiciousActivity";
import Warning from "./Warning";
import FailedLoginAttempt from "./FailedLoginAttempt";
import Chat from "./Chat";
import Message from "./Message";

// -------------------------
// 🧩 User ↔ BlockedUser
// -------------------------
BlockedUser.belongsTo(User, { foreignKey: "userId", as: "user" });
BlockedUser.belongsTo(User, { foreignKey: "blockedBy", as: "blockedByAdmin" });
BlockedUser.belongsTo(User, { foreignKey: "unblockedBy", as: "unblockedByAdmin" });
User.hasMany(BlockedUser, { foreignKey: "userId", as: "blockRecords" });

// -------------------------
// 🧩 User ↔ Complaint
// -------------------------
Complaint.belongsTo(User, { foreignKey: "reporterId", as: "reporter" });
Complaint.belongsTo(User, { foreignKey: "reportedUserId", as: "reportedUser" });
Complaint.belongsTo(User, { foreignKey: "handledBy", as: "handledByAdmin" });

User.hasMany(Complaint, { foreignKey: "reporterId", as: "reportedComplaints" });
User.hasMany(Complaint, { foreignKey: "reportedUserId", as: "complaintsAgainst" });

// -------------------------
// 🧩 BlockedUser ↔ Complaint (Many-to-Many)
// -------------------------
BlockedUser.belongsToMany(Complaint, {
  through: BlockedUserComplaint,
  as: "complaints",
  foreignKey: "blockedUserId",
});

Complaint.belongsToMany(BlockedUser, {
  through: BlockedUserComplaint,
  as: "blockRecords",
  foreignKey: "complaintId",
});

// -------------------------
// 🧩 SuspiciousActivity ↔ User
// -------------------------
SuspiciousActivity.belongsTo(User, { foreignKey: "userId", as: "user" });
SuspiciousActivity.belongsTo(User, { foreignKey: "handledBy", as: "handledByAdmin" });
User.hasMany(SuspiciousActivity, { foreignKey: "userId", as: "activities" });

// -------------------------
// 🧩 Warning ↔ User / Complaint
// -------------------------
Warning.belongsTo(User, { foreignKey: "userId", as: "user" });
Warning.belongsTo(Complaint, { foreignKey: "complaintId", as: "complaint" });
Warning.belongsTo(User, { foreignKey: "adminId", as: "adminUser" });
User.hasMany(Warning, { foreignKey: "userId", as: "warnings" });

// -------------------------
// 🧩 Failed Login Attempts ↔ User
// -------------------------
FailedLoginAttempt.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(FailedLoginAttempt, { foreignKey: "userId", as: "failedAttempts" });


// 1️⃣ Chat ↔ User (many-to-many)
Chat.belongsToMany(User, {
  through: "ChatParticipants",
  as: "participants",
  foreignKey: "chatId",
});
User.belongsToMany(Chat, {
  through: "ChatParticipants",
  as: "chats",
  foreignKey: "userId",
});

// 2️⃣ Chat ↔ Message (for last message)
Chat.belongsTo(Message, { as: "lastMessage", foreignKey: "lastMessageId" });
Message.hasOne(Chat, { as: "chatWithLastMessage", foreignKey: "lastMessageId" });

// 3️⃣ Chat ↔ Message (for message history)
Chat.hasMany(Message, { as: "messages", foreignKey: "chatId" });
Message.belongsTo(Chat, { as: "parentChat", foreignKey: "chatId" });


export {
  User,
  BlockedUser,
  Complaint,
  BlockedUserComplaint,
  SuspiciousActivity,
  Warning,
  FailedLoginAttempt,
  Message,
  Chat
};
