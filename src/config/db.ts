import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// Debug: check env values
console.log(
  "Database info:",
  process.env.MYSQL_DATABASE,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASSWORD
);

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || "testdb", // database name
  process.env.MYSQL_USER || "root",       // username
  process.env.MYSQL_PASSWORD || "123456", // password
  {
    host: process.env.MYSQL_HOST || "localhost",
    port: Number(process.env.MYSQL_PORT) || 3306,
    dialect: "mysql",
    logging: false, // set true to debug queries
  }
);

// Optional: test connection immediately
(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully!");
  } catch (error) {
    console.error("❌ Unable to connect to database:", error);
  }
})();

export default sequelize;
