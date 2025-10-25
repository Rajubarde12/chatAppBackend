
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
  bio?:string;
  isDisabled?:boolean;
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
  public bio?:string;
  public isDisabled?:boolean;

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
    bio: {type:DataTypes.STRING(255),defaultValue:"" },
    isDisabled: {type:DataTypes.BOOLEAN,defaultValue:false}

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

