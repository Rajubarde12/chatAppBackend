import { Op } from "sequelize";
import { BlockedUser, Complaint, User } from "../models";

export const getAllCompaintsbyuserId = async (
  reportedUserId: string,
  onlyLast24Hours: boolean = false
) => {
  try {
    const whereCondition: any = {
      reportedUserId,
      status: "pending",
    };

    if (onlyLast24Hours) {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      whereCondition.createdAt = { [Op.gte]: last24Hours };
    }

    const complaints = await Complaint.findAll({
      where: whereCondition,
      include: [
        { model: User, as: "reporter", attributes: ["id", "name", "email"] },
        { model: User, as: "reportedUser", attributes: ["id", "name", "email"] },
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
      order: [["createdAt", "DESC"]],
    });

    return complaints;
  } catch (err) {
    console.error("getAllCompaintsbyuserId error:", err);
    return [];
  }
};
