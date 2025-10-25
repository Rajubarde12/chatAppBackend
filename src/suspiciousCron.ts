// suspiciousCron.ts
import cron from "node-cron";
import { Op } from "sequelize";
import sequelize from "./config/db";
import User from "./models/User";
import SuspiciousActivity from "./models/SuspiciousActivity";
import Message from "./models/Message";
import Complaint from "./models/Complaint";

cron.schedule("*/1 * * * *", async () => {
  console.log("Running suspicious activity checks...");

  // Messaging spam
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const users = await Message.findAll({
    attributes: ["senderId"],
    where: { createdAt: { [Op.gte]: oneMinuteAgo } },
    group: ["senderId"],
    having: sequelize.literal("COUNT(*) > 50"),
  });

  for (const u of users) {
    await SuspiciousActivity.create({
      userId: u.senderId,
      type: "spam",
      details: JSON.stringify({ messageCount: 50, period: "1 min" }),
      status: "pending",
    });
  }

  // Multiple complaints
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const flaggedUsers = await Complaint.findAll({
    attributes: ["reportedUserId"],
    where: { createdAt: { [Op.gte]: yesterday } },
    group: ["reportedUserId"],
    having: sequelize.literal("COUNT(*) > 5"),
  });

  for (const u of flaggedUsers) {
    const existing = await SuspiciousActivity.findOne({
      where: {
        userId: u.reportedUserId,
        type: "massReports",
        status: "pending",
      },
    });
    if (!existing) {
      await SuspiciousActivity.create({
        userId: u.reportedUserId,
        type: "massReports",
        details: JSON.stringify({ reportCount: 5, period: "24h" }),
        status: "pending",
      });
    }
  }

  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  // Find login anomaly flags older than 10 minutes
  const expiredFlags = await SuspiciousActivity.findAll({
    where: {
      type: "loginAnomaly",
      createdAt: { [Op.lte]: tenMinutesAgo },
      status: "actionTaken",
    },
  });

  for (const flag of expiredFlags) {
    const userId = flag.userId;

    // Unblock user
    await User.update({ isDisabled: false }, { where: { id: userId } });

    // Mark suspicious activity as resolved
    await flag.update({ status: "resolved" });

    console.log(`✅ User ${userId} auto-unblocked after 10 minutes`);
  }
});
