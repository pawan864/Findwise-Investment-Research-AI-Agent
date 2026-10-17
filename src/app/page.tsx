"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import SectorPills from "@/components/SectorPills";
import RecentDossiers, { type StoredDossier } from "@/components/RecentDossiers";
import TraceLog from "@/components/TraceLog";
import VerdictCard from "@/components/VerdictCard";
import { useAuth } from "@/context/AuthContext";
import type { AgentDecision, StreamEvent, TraceStep } from "@/lib/agent/types";

const RANDOM_POOL = [
  "Nvidia", "Tata Elxsi", "Apple", "Zomato", "Tesla", "Palantir",
  "Microsoft", "Reliance", "TSMC", "Amazon", "Alphabet", "Airbnb"
];

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [company, setCompany] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<TraceStep[]>([]);
  const [decision, setDecision] = useState<AgentDecision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dossiers, setDossiers] = useState<StoredDossier[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Authentication Guard: Redirect to /login if unauthenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Load past dossiers from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("findwise_dossiers");
      if (saved) {
        setDossiers(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  // Save dossiers to localStorage
  function saveDossier(newDecision: AgentDecision) {
    setDossiers((prev) => {
      const entry: StoredDossier = {
        company: newDecision.company,
        ticker: newDecision.ticker,
        verdict: newDecision.verdict,
        confidence: newDecision.confidence,
        timestamp: Date.now(),
        decision: newDecision,
      };
      // Keep unique by company name, maximum 8 items
      const filtered = prev.filter(
        (d) => d.company.toLowerCase() !== newDecision.company.toLowerCase()
      );
      const updated = [entry, ...filtered].slice(0, 8);
      try {
        localStorage.setItem("findwise_dossiers", JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }

  // Keyboard shortcut: Ctrl+K or / to focus search input
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Active elapsed stopwatch when running
  useEffect(() => {
    if (isRunning) {
      const startTime = Date.now();
      setElapsedTime(0);
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  async function runResearch(name: string) {
    const targetName = name.trim();
    if (!targetName || isRunning) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setCompany(targetName);
    setIsRunning(true);
    setSteps([]);
    setDecision(null);
    setError(null);

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: targetName }),
        signal: controller.signal,
      });

      if (!res.body) throw new Error("No response stream from research node.");

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
            saveDossier(event.decision);
          } else if (event.type === "error") {
            setError(event.message);
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError(err instanceof Error ? err.message : "Network error running analysis.");
      }
    } finally {
      setIsRunning(false);
    }
  }

  function handleSelectDossier(d: StoredDossier) {
    setCompany(d.company);
    setDecision(d.decision);
    setSteps([
      { id: "gather_financials", label: "Pulling financial fundamentals", status: "done", detail: "Loaded from cached session dossier." },
      { id: "gather_news", label: "Searching recent news & developments", status: "done", detail: "Loaded from cached session dossier." },
      { id: "synthesize", label: "Writing research note", status: "done", detail: "Dossier synthesis complete." },
      { id: "decide", label: "Weighing the evidence & deciding", status: "done", detail: `Verdict: ${d.decision.verdict}` },
    ]);
  }

  function handleClearHistory() {
    setDossiers([]);
    try {
      localStorage.removeItem("findwise_dossiers");
    } catch {
      // ignore
    }
  }

  function handlePickRandom() {
    const unselected = RANDOM_POOL.filter((c) => c.toLowerCase() !== company.toLowerCase());
    const random = unselected[Math.floor(Math.random() * unselected.length)];
    setCompany(random);
    runResearch(random);
  }

  function handleReset() {
    abortRef.current?.abort();
    setIsRunning(false);
    setCompany("");
    setDecision(null);
    setSteps([]);
    setError(null);
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--ink-950)" }}>
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--parchment-dim)", fontFamily: "var(--font-data)" }}>
          <span className="w-2 h-2 rounded-full bg-[var(--invest)] pulse-dot"></span>
          <span>Verifying terminal clearance…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ink-950)" }}>
      {/* Top Terminal Bar */}
      <Navbar onReset={handleReset} hasActiveReport={!!decision || steps.length > 0} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-10 pb-20">
        {/* Editorial Masthead */}
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] uppercase tracking-[0.18em] mb-4" style={{ borderColor: "var(--line)", background: "var(--ink-900)", color: "var(--invest)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--invest)]"></span>
            <span>Autonomous Equity Valuation Engine</span>
          </div>
          <h1
            style={{ fontFamily: "var(--font-display)" }}
            className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.15] max-w-3xl"
          >
            Institutional research desk.
            <br />
            <span style={{ fontStyle: "italic", color: "var(--parchment-dim)" }}>
              No marketing noise, just conviction.
            </span>
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed" style={{ color: "var(--parchment-dim)" }}>
            Provide any company or ticker. Findwise pulls fundamentals, extracts market sentiment, stress-tests bull vs. bear arguments, and commits to an uncompromising verdict.
          </p>
        </div>

        {/* Interactive Search Deck */}
        <div
          className="rounded-xl border p-4 sm:p-6 mb-8 shadow-2xl relative overflow-hidden"
          style={{
            borderColor: "var(--line)",
            background: "rgba(16, 21, 36, 0.75)",
            backdropFilter: "blur(16px)",
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runResearch(company);
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <div
                className="absolute left-4 top-1/2 -translate-y-1/2 text-sm select-none pointer-events-none"
                style={{ color: "var(--parchment-faint)" }}
              >
                ⌕
              </div>
              <input
                ref={inputRef}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Enter ticker or company name (e.g. Nvidia, Zomato, Apple, Tata Motors)..."
                disabled={isRunning}
                className="w-full rounded-lg border pl-10 pr-10 py-3.5 text-[15px] outline-none transition-all focus:border-[var(--invest)] disabled:opacity-50"
                style={{
                  background: "var(--ink-950)",
                  borderColor: "var(--line)",
                  color: "var(--parchment)",
                  fontFamily: "var(--font-body)",
                }}
              />
              {company && !isRunning && (
                <button
                  type="button"
                  onClick={() => setCompany("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs rounded-full w-5 h-5 flex items-center justify-center hover:bg-[var(--ink-800)]"
                  style={{ color: "var(--parchment-faint)" }}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePickRandom}
                disabled={isRunning}
                title="Analyze random company"
                className="rounded-lg border px-3.5 py-3.5 text-[14px] flex items-center justify-center transition-colors hover:bg-[var(--ink-800)] disabled:opacity-40 cursor-pointer"
                style={{
                  borderColor: "var(--line)",
                  color: "var(--parchment-dim)",
                  background: "var(--ink-900)",
                }}
              >
                🎲 Random
              </button>

              <button
                type="submit"
                disabled={isRunning || !company.trim()}
                className="rounded-lg px-6 py-3.5 text-[14.5px] font-semibold transition-all duration-150 disabled:opacity-40 flex items-center justify-center gap-2 shadow-md cursor-pointer shrink-0"
                style={{
                  background: "var(--invest)",
                  color: "var(--ink-950)",
                }}
              >
                {isRunning ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[var(--ink-950)] pulse-dot"></span>
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <span>Initiate Coverage →</span>
                )}
              </button>
            </div>
          </form>

          {/* Quick Curated Sector Presets */}
          <div className="mt-5 pt-4 border-t" style={{ borderColor: "var(--line)" }}>
            <div className="text-[11px] uppercase tracking-[0.14em] mb-2" style={{ color: "var(--parchment-faint)" }}>
              Explore Curated Asset Classes
            </div>
            <SectorPills onSelectCompany={(name) => runResearch(name)} disabled={isRunning} />
          </div>
        </div>

        {/* History / Previous Dossiers */}
        <RecentDossiers
          dossiers={dossiers}
          onSelectDossier={handleSelectDossier}
          onClearHistory={handleClearHistory}
          activeCompany={decision?.company}
        />

        {/* Error Alert */}
        {error && (
          <div
            className="mb-8 rounded-lg border p-4 text-[14px] flex items-start gap-3 shadow-lg"
            style={{
              borderColor: "var(--pass)",
              background: "var(--pass-dim)",
              color: "var(--parchment)",
            }}
          >
            <span className="text-base font-bold" style={{ color: "var(--pass)" }}>
              ✕
            </span>
            <div>
              <div className="font-semibold text-sm">Analysis Interrupted</div>
              <div className="mt-0.5 text-xs opacity-90">{error}</div>
            </div>
          </div>
        )}

        {/* Output Grid: Trace Log + Verdict Dossier */}
        {(steps.length > 0 || decision) && (
          <div className="grid lg:grid-cols-[310px_1fr] gap-6 items-start">
            <TraceLog steps={steps} elapsedTime={elapsedTime} isRunning={isRunning} />
            {decision ? (
              <VerdictCard decision={decision} />
            ) : (
              <div
                className="rounded-lg border p-12 text-center text-[14px] flex flex-col items-center justify-center min-h-[360px]"
                style={{
                  borderColor: "var(--line)",
                  background: "var(--ink-900)",
                  color: "var(--parchment-faint)",
                }}
              >
                <div className="w-10 h-10 rounded-full border border-dashed flex items-center justify-center mb-4 pulse-dot" style={{ borderColor: "var(--invest)", color: "var(--invest)" }}>
                  ⟳
                </div>
                <div className="text-[15px] font-semibold" style={{ color: "var(--parchment)", fontFamily: "var(--font-display)" }}>
                  Drafting Equity Memo for {company}...
                </div>
                <p className="mt-1 text-xs max-w-sm" style={{ color: "var(--parchment-dim)" }}>
                  Weighing fundamental solvency, evaluating moat durability, and scoring bear risk factors.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Terminal Footer */}
      <footer
        className="no-print w-full border-t py-6 text-center text-[11px]"
        style={{
          borderColor: "var(--line)",
          background: "var(--ink-950)",
          color: "var(--parchment-faint)",
          fontFamily: "var(--font-data)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold" style={{ color: "var(--parchment)", fontFamily: "var(--font-display)" }}>FINDWISE</span>
            <span>· Autonomous Investment Intelligence</span>
          </div>
          <div className="flex items-center gap-4 text-[10.5px]">
            <span>STRICTLY FOR INFORMATIONAL USE</span>
            <span>NOT FINANCIAL ADVICE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
