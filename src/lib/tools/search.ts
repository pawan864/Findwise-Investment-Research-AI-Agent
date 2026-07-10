import type { NewsItem } from "@/lib/agent/types";

/**
 * Thin wrapper around the Tavily search API.
 * If no TAVILY_API_KEY is configured, this resolves to an empty array rather
 * than throwing — the agent is designed to degrade gracefully and lean more
 * on the LLM's own knowledge + financial data when web search isn't available.
 */
export async function searchNews(query: string, maxResults = 6): Promise<NewsItem[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "advanced",
        max_results: maxResults,
        include_answer: false,
        topic: "news",
      }),
    });

    if (!res.ok) return [];
    const data = await res.json();

    const results: NewsItem[] = (data.results ?? []).map(
      (r: { title?: string; url?: string; content?: string; published_date?: string }) => ({
        title: r.title ?? "Untitled",
        url: r.url ?? "",
        snippet: (r.content ?? "").slice(0, 400),
        source: r.url ? new URL(r.url).hostname.replace("www.", "") : undefined,
        publishedAt: r.published_date,
      })
    );

    return results;
  } catch {
    // Network / parsing failure -> degrade gracefully, don't crash the graph.
    return [];
  }
}
