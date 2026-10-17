"use client";

import type { AgentDecision } from "@/lib/agent/types";

export interface StoredDossier {
  company: string;
  ticker?: string;
  verdict: AgentDecision["verdict"];
  confidence: number;
  timestamp: number;
  decision: AgentDecision;
}

const VERDICT_BADGE: Record<AgentDecision["verdict"], { label: string; color: string; bg: string }> = {
  INVEST: { label: "INVEST", color: "var(--invest)", bg: "var(--invest-dim)" },
  PASS: { label: "PASS", color: "var(--pass)", bg: "var(--pass-dim)" },
  WATCH: { label: "WATCH", color: "var(--watch)", bg: "var(--watch-dim)" },
};

export default function RecentDossiers({
  dossiers,
  onSelectDossier,
  onClearHistory,
  activeCompany,
}: {
  dossiers: StoredDossier[];
  onSelectDossier: (dossier: StoredDossier) => void;
  onClearHistory: () => void;
  activeCompany?: string;
}) {
  if (dossiers.length === 0) return null;

  return (
    <div
      className="rounded-lg border p-4 mb-8"
      style={{
        borderColor: "var(--line)",
        background: "rgba(16, 21, 36, 0.6)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.15em]" style={{ color: "var(--parchment-faint)" }}>
            Session Dossiers
          </span>
          <span
            className="text-[10px] px-1.5 py-0.2 rounded-full"
            style={{
              background: "var(--ink-700)",
              color: "var(--parchment-dim)",
              fontFamily: "var(--font-data)",
            }}
          >
            {dossiers.length}
          </span>
        </div>
        <button
          onClick={onClearHistory}
          className="text-[11px] hover:underline cursor-pointer"
          style={{ color: "var(--parchment-faint)" }}
        >
          Clear History
        </button>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {dossiers.map((item) => {
          const badge = VERDICT_BADGE[item.verdict];
          const isActive = activeCompany?.toLowerCase() === item.company.toLowerCase();
          return (
            <button
              key={`${item.company}-${item.timestamp}`}
              onClick={() => onSelectDossier(item)}
              className="group flex items-center gap-2.5 px-3 py-1.5 rounded-md border text-left transition-all duration-150 cursor-pointer"
              style={{
                borderColor: isActive ? badge.color : "var(--line)",
                background: isActive ? "var(--ink-800)" : "var(--ink-900)",
              }}
            >
              <div className="flex flex-col">
                <span
                  className="text-[12.5px] font-medium"
                  style={{ color: isActive ? "var(--parchment)" : "var(--parchment-dim)" }}
                >
                  {item.company}
                </span>
                {item.ticker && (
                  <span
                    className="text-[9px]"
                    style={{ fontFamily: "var(--font-data)", color: "var(--parchment-faint)" }}
                  >
                    {item.ticker}
                  </span>
                )}
              </div>

              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase"
                style={{
                  color: badge.color,
                  background: badge.bg,
                  fontFamily: "var(--font-display)",
                }}
              >
                {badge.label}
              </span>

              <span
                className="text-[10px]"
                style={{
                  fontFamily: "var(--font-data)",
                  color: "var(--parchment-faint)",
                }}
              >
                {item.confidence}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
