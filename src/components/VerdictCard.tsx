"use client";

import { useState } from "react";
import type { AgentDecision } from "@/lib/agent/types";

const VERDICT_STYLE: Record<AgentDecision["verdict"], { color: string; dim: string; label: string; bg: string }> = {
  INVEST: { color: "var(--invest)", dim: "var(--invest-dim)", label: "Invest", bg: "rgba(63, 179, 127, 0.08)" },
  PASS: { color: "var(--pass)", dim: "var(--pass-dim)", label: "Pass", bg: "rgba(209, 73, 91, 0.08)" },
  WATCH: { color: "var(--watch)", dim: "var(--watch-dim)", label: "Watch", bg: "rgba(217, 169, 58, 0.08)" },
};

function ScoreBar({ label, value, invert }: { label: string; value: number; invert?: boolean }) {
  const pct = Math.max(0, Math.min(10, value)) * 10;
  const color = invert
    ? value > 6.5 ? "var(--pass)" : value > 3.5 ? "var(--watch)" : "var(--invest)"
    : value > 6.5 ? "var(--invest)" : value > 3.5 ? "var(--watch)" : "var(--pass)";
  return (
    <div className="group">
      <div className="flex justify-between text-[11px] mb-1" style={{ color: "var(--parchment-faint)" }}>
        <span className="uppercase tracking-[0.1em]">{label}</span>
        <span style={{ fontFamily: "var(--font-data)", color: "var(--parchment)" }}>{value.toFixed(1)} / 10</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--ink-700)" }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export default function VerdictCard({ decision }: { decision: AgentDecision }) {
  const [activeTab, setActiveTab] = useState<"summary" | "bullbear" | "risks" | "sources">("summary");
  const [copied, setCopied] = useState(false);
  const style = VERDICT_STYLE[decision.verdict];

  function handleCopyMarkdown() {
    const text = `# ${decision.resolvedName || decision.company} (${decision.ticker || "N/A"}) — Findwise Research Note
**Verdict:** ${decision.verdict} | **Conviction:** ${decision.confidence}%

## Investment Thesis
${decision.thesis}

## Scorecard
- Fundamentals: ${decision.scorecard.fundamentals}/10
- Momentum: ${decision.scorecard.momentum}/10
- Sentiment: ${decision.scorecard.sentiment}/10
- Risk Level: ${decision.scorecard.risk}/10

## Bull Case
${decision.bullPoints.map((p) => `- ${p}`).join("\n")}

## Bear Case
${decision.bearPoints.map((p) => `- ${p}`).join("\n")}

## Key Risks
${decision.risks.map((r) => `- [${r.severity.toUpperCase()}] ${r.title}: ${r.detail}`).join("\n")}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div
      className="relative rounded-lg border overflow-hidden transition-all shadow-xl"
      style={{
        borderColor: "var(--line)",
        background: "var(--ink-900)",
      }}
    >
      {/* Decorative top verdict bar */}
      <div className="h-1 w-full" style={{ background: style.color }} />

      {/* Stamp — Signature element */}
      <div
        className="stamp-in absolute top-5 right-5 sm:top-7 sm:right-7 select-none z-10"
        style={{ transform: "rotate(-7deg)" }}
        aria-hidden
      >
        <div
          className="px-3.5 py-1.5 border-2 rounded text-center shadow-lg backdrop-blur-sm"
          style={{
            borderColor: style.color,
            color: style.color,
            background: "rgba(16, 21, 36, 0.9)",
          }}
        >
          <span
            className="block text-lg sm:text-xl font-bold tracking-[0.1em] uppercase"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {style.label}
          </span>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {/* Header Metadata */}
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.15em] mb-2" style={{ color: "var(--parchment-faint)" }}>
          <span>Findwise Research Dossier</span>
          <span>·</span>
          <span>Conviction: {decision.confidence}%</span>
        </div>

        {/* Company Title & Ticker */}
        <h2
          className="pr-32 sm:pr-40 font-semibold"
          style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", lineHeight: 1.25 }}
        >
          {decision.resolvedName ?? decision.company}
          {decision.ticker && (
            <span
              className="ml-2 font-mono text-[1.05rem] px-2 py-0.5 rounded"
              style={{
                fontFamily: "var(--font-data)",
                color: "var(--parchment-dim)",
                background: "var(--ink-800)",
              }}
            >
              {decision.ticker}
            </span>
          )}
        </h2>

        {/* Confidence Meter */}
        <div className="mt-4 flex items-center gap-3 max-w-sm">
          <div className="text-[11px] uppercase tracking-[0.15em]" style={{ color: "var(--parchment-faint)" }}>
            Conviction
          </div>
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--ink-700)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${decision.confidence}%`, background: style.color }}
            />
          </div>
          <div style={{ fontFamily: "var(--font-data)", fontSize: "13px", color: "var(--parchment)" }}>
            {decision.confidence}%
          </div>
        </div>

        {/* Interactive View Tabs */}
        <div className="flex items-center justify-between border-b mt-6 pb-2" style={{ borderColor: "var(--line)" }}>
          <div className="flex items-center gap-1 sm:gap-2">
            {[
              { id: "summary", label: "Executive Thesis" },
              { id: "bullbear", label: `Bull vs. Bear (${decision.bullPoints.length + decision.bearPoints.length})` },
              { id: "risks", label: `Risk Matrix (${decision.risks.length})` },
              { id: "sources", label: `Sources (${decision.sources.length})` },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className="px-3 py-1 text-xs rounded transition-colors cursor-pointer"
                  style={{
                    color: isActive ? "var(--parchment)" : "var(--parchment-faint)",
                    background: isActive ? "var(--ink-800)" : "transparent",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              title="Copy markdown research brief"
              className="text-[11px] px-2.5 py-1 rounded border flex items-center gap-1.5 transition-colors hover:bg-[var(--ink-800)] cursor-pointer"
              style={{ borderColor: "var(--line)", color: "var(--parchment-dim)" }}
            >
              <span>{copied ? "✓ Copied" : "📋 Copy Note"}</span>
            </button>
            <button
              onClick={handlePrint}
              title="Print / Save PDF"
              className="hidden sm:flex text-[11px] px-2.5 py-1 rounded border items-center gap-1.5 transition-colors hover:bg-[var(--ink-800)] cursor-pointer"
              style={{ borderColor: "var(--line)", color: "var(--parchment-dim)" }}
            >
              <span>🖨️ Export</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Executive Thesis & Scorecard */}
        {activeTab === "summary" && (
          <div className="mt-5 space-y-6">
            <div
              className="p-4 rounded-md border text-[15px] leading-relaxed"
              style={{
                borderColor: "var(--line)",
                background: style.bg,
                color: "var(--parchment)",
              }}
            >
              <div className="text-[11px] uppercase tracking-[0.15em] mb-1 font-semibold" style={{ color: style.color }}>
                Analyst Core Thesis
              </div>
              <p className="mt-1 text-[14.5px] leading-relaxed" style={{ color: "var(--parchment)" }}>
                {decision.thesis}
              </p>
            </div>

            {/* Scorecard Grid */}
            <div>
              <div className="text-[11px] uppercase tracking-[0.15em] mb-3" style={{ color: "var(--parchment-faint)" }}>
                Quant Scorecard
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-md border" style={{ borderColor: "var(--line)", background: "var(--ink-800)" }}>
                <ScoreBar label="Fundamentals" value={decision.scorecard.fundamentals} />
                <ScoreBar label="Momentum" value={decision.scorecard.momentum} />
                <ScoreBar label="Sentiment" value={decision.scorecard.sentiment} />
                <ScoreBar label="Risk Exposure" value={decision.scorecard.risk} invert />
              </div>
            </div>

            {/* Brief Bull / Bear Preview */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded border" style={{ borderColor: "var(--line)", background: "var(--ink-950)" }}>
                <div className="text-[11px] uppercase tracking-[0.15em] font-semibold mb-2" style={{ color: "var(--invest)" }}>
                  Primary Bull Driver
                </div>
                <p className="text-[13px] leading-relaxed" style={{ color: "var(--parchment-dim)" }}>
                  {decision.bullPoints[0] || "Strong competitive position in target market."}
                </p>
              </div>
              <div className="p-3.5 rounded border" style={{ borderColor: "var(--line)", background: "var(--ink-950)" }}>
                <div className="text-[11px] uppercase tracking-[0.15em] font-semibold mb-2" style={{ color: "var(--pass)" }}>
                  Primary Bear Counterpoint
                </div>
                <p className="text-[13px] leading-relaxed" style={{ color: "var(--parchment-dim)" }}>
                  {decision.bearPoints[0] || "Valuation sensitivity and execution headwinds."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Bull vs Bear Deep Dive */}
        {activeTab === "bullbear" && (
          <div className="mt-5 grid sm:grid-cols-2 gap-6">
            <div className="p-4 rounded-md border" style={{ borderColor: "var(--line)", background: "var(--ink-800)" }}>
              <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.15em] font-semibold mb-3" style={{ color: "var(--invest)" }}>
                <span>+ Bull Case Vectors</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--ink-700)] text-[var(--invest)]">
                  {decision.bullPoints.length} points
                </span>
              </div>
              <ul className="space-y-3">
                {decision.bullPoints.map((point, i) => (
                  <li key={i} className="text-[13.5px] leading-relaxed flex gap-2.5 items-start">
                    <span className="w-5 h-5 rounded flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold" style={{ background: "var(--invest-dim)", color: "var(--invest)" }}>
                      ✓
                    </span>
                    <span style={{ color: "var(--parchment)" }}>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-md border" style={{ borderColor: "var(--line)", background: "var(--ink-800)" }}>
              <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.15em] font-semibold mb-3" style={{ color: "var(--pass)" }}>
                <span>– Bear Case Vectors</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--ink-700)] text-[var(--pass)]">
                  {decision.bearPoints.length} points
                </span>
              </div>
              <ul className="space-y-3">
                {decision.bearPoints.map((point, i) => (
                  <li key={i} className="text-[13.5px] leading-relaxed flex gap-2.5 items-start">
                    <span className="w-5 h-5 rounded flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold" style={{ background: "var(--pass-dim)", color: "var(--pass)" }}>
                      ✕
                    </span>
                    <span style={{ color: "var(--parchment)" }}>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Tab 3: Risk Matrix */}
        {activeTab === "risks" && (
          <div className="mt-5 space-y-3">
            {decision.risks.length === 0 ? (
              <div className="p-4 text-center text-sm" style={{ color: "var(--parchment-faint)" }}>
                No critical risks flagged for this asset.
              </div>
            ) : (
              decision.risks.map((r, i) => (
                <div
                  key={i}
                  className="rounded-md border p-3.5 transition-colors"
                  style={{ borderColor: "var(--line)", background: "var(--ink-800)" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-semibold" style={{ color: "var(--parchment)" }}>
                      {r.title}
                    </span>
                    <span
                      className="text-[10px] uppercase tracking-[0.1em] px-2 py-0.5 rounded font-mono font-semibold"
                      style={{
                        color:
                          r.severity === "high"
                            ? "var(--pass)"
                            : r.severity === "medium"
                            ? "var(--watch)"
                            : "var(--invest)",
                        background: "var(--ink-700)",
                      }}
                    >
                      {r.severity} Risk
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: "var(--parchment-dim)" }}>
                    {r.detail}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: Sources & Citations */}
        {activeTab === "sources" && (
          <div className="mt-5">
            {decision.sources.length === 0 ? (
              <div className="p-6 rounded border text-center text-sm" style={{ borderColor: "var(--line)", color: "var(--parchment-faint)", background: "var(--ink-800)" }}>
                Synthesized primarily from verified baseline financials and company filings. Live search provider was not configured.
              </div>
            ) : (
              <ul className="space-y-2">
                {decision.sources.map((s, i) => (
                  <li
                    key={i}
                    className="p-3 rounded border flex items-center justify-between gap-4 transition-colors hover:bg-[var(--ink-800)]"
                    style={{ borderColor: "var(--line)", background: "var(--ink-950)" }}
                  >
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[13.5px] hover:underline truncate"
                      style={{ color: "var(--parchment)" }}
                    >
                      {s.title}
                    </a>
                    <span className="text-[11px] shrink-0 font-mono" style={{ color: "var(--parchment-faint)" }}>
                      ↗ External Link
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
