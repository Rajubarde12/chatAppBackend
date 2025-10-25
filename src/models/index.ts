// models/index.ts
import User from "./User";
import BlockedUser from "./BlockedUsers";
import Complaint from "./Complaint";
import BlockedUserComplaint from "./BlockedUserComplaint";
import SuspiciousActivity from "./SuspiciousActivity";
import Warning from "./Warning";
import FailedLoginAttempt from "./FailedLoginAttempt";

BlockedUser.belongsTo(User, { foreignKey: "userId", as: "user" });
BlockedUser.belongsTo(User, { foreignKey: "blockedBy", as: "blockedByAdmin" });
BlockedUser.belongsTo(User, {
  foreignKey: "unblockedBy",
  as: "unblockedByAdmin",
});

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

SuspiciousActivity.belongsTo(User, { foreignKey: "userId", as: "user" });
SuspiciousActivity.belongsTo(User, {
  foreignKey: "handledBy",
  as: "handledByAdmin",
});
User.hasMany(SuspiciousActivity, { foreignKey: "userId", as: "activities" });

Warning.belongsTo(User, { foreignKey: "userId", as: "user" });
Warning.belongsTo(Complaint, { foreignKey: "complaintId", as: "complaint" });
Warning.belongsTo(User, { foreignKey: "adminId", as: "adminUser" });
User.hasMany(FailedLoginAttempt, {
  foreignKey: "userId",
  as: "failedAttempts",
});
FailedLoginAttempt.belongsTo(User, { foreignKey: "userId", as: "user" });

export {
  User,
  BlockedUser,
  Complaint,
  BlockedUserComplaint,
  SuspiciousActivity,
  FailedLoginAttempt,
};
