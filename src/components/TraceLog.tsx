"use client";

import type { TraceStep } from "@/lib/agent/types";

const STATUS_GLYPH: Record<TraceStep["status"], string> = {
  pending: "○",
  running: "▶",
  done: "✓",
  error: "✕",
  skipped: "–",
};

const STATUS_COLOR: Record<TraceStep["status"], string> = {
  pending: "var(--parchment-faint)",
  running: "var(--invest)",
  done: "var(--invest)",
  error: "var(--pass)",
  skipped: "var(--parchment-faint)",
};

export default function TraceLog({
  steps,
  elapsedTime,
  isRunning,
}: {
  steps: TraceStep[];
  elapsedTime?: number;
  isRunning?: boolean;
}) {
  const completedCount = steps.filter((s) => s.status === "done").length;

  return (
    <div
      className="rounded-lg border scan-texture overflow-hidden shadow-lg transition-all"
      style={{
        borderColor: "var(--line)",
        background: "var(--ink-900)",
      }}
    >
      {/* Terminal Title Bar */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b text-[11px] uppercase tracking-[0.15em]"
        style={{
          borderColor: "var(--line)",
          background: "var(--ink-800)",
          color: "var(--parchment-faint)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--invest)] pulse-dot"></span>
          <span className="font-semibold" style={{ color: "var(--parchment)" }}>
            ANALYST TRACE LOG
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono">
          {elapsedTime !== undefined && (
            <span style={{ color: isRunning ? "var(--watch)" : "var(--parchment-faint)" }}>
              {(elapsedTime / 1000).toFixed(1)}s
            </span>
          )}
          <span style={{ color: "var(--parchment)" }}>
            {steps.length > 0 ? `${completedCount} / ${steps.length}` : "IDLE"}
          </span>
        </div>
      </div>

      {/* Terminal Output */}
      <ul className="p-4 space-y-3.5" style={{ fontFamily: "var(--font-data)" }}>
        {steps.length === 0 && (
          <li className="text-[12.5px] py-4 text-center" style={{ color: "var(--parchment-faint)" }}>
            Waiting for ticker input… Select a preset or type any company name.
          </li>
        )}
        {steps.map((step) => {
          const isCurrent = step.status === "running";
          return (
            <li
              key={step.id}
              className="text-[12.5px] leading-relaxed transition-all"
              style={{
                opacity: step.status === "pending" ? 0.45 : 1,
              }}
            >
              <div className="flex items-start gap-2.5">
                <span
                  className={isCurrent ? "pulse-dot font-bold" : "font-bold"}
                  style={{
                    color: STATUS_COLOR[step.status],
                    lineHeight: "1.4",
                    fontSize: isCurrent ? "14px" : "12px",
                  }}
                >
                  {STATUS_GLYPH[step.status]}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span
                      style={{
                        color: isCurrent ? "var(--parchment)" : "var(--parchment-dim)",
                        fontWeight: isCurrent ? 600 : 400,
                      }}
                    >
                      {step.label}
                    </span>
                    {step.startedAt && step.finishedAt && (
                      <span style={{ color: "var(--parchment-faint)", fontSize: "10.5px" }}>
                        +{((step.finishedAt - step.startedAt) / 1000).toFixed(2)}s
                      </span>
                    )}
                  </div>
                  {step.detail && (
                    <div
                      className="mt-1 pl-2 border-l text-[11.5px] leading-snug"
                      style={{
                        borderColor: "var(--line)",
                        color: "var(--parchment-faint)",
                      }}
                    >
                      {step.detail}
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Terminal Footer */}
      <div
        className="px-4 py-2 border-t text-[10px] flex items-center justify-between"
        style={{
          borderColor: "var(--line)",
          background: "var(--ink-950)",
          color: "var(--parchment-faint)",
          fontFamily: "var(--font-data)",
        }}
      >
        <span>LANGGRAPH // NODE PIPELINE</span>
        <span style={{ color: isRunning ? "var(--invest)" : "var(--parchment-faint)" }}>
          {isRunning ? "PROCESSING STREAM" : "STANDBY"}
        </span>
      </div>
    </div>
  );
}
