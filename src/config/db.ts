// import mongoose from "mongoose";

// const connectDB = async () => {
//   try {
//     console.log("Mongo URI:", process.env.MONGO_URI); // ✅ debug
//     const conn = await mongoose.connect(process.env.MONGO_URI || "");
//     console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
//   } catch (error) {
//     console.error("MongoDB connection error:", error);
//     process.exit(1);
//   }
// };

// export default connectDB;

// import mysql from 'mysql2/promise';
// import dotenv from 'dotenv';

// dotenv.config();

// const pool = mysql.createPool({
//     host: process.env.DB_HOST || "",
//     user: process.env.DB_USER || "",
//     password: process.env.DB_PASSWORD || "",
//     database: process.env.DB_NAME || "",
//     port: parseInt(process.env.DB_PORT1 || "3306"), // convert string to number
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0
// });

// export default pool;

import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();


const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || "testdb",      // database name
  process.env.MYSQL_USER || "root",        // username
  process.env.MYSQL_PASSWORD || "123456",  // password
  {
    host: process.env.MYSQL_HOST || "localhost",
    port: parseInt(process.env.MYSQL_PORT || "3306"), // must be number
    dialect: "mysql",
    logging: false, // set to true to see SQL queries
  }
);



export default sequelize;
