import { BlockedUser, Complaint, User } from "../models";

export const getAllCompaintsbyuserId = async (reportedUserId: string) => {
  try {
    const complaints = await Complaint.findAll({
      include: [
        { model: User, as: "reporter", attributes: ["id", "name", "email"] },
        {
          model: User,
          as: "reportedUser",
          attributes: ["id", "name", "email"],
        },
        { model: User, as: "adminUser", attributes: ["id", "name"] },
        {
          model: BlockedUser,
          as: "blockRecords",
          include: [
            { model: User, as: "blockedByAdmin", attributes: ["id", "name"] },
            { model: User, as: "unblockedByAdmin", attributes: ["id", "name"] },
          ],
        },
      ],
      where: {
        reportedUserId: reportedUserId,
        status: "pending",
      },
      order: [["createdAt", "DESC"]],
    });
    return complaints
  } catch (err) {
    return [];
  }
};
