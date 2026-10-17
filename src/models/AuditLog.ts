import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuditLog extends Document {
  action: "REGISTER" | "LOGIN_SUCCESS" | "LOGIN_FAILED" | "VERIFICATION_TOGGLE" | "STATUS_CHANGE" | "USER_DELETED";
  userEmail: string;
  userName?: string;
  role?: string;
  details: string;
  ipAddress?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      required: true,
      enum: ["REGISTER", "LOGIN_SUCCESS", "LOGIN_FAILED", "VERIFICATION_TOGGLE", "STATUS_CHANGE", "USER_DELETED"],
    },
    userEmail: { type: String, required: true, lowercase: true, trim: true },
    userName: { type: String },
    role: { type: String },
    details: { type: String, required: true },
    ipAddress: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const AuditLogModel: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
