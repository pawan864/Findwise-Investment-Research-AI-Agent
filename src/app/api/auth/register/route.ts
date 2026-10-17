import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/models/User";
import { AuditLogModel } from "@/models/AuditLog";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role } = await req.json();

    const cleanName = (name || "").trim();
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPassword = (password || "").trim();
    const cleanRole = (role || "Equity Research Analyst").trim();

    if (!cleanName || !cleanEmail || !cleanPassword) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (cleanPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const conn = await connectToDatabase();

    if (conn) {
      const existing = await UserModel.findOne({ email: cleanEmail });
      if (existing) {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 409 }
        );
      }

      const user = await UserModel.create({
        name: cleanName,
        email: cleanEmail,
        passwordHash: cleanPassword,
        role: cleanRole,
        isVerified: true,
        status: "active",
        createdAt: new Date(),
      });

      // Log in Audit Trail
      await AuditLogModel.create({
        action: "REGISTER",
        userEmail: cleanEmail,
        userName: cleanName,
        role: cleanRole,
        details: `User registered with role ${cleanRole}. Clearance auto-verified.`,
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
        },
      });
    } else {
      // Database not connected
      return NextResponse.json({
        success: true,
        user: {
          id: `usr_${Date.now()}`,
          name: cleanName,
          email: cleanEmail,
          role: cleanRole,
          isVerified: true,
          status: "active",
          createdAt: new Date(),
        },
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to register user.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
