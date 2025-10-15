// // models/User.ts
// import mongoose, { Document, Schema } from "mongoose";
// import bcrypt from "bcryptjs";

// // 1. Define the User interface
// export interface IUser extends Document {
//     _id: mongoose.Types.ObjectId;
//   name: string;
//   email: string;
//   password: string;
//   role: "user" | "admin";
//   avatar?: string;
//   isActive: boolean;
//   lastLogin?: Date;
//   createdAt: Date;
//   updatedAt: Date;

//   matchPassword(enteredPassword: string): Promise<boolean>;
// }

// // 2. Create the schema
// const userSchema = new Schema<IUser>(
//   {
//     name: {
//       type: String,
//       required: [true, "Name is required"],
//       trim: true,
//       minlength: 2,
//       maxlength: 50,
//     },
//     email: {
//       type: String,
//       required: [true, "Email is required"],
//       unique: true,
//       lowercase: true,
//       trim: true,
//       match: [
//         /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
//         "Please enter a valid email",
//       ],
//     },
//     password: {
//       type: String,
//       required: [true, "Password is required"],
//       minlength: 6,
//       select: false,
//     },
//     role: {
//       type: String,
//       enum: ["user", "admin"],
//       default: "user",
//     },
//     avatar: {
//       type: String,
//       default: "",
//     },
//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//     lastLogin: {
//       type: Date,
//     },
//   },
//   { timestamps: true }
// );

// // 3. Pre-save hook to hash password
// userSchema.pre<IUser>("save", async function (next) {
//   if (!this.isModified("password")) return next();

//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// // 4. Method to compare passwords
// userSchema.methods.matchPassword = async function (
//   enteredPassword: string
// ): Promise<boolean> {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// // 5. Export the model
// const User = mongoose.model<IUser>("User", userSchema);
// export default User;

import { DataTypes, Model, Optional } from "sequelize";
import bcrypt from "bcryptjs";
import sequelize from "../config/db";

// 1. Define User attributes
interface UserAttributes {
  id:string;
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// 2. Attributes needed for creation
interface UserCreationAttributes extends Optional<UserAttributes, "id" | "createdAt" | "updatedAt" | "lastLogin" | "avatar" | "role" | "isActive"> {}

// 3. Model class
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public name!: string;
  public email!: string;
  public password!: string;
  public role!: "user" | "admin";
  public avatar?: string;
  public isActive!: boolean;
  public lastLogin?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // 4. Method to compare passwords
  public async matchPassword(enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password);
  }
}

// 5. Initialize model
User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING(50), allowNull: false },
    email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.ENUM("user", "admin"), defaultValue: "user" },
    avatar: { type: DataTypes.STRING(255), defaultValue: "" },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    lastLogin: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: "users",
    hooks: {
      // 6. Pre-save hook to hash password
      beforeCreate: async (user: User) => {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      },
      beforeUpdate: async (user: User) => {
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

export default User;

