import User from "./User";
import BlockedUser from "./BlockedUsers";
import Complaint from "./Complaint";
import BlockedUserComplaint from "./BlockedUserComplaint";


BlockedUser.belongsTo(User, { foreignKey: "userId", as: "user" });


BlockedUser.belongsTo(User, { foreignKey: "blockedBy", as: "blockedByAdmin" });


BlockedUser.belongsTo(User, { foreignKey: "unblockedBy", as: "unblockedByAdmin" });
Complaint.belongsTo(User, { foreignKey: "reporterId", as: "reporter" });
Complaint.belongsTo(User, { foreignKey: "reportedUserId", as: "reportedUser" });
Complaint.belongsTo(User, { foreignKey: "handledBy", as: "adminUser" });
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
