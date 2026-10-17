import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  isVerified: boolean;
  status: "active" | "suspended" | "pending";
  createdAt: Date;
  lastLoginAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: "Equity Research Analyst" },
    isVerified: { type: Boolean, default: true },
    status: { type: String, enum: ["active", "suspended", "pending"], default: "active" },
    createdAt: { type: Date, default: Date.now },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
