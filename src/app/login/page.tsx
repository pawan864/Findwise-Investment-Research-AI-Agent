"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, isLoading, login } = useAuth();
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
    setIsSubmitting(true);

    const res = await login(email, password);
    setIsSubmitting(false);

    if (res.success) {
      router.push("/");
    } else {
      setError(res.error || "Authentication failed.");
    }
  }

  function handleFillDemo() {
    setEmail("analyst@findwise.com");
    setPassword("findwise123");
    setError(null);
  }

  if (isLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--ink-950)" }}>
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--parchment-dim)", fontFamily: "var(--font-data)" }}>
          <span className="w-2 h-2 rounded-full bg-[var(--invest)] pulse-dot"></span>
          <span>Verifying clearance credentials…</span>
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
        <div className="relative z-10 my-10 space-y-8">
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
              <span>Next-Gen Valuation Engine</span>
            </div>
            <h1
              className="text-3xl xl:text-4xl font-bold tracking-tight leading-[1.2]"
              style={{ fontFamily: "var(--font-display)", color: "var(--parchment)" }}
            >
              Autonomous equity intelligence that commits to a verdict.
            </h1>
            <p className="text-[14.5px] leading-relaxed max-w-lg" style={{ color: "var(--parchment-dim)" }}>
              Traditional market notes hide behind ambiguous disclaimers. Findwise models the bull case, stresses the bear thesis, and stamps an unhedged decision with verifiable confidence.
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="space-y-4 pt-2">
            <div
              className="p-4 rounded-lg border transition-all"
              style={{ borderColor: "var(--line)", background: "rgba(16, 21, 36, 0.7)" }}
            >
              <div className="flex items-center gap-2 text-[13px] font-semibold mb-1" style={{ color: "var(--parchment)" }}>
                <span className="text-[var(--invest)]">✦</span>
                <span>Parallel LangGraph Pipeline</span>
              </div>
              <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--parchment-faint)" }}>
                Financial filings and live news stream through isolated reasoning nodes in parallel before synthesis.
              </p>
            </div>

            <div
              className="p-4 rounded-lg border transition-all"
              style={{ borderColor: "var(--line)", background: "rgba(16, 21, 36, 0.7)" }}
            >
              <div className="flex items-center gap-2 text-[13px] font-semibold mb-1" style={{ color: "var(--parchment)" }}>
                <span className="text-[var(--invest)]">✦</span>
                <span>Calibrated Conviction Scoring</span>
              </div>
              <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--parchment-faint)" }}>
                Rigorous 4-factor quant scorecard evaluating fundamentals, momentum, sentiment, and structural risk.
              </p>
            </div>

            <div
              className="p-4 rounded-lg border transition-all"
              style={{ borderColor: "var(--line)", background: "rgba(16, 21, 36, 0.7)" }}
            >
              <div className="flex items-center gap-2 text-[13px] font-semibold mb-1" style={{ color: "var(--parchment)" }}>
                <span className="text-[var(--invest)]">✦</span>
                <span>Zero Black-Box Opacity</span>
              </div>
              <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--parchment-faint)" }}>
                Every decision includes the full analyst trace, bull/bear tension vectors, and consulted primary sources.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Platform Stat Badges */}
        <div
          className="relative z-10 pt-6 border-t flex items-center justify-between text-[11px]"
          style={{ borderColor: "var(--line)", color: "var(--parchment-faint)", fontFamily: "var(--font-data)" }}
        >
          <div>
            <span className="block text-[14px] font-bold" style={{ color: "var(--parchment)" }}>&lt; 8.5s</span>
            <span>Synthesis Latency</span>
          </div>
          <div>
            <span className="block text-[14px] font-bold" style={{ color: "var(--invest)" }}>100%</span>
            <span>Trace Visibility</span>
          </div>
          <div>
            <span className="block text-[14px] font-bold" style={{ color: "var(--parchment)" }}>Multi-Node</span>
            <span>StateGraph Agent</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Login Form (Scrollable) */}
      <div className="lg:col-span-7 xl:col-span-6 h-full overflow-y-auto flex flex-col px-6 sm:px-12 lg:px-16 py-8">
        <div className="w-full max-w-md mx-auto my-auto">
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

          <div className="mb-8">
            <div className="text-[11px] uppercase tracking-[0.16em] mb-2 font-medium" style={{ color: "var(--invest)" }}>
              Terminal Authentication
            </div>
            <h2
              className="text-2xl sm:text-3xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "var(--parchment)" }}
            >
              Sign in to Research Desk
            </h2>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--parchment-dim)" }}>
              Access live financial modeling, analyst traces, and institutional dossiers.
            </p>
          </div>

          {/* Form Card */}
          <div
            className="rounded-xl border p-6 sm:p-8 shadow-2xl backdrop-blur-md"
            style={{
              borderColor: "var(--line)",
              background: "rgba(16, 21, 36, 0.8)",
            }}
          >
            {error && (
              <div
                className="mb-5 rounded-md border p-3.5 text-[13px] flex items-start gap-2.5"
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-[11px] uppercase tracking-[0.14em] font-medium mb-1.5"
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
                  placeholder="analyst@findwise.com"
                  className="w-full rounded-md border px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-[var(--invest)]"
                  style={{
                    background: "var(--ink-950)",
                    borderColor: "var(--line)",
                    color: "var(--parchment)",
                    fontFamily: "var(--font-body)",
                  }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-[11px] uppercase tracking-[0.14em] font-medium"
                    style={{ color: "var(--parchment-dim)" }}
                  >
                    Clearance Key (Password)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] hover:underline cursor-pointer"
                    style={{ color: "var(--parchment-faint)" }}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-md border px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-[var(--invest)]"
                  style={{
                    background: "var(--ink-950)",
                    borderColor: "var(--line)",
                    color: "var(--parchment)",
                    fontFamily: "var(--font-body)",
                  }}
                />
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
                    <span>Verifying Credentials…</span>
                  </>
                ) : (
                  <span>Access Research Terminal →</span>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Autofill */}
            <div className="mt-5 pt-4 border-t" style={{ borderColor: "var(--line)" }}>
              <button
                type="button"
                onClick={handleFillDemo}
                className="w-full py-2 px-3 rounded border text-xs flex items-center justify-center gap-2 transition-colors hover:bg-[var(--ink-800)] cursor-pointer"
                style={{
                  borderColor: "var(--line)",
                  background: "var(--ink-900)",
                  color: "var(--parchment-dim)",
                }}
              >
                <span>⚡ One-Click Analyst Demo Access</span>
              </button>
              <div className="mt-2 text-center text-[10.5px]" style={{ color: "var(--parchment-faint)", fontFamily: "var(--font-data)" }}>
                analyst@findwise.com · key: findwise123
              </div>
            </div>

            {/* Link to Register */}
            <div className="mt-6 text-center text-[13px]" style={{ color: "var(--parchment-dim)" }}>
              Don&apos;t have terminal clearance?{" "}
              <Link
                href="/register"
                className="font-medium hover:underline cursor-pointer"
                style={{ color: "var(--invest)" }}
              >
                Register Here →
              </Link>
            </div>
          </div>

          {/* Compliance Footer Note */}
          <div className="mt-6 text-center text-[11px]" style={{ color: "var(--parchment-faint)", fontFamily: "var(--font-data)" }}>
            FINDWISE RESEARCH DESK · SECURE SESSION ENFORCED
          </div>
        </div>
      </div>
    </div>
  );
}
