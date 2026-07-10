// Shared types for the Investment Research Agent.
// Kept in one file so both the graph and the API route / UI agree on shape.

export type StepStatus = "pending" | "running" | "done" | "error" | "skipped";

/** One entry in the visible "agent trace" the UI renders as the analyst works. */
export interface TraceStep {
  id: string;
  label: string;
  status: StepStatus;
  detail?: string;
  startedAt?: number;
  finishedAt?: number;
}

export interface NewsItem {
  title: string;
  url: string;
  snippet: string;
  source?: string;
  publishedAt?: string;
}

export interface FinancialSnapshot {
  ticker?: string;
  name?: string;
  currency?: string;
  price?: number;
  marketCap?: number;
  peRatio?: number;
  eps?: number;
  revenueTTM?: number;
  revenueGrowthYoY?: number;
  profitMargin?: number;
  debtToEquity?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  sector?: string;
  industry?: string;
  description?: string;
  raw?: Record<string, unknown>;
  source: "alphavantage" | "none";
}

export interface RiskItem {
  title: string;
  detail: string;
  severity: "low" | "medium" | "high";
}

export interface Scorecard {
  fundamentals: number; // 0-10
  momentum: number; // 0-10
  sentiment: number; // 0-10
  risk: number; // 0-10, higher = riskier
}

export interface AgentDecision {
  company: string;
  resolvedName?: string;
  ticker?: string;
  verdict: "INVEST" | "PASS" | "WATCH";
  confidence: number; // 0-100
  thesis: string; // one paragraph summary
  bullPoints: string[];
  bearPoints: string[];
  risks: RiskItem[];
  scorecard: Scorecard;
  sources: { title: string; url: string }[];
}

/** The full state object threaded through every LangGraph node. */
export interface AgentState {
  company: string;
  trace: TraceStep[];
  news: NewsItem[];
  financials: FinancialSnapshot | null;
  researchNotes: string;
  decision: AgentDecision | null;
  error: string | null;
}

/** Server -> client streaming event shapes (Server-Sent Events payloads). */
export type StreamEvent =
  | { type: "trace"; step: TraceStep }
  | { type: "decision"; decision: AgentDecision }
  | { type: "error"; message: string }
  | { type: "done" };
