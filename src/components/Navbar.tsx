"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Navbar({
  onReset,
  hasActiveReport,
}: {
  onReset: () => void;
  hasActiveReport: boolean;
}) {
  const [nyTime, setNyTime] = useState("");
  const [istTime, setIstTime] = useState("");
  const { user, logout } = useAuth();

  useEffect(() => {
    function updateClocks() {
      const now = new Date();
      setNyTime(
        now.toLocaleTimeString("en-US", {
          timeZone: "America/New_York",
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setIstTime(
        now.toLocaleTimeString("en-US", {
          timeZone: "Asia/Kolkata",
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }
    updateClocks();
    const interval = setInterval(updateClocks, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className="no-print w-full border-b sticky top-0 z-40"
      style={{
        borderColor: "var(--line)",
        background: "rgba(11, 14, 24, 0.85)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded border flex items-center justify-center font-bold text-sm tracking-wider"
              style={{
                borderColor: "var(--line)",
                background: "var(--ink-900)",
                color: "var(--invest)",
                fontFamily: "var(--font-display)",
              }}
            >
              FW
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="font-bold text-[15px] tracking-[0.06em]"
                  style={{ fontFamily: "var(--font-display)", color: "var(--parchment)" }}
                >
                  FINDWISE
                </span>
                <span
                  className="hidden sm:inline-block text-[9px] uppercase tracking-[0.16em] px-1.5 py-0.5 rounded border"
                  style={{
                    borderColor: "var(--line)",
                    background: "var(--ink-800)",
                    color: "var(--parchment-faint)",
                  }}
                >
                  PRO DESK
                </span>
              </div>
              <div
                className="text-[10px] tracking-wider uppercase hidden sm:block"
                style={{ color: "var(--parchment-faint)" }}
              >
                Institutional Equity Intelligence
              </div>
            </div>
          </Link>
        </div>

        {/* Global Market Clocks */}
        <div
          className="hidden md:flex items-center gap-4 text-[11px]"
          style={{ fontFamily: "var(--font-data)", color: "var(--parchment-faint)" }}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--invest)]"></span>
            <span>NYSE</span>
            <span style={{ color: "var(--parchment)" }}>{nyTime || "--:--:--"}</span>
            <span className="text-[9px]">EST</span>
          </div>
          <span style={{ color: "var(--line)" }}>|</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--invest)]"></span>
            <span>NSE</span>
            <span style={{ color: "var(--parchment)" }}>{istTime || "--:--:--"}</span>
            <span className="text-[9px]">IST</span>
          </div>
        </div>

        {/* Status, User & Actions */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin"
            title="Admin Console & Verification"
            className="text-[11.5px] px-2.5 py-1 rounded border transition-colors hover:bg-[var(--ink-800)] flex items-center gap-1 cursor-pointer"
            style={{
              borderColor: "var(--line)",
              color: "var(--parchment-dim)",
            }}
          >
            <span>⚙️ Admin</span>
          </Link>

          {hasActiveReport && (
            <button
              onClick={onReset}
              className="text-[12px] px-3 py-1 rounded border transition-colors hover:bg-[var(--ink-800)] cursor-pointer"
              style={{
                borderColor: "var(--line)",
                color: "var(--parchment-dim)",
              }}
            >
              New Query
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-2.5">
              <div
                className="hidden sm:flex flex-col text-right text-[11px]"
                style={{ color: "var(--parchment)" }}
              >
                <span className="font-medium truncate max-w-[130px]">{user.name}</span>
                <span
                  className="text-[9.5px] uppercase tracking-wider"
                  style={{ color: "var(--parchment-faint)" }}
                >
                  {user.role}
                </span>
              </div>

              <div
                className="w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold font-mono"
                style={{
                  borderColor: "var(--line)",
                  background: "var(--ink-800)",
                  color: "var(--invest)",
                }}
                title={`${user.name} (${user.email})`}
              >
                {user.name.slice(0, 2).toUpperCase()}
              </div>

              <button
                onClick={logout}
                title="Sign out of research terminal"
                className="text-[11.5px] px-2.5 py-1 rounded border transition-colors hover:bg-[var(--ink-800)] hover:text-[var(--pass)] cursor-pointer"
                style={{
                  borderColor: "var(--line)",
                  color: "var(--parchment-dim)",
                }}
              >
                Exit
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-[12px] px-3.5 py-1.5 rounded font-medium transition-opacity cursor-pointer"
              style={{
                background: "var(--invest)",
                color: "var(--ink-950)",
              }}
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
