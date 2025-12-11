import { DataTypes, Model, Optional, Op } from "sequelize";
import sequelize from "../config/db";
import { parsePhoneNumberFromString } from "libphonenumber-js";

interface UserAttributes {
  id: string;
  name: string;
  email?: string;
  mobileNumber: string;
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

  // OTP fields
  otp?: string;
  otpExpires?: Date;
  isVerified: boolean;
  lastOtpSent?: Date;
  otpRetryCount: number;
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
    | "otp"
    | "otpExpires"
    | "isVerified"
    | "lastOtpSent"
    | "otpRetryCount"
  > {}

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: string;
  public name!: string;
  public email?: string;
  public mobileNumber!: string;
  public role!: "user" | "admin" | "SuperAdmin";
  public avatar?: string;
  public isActive!: boolean;
  public lastLogin?: Date;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
  public bio?: string;
  public isDisabled?: boolean;
  public countryCode?: string;
  public countryISO?: string;
  public countryName?: string;

  // OTP fields
  public otp?: string;
  public otpExpires?: Date;
  public isVerified!: boolean;
  public lastOtpSent?: Date;
  public otpRetryCount!: number;

  // --------------------------
  // ✅ Instance Methods
  // --------------------------

  public async validateOtp(enteredOtp: string): Promise<boolean> {
    if (!this.otp || !this.otpExpires) return false;

    const now = new Date();
    if (now > this.otpExpires) return false;

    return this.otp === enteredOtp;
  }

  public canResendOtp(): boolean {
    if (!this.lastOtpSent) return true;

    const now = new Date();
    const lastSent = new Date(this.lastOtpSent);
    const cooldownSeconds = 60; // 1-minute cooldown

    return (now.getTime() - lastSent.getTime()) / 1000 >= cooldownSeconds;
  }

  public isOtpBlocked(): boolean {
    return this.otpRetryCount >= 5; // Block after 5 failed attempts
  }

  public resetOtpRetryCount(): void {
    this.otpRetryCount = 0;
  }

  public incrementOtpRetryCount(): void {
    this.otpRetryCount += 1;
  }

  // --------------------------
  // ✅ Static Methods
  // --------------------------

  public static generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  public static getOtpExpiration(): Date {
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 10); // 10 minutes
    return expires;
  }
}

// --------------------------
// ✅ Model Initialization
// --------------------------

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: {
        name: "uniq_email",
        msg: "Email already exists",
      },
      validate: {
        isEmail: {
          msg: "Please provide a valid email address",
        },
      },
    },
    countryISO: {
      type: DataTypes.STRING(5),
      allowNull: true,
      defaultValue: "IN",
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
      unique: {
        name: "uniq_mobileNumber",
        msg: "Mobile Number already exists",
      },
      validate: {
        isValidPhone(value: string) {
          const countryCode = (this as any).countryCode || "+91";
          const phoneNumber = parsePhoneNumberFromString(
            value.startsWith("+") ? value : `${countryCode}${value}`
          );

          if (!phoneNumber || !phoneNumber.isValid()) {
            throw new Error(
              `Invalid mobile number for country code ${countryCode}`
            );
          }
        },
      },
    },
    role: {
      type: DataTypes.ENUM("user", "admin", "SuperAdmin"),
      defaultValue: "user",
    },
    avatar: {
      type: DataTypes.STRING(255),
      defaultValue: "",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    bio: {
      type: DataTypes.STRING(255),
      defaultValue: "",
    },
    isDisabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    // --------------------------
    // OTP Fields
    // --------------------------
    otp: {
      type: DataTypes.STRING(6),
      allowNull: true,
      comment: "6-digit OTP",
    },
    otpExpires: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "OTP expiration time",
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Whether user has verified their mobile/email",
    },
    lastOtpSent: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Last time OTP was sent",
    },
    otpRetryCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 5,
      },
      comment: "Number of failed OTP attempts",
    },
  },
  {
    sequelize,
    tableName: "users",
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.otpRetryCount == null) user.otpRetryCount = 0;
        if (user.isVerified == null) user.isVerified = false;
      },
      beforeUpdate: async (user: User) => {
        // You can handle OTP expiration logic here if needed
      },
    },
    indexes: [
      {
        fields: ["otp", "otpExpires"],
        where: {
          otp: { [Op.ne]: null },
        },
      },
      {
        fields: ["lastOtpSent"],
      },
    ],
  }
);

export default User;
