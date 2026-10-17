import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { AuditLogModel } from "@/models/AuditLog";

export async function GET() {
  try {
    const conn = await connectToDatabase();

    if (!conn) {
      return NextResponse.json({
        connected: false,
        logs: [
          {
            _id: "log_1",
            action: "LOGIN_SUCCESS",
            userEmail: "analyst@findwise.com",
            userName: "Senior Equity Analyst",
            role: "Lead Portfolio Analyst",
            details: "Session established successfully.",
            timestamp: new Date(),
          },
          {
            _id: "log_2",
            action: "REGISTER",
            userEmail: "analyst@findwise.com",
            userName: "Senior Equity Analyst",
            role: "Lead Portfolio Analyst",
            details: "User registered with role Lead Portfolio Analyst. Clearance auto-verified.",
            timestamp: new Date(Date.now() - 3600000),
          },
        ],
      });
    }

    const logs = await AuditLogModel.find().sort({ timestamp: -1 }).limit(150);

    return NextResponse.json({
      connected: true,
      logs,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch logs.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
