import { DataTypes, Model, Optional } from "sequelize";
import bcrypt from "bcryptjs";
import sequelize from "../config/db";
import { parsePhoneNumberFromString } from "libphonenumber-js";

interface UserAttributes {
  id: string;
  name: string;
  email?: string;
  mobileNumber: string;
  password: string;
  role: "user" | "admin" | "SuperAdmin";
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  bio?: string;
  isDisabled?: boolean;
  countryCode?: string;
  countryISO?: string;
  countryName?: string;
}

interface UserCreationAttributes
  extends Optional<
    UserAttributes,
    | "id"
    | "email"
    | "bio"
    | "isDisabled"
    | "avatar"
    | "createdAt"
    | "updatedAt"
    | "lastLogin"
    | "role"
    | "isActive"
    | "countryCode"
    | "countryName"
    | "countryISO"
  > {}

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: string;
  public name!: string;
  public email?: string;
  public mobileNumber!: string;
  public password!: string;
  public role!: "user" | "admin" | "SuperAdmin";
  public avatar?: string;
  public isActive!: boolean;
  public lastLogin?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public bio?: string;
  public isDisabled?: boolean;
  public countryCode?: string;
  public countryISO?: string;
  public countryName?: string;

  public async matchPassword(enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password);
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING(50), allowNull: false },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: { name: "uniq_email", msg: "Email Number akready have" },
    },
    countryISO: {
      type: DataTypes.STRING(5),
      allowNull: true,
      defaultValue: "IN", // fallback
    },
    countryName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: "India",
    },
    countryCode: {
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: "+91",
    },
    mobileNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: { name: "uniq_mobileNumber", msg: "Mobile Number akready have" },
      validate: {
        isValidPhone(value: string) {
          const countryCode = (this as any).countryCode || "+91";
          const phoneNumber = parsePhoneNumberFromString(
            `+${countryCode.replace("+", "")}${value}`
          );

          if (!phoneNumber || !phoneNumber.isValid()) {
            throw new Error(
              `Invalid mobile number for country code ${countryCode}`
            );
          }
        },
      },
    },
    password: { type: DataTypes.STRING(255), allowNull: false },
    role: {
      type: DataTypes.ENUM("user", "admin", "SuperAdmin"),
      defaultValue: "user",
    },
    avatar: { type: DataTypes.STRING(255), defaultValue: "" },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    lastLogin: { type: DataTypes.DATE, allowNull: true },
    bio: { type: DataTypes.STRING(255), defaultValue: "" },
    isDisabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    sequelize,
    tableName: "users",
    hooks: {
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
