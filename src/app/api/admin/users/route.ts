import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, isDatabaseConnected } from "@/lib/mongodb";
import { UserModel } from "@/models/User";
import { AuditLogModel } from "@/models/AuditLog";

export async function GET() {
  try {
    const conn = await connectToDatabase();
    const dbActive = isDatabaseConnected();

    if (!conn) {
      return NextResponse.json({
        connected: false,
        users: [
          {
            _id: "usr_admin",
            name: "Head of Research Desk",
            email: "admin@findwise.com",
            role: "Admin",
            isVerified: true,
            status: "active",
            createdAt: new Date(),
            lastLoginAt: new Date(),
          },
          {
            _id: "usr_demo",
            name: "Senior Equity Analyst",
            email: "analyst@findwise.com",
            role: "Lead Portfolio Analyst",
            isVerified: true,
            status: "active",
            createdAt: new Date(Date.now() - 86400000),
            lastLoginAt: new Date(),
          },
        ],
        stats: {
          totalUsers: 2,
          verifiedUsers: 2,
          pendingUsers: 0,
          activeUsers: 2,
          suspendedUsers: 0,
        },
      });
    }

    // Ensure default admin user exists if table is empty
    const count = await UserModel.countDocuments();
    if (count === 0) {
      await UserModel.create({
        name: "Head of Research Desk",
        email: "admin@findwise.com",
        passwordHash: "admin123",
        role: "Admin",
        isVerified: true,
        status: "active",
      });
      await UserModel.create({
        name: "Senior Equity Analyst",
        email: "analyst@findwise.com",
        passwordHash: "findwise123",
        role: "Lead Portfolio Analyst",
        isVerified: true,
        status: "active",
      });
    }

    const users = await UserModel.find().sort({ createdAt: -1 }).select("-passwordHash");

    const totalUsers = users.length;
    const verifiedUsers = users.filter((u) => u.isVerified).length;
    const pendingUsers = users.filter((u) => !u.isVerified).length;
    const activeUsers = users.filter((u) => u.status === "active").length;
    const suspendedUsers = users.filter((u) => u.status === "suspended").length;

    return NextResponse.json({
      connected: dbActive,
      users,
      stats: {
        totalUsers,
        verifiedUsers,
        pendingUsers,
        activeUsers,
        suspendedUsers,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch users.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId, isVerified, status, role } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { error: "Database not connected. Please ensure MongoDB is running." },
        { status: 503 }
      );
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const updates: string[] = [];

    if (isVerified !== undefined && user.isVerified !== isVerified) {
      user.isVerified = isVerified;
      updates.push(`Verification changed to ${isVerified ? "VERIFIED" : "PENDING"}`);
    }

    if (status && user.status !== status) {
      user.status = status;
      updates.push(`Status updated to ${status.toUpperCase()}`);
    }

    if (role && user.role !== role) {
      user.role = role;
      updates.push(`Role changed to ${role}`);
    }

    await user.save();

    // Log admin update in Audit Trail
    if (updates.length > 0) {
      await AuditLogModel.create({
        action: "VERIFICATION_TOGGLE",
        userEmail: user.email,
        userName: user.name,
        role: user.role,
        details: updates.join("; "),
        timestamp: new Date(),
      });
    }

    return NextResponse.json({ success: true, user });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update user.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({ error: "Database not connected." }, { status: 503 });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    await UserModel.findByIdAndDelete(userId);

    await AuditLogModel.create({
      action: "USER_DELETED",
      userEmail: user.email,
      userName: user.name,
      role: user.role,
      details: `User clearance deleted by administrator.`,
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete user.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
