"use client";

import { useState } from "react";

interface SectorGroup {
  id: string;
  label: string;
  stocks: Array<{ name: string; ticker: string; tag: string }>;
}

const SECTOR_GROUPS: SectorGroup[] = [
  {
    id: "trending",
    label: "🔥 Market Favorites",
    stocks: [
      { name: "Nvidia", ticker: "NVDA", tag: "AI Leader" },
      { name: "Tesla", ticker: "TSLA", tag: "EV/Robotics" },
      { name: "Zomato", ticker: "ZOMATO", tag: "Quick Commerce" },
      { name: "Tata Elxsi", ticker: "TATAELXSI", tag: "Auto Eng." },
    ],
  },
  {
    id: "ai_semi",
    label: "⚡ AI & Silicon",
    stocks: [
      { name: "Palantir", ticker: "PLTR", tag: "Enterprise AI" },
      { name: "TSMC", ticker: "TSM", tag: "Foundry Monop." },
      { name: "AMD", ticker: "AMD", tag: "Data Center" },
      { name: "Broadcom", ticker: "AVGO", tag: "Custom ASIC" },
    ],
  },
  {
    id: "mega_tech",
    label: "🏛️ Tech Monopolies",
    stocks: [
      { name: "Apple", ticker: "AAPL", tag: "Consumer Moat" },
      { name: "Microsoft", ticker: "MSFT", tag: "Cloud/SaaS" },
      { name: "Amazon", ticker: "AMZN", tag: "E-Com/AWS" },
      { name: "Alphabet", ticker: "GOOGL", tag: "Search & Ad" },
    ],
  },
  {
    id: "india_growth",
    label: "🇮🇳 India Growth",
    stocks: [
      { name: "Reliance Industries", ticker: "RELIANCE", tag: "Conglomerate" },
      { name: "HDFC Bank", ticker: "HDFCBANK", tag: "Banking Giant" },
      { name: "Varun Beverages", ticker: "VBL", tag: "FMCG Favourites" },
      { name: "Trent", ticker: "TRENT", tag: "Retail Hyper" },
    ],
  },
];

export default function SectorPills({
  onSelectCompany,
  disabled,
}: {
  onSelectCompany: (company: string) => void;
  disabled?: boolean;
}) {
  const [activeTab, setActiveTab] = useState("trending");

  const currentGroup = SECTOR_GROUPS.find((g) => g.id === activeTab) ?? SECTOR_GROUPS[0];

  return (
    <div className="w-full">
      {/* Category selector tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-[12px]">
        {SECTOR_GROUPS.map((group) => {
          const isActive = group.id === activeTab;
          return (
            <button
              key={group.id}
              onClick={() => setActiveTab(group.id)}
              className="px-3 py-1.5 rounded-full border text-xs whitespace-nowrap transition-all duration-150 cursor-pointer"
              style={{
                borderColor: isActive ? "var(--invest)" : "var(--line)",
                background: isActive ? "var(--ink-800)" : "transparent",
                color: isActive ? "var(--parchment)" : "var(--parchment-faint)",
                fontWeight: isActive ? 500 : 400,
              }}
            >
              {group.label}
            </button>
          );
        })}
      </div>

      {/* Stock pills in selected category */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3">
        {currentGroup.stocks.map((stock) => (
          <button
            key={stock.ticker}
            onClick={() => onSelectCompany(stock.name)}
            disabled={disabled}
            className="group flex flex-col p-2.5 rounded-lg border text-left transition-all duration-200 hover:border-[var(--invest)] hover:bg-[var(--ink-800)] disabled:opacity-40 cursor-pointer"
            style={{
              borderColor: "var(--line)",
              background: "var(--ink-900)",
            }}
          >
            <div className="flex items-center justify-between w-full">
              <span
                className="text-[13px] font-semibold group-hover:text-[var(--parchment)] transition-colors truncate"
                style={{ color: "var(--parchment-dim)" }}
              >
                {stock.name}
              </span>
              <span
                className="text-[10px] uppercase font-mono px-1 py-0.2 rounded"
                style={{
                  background: "var(--ink-700)",
                  color: "var(--parchment-faint)",
                  fontFamily: "var(--font-data)",
                }}
              >
                {stock.ticker}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px]">
              <span style={{ color: "var(--parchment-faint)" }}>{stock.tag}</span>
              <span
                className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity font-medium"
                style={{ color: "var(--invest)" }}
              >
                Inspect →
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
