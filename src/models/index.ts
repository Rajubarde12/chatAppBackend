// models/index.ts
import User from "./User";
import BlockedUser from "./BlockedUsers";
import Complaint from "./Complaint";
import BlockedUserComplaint from "./BlockedUserComplaint";

// ===================
// Define Associations
// ===================

// BlockedUser ↔ User
BlockedUser.belongsTo(User, { foreignKey: "userId", as: "user" });
BlockedUser.belongsTo(User, { foreignKey: "blockedBy", as: "blockedByAdmin" });
BlockedUser.belongsTo(User, { foreignKey: "unblockedBy", as: "unblockedByAdmin" });

// Complaint ↔ User
Complaint.belongsTo(User, { foreignKey: "reporterId", as: "reporter" });
Complaint.belongsTo(User, { foreignKey: "reportedUserId", as: "reportedUser" });
Complaint.belongsTo(User, { foreignKey: "handledBy", as: "adminUser" });

// BlockedUser ↔ Complaint (Many-to-Many)
BlockedUser.belongsToMany(Complaint, {
  through: BlockedUserComplaint,
  as: "complaints",
  foreignKey: "blockedUserId", // UUID now
});

Complaint.belongsToMany(BlockedUser, {
  through: BlockedUserComplaint,
  as: "blockRecords",
  foreignKey: "complaintId", // UUID now
});

export { User, BlockedUser, Complaint, BlockedUserComplaint };
