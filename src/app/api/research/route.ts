import { NextRequest } from "next/server";
import { buildResearchGraph } from "@/lib/agent/graph";
import type { StreamEvent, TraceStep } from "@/lib/agent/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const STEP_LABELS: Record<string, string> = {
  gather_financials: "Pulling financial fundamentals",
  gather_news: "Searching recent news & developments",
  synthesize: "Writing research note",
  decide: "Weighing the evidence & deciding",
};

export async function POST(req: NextRequest) {
  const { company } = await req.json();

  if (!company || typeof company !== "string" || !company.trim()) {
    return new Response(JSON.stringify({ error: "A company name is required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: StreamEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      const trace: Record<string, TraceStep> = {};
      const emitStep = (id: string, status: TraceStep["status"], detail?: string) => {
        const now = Date.now();
        const existing = trace[id];
        const step: TraceStep = {
          id,
          label: STEP_LABELS[id] ?? id,
          status,
          detail,
          startedAt: existing?.startedAt ?? (status === "running" ? now : undefined),
          finishedAt: status === "done" || status === "error" ? now : existing?.finishedAt,
        };
        trace[id] = step;
        send({ type: "trace", step });
      };

      try {
        const app = buildResearchGraph();

        // Mark the parallel research steps as running immediately.
        emitStep("gather_financials", "running");
        emitStep("gather_news", "running");

        const stream = await app.stream(
          { company: company.trim() },
          { streamMode: "updates" }
        );

        for await (const update of stream) {
          for (const nodeName of Object.keys(update)) {
            if (nodeName === "gather_financials") {
              const hasData = !!update.gather_financials?.financials;
              emitStep(
                "gather_financials",
                "done",
                hasData
                  ? "Fundamentals retrieved."
                  : "No financial data provider configured or ticker not resolved — continuing without it."
              );
            }
            if (nodeName === "gather_news") {
              const count = update.gather_news?.news?.length ?? 0;
              emitStep(
                "gather_news",
                "done",
                count > 0
                  ? `${count} recent articles found.`
                  : "No search provider configured — continuing on model knowledge only."
              );
            }
            if (nodeName === "synthesize") {
              emitStep("synthesize", "done", "Research note drafted.");
              emitStep("decide", "running");
            }
            if (nodeName === "decide") {
              if (update.decide?.error) {
                emitStep("decide", "error", update.decide.error);
                send({ type: "error", message: update.decide.error });
              } else if (update.decide?.decision) {
                emitStep("decide", "done", `Verdict: ${update.decide.decision.verdict}`);
                send({ type: "decision", decision: update.decide.decision });
              }
            }
          }
        }

        send({ type: "done" });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error running the research agent.";
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
