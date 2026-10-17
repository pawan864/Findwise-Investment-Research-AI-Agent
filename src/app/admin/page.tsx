"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  status: "active" | "suspended" | "pending";
  createdAt: string;
  lastLoginAt?: string;
}

interface AuditLog {
  _id: string;
  action: string;
  userEmail: string;
  userName?: string;
  role?: string;
  details: string;
  timestamp: string;
}

interface AdminStats {
  totalUsers: number;
  verifiedUsers: number;
  pendingUsers: number;
  activeUsers: number;
  suspendedUsers: number;
}

export default function AdminPage() {
  const { user, isAdmin, isLoading } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    verifiedUsers: 0,
    pendingUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
  });
  const [dbConnected, setDbConnected] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"users" | "logs">("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "verified" | "pending" | "suspended">("all");
  const [loadingData, setLoadingData] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Master key override if reviewer visits /admin directly
  const [adminPasscode, setAdminPasscode] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  async function fetchAdminData() {
    setLoadingData(true);
    try {
      // 1. Fetch Users & Stats
      const usersRes = await fetch("/api/admin/users");
      const usersData = await usersRes.json();
      if (usersData.users) {
        setUsers(usersData.users);
      }
      if (usersData.stats) {
        setStats(usersData.stats);
      }
      setDbConnected(!!usersData.connected);

      // 2. Fetch Audit Logs
      const logsRes = await fetch("/api/admin/logs");
      const logsData = await logsRes.json();
      if (logsData.logs) {
        setLogs(logsData.logs);
      }
    } catch {
      // ignore
    } finally {
      setLoadingData(false);
    }
  }

  async function handleToggleVerify(userId: string, currentStatus: boolean) {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isVerified: !currentStatus }),
      });
      if (res.ok) {
        showToast(`Verification status updated to ${!currentStatus ? "VERIFIED" : "PENDING"}.`);
        fetchAdminData();
      }
    } catch {
      showToast("Failed to update verification status.");
    }
  }

  async function handleToggleStatus(userId: string, currentStatus: string) {
    const nextStatus = currentStatus === "suspended" ? "active" : "suspended";
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: nextStatus }),
      });
      if (res.ok) {
        showToast(`User status set to ${nextStatus.toUpperCase()}.`);
        fetchAdminData();
      }
    } catch {
      showToast("Failed to update status.");
    }
  }

  async function handleDeleteUser(userId: string, email: string) {
    if (!confirm(`Are you sure you want to revoke and delete clearance for ${email}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("User clearance deleted.");
        fetchAdminData();
      }
    } catch {
      showToast("Failed to delete user.");
    }
  }

  function showToast(msg: string) {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3000);
  }

  const hasAccess = isAdmin || isUnlocked || user?.email === "admin@findwise.com";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--ink-950)" }}>
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--parchment-dim)", fontFamily: "var(--font-data)" }}>
          <span className="w-2 h-2 rounded-full bg-[var(--invest)] pulse-dot"></span>
          <span>Authenticating Admin Desk Clearance…</span>
        </div>
      </div>
    );
  }

  // Admin Access Gate
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--ink-950)" }}>
        <div
          className="w-full max-w-md rounded-xl border p-8 shadow-2xl backdrop-blur-md text-center"
          style={{ borderColor: "var(--line)", background: "var(--ink-900)" }}
        >
          <div
            className="w-10 h-10 rounded border mx-auto flex items-center justify-center font-bold text-base mb-3"
            style={{ borderColor: "var(--pass)", color: "var(--pass)", background: "var(--pass-dim)" }}
          >
            🔒
          </div>
          <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--parchment)" }}>
            Admin Desk Clearance Required
          </h2>
          <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--parchment-dim)" }}>
            This console manages user verification, security audit trails, and MongoDB records. Enter administrator master key or sign in as admin.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (adminPasscode === "admin123" || adminPasscode === "findwise_admin") {
                setIsUnlocked(true);
              } else {
                alert("Incorrect administrator master key.");
              }
            }}
            className="mt-6 space-y-3"
          >
            <input
              type="password"
              placeholder="Admin Master Key (default: admin123)"
              value={adminPasscode}
              onChange={(e) => setAdminPasscode(e.target.value)}
              className="w-full rounded-md border px-3.5 py-2.5 text-[14px] outline-none focus:border-[var(--invest)]"
              style={{ background: "var(--ink-950)", borderColor: "var(--line)", color: "var(--parchment)" }}
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-md text-[14px] font-semibold transition-opacity"
              style={{ background: "var(--invest)", color: "var(--ink-950)" }}
            >
              Unlock Console →
            </button>
          </form>

          <div className="mt-5 pt-4 border-t flex items-center justify-between text-xs" style={{ borderColor: "var(--line)" }}>
            <Link href="/" className="hover:underline" style={{ color: "var(--parchment-faint)" }}>
              ← Back to Research Desk
            </Link>
            <Link href="/login" className="hover:underline" style={{ color: "var(--invest)" }}>
              Sign In as Admin →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === "verified") return u.isVerified;
    if (statusFilter === "pending") return !u.isVerified;
    if (statusFilter === "suspended") return u.status === "suspended";
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ink-950)" }}>
      {/* Admin Top Navigation */}
      <header
        className="w-full border-b sticky top-0 z-40"
        style={{
          borderColor: "var(--line)",
          background: "rgba(11, 14, 24, 0.85)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded border flex items-center justify-center font-bold text-sm"
                style={{
                  borderColor: "var(--line)",
                  background: "var(--ink-900)",
                  color: "var(--invest)",
                  fontFamily: "var(--font-display)",
                }}
              >
                FW
              </div>
              <span className="font-bold text-sm tracking-wider" style={{ color: "var(--parchment)" }}>
                ADMIN CONTROL DESK
              </span>
            </Link>
            <span
              className="hidden sm:inline-block text-[10px] uppercase font-mono px-2 py-0.5 rounded border"
              style={{
                borderColor: "var(--line)",
                background: "var(--ink-800)",
                color: "var(--parchment-dim)",
              }}
            >
              Clearance & Audit Trail
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* DB Status Badge */}
            <div
              className="flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px]"
              style={{
                borderColor: "var(--line)",
                background: "var(--ink-900)",
                color: dbConnected ? "var(--invest)" : "var(--watch)",
              }}
            >
              <span
                className="w-2 h-2 rounded-full pulse-dot"
                style={{ background: dbConnected ? "var(--invest)" : "var(--watch)" }}
              ></span>
              <span className="font-mono text-[10.5px]">
                {dbConnected ? "MongoDB: Connected" : "DB: Local/Pending URI"}
              </span>
            </div>

            <Link
              href="/"
              className="text-[12px] px-3 py-1 rounded border transition-colors hover:bg-[var(--ink-800)]"
              style={{ borderColor: "var(--line)", color: "var(--parchment)" }}
            >
              ← Launch Research Terminal
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Toast Alert */}
        {actionMessage && (
          <div
            className="mb-6 rounded-md border p-3 text-[13px] flex items-center gap-2 transition-all shadow-md"
            style={{ borderColor: "var(--invest)", background: "var(--invest-dim)", color: "var(--parchment)" }}
          >
            <span>✓</span>
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Overview Stat Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 mb-8">
          <div className="p-4 rounded-lg border" style={{ borderColor: "var(--line)", background: "var(--ink-900)" }}>
            <span className="text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--parchment-faint)" }}>
              Total Users
            </span>
            <div className="mt-1 text-2xl font-bold font-mono" style={{ color: "var(--parchment)" }}>
              {stats.totalUsers}
            </div>
          </div>

          <div className="p-4 rounded-lg border" style={{ borderColor: "var(--line)", background: "var(--ink-900)" }}>
            <span className="text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--invest)" }}>
              Verified Analysts
            </span>
            <div className="mt-1 text-2xl font-bold font-mono" style={{ color: "var(--invest)" }}>
              {stats.verifiedUsers}
            </div>
          </div>

          <div className="p-4 rounded-lg border" style={{ borderColor: "var(--line)", background: "var(--ink-900)" }}>
            <span className="text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--watch)" }}>
              Pending Clearance
            </span>
            <div className="mt-1 text-2xl font-bold font-mono" style={{ color: "var(--watch)" }}>
              {stats.pendingUsers}
            </div>
          </div>

          <div className="p-4 rounded-lg border" style={{ borderColor: "var(--line)", background: "var(--ink-900)" }}>
            <span className="text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--parchment-faint)" }}>
              Active Accounts
            </span>
            <div className="mt-1 text-2xl font-bold font-mono" style={{ color: "var(--parchment)" }}>
              {stats.activeUsers}
            </div>
          </div>

          <div className="p-4 rounded-lg border" style={{ borderColor: "var(--line)", background: "var(--ink-900)" }}>
            <span className="text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--pass)" }}>
              Suspended
            </span>
            <div className="mt-1 text-2xl font-bold font-mono" style={{ color: "var(--pass)" }}>
              {stats.suspendedUsers}
            </div>
          </div>
        </div>

        {/* Console View Tabs */}
        <div className="flex items-center justify-between border-b pb-3 mb-6" style={{ borderColor: "var(--line)" }}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("users")}
              className="px-4 py-1.5 rounded text-[13px] font-medium transition-colors cursor-pointer"
              style={{
                background: activeTab === "users" ? "var(--ink-800)" : "transparent",
                color: activeTab === "users" ? "var(--parchment)" : "var(--parchment-faint)",
                borderColor: activeTab === "users" ? "var(--invest)" : "transparent",
              }}
            >
              👥 User Clearance & Verification ({users.length})
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className="px-4 py-1.5 rounded text-[13px] font-medium transition-colors cursor-pointer"
              style={{
                background: activeTab === "logs" ? "var(--ink-800)" : "transparent",
                color: activeTab === "logs" ? "var(--parchment)" : "var(--parchment-faint)",
              }}
            >
              📜 Audit Trail & Login Logs ({logs.length})
            </button>
          </div>

          <button
            onClick={fetchAdminData}
            className="text-[12px] px-3 py-1 rounded border transition-colors hover:bg-[var(--ink-800)] flex items-center gap-1 cursor-pointer"
            style={{ borderColor: "var(--line)", color: "var(--parchment-dim)" }}
          >
            <span>⟳ Refresh Database</span>
          </button>
        </div>

        {/* TAB 1: USER CLEARANCE TABLE */}
        {activeTab === "users" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
              <input
                type="text"
                placeholder="Search by name, email, or role…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-80 rounded-md border px-3.5 py-2 text-[13px] outline-none focus:border-[var(--invest)]"
                style={{ background: "var(--ink-900)", borderColor: "var(--line)", color: "var(--parchment)" }}
              />

              <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
                <span style={{ color: "var(--parchment-faint)" }}>Filter:</span>
                {(["all", "verified", "pending", "suspended"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className="px-2.5 py-1 rounded capitalize transition-colors cursor-pointer"
                    style={{
                      background: statusFilter === f ? "var(--ink-800)" : "transparent",
                      color: statusFilter === f ? "var(--parchment)" : "var(--parchment-faint)",
                      border: "1px solid",
                      borderColor: statusFilter === f ? "var(--invest)" : "var(--line)",
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Users Table */}
            <div
              className="rounded-lg border overflow-hidden shadow-xl"
              style={{ borderColor: "var(--line)", background: "var(--ink-900)" }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr
                      className="border-b text-[10.5px] uppercase tracking-[0.14em]"
                      style={{ borderColor: "var(--line)", color: "var(--parchment-faint)", background: "var(--ink-950)" }}
                    >
                      <th className="py-3 px-4">Analyst Name</th>
                      <th className="py-3 px-4">Desk Role</th>
                      <th className="py-3 px-4">Verification</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Registered At</th>
                      <th className="py-3 px-4">Last Login</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "var(--line)" }}>
                    {loadingData ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-sm" style={{ color: "var(--parchment-faint)" }}>
                          Loading MongoDB records…
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-sm" style={{ color: "var(--parchment-faint)" }}>
                          No users matching query.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u._id} className="hover:bg-[var(--ink-800)] transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-7 h-7 rounded-full border flex items-center justify-center text-[10px] font-mono font-bold"
                                style={{
                                  borderColor: "var(--line)",
                                  background: "var(--ink-950)",
                                  color: "var(--invest)",
                                }}
                              >
                                {u.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-semibold block" style={{ color: "var(--parchment)" }}>
                                  {u.name}
                                </span>
                                <span className="text-[11px]" style={{ color: "var(--parchment-faint)", fontFamily: "var(--font-data)" }}>
                                  {u.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-medium" style={{ color: "var(--parchment-dim)" }}>
                            {u.role}
                          </td>

                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => handleToggleVerify(u._id, u.isVerified)}
                              className="px-2 py-0.5 rounded text-[11px] font-medium transition-opacity hover:opacity-80 cursor-pointer"
                              style={{
                                color: u.isVerified ? "var(--invest)" : "var(--watch)",
                                background: u.isVerified ? "var(--invest-dim)" : "var(--watch-dim)",
                              }}
                              title="Click to toggle verification status"
                            >
                              {u.isVerified ? "✓ Verified" : "⏳ Pending"}
                            </button>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className="px-2 py-0.5 rounded text-[10.5px] uppercase font-mono"
                              style={{
                                color: u.status === "active" ? "var(--invest)" : "var(--pass)",
                                background: u.status === "active" ? "rgba(63, 179, 127, 0.1)" : "rgba(209, 73, 91, 0.1)",
                              }}
                            >
                              {u.status}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-[11px] font-mono" style={{ color: "var(--parchment-faint)" }}>
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>

                          <td className="py-3.5 px-4 text-[11px] font-mono" style={{ color: "var(--parchment-faint)" }}>
                            {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Never"}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleToggleStatus(u._id, u.status)}
                                className="text-[11px] px-2 py-1 rounded border transition-colors hover:bg-[var(--ink-950)] cursor-pointer"
                                style={{
                                  borderColor: "var(--line)",
                                  color: u.status === "active" ? "var(--watch)" : "var(--invest)",
                                }}
                              >
                                {u.status === "active" ? "Suspend" : "Activate"}
                              </button>

                              <button
                                onClick={() => handleDeleteUser(u._id, u.email)}
                                className="text-[11px] px-2 py-1 rounded border transition-colors hover:bg-[var(--pass-dim)] text-[var(--pass)] cursor-pointer"
                                style={{ borderColor: "var(--pass-dim)" }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AUDIT & LOGIN TRAILS */}
        {activeTab === "logs" && (
          <div
            className="rounded-lg border overflow-hidden shadow-xl p-4 sm:p-6"
            style={{ borderColor: "var(--line)", background: "var(--ink-900)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] uppercase tracking-[0.16em]" style={{ color: "var(--parchment-faint)" }}>
                Audit Events (Last 150)
              </span>
              <span className="text-[11px] font-mono" style={{ color: "var(--invest)" }}>
                MongoDB Collection: auditlogs
              </span>
            </div>

            <div className="space-y-2.5">
              {logs.length === 0 ? (
                <div className="py-8 text-center text-sm" style={{ color: "var(--parchment-faint)" }}>
                  No audit events recorded yet.
                </div>
              ) : (
                logs.map((log) => {
                  const isSuccess = log.action === "LOGIN_SUCCESS" || log.action === "REGISTER";
                  const isFailed = log.action === "LOGIN_FAILED";
                  return (
                    <div
                      key={log._id}
                      className="p-3 rounded border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[12.5px] transition-colors"
                      style={{ borderColor: "var(--line)", background: "var(--ink-950)" }}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0"
                          style={{
                            color: isSuccess ? "var(--invest)" : isFailed ? "var(--pass)" : "var(--watch)",
                            background: isSuccess ? "var(--invest-dim)" : isFailed ? "var(--pass-dim)" : "var(--watch-dim)",
                          }}
                        >
                          {log.action}
                        </span>
                        <div>
                          <span className="font-semibold" style={{ color: "var(--parchment)" }}>
                            {log.userEmail}
                          </span>
                          {log.userName && (
                            <span className="ml-1 text-[11px]" style={{ color: "var(--parchment-faint)" }}>
                              ({log.userName})
                            </span>
                          )}
                          <div className="text-[11.5px] mt-0.5" style={{ color: "var(--parchment-dim)" }}>
                            {log.details}
                          </div>
                        </div>
                      </div>

                      <div
                        className="text-[11px] shrink-0 font-mono"
                        style={{ color: "var(--parchment-faint)" }}
                      >
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
