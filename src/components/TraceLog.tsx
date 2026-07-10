"use client";

import type { TraceStep } from "@/lib/agent/types";

const STATUS_GLYPH: Record<TraceStep["status"], string> = {
  pending: "○",
  running: "◐",
  done: "●",
  error: "✕",
  skipped: "–",
};

const STATUS_COLOR: Record<TraceStep["status"], string> = {
  pending: "var(--parchment-faint)",
  running: "var(--watch)",
  done: "var(--invest)",
  error: "var(--pass)",
  skipped: "var(--parchment-faint)",
};

export default function TraceLog({ steps }: { steps: TraceStep[] }) {
  return (
    <div className="rounded-lg border scan-texture" style={{ borderColor: "var(--line)", background: "var(--ink-900)" }}>
      <div
        className="flex items-center gap-2 px-4 py-2.5 border-b text-[11px] uppercase tracking-[0.15em]"
        style={{ borderColor: "var(--line)", color: "var(--parchment-faint)" }}
      >
        <span>Analyst trace</span>
        <span className="ml-auto font-normal tracking-normal">{steps.length ? `${steps.filter(s => s.status === "done").length}/${steps.length}` : ""}</span>
      </div>
      <ul className="p-4 space-y-3" style={{ fontFamily: "var(--font-data)" }}>
        {steps.length === 0 && (
          <li className="text-sm" style={{ color: "var(--parchment-faint)" }}>
            Waiting for a company name…
          </li>
        )}
        {steps.map((step) => (
          <li key={step.id} className="text-[13px] leading-relaxed">
            <div className="flex items-start gap-2.5">
              <span
                className={step.status === "running" ? "pulse-dot" : ""}
                style={{ color: STATUS_COLOR[step.status], lineHeight: "1.4" }}
              >
                {STATUS_GLYPH[step.status]}
              </span>
              <div className="flex-1">
                <span style={{ color: "var(--parchment)" }}>{step.label}</span>
                {step.detail && (
                  <div className="mt-0.5" style={{ color: "var(--parchment-faint)", fontSize: "12px" }}>
                    {step.detail}
                  </div>
                )}
              </div>
              {step.startedAt && step.finishedAt && (
                <span style={{ color: "var(--parchment-faint)", fontSize: "11px" }}>
                  {((step.finishedAt - step.startedAt) / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
