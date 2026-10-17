import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/models/User";
import { AuditLogModel } from "@/models/AuditLog";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPassword = (password || "").trim();

    if (!cleanEmail || !cleanPassword) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const conn = await connectToDatabase();

    if (conn) {
      const user = await UserModel.findOne({ email: cleanEmail });

      if (!user) {
        await AuditLogModel.create({
          action: "LOGIN_FAILED",
          userEmail: cleanEmail,
          details: "Attempted login with non-existent email account.",
          timestamp: new Date(),
        });

        return NextResponse.json(
          { error: "No account found with this email. Please register." },
          { status: 404 }
        );
      }

      if (user.passwordHash !== cleanPassword) {
        await AuditLogModel.create({
          action: "LOGIN_FAILED",
          userEmail: cleanEmail,
          userName: user.name,
          role: user.role,
          details: "Failed password validation attempt.",
          timestamp: new Date(),
        });

        return NextResponse.json(
          { error: "Incorrect password. Please verify your credentials." },
          { status: 401 }
        );
      }

      if (user.status === "suspended") {
        await AuditLogModel.create({
          action: "LOGIN_FAILED",
          userEmail: cleanEmail,
          userName: user.name,
          role: user.role,
          details: "Blocked login attempt on suspended account.",
          timestamp: new Date(),
        });

        return NextResponse.json(
          { error: "This analyst clearance has been suspended by administrator." },
          { status: 403 }
        );
      }

      if (user.isVerified === false) {
        await AuditLogModel.create({
          action: "LOGIN_FAILED",
          userEmail: cleanEmail,
          userName: user.name,
          role: user.role,
          details: "Login attempt while clearance is pending verification.",
          timestamp: new Date(),
        });

        return NextResponse.json(
          { error: "Your account is pending verification by desk administrator." },
          { status: 403 }
        );
      }

      // Update last login timestamp
      user.lastLoginAt = new Date();
      await user.save();

      // Log success in Audit Trail
      await AuditLogModel.create({
        action: "LOGIN_SUCCESS",
        userEmail: cleanEmail,
        userName: user.name,
        role: user.role,
        details: "Successful clearance verification and session start.",
        timestamp: new Date(),
      });

      return NextResponse.json({
        success: true,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          status: user.status,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
        },
      });
    } else {
      // Fallback for pre-seeded demo account when DB is not running
      if (cleanEmail === "analyst@findwise.com" && cleanPassword === "findwise123") {
        return NextResponse.json({
          success: true,
          user: {
            id: "usr_demo_1",
            name: "Senior Equity Analyst",
            email: "analyst@findwise.com",
            role: "Lead Portfolio Analyst",
            isVerified: true,
            status: "active",
            createdAt: new Date(),
            lastLoginAt: new Date(),
          },
        });
      }

      return NextResponse.json(
        { error: "Invalid credentials or account not found." },
        { status: 401 }
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to authenticate.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
