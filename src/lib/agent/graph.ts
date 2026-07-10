import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getChatModel } from "@/lib/agent/llm";
import { searchNews } from "@/lib/tools/search";
import { fetchFinancials } from "@/lib/tools/financials";
import type {
  AgentDecision,
  FinancialSnapshot,
  NewsItem,
  Scorecard,
} from "@/lib/agent/types";

// ---------------------------------------------------------------------------
// Graph state
// ---------------------------------------------------------------------------
// LangGraph's Annotation API describes how each key in state is merged when a
// node returns a partial update. Most fields here are simple "last write
// wins" — only `news` needs no merging since we only ever set it once.

const GraphState = Annotation.Root({
  company: Annotation<string>(),
  news: Annotation<NewsItem[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  financials: Annotation<FinancialSnapshot | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  researchNotes: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
  decision: Annotation<AgentDecision | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  error: Annotation<string | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
});

export type GraphStateType = typeof GraphState.State;

// ---------------------------------------------------------------------------
// Node: gather_financials — pulls fundamentals + a live quote if a
// financial-data API key is configured. Never throws: absence of data is a
// valid outcome the downstream analyst node is told about explicitly.
// ---------------------------------------------------------------------------
async function gatherFinancials(state: GraphStateType): Promise<Partial<GraphStateType>> {
  const financials = await fetchFinancials(state.company);
  return { financials };
}

// ---------------------------------------------------------------------------
// Node: gather_news — recent web/news context, if a search API key exists.
// ---------------------------------------------------------------------------
async function gatherNews(state: GraphStateType): Promise<Partial<GraphStateType>> {
  const query = `${state.company} stock investment outlook 2026 earnings news`;
  const news = await searchNews(query);
  return { news };
}

// ---------------------------------------------------------------------------
// Node: synthesize — the LLM reads whatever structured data we managed to
// gather and writes a research note in its own words. Separating "reading
// the data" from "deciding" keeps the final decision node's prompt shorter
// and makes each step independently inspectable in the trace.
// ---------------------------------------------------------------------------
async function synthesize(state: GraphStateType): Promise<Partial<GraphStateType>> {
  const model = getChatModel({ temperature: 0.3 });

  const financialsBlock = state.financials
    ? JSON.stringify(state.financials, null, 2)
    : "No structured financial data was available (no API key configured, ticker could not be resolved, or provider had no coverage). Rely on general knowledge and flag this as a limitation.";

  const newsBlock =
    state.news.length > 0
      ? state.news
          .map((n, i) => `[${i + 1}] ${n.title} (${n.source ?? "unknown source"})\n${n.snippet}`)
          .join("\n\n")
      : "No live web search results were available (no search API key configured). Rely on general knowledge up to your training cutoff and flag this as a limitation.";

  const system = new SystemMessage(
    `You are a meticulous equity research analyst. You are given whatever structured
financial data and news snippets could be retrieved for a company, plus your own general
knowledge. Write a dense, factual research note (350-500 words) covering: what the
company does, its financial health and trajectory, competitive position, recent
developments, and the biggest risks. Be specific with numbers where you have them.
Do not give a final verdict yet — that happens in a separate step. Note explicitly
where data is missing or you are relying on general knowledge rather than fresh data.`
  );

  const human = new HumanMessage(
    `Company: ${state.company}

STRUCTURED FINANCIAL DATA:
${financialsBlock}

RECENT NEWS / WEB SEARCH RESULTS:
${newsBlock}`
  );

  const response = await model.invoke([system, human]);
  const researchNotes = typeof response.content === "string" ? response.content : JSON.stringify(response.content);

  return { researchNotes };
}

// ---------------------------------------------------------------------------
// Node: decide — reads the research note and produces a structured
// invest/pass/watch verdict as strict JSON, parsed and validated here.
// ---------------------------------------------------------------------------
const DECISION_SCHEMA_HINT = `{
  "resolvedName": string,
  "ticker": string | null,
  "verdict": "INVEST" | "PASS" | "WATCH",
  "confidence": number (0-100),
  "thesis": string (2-4 sentences),
  "bullPoints": string[] (3-5 items),
  "bearPoints": string[] (3-5 items),
  "risks": [{ "title": string, "detail": string, "severity": "low" | "medium" | "high" }] (2-4 items),
  "scorecard": { "fundamentals": number (0-10), "momentum": number (0-10), "sentiment": number (0-10), "risk": number (0-10, higher = riskier) }
}`;

async function decide(state: GraphStateType): Promise<Partial<GraphStateType>> {
  const model = getChatModel({ temperature: 0 });

  const system = new SystemMessage(
    `You are the decision-making partner at an investment research desk. Given an
analyst's research note, you make the final call: INVEST, PASS, or WATCH (use WATCH
when the thesis is genuinely balanced and more information/time is needed before
committing capital either way — don't overuse it as a way to avoid a call).

Respond with ONLY valid JSON matching this exact shape, no prose before or after,
no markdown code fences:
${DECISION_SCHEMA_HINT}

Be honest and calibrated: if data was missing, that should lower your confidence
and show up in risks, not be papered over. Confidence should rarely exceed 80 given
the agent is working from limited, point-in-time data.`
  );

  const human = new HumanMessage(
    `Company as given by the user: ${state.company}

RESEARCH NOTE:
${state.researchNotes}`
  );

  const response = await model.invoke([system, human]);
  const raw = typeof response.content === "string" ? response.content : JSON.stringify(response.content);

  const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");

  let parsed: Record<string, unknown> & {
    resolvedName?: string;
    ticker?: string;
    verdict?: string;
    confidence?: number;
    thesis?: string;
    bullPoints?: string[];
    bearPoints?: string[];
    risks?: AgentDecision["risks"];
    scorecard?: Record<string, number>;
  };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return {
      error: "The model's decision output could not be parsed as JSON. Raw output: " + cleaned.slice(0, 500),
    };
  }

  const scorecard: Scorecard = {
    fundamentals: clamp(parsed?.scorecard?.fundamentals),
    momentum: clamp(parsed?.scorecard?.momentum),
    sentiment: clamp(parsed?.scorecard?.sentiment),
    risk: clamp(parsed?.scorecard?.risk),
  };

  const decision: AgentDecision = {
    company: state.company,
    resolvedName: parsed.resolvedName ?? state.financials?.name ?? state.company,
    ticker: parsed.ticker ?? state.financials?.ticker ?? undefined,
    verdict:
      parsed.verdict === "INVEST" || parsed.verdict === "PASS" || parsed.verdict === "WATCH"
        ? parsed.verdict
        : "WATCH",
    confidence: Math.max(0, Math.min(100, Number(parsed.confidence) || 0)),
    thesis: parsed.thesis ?? "",
    bullPoints: Array.isArray(parsed.bullPoints) ? parsed.bullPoints : [],
    bearPoints: Array.isArray(parsed.bearPoints) ? parsed.bearPoints : [],
    risks: Array.isArray(parsed.risks) ? parsed.risks : [],
    scorecard,
    sources: state.news.map((n) => ({ title: n.title, url: n.url })),
  };

  return { decision };
}

function clamp(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return 5;
  return Math.max(0, Math.min(10, n));
}

// ---------------------------------------------------------------------------
// Graph assembly
// ---------------------------------------------------------------------------
// gather_financials and gather_news run in parallel (both branch from START
// and both feed into synthesize), then synthesize -> decide runs serially.

export function buildResearchGraph() {
  const graph = new StateGraph(GraphState)
    .addNode("gather_financials", gatherFinancials)
    .addNode("gather_news", gatherNews)
    .addNode("synthesize", synthesize)
    .addNode("decide", decide)
    .addEdge(START, "gather_financials")
    .addEdge(START, "gather_news")
    .addEdge("gather_financials", "synthesize")
    .addEdge("gather_news", "synthesize")
    .addEdge("synthesize", "decide")
    .addEdge("decide", END);

  return graph.compile();
}
