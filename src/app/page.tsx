"use client";

import { useState, useRef } from "react";
import TraceLog from "@/components/TraceLog";
import VerdictCard from "@/components/VerdictCard";
import type { AgentDecision, StreamEvent, TraceStep } from "@/lib/agent/types";

const EXAMPLES = ["Tata Elxsi", "Nvidia", "Zomato", "Airbnb"];

export default function Home() {
  const [company, setCompany] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<TraceStep[]>([]);
  const [decision, setDecision] = useState<AgentDecision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function runResearch(name: string) {
    if (!name.trim() || isRunning) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsRunning(true);
    setSteps([]);
    setDecision(null);
    setError(null);

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: name.trim() }),
        signal: controller.signal,
      });

      if (!res.body) throw new Error("No response stream from server.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          const line = chunk.trim();
          if (!line.startsWith("data:")) continue;
          const jsonStr = line.slice(5).trim();
          if (!jsonStr) continue;

          let event: StreamEvent;
          try {
            event = JSON.parse(jsonStr);
          } catch {
            continue;
          }

          if (event.type === "trace") {
            setSteps((prev) => {
              const idx = prev.findIndex((s) => s.id === event.step.id);
              if (idx === -1) return [...prev, event.step];
              const copy = [...prev];
              copy[idx] = event.step;
              return copy;
            });
          } else if (event.type === "decision") {
            setDecision(event.decision);
          } else if (event.type === "error") {
            setError(event.message);
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-24">
        {/* Hero */}
        <div className="mb-12">
          <div className="text-[11px] uppercase tracking-[0.2em] mb-4" style={{ color: "var(--parchment-faint)" }}>
            Research Desk · AI Investment Agent
          </div>
          <h1
            style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}
            className="text-4xl sm:text-5xl leading-[1.1] max-w-2xl"
          >
            Name a company.
            <br />
            It builds the case, both ways, then calls it.
          </h1>
          <p className="mt-4 max-w-xl text-[15px]" style={{ color: "var(--parchment-dim)" }}>
            A LangGraph agent pulls fundamentals and recent news where available, writes a
            research note, then commits to Invest, Pass, or Watch — with the reasoning shown,
            not hidden.
          </p>
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runResearch(company);
          }}
          className="flex flex-col sm:flex-row gap-3 mb-4"
        >
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Nvidia, Tata Elxsi, Airbnb…"
            className="flex-1 rounded-md border px-4 py-3 text-[15px] outline-none focus:ring-2"
            style={{
              background: "var(--ink-900)",
              borderColor: "var(--line)",
              color: "var(--parchment)",
            }}
          />
          <button
            type="submit"
            disabled={isRunning || !company.trim()}
            className="rounded-md px-6 py-3 text-[15px] font-medium transition-opacity disabled:opacity-40"
            style={{ background: "var(--invest)", color: "var(--ink-950)" }}
          >
            {isRunning ? "Researching…" : "Run research"}
          </button>
        </form>

        <div className="flex flex-wrap gap-2 mb-12">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => {
                setCompany(ex);
                runResearch(ex);
              }}
              disabled={isRunning}
              className="text-[12px] rounded-full border px-3 py-1 disabled:opacity-40"
              style={{ borderColor: "var(--line)", color: "var(--parchment-dim)" }}
            >
              {ex}
            </button>
          ))}
        </div>

        {error && (
          <div
            className="mb-8 rounded-md border px-4 py-3 text-[14px]"
            style={{ borderColor: "var(--pass)", background: "var(--pass-dim)", color: "var(--parchment)" }}
          >
            {error}
          </div>
        )}

        {(steps.length > 0 || decision) && (
          <div className="grid lg:grid-cols-[280px_1fr] gap-6 items-start">
            <TraceLog steps={steps} />
            {decision ? (
              <VerdictCard decision={decision} />
            ) : (
              <div
                className="rounded-lg border px-6 py-16 text-center text-[14px]"
                style={{ borderColor: "var(--line)", background: "var(--ink-900)", color: "var(--parchment-faint)" }}
              >
                {isRunning ? "Drafting the verdict…" : "Waiting to start."}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
