"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const ROLES = [
  "Equity Research Analyst",
  "Portfolio Manager",
  "Quant / Risk Officer",
  "Institutional / Private Investor",
];

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(ROLES[0]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, isLoading, register } = useAuth();
  const router = useRouter();

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!isLoading && user) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Clearance keys do not match. Please verify.");
      return;
    }

    if (password.length < 6) {
      setError("Clearance key must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    const res = await register(name, email, password, role);
    setIsSubmitting(false);

    if (res.success) {
      router.push("/");
    } else {
      setError(res.error || "Registration failed.");
    }
  }

  if (isLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--ink-950)" }}>
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--parchment-dim)", fontFamily: "var(--font-data)" }}>
          <span className="w-2 h-2 rounded-full bg-[var(--invest)] pulse-dot"></span>
          <span>Verifying credentials…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full grid lg:grid-cols-12 overflow-hidden" style={{ background: "var(--ink-950)" }}>
      {/* LEFT SIDE: Website Content & Platform Value (Fixed, No Scroll) */}
      <div
        className="hidden lg:flex lg:col-span-5 xl:col-span-6 h-full overflow-hidden flex-col justify-between p-8 xl:p-12 border-r relative select-none"
        style={{
          borderColor: "var(--line)",
          background: "linear-gradient(175deg, #101524 0%, #0b0e18 100%)",
        }}
      >
        {/* Subtle Background Glow */}
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full pointer-events-none blur-3xl opacity-20"
          style={{ background: "var(--invest)" }}
        />
        <div
          className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full pointer-events-none blur-3xl opacity-10"
          style={{ background: "var(--watch)" }}
        />

        {/* Top Branding */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded border flex items-center justify-center font-bold text-sm tracking-wider"
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
              <span
                className="font-bold text-base tracking-[0.08em] block"
                style={{ fontFamily: "var(--font-display)", color: "var(--parchment)" }}
              >
                FINDWISE
              </span>
              <span className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "var(--parchment-faint)" }}>
                Institutional Equity Research Desk
              </span>
            </div>
          </div>
        </div>

        {/* Center Editorial Value Proposition */}
        <div className="relative z-10 my-8 space-y-7">
          <div className="space-y-3">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10.5px] uppercase tracking-[0.16em]"
              style={{
                borderColor: "var(--line)",
                background: "var(--ink-800)",
                color: "var(--invest)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--invest)]"></span>
              <span>Analyst Onboarding</span>
            </div>
            <h1
              className="text-3xl xl:text-4xl font-bold tracking-tight leading-[1.2]"
              style={{ fontFamily: "var(--font-display)", color: "var(--parchment)" }}
            >
              Arm your research process with uncompromising clarity.
            </h1>
            <p className="text-[14.5px] leading-relaxed max-w-lg" style={{ color: "var(--parchment-dim)" }}>
              Join forward-looking equity analysts using autonomous reasoning graphs to evaluate market structure, parse earnings transcripts, and identify true asymmetric risk/reward.
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="space-y-3.5 pt-1">
            <div
              className="p-3.5 rounded-lg border transition-all"
              style={{ borderColor: "var(--line)", background: "rgba(16, 21, 36, 0.7)" }}
            >
              <div className="flex items-center gap-2 text-[13px] font-semibold mb-1" style={{ color: "var(--parchment)" }}>
                <span className="text-[var(--invest)]">✦</span>
                <span>Dialectic Bull vs. Bear Architecture</span>
              </div>
              <p className="text-[12px] leading-relaxed" style={{ color: "var(--parchment-faint)" }}>
                Every company undergoes adversarial stress-testing. Both the upside thesis and downside vulnerabilities are surfaced side-by-side.
              </p>
            </div>

            <div
              className="p-3.5 rounded-lg border transition-all"
              style={{ borderColor: "var(--line)", background: "rgba(16, 21, 36, 0.7)" }}
            >
              <div className="flex items-center gap-2 text-[13px] font-semibold mb-1" style={{ color: "var(--parchment)" }}>
                <span className="text-[var(--invest)]">✦</span>
                <span>Live Streaming Analyst Traces</span>
              </div>
              <p className="text-[12px] leading-relaxed" style={{ color: "var(--parchment-faint)" }}>
                Watch parallel agent execution in real-time as the graph pulls fundamentals, searches macro catalysts, and synthesizes the final memo.
              </p>
            </div>

            <div
              className="p-3.5 rounded-lg border transition-all"
              style={{ borderColor: "var(--line)", background: "rgba(16, 21, 36, 0.7)" }}
            >
              <div className="flex items-center gap-2 text-[13px] font-semibold mb-1" style={{ color: "var(--parchment)" }}>
                <span className="text-[var(--invest)]">✦</span>
                <span>Session Dossier Persistence</span>
              </div>
              <p className="text-[12px] leading-relaxed" style={{ color: "var(--parchment-faint)" }}>
                Seamlessly store, compare, and re-examine past company valuations with one click without repeating LLM compute.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Platform Stat Badges */}
        <div
          className="relative z-10 pt-5 border-t flex items-center justify-between text-[11px]"
          style={{ borderColor: "var(--line)", color: "var(--parchment-faint)", fontFamily: "var(--font-data)" }}
        >
          <div>
            <span className="block text-[14px] font-bold" style={{ color: "var(--parchment)" }}>Universal</span>
            <span>Global Equities</span>
          </div>
          <div>
            <span className="block text-[14px] font-bold" style={{ color: "var(--invest)" }}>Honest</span>
            <span>Missing-Data Handling</span>
          </div>
          <div>
            <span className="block text-[14px] font-bold" style={{ color: "var(--parchment)" }}>LangGraph</span>
            <span>StateGraph Engine</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Register Form (Scrollable) */}
      <div className="lg:col-span-7 xl:col-span-6 h-full overflow-y-auto flex flex-col px-6 sm:px-12 lg:px-16 py-8">
        <div className="w-full max-w-md mx-auto my-auto py-4">
          {/* Mobile Only Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
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
              <span className="font-bold text-sm tracking-[0.06em]" style={{ color: "var(--parchment)" }}>
                FINDWISE
              </span>
              <span className="text-[10px] block" style={{ color: "var(--parchment-faint)" }}>
                Institutional Equity Research Desk
              </span>
            </div>
          </div>

          <div className="mb-6">
            <div className="text-[11px] uppercase tracking-[0.16em] mb-1.5 font-medium" style={{ color: "var(--invest)" }}>
              Analyst Onboarding
            </div>
            <h2
              className="text-2xl sm:text-3xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "var(--parchment)" }}
            >
              Request Desk Clearance
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--parchment-dim)" }}>
              Provision your analyst credentials for instant dashboard access.
            </p>
          </div>

          {/* Form Card */}
          <div
            className="rounded-xl border p-6 sm:p-7 shadow-2xl backdrop-blur-md"
            style={{
              borderColor: "var(--line)",
              background: "rgba(16, 21, 36, 0.8)",
            }}
          >
            {error && (
              <div
                className="mb-4 rounded-md border p-3 text-[13px] flex items-start gap-2.5"
                style={{
                  borderColor: "var(--pass)",
                  background: "var(--pass-dim)",
                  color: "var(--parchment)",
                }}
              >
                <span className="font-bold text-sm" style={{ color: "var(--pass)" }}>✕</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label
                  htmlFor="name"
                  className="block text-[11px] uppercase tracking-[0.14em] font-medium mb-1"
                  style={{ color: "var(--parchment-dim)" }}
                >
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Pawan Tiwari"
                  className="w-full rounded-md border px-3.5 py-2 text-[13.5px] outline-none transition-colors focus:border-[var(--invest)]"
                  style={{
                    background: "var(--ink-950)",
                    borderColor: "var(--line)",
                    color: "var(--parchment)",
                    fontFamily: "var(--font-body)",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-[11px] uppercase tracking-[0.14em] font-medium mb-1"
                  style={{ color: "var(--parchment-dim)" }}
                >
                  Work Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pawan@findwise.com"
                  className="w-full rounded-md border px-3.5 py-2 text-[13.5px] outline-none transition-colors focus:border-[var(--invest)]"
                  style={{
                    background: "var(--ink-950)",
                    borderColor: "var(--line)",
                    color: "var(--parchment)",
                    fontFamily: "var(--font-body)",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="block text-[11px] uppercase tracking-[0.14em] font-medium mb-1"
                  style={{ color: "var(--parchment-dim)" }}
                >
                  Desk Function / Role
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-md border px-3.5 py-2 text-[13.5px] outline-none transition-colors focus:border-[var(--invest)] cursor-pointer"
                  style={{
                    background: "var(--ink-950)",
                    borderColor: "var(--line)",
                    color: "var(--parchment)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r} style={{ background: "var(--ink-900)" }}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-[11px] uppercase tracking-[0.14em] font-medium mb-1"
                    style={{ color: "var(--parchment-dim)" }}
                  >
                    Clearance Key
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 chars"
                    className="w-full rounded-md border px-3 py-2 text-[13.5px] outline-none transition-colors focus:border-[var(--invest)]"
                    style={{
                      background: "var(--ink-950)",
                      borderColor: "var(--line)",
                      color: "var(--parchment)",
                      fontFamily: "var(--font-body)",
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-[11px] uppercase tracking-[0.14em] font-medium mb-1"
                    style={{ color: "var(--parchment-dim)" }}
                  >
                    Confirm Key
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm"
                    className="w-full rounded-md border px-3 py-2 text-[13.5px] outline-none transition-colors focus:border-[var(--invest)]"
                    style={{
                      background: "var(--ink-950)",
                      borderColor: "var(--line)",
                      color: "var(--parchment)",
                      fontFamily: "var(--font-body)",
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 rounded-md py-3 text-[14.5px] font-semibold transition-opacity disabled:opacity-50 cursor-pointer shadow-md flex items-center justify-center gap-2"
                style={{
                  background: "var(--invest)",
                  color: "var(--ink-950)",
                }}
              >
                {isSubmitting ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[var(--ink-950)] pulse-dot"></span>
                    <span>Provisioning Clearance…</span>
                  </>
                ) : (
                  <span>Complete Registration & Launch Desk →</span>
                )}
              </button>
            </form>

            {/* Link back to login */}
            <div className="mt-5 text-center text-[13px]" style={{ color: "var(--parchment-dim)" }}>
              Already hold terminal clearance?{" "}
              <Link
                href="/login"
                className="font-medium hover:underline cursor-pointer"
                style={{ color: "var(--invest)" }}
              >
                Sign In Here →
              </Link>
            </div>
          </div>

          {/* Compliance Footer Note */}
          <div className="mt-5 text-center text-[11px]" style={{ color: "var(--parchment-faint)", fontFamily: "var(--font-data)" }}>
            FINDWISE RESEARCH DESK · INTERNAL COMPLIANCE ENFORCED
          </div>
        </div>
      </div>
    </div>
  );
}
