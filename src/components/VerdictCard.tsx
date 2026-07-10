"use client";

import type { AgentDecision } from "@/lib/agent/types";

const VERDICT_STYLE: Record<AgentDecision["verdict"], { color: string; dim: string; label: string }> = {
  INVEST: { color: "var(--invest)", dim: "var(--invest-dim)", label: "Invest" },
  PASS: { color: "var(--pass)", dim: "var(--pass-dim)", label: "Pass" },
  WATCH: { color: "var(--watch)", dim: "var(--watch-dim)", label: "Watch" },
};

function ScoreBar({ label, value, invert }: { label: string; value: number; invert?: boolean }) {
  const pct = Math.max(0, Math.min(10, value)) * 10;
  const color = invert
    ? value > 6.5 ? "var(--pass)" : value > 3.5 ? "var(--watch)" : "var(--invest)"
    : value > 6.5 ? "var(--invest)" : value > 3.5 ? "var(--watch)" : "var(--pass)";
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1" style={{ color: "var(--parchment-faint)" }}>
        <span className="uppercase tracking-[0.1em]">{label}</span>
        <span style={{ fontFamily: "var(--font-data)", color: "var(--parchment)" }}>{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--ink-700)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function VerdictCard({ decision }: { decision: AgentDecision }) {
  const style = VERDICT_STYLE[decision.verdict];

  return (
    <div className="relative rounded-lg border overflow-hidden" style={{ borderColor: "var(--line)", background: "var(--ink-900)" }}>
      {/* Stamp — the signature element */}
      <div
        className="stamp-in absolute top-5 right-5 sm:top-7 sm:right-7 select-none"
        style={{ transform: "rotate(-8deg)" }}
        aria-hidden
      >
        <div
          className="px-3 py-1 border-2 rounded-sm text-center"
          style={{
            borderColor: style.color,
            color: style.color,
          }}
        >
          <span
            className="block text-lg sm:text-xl font-semibold tracking-[0.08em]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {style.label}
          </span>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        <div className="text-[11px] uppercase tracking-[0.15em] mb-2" style={{ color: "var(--parchment-faint)" }}>
          Verdict
        </div>
        <h2
          className="pr-32 sm:pr-40"
          style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", lineHeight: 1.25 }}
        >
          {decision.resolvedName ?? decision.company}
          {decision.ticker && (
            <span style={{ fontFamily: "var(--font-data)", color: "var(--parchment-faint)", fontSize: "1rem" }}>
              {" "}· {decision.ticker}
            </span>
          )}
        </h2>

        <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "var(--parchment-dim)" }}>
          {decision.thesis}
        </p>

        <div className="mt-5 flex items-center gap-3">
          <div className="text-[11px] uppercase tracking-[0.15em]" style={{ color: "var(--parchment-faint)" }}>
            Confidence
          </div>
          <div className="flex-1 h-2 rounded-full overflow-hidden max-w-[180px]" style={{ background: "var(--ink-700)" }}>
            <div className="h-full rounded-full" style={{ width: `${decision.confidence}%`, background: style.color }} />
          </div>
          <div style={{ fontFamily: "var(--font-data)", fontSize: "13px" }}>{decision.confidence}%</div>
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <ScoreBar label="Fundamentals" value={decision.scorecard.fundamentals} />
          <ScoreBar label="Momentum" value={decision.scorecard.momentum} />
          <ScoreBar label="Sentiment" value={decision.scorecard.sentiment} />
          <ScoreBar label="Risk" value={decision.scorecard.risk} invert />
        </div>

        <div className="mt-7 grid sm:grid-cols-2 gap-6">
          <div>
            <div className="text-[11px] uppercase tracking-[0.15em] mb-2.5" style={{ color: "var(--invest)" }}>
              Bull case
            </div>
            <ul className="space-y-2">
              {decision.bullPoints.map((p, i) => (
                <li key={i} className="text-[13.5px] leading-relaxed flex gap-2" style={{ color: "var(--parchment-dim)" }}>
                  <span style={{ color: "var(--invest)" }}>+</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.15em] mb-2.5" style={{ color: "var(--pass)" }}>
              Bear case
            </div>
            <ul className="space-y-2">
              {decision.bearPoints.map((p, i) => (
                <li key={i} className="text-[13.5px] leading-relaxed flex gap-2" style={{ color: "var(--parchment-dim)" }}>
                  <span style={{ color: "var(--pass)" }}>–</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {decision.risks.length > 0 && (
          <div className="mt-7">
            <div className="text-[11px] uppercase tracking-[0.15em] mb-2.5" style={{ color: "var(--watch)" }}>
              Key risks
            </div>
            <div className="space-y-2">
              {decision.risks.map((r, i) => (
                <div
                  key={i}
                  className="rounded-md border px-3.5 py-2.5"
                  style={{ borderColor: "var(--line)", background: "var(--ink-800)" }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] uppercase tracking-[0.1em] px-1.5 py-0.5 rounded"
                      style={{
                        color:
                          r.severity === "high" ? "var(--pass)" : r.severity === "medium" ? "var(--watch)" : "var(--parchment-faint)",
                        background: "var(--ink-700)",
                      }}
                    >
                      {r.severity}
                    </span>
                    <span className="text-[13.5px] font-medium">{r.title}</span>
                  </div>
                  <p className="mt-1 text-[13px]" style={{ color: "var(--parchment-dim)" }}>
                    {r.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {decision.sources.length > 0 && (
          <div className="mt-7">
            <div className="text-[11px] uppercase tracking-[0.15em] mb-2.5" style={{ color: "var(--parchment-faint)" }}>
              Sources consulted
            </div>
            <ul className="space-y-1.5">
              {decision.sources.map((s, i) => (
                <li key={i} className="text-[13px] truncate">
                  <a href={s.url} target="_blank" rel="noreferrer" className="hover:underline" style={{ color: "var(--parchment-dim)" }}>
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
