# Research Desk — AI Investment Research Agent

An agent that takes a company name, researches it (fundamentals + recent news where
available), writes an analyst-style note, and commits to a verdict — **Invest**, **Pass**,
or **Watch** — with the bull case, bear case, risks, and a confidence score shown
alongside, not hidden inside a black box.

Built for the InsideIIM × Altuni AI Labs take-home assignment.

---

## Overview

You type a company name (e.g. "Nvidia", "Tata Elxsi", "Zomato") and hit **Run research**.
The UI streams a live **analyst trace** on the left while a **LangGraph.js** agent works in
parallel on the backend:

1. Pull financial fundamentals (if a data provider key is configured)
2. Search recent news (if a search provider key is configured)
3. Synthesize both into a written research note
4. Decide: Invest / Pass / Watch, with confidence, bull/bear points, risks, and a scorecard

The result renders as a "verdict card" — a stamped decision, a scorecard
(fundamentals / momentum / sentiment / risk), the bull and bear case side by side, key
risks, and any sources the agent actually consulted.

The agent is intentionally **honest about what it doesn't know**: if no search or
financial-data API key is configured, it says so in the trace and in its reasoning,
and leans on the LLM's own knowledge instead of pretending to have live data.

---

## How to run it

**Requirements:** Node.js 18.18+ (Node 20 LTS recommended), npm.

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env.local
# then open .env.local and fill in at least one LLM key (see below)

# 3. Run in development
npm run dev
# open http://localhost:3000

# — or build for production —
npm run build
npm run start
```

### Environment variables

| Variable | Required? | Purpose |
|---|---|---|
| `LLM_PROVIDER` | No (default `google`) | `anthropic`, `openai`, or `google` (Gemini) |
| `GOOGLE_API_KEY` | **Yes**, if using Gemini (default) | Powers the analyst + decision nodes — [free tier key](https://aistudio.google.com/app/apikey) |
| `GOOGLE_MODEL` | No (default `gemini-3.1-flash-lite`) | Override the model |
| `ANTHROPIC_API_KEY` | Yes, if `LLM_PROVIDER=anthropic` | Alternative LLM provider |
| `ANTHROPIC_MODEL` | No (default `claude-sonnet-4-5`) | Override the model |
| `OPENAI_API_KEY` | Yes, if `LLM_PROVIDER=openai` | Alternative LLM provider |
| `OPENAI_MODEL` | No (default `gpt-4o-mini`) | Override the model |
| `TAVILY_API_KEY` | No, but recommended | Enables live news search ([free tier](https://tavily.com)) |
| `ALPHAVANTAGE_API_KEY` | No, but recommended | Enables live fundamentals + quote ([free key](https://www.alphavantage.co/support/#api-key)) |

**Minimum viable setup:** just `GOOGLE_API_KEY` (Gemini's free tier is generous enough
for this app's usage). The agent still runs end-to-end without the two research keys —
it just relies more on the model's own knowledge and says so explicitly in the trace and
in its risk list. This was a deliberate design choice — see **Key decisions** below.

> **Note on model choice:** the default was switched from `gemini-2.0-flash` to
> `gemini-3.1-flash-lite` after `gemini-2.0-flash` was retired and `gemini-2.5-flash`
> began returning intermittent `404`/deprecation errors as Google rolled out the Gemini
> 3.x line. `gemini-3.5-flash` was tried as a replacement but its free tier is capped at
> a low daily request quota (20 requests/day at time of writing), which isn't enough for
> iterative dev/testing. `gemini-3.1-flash-lite` has a materially higher free-tier
> quota and is the current default; swap `GOOGLE_MODEL` to `gemini-3.5-flash` for a
> higher-quality one-off run if you're within its daily quota.

### Deploying (bonus)

Deploys cleanly to Vercel as-is (`vercel deploy`), since it's a standard Next.js app with
one serverless API route. Add the same environment variables in the Vercel project
settings. No other infra needed — there's no database or persistent state.

---

## How it works

### Architecture

```
                    ┌──────────────────┐
        ┌──────────▶│ gather_financials │──┐
        │           └──────────────────┘  │
   START┤                                  ├──▶ synthesize ──▶ decide ──▶ END
        │           ┌──────────────────┐  │
        └──────────▶│   gather_news     │──┘
                    └──────────────────┘
```

This is a **LangGraph.js `StateGraph`** (see `src/lib/agent/graph.ts`), not a single
prompt. Four nodes, each independently inspectable:

- **`gather_financials`** — resolves the company name to a ticker via Alpha Vantage's
  `SYMBOL_SEARCH`, then pulls `OVERVIEW` (fundamentals) and `GLOBAL_QUOTE` (live price).
- **`gather_news`** — Tavily search scoped to recent news/outlook for the company.
- These two run **in parallel** (both branch from `START`) since they're independent
  I/O calls with no shared dependency — no reason to serialize them.
- **`synthesize`** — an LLM call that reads whatever structured data was actually
  retrieved (explicitly told when data is missing) and writes a ~400-word research note
  in its own words. Kept separate from the decision step so the note is inspectable on
  its own and the decision prompt stays short and focused.
- **`decide`** — a second, cooler (`temperature: 0`) LLM call that reads only the
  research note and returns **strict JSON** (verdict, confidence, thesis, bull/bear
  points, risks, a 4-axis scorecard). Parsed and validated server-side before being sent
  to the client — if the model returns something that isn't valid JSON, that surfaces as
  an explicit error rather than a silent crash or a fabricated decision.

### Streaming

The API route (`src/app/api/research/route.ts`) runs the graph with LangGraph's
`stream({ streamMode: "updates" })` and forwards each node's completion as a
Server-Sent Event, so the UI can show the trace updating live rather than a single
loading spinner for the whole ~10–20 second run. The front end reads the SSE stream
manually via `fetch` + `ReadableStream` (not `EventSource`, since `EventSource` can't
send a POST body).

### Front end

Plain Next.js App Router + Tailwind, no component library. Two panels once a run
starts: a terminal-styled **trace log** (`TraceLog.tsx`) showing each step's status and
timing, and a **verdict card** (`VerdictCard.tsx`) with a stamped verdict, confidence
bar, 4-axis scorecard, bull/bear lists, risk cards, and sources. Design direction: an
"analyst's desk" — ink-navy background, serif display face for the analyst's voice,
monospace for anything that's data (tickers, numbers, the trace log), and a rotated
verdict "stamp" as the one signature visual element.

---

## Key decisions & trade-offs

- **Google Gemini as the default provider.** Gemini's free tier (via [AI Studio](https://aistudio.google.com/app/apikey))
  is generous enough to run this whole app at zero cost, unlike Anthropic/OpenAI which
  require prepaid billing even for light testing — a meaningfully lower barrier for
  anyone running this to review it. Anthropic and OpenAI remain fully supported via
  `LLM_PROVIDER`; swapping is a one-line env change since all three go through the same
  `getChatModel()` factory in `src/lib/agent/llm.ts`.
- **Graceful degradation over hard dependency on paid APIs.** The brief says "any LLM
  provider and any other libraries / APIs / tools you like" — I chose to make Tavily
  (search) and Alpha Vantage (fundamentals) *optional*, not required, because free-tier
  financial/search APIs are rate-limited and I didn't want the whole submission to be a
  single point of failure if a reviewer runs it without registering for two more free
  API keys. The trade-off: without those keys, the "research" leans more on the LLM's
  training data than fresh data — which is exactly why the agent is built to say so
  explicitly (in the trace, and as a risk factor in its own decision) rather than
  quietly pretending otherwise.
- **Separate synthesize → decide steps instead of one mega-prompt.** Slower (two LLM
  calls instead of one) and costs more tokens, but makes the reasoning legible: you can
  read the research note on its own, and the decision node's job is narrow enough that
  asking for strict JSON back reliably works. I considered LangGraph's structured-output
  tool binding but kept it to a plain JSON-in-the-prompt approach for portability across
  the two providers I support (Anthropic and OpenAI have different native structured
  output APIs; a shared JSON convention keeps `llm.ts` a two-line provider swap).
- **Alpha Vantage over a paid financial data API** (e.g. Financial Modeling Prep
  premium, Polygon). Free tier is enough to demonstrate the pattern; the trade-off is a
  5 req/min rate limit and patchy coverage for non-US-listed companies (many Indian
  large-caps aren't covered well) — the agent handles a null/partial response as a
  normal case, not an error.
- **Parallel fan-out for the two research nodes, serial for synthesize → decide.** The
  research calls have no dependency on each other; the write-up genuinely needs both
  before it can proceed, and the decision genuinely needs the write-up. No point forcing
  extra latency where there's no dependency, and no point trying to parallelize where
  there is one.
- **`gemini-3.1-flash-lite` over `gemini-3.5-flash` as the shipped default.** The
  Gemini model lineup shifted meaningfully during development — `gemini-2.0-flash` was
  retired, then `gemini-2.5-flash` began returning deprecation errors as Google pushed
  the Gemini 3.x line. `gemini-3.5-flash` is the newer, more capable model, but its free
  tier caps out at a low daily request quota, which made it unreliable for repeated
  dev/test runs (let alone a reviewer running several companies back to back). Flash-Lite
  trades some reasoning depth for a materially higher free-tier quota, which matters more
  for this app's actual usage pattern than peak model quality on any single call.
- **What I left out, deliberately, given the 7-day scope:**
  - *No persistence / history.* Each run is stateless; there's no database of past
    verdicts. Would add real product value (e.g. "how has your view on X changed over
    time") but wasn't core to the brief.
  - *No multi-turn chat / follow-up questions on a verdict.* The agent is single-shot:
    company in, verdict out. A natural v2 would let you ask "why do you say the margins
    are shrinking?" and have the agent answer from its own research note.
  - *No SEC filings / annual report ingestion.* Would meaningfully deepen the
    fundamentals for a real research desk, but needed a PDF-parsing pipeline that felt
    like scope creep for the time box.
  - *No caching of financial/news lookups.* Every run re-fetches; fine for a demo,
    wasteful for anything with real traffic — Alpha Vantage's free tier especially would
    benefit from a short-TTL cache.
  - *No authentication / rate limiting on the API route itself* — reasonable for a
    take-home, not for anything public-facing.

---

## Example runs

The three examples below illustrate the **shape** of the output — same schema you'll get
from a real run, written the way the agent's JSON decision renders in the UI. They were
composed by hand (not screenshots from a live run) because this build environment
doesn't have LLM/search API keys configured; wording, numbers, and even the verdict
itself will differ when you run it live, since the model isn't temperature-0 in the
research step and real data changes over time. **Do not treat any figure below as
current or investment advice** — regenerate these yourself with your own API keys before
relying on them (the trace panel will show you exactly which tools fired, live).

### Nvidia

```
Verdict: WATCH · Confidence: 62%

Thesis: Nvidia's AI-accelerator dominance and data-center revenue growth remain
exceptional, but valuation already prices in years of continued hyper-growth, and
without a live search/financials key the model is working from general knowledge
rather than this quarter's numbers — that gap alone argues for a fresh look before
committing new capital rather than a clean yes or no.

Bull case:
+ Dominant share of AI training/inference accelerator market with a defensible
  CUDA software moat
+ Data center segment has been growing revenue at a pace few large-caps match
+ Diversifying into networking and enterprise AI software/services

Bear case:
- Valuation multiple assumes sustained hyper-growth; any deceleration is likely
  punished disproportionately
- Customer concentration: a handful of hyperscalers drive an outsized share of
  data-center revenue
- Export restrictions on advanced chips to China remain a live policy risk

Key risks:
[medium] Policy/export risk - further export controls could cut off a meaningful
revenue market with little notice
[medium] Valuation risk - priced for perfection; a single soft quarter could
trigger a sharp re-rating
[low] Competitive risk - AMD and custom silicon chip away at share over a
multi-year horizon
```

### Zomato

```
Verdict: PASS · Confidence: 58%

Thesis: Zomato's food-delivery and quick-commerce (Blinkit) growth is real, but
profitability in quick-commerce is still unproven at scale, competitive intensity
in Indian quick-commerce is unusually high, and margins in the newer segment look
thin - the growth story is ahead of the cash-flow story.

Bull case:
+ Market leadership in Indian food delivery with Blinkit adding a second
  high-growth vector
+ Asset-light delivery model scales revenue faster than fixed costs in the core
  business
+ Large, underpenetrated market for online food and quick-commerce in India

Bear case:
- Quick-commerce burns cash to fund dark-store expansion; segment profitability
  isn't proven yet at current growth rates
- Intense, well-funded competition compresses margins and raises acquisition costs
- Regulatory attention on gig-worker classification is an ongoing overhang

Key risks:
[high] Quick-commerce profitability risk - continued cash burn pressures the
balance sheet if unit economics don't improve
[medium] Competitive intensity - closer to a subsidy war than a settled market
[low] Regulatory risk - gig-economy labor rules could raise costs sector-wide
```

### Tata Elxsi

```
Verdict: INVEST · Confidence: 66%

Thesis: Tata Elxsi's engineering-and-design services model, concentrated in
automotive, media/broadcast, and healthcare R&D outsourcing, benefits from
structural tailwinds and carries a cleaner margin profile than commodity IT
services - the main watch item is customer concentration tied to global auto
capex cycles.

Bull case:
+ Differentiated positioning in high-value engineering R&D rather than commodity
  IT outsourcing
+ Automotive design-services demand is structurally growing with the shift to
  software-defined vehicles
+ Consistently strong operating margins relative to Indian IT-services peers

Bear case:
- Revenue is concentrated in a small number of large automotive and media
  clients; losing one is a meaningful hit
- Global auto industry capex is cyclical - a slowdown flows directly into
  design-services demand
- Dollar/euro-denominated revenue against rupee costs adds earnings volatility

Key risks:
[medium] Client concentration - a small number of large accounts drive an
outsized share of revenue
[medium] Cyclicality - tied to automotive and media capex cycles
[low] Talent/wage inflation - specialized engineering talent is competitive to
retain
```

---

## What I would improve with more time

- **Structured tool-calling instead of prompt-shaped JSON.** Bind the decision schema
  as a proper structured-output tool with provider-native schema enforcement instead of
  asking nicely for JSON and parsing it - more robust, especially on providers with
  weaker JSON-following.
- **A real financial-data provider with better global coverage** (many Indian and
  non-US tickers are poorly covered by Alpha Vantage's free tier) and a short-TTL cache
  so repeated queries for the same company don't burn rate limit or add latency.
- **Follow-up Q&A on a verdict.** Turn the single-shot flow into a short conversation
  where you can push back on the agent's reasoning ("what would change your mind?") and
  have it re-derive a verdict from the same research note.
- **Source-grounded citations inline in the note**, not just a flat source list at the
  end - link specific claims in the bull/bear case back to the specific article or
  filing that supports them.
- **A lightweight eval set** - a fixed list of companies with a human-labeled "sensible
  verdict range," run against the agent after any prompt change, to catch regressions in
  reasoning quality rather than eyeballing example runs.
- **Multi-model cross-check** - run the decision node on two different providers and
  flag disagreement as a signal that the case is genuinely borderline, rather than
  reporting single-model confidence as if it were a calibrated probability.
- **Retry/fallback logic around the LLM provider call** - transparently retry on
  transient `429`/`503` errors (with backoff) and, ideally, fall back to a secondary
  model or provider if the primary one is rate-limited or temporarily unavailable,
  rather than surfacing a raw provider error to the trace.

---

## Bonus: build session transcript

See [`transcripts/build-session.md`](transcripts/build-session.md) for a chronological
log of the AI-assisted build session: the architecture decisions made along the way, the
commands run, and the errors hit and fixed (a Google Fonts network failure during build,
two ESLint `no-explicit-any` fixes, a standalone script used to verify LangGraph's
parallel-fan-in join semantics before trusting them in the real graph).

---

## Project structure

```
src/
  app/
    page.tsx                  # main UI: input, streaming, layout
    layout.tsx
    globals.css                # design tokens
    api/research/route.ts      # SSE endpoint that runs the LangGraph agent
  components/
    TraceLog.tsx                # live agent trace panel
    VerdictCard.tsx              # verdict / scorecard / bull-bear / risks panel
  lib/
    agent/
      types.ts                   # shared state & output types
      llm.ts                      # provider factory (Anthropic / OpenAI)
      graph.ts                    # the LangGraph StateGraph itself
    tools/
      search.ts                    # Tavily wrapper
      financials.ts                 # Alpha Vantage wrapper
transcripts/
  build-session.md                 # bonus: AI build-session log
```