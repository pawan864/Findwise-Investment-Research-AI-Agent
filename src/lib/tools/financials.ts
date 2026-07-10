import type { FinancialSnapshot } from "@/lib/agent/types";

/**
 * Resolves a free-text company name to a likely ticker symbol using Alpha
 * Vantage's SYMBOL_SEARCH endpoint, then pulls fundamentals via OVERVIEW and
 * a live quote via GLOBAL_QUOTE.
 *
 * Alpha Vantage's free tier is rate-limited (5 req/min, 25/day) and often
 * returns partial data for non-US tickers — this is treated as expected and
 * handled gracefully rather than as an error. If ALPHAVANTAGE_API_KEY is
 * missing, the function returns null and the agent falls back to
 * LLM-knowledge + web search only.
 */
export async function fetchFinancials(companyName: string): Promise<FinancialSnapshot | null> {
  const apiKey = process.env.ALPHAVANTAGE_API_KEY;
  if (!apiKey) return null;

  try {
    const ticker = await resolveTicker(companyName, apiKey);
    if (!ticker) return null;

    const [overview, quote] = await Promise.all([
      fetchJSON(
        `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${encodeURIComponent(
          ticker
        )}&apikey=${apiKey}`
      ),
      fetchJSON(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(
          ticker
        )}&apikey=${apiKey}`
      ),
    ]);

    if (!overview || Object.keys(overview).length === 0) {
      return { ticker, source: "alphavantage" };
    }

    const globalQuote = (quote?.["Global Quote"] as Record<string, unknown> | undefined) ?? {};
    const price = toNumber(globalQuote["05. price"]);

    const snapshot: FinancialSnapshot = {
      ticker,
      name: str(overview.Name),
      currency: str(overview.Currency),
      price,
      marketCap: toNumber(overview.MarketCapitalization),
      peRatio: toNumber(overview.PERatio),
      eps: toNumber(overview.EPS),
      revenueTTM: toNumber(overview.RevenueTTM),
      revenueGrowthYoY: toNumber(overview.QuarterlyRevenueGrowthYOY),
      profitMargin: toNumber(overview.ProfitMargin),
      debtToEquity: undefined, // not provided by OVERVIEW; left for future enrichment
      fiftyTwoWeekHigh: toNumber(overview["52WeekHigh"]),
      fiftyTwoWeekLow: toNumber(overview["52WeekLow"]),
      sector: str(overview.Sector),
      industry: str(overview.Industry),
      description: str(overview.Description),
      raw: overview,
      source: "alphavantage",
    };

    return snapshot;
  } catch {
    return null;
  }
}

async function resolveTicker(companyName: string, apiKey: string): Promise<string | null> {
  const data = await fetchJSON(
    `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(
      companyName
    )}&apikey=${apiKey}`
  );
  const matches = data?.bestMatches as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(matches) || matches.length === 0) return null;
  return str(matches[0]["1. symbol"]) ?? null;
}

async function fetchJSON(url: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

function toNumber(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "None" || v === "-") return undefined;
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : undefined;
}

function str(v: unknown): string | undefined {
  if (v === undefined || v === null || v === "None") return undefined;
  return String(v);
}
