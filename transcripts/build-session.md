# Build session transcript

This is a chronological account of the AI-assisted build session for this project,
produced with Claude (Anthropic) working inside an agentic coding environment with real
file-system and shell access (not a chat-only assistant pasting code blocks). It's
reconstructed from the actual sequence of decisions, commands, and fixes made during the
build — not written after the fact as a clean narrative.

---

## 1. Brief intake

**Prompt (paraphrased):** build an AI Investment Research Agent — takes a company name,
researches it, decides invest/pass with reasoning — using React/Next.js, Node.js,
LangChain.js/LangGraph.js, any LLM provider.

**First response:** rather than start writing code immediately, clarified a few load-
bearing choices before scaffolding: which LLM provider, which data sources for
"research" (web search vs. financial APIs vs. both), and whether the agent should be a
single prompt or an explicit multi-step graph. Decided to default to Anthropic (Claude)
as the LLM, Tavily for news search and Alpha Vantage for fundamentals as *optional*
enrichment tools, and an explicit LangGraph `StateGraph` with named nodes rather than one
big prompt — mainly because the README needs to explain "how it works," and a graph with
inspectable nodes is a much better artifact to explain and defend than a single opaque
prompt.

The user's actual next message was simply "no build and provide me zip" — i.e., stop
asking, build it, package it. Proceeded on the defaults above rather than blocking on
further clarification, and documented every default/assumption in the README's "Key
decisions" section instead.

## 2. Scaffolding

- `npx create-next-app@latest` with TypeScript, Tailwind, App Router, `src/` directory.
- `npm install @langchain/core @langchain/anthropic @langchain/openai @langchain/langgraph zod`.
- Removed the auto-generated `AGENTS.md` / `CLAUDE.md` files create-next-app's newer
  versions scaffold by default — not relevant to this deliverable.

## 3. Agent core

Built in this order, each piece checked before moving to the next:

1. `src/lib/agent/types.ts` — shared `AgentState`, `AgentDecision`, `TraceStep` etc.
   Written first and deliberately kept as the single source of truth for shape, since
   the graph, the API route, and the UI all need to agree on it.
2. `src/lib/tools/search.ts` and `src/lib/tools/financials.ts` — thin wrappers around
   Tavily and Alpha Vantage. Both designed from the start to return `null`/`[]` rather
   than throw when no API key is configured, since "the agent still works with just an
   LLM key" was a deliberate design goal, not an afterthought.
3. `src/lib/agent/llm.ts` — a one-function provider factory so switching Anthropic ↔
   OpenAI is an env var, not a code change.
4. `src/lib/agent/graph.ts` — the actual `StateGraph`: `gather_financials` and
   `gather_news` fan out from `START` in parallel, both feed `synthesize`, which feeds
   `decide`, which feeds `END`.

## 4. Verifying LangGraph's parallel-fan-in behavior before trusting it

Before wiring the real graph's `synthesize` node to depend on both `gather_financials`
and `gather_news`, wrote a standalone throwaway script (`test_graph.mjs`, deleted after)
with two mock async nodes of different latencies feeding a shared "join" node, and ran
it directly with `node` against the installed `@langchain/langgraph` package. First
attempt hit a naming collision (used `a`/`b` as both node names and state keys — the
library correctly threw `Error: a is already being used as a state attribute...`).
Renamed to `gather_a`/`gather_b`/`join_step` and reran; output confirmed the join node
only executes once, after both branches complete, regardless of which one finishes
first. That confirmed the real graph's `synthesize` node — which depends on both
research nodes — doesn't need any extra synchronization logic; LangGraph's `updates`
streaming mode handles it correctly out of the box.

## 5. API route and streaming

Built `src/app/api/research/route.ts` around `app.stream({ ... }, { streamMode:
"updates" })`, translating each node's completion into a Server-Sent Event. Chose
manual `fetch` + `ReadableStream` parsing on the client instead of the browser's
`EventSource` API specifically because `EventSource` only supports GET requests, and the
company name needs to go up as a POST body.

## 6. Front end and design pass

Followed a design-token-first process: named a concrete direction ("analyst's desk" —
ink-navy background, serif display voice, monospace for anything that's data, a rotated
verdict "stamp" as the one signature element) before writing component code, specifically
to avoid the generic cream/terracotta or near-black/neon looks that AI-generated UIs
default to. Built `globals.css` tokens first, then `TraceLog.tsx` (the live trace panel)
and `VerdictCard.tsx` (the stamped decision panel) as separate components, then wired
them together in `page.tsx` with the streaming/parsing logic.

## 7. Build, lint, and fixes

Ran `npm run build` early and often rather than writing everything then checking once.
Issues hit and how they were resolved:

- **Google Fonts fetch failure at build time** (`next/font/google` for Fraunces / Inter /
  IBM Plex Mono — the build sandbox's network allowlist doesn't include
  `fonts.googleapis.com`). Rather than leave a build that only works with unrestricted
  network access, swapped to system font stacks (`--font-display`, `--font-body`,
  `--font-data` CSS variables pointing at OS-native serif/sans/mono faces) that
  approximate the same pairing without any external fetch. Documented in `globals.css`
  as a comment, with a note on swapping back to `next/font/google` if desired.
- **Two ESLint `@typescript-eslint/no-explicit-any` errors** — one in `graph.ts`'s
  decision-parsing code, one in `financials.ts`'s generic JSON fetch helper. Fixed by
  giving both a real structural type (`Record<string, unknown>` plus a narrow expected
  shape) instead of suppressing the rule.
- **A TypeScript narrowing error** on the `verdict` field after removing `any` — `Array
  .includes` doesn't narrow a union type in TS, so switched to an explicit `===` chain.

## 8. End-to-end smoke test without live API keys

Started the production build (`npm run start`) and sent a request to `/api/research`
with no environment variables set, to verify the "no keys configured" path degrades
gracefully rather than crashing:

```
data: {"type":"trace","step":{"id":"gather_financials","status":"running",...}}
data: {"type":"trace","step":{"id":"gather_news","status":"running",...}}
data: {"type":"trace","step":{"id":"gather_financials","status":"done","detail":"No financial data provider configured or ticker not resolved — continuing without it."}}
data: {"type":"trace","step":{"id":"gather_news","status":"done","detail":"No search provider configured — continuing on model knowledge only."}}
data: {"type":"error","message":"Anthropic API key not found"}
```

This confirmed exactly the intended behavior: both research nodes complete and report
their degraded state honestly, and the pipeline only fails at the point an LLM call is
actually attempted with no key — a clean, explainable failure rather than a crash. This
build environment has no LLM API keys available, so the "Example runs" in the README are
hand-composed to show the output schema rather than pasted from a live run; the README
says so explicitly and asks the user to regenerate with their own keys before submitting.

## 9. Packaging

Final `npm run build` + `npm run lint` pass clean. Removed `node_modules` and `.next`
before zipping (restored via `npm install` / `npm run build` on the user's end) to keep
the deliverable small. `.env.local` shipped as a blank copy of `.env.example` — no real
keys anywhere in the zip.
