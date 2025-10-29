import React from "react";
import FlaggedTransactions from "./FlaggedTransactions";
import { useState } from "react";

const fmt = (v = 0) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    v
  );

// small heat color helper
const heatColor = (v, max) => {
  if (max <= 0) return "#eee";
  const p = Math.min(1, Math.abs(v) / max);
  const r = Math.round(255 * p);
  const g = 220 - Math.round(120 * p);
  return `rgb(${r},${g},150)`;
};

function getContrastColor(rgbStr) {
  try {
    if (typeof rgbStr !== "string") return "#111";
    const hexMatch = rgbStr.match(/^#?([0-9a-f]{6})$/i);
    if (hexMatch) {
      const hex = hexMatch[1];
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return lum > 0.6 ? "#111" : "#fff";
    }
    const m = rgbStr.match(/rgb\s*\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)/i);
    if (m) {
      const r = Number(m[1]),
        g = Number(m[2]),
        b = Number(m[3]);
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return lum > 0.6 ? "#111" : "#fff";
    }
  } catch (e) {}
  return "#111";
}

export default function WeeklyReport({ report, hiddenTxIndices }) {
  console.log("DEBUG WeeklyReport received:", report);

  // ADD THESE LINES - State for week navigation
  const [weekOffset, setWeekOffset] = useState(0);

  if (!report) return null;

  // tolerant unwrapping if nested
  const payload = (report.data && (report.data.data || report.data)) || report;

  const {
    summary = {},
    daily_series = [],
    weekly_waterfall = [],
    category_tree = [],
    category_sparklines = [],
    distribution = {},
    flagged = [],
    transactions_by_day = {},
  } = payload;

  if (!daily_series || !daily_series.length) {
    return (
      <div className="p-4 text-center text-gray-700">
        No transaction data available for the selected period
      </div>
    );
  }

  // ADD THIS - Calculate week boundaries and slice data
  const DAYS_PER_WEEK = 7;
  const totalDays = daily_series.length;
  const totalWeeks = Math.ceil(totalDays / DAYS_PER_WEEK);
  const currentWeek = Math.max(0, Math.min(weekOffset, totalWeeks - 1));

  const startIdx = currentWeek * DAYS_PER_WEEK;
  const endIdx = Math.min(startIdx + DAYS_PER_WEEK, totalDays);
  const currentWeekData = daily_series.slice(startIdx, endIdx);

  // ADD THIS - Recalculate summary for current week
  const weekSummary = {
    total_income: currentWeekData.reduce((sum, d) => sum + (d.income || 0), 0),
    total_expenses: currentWeekData.reduce(
      (sum, d) => sum + (d.expense || 0),
      0
    ),
    net: currentWeekData.reduce((sum, d) => sum + (d.net || 0), 0),
    avg_daily_spend:
      currentWeekData.reduce((sum, d) => sum + Math.abs(d.net || 0), 0) /
      currentWeekData.length,
    transaction_count: currentWeekData.reduce(
      (sum, d) => sum + (d.transactions_count || 0),
      0
    ),
  };

  const maxAbs = Math.max(...daily_series.map((d) => Math.abs(d.net || 0)), 1);

  return (
    <div className="max-h-[80vh] overflow-auto p-4 space-y-6 text-gray-800 w-full max-w-full">
      {/* ADD THIS - Week navigation header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow">
        <button
          onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
          disabled={weekOffset === 0}
          className="px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          ← Previous Week
        </button>

        <div className="text-center">
          <div className="text-sm font-semibold text-gray-700">
            Week {currentWeek + 1} of {totalWeeks}
          </div>
          <div className="text-xs text-gray-500">
            {currentWeekData[0]?.date} -{" "}
            {currentWeekData[currentWeekData.length - 1]?.date}
          </div>
        </div>

        <button
          onClick={() =>
            setWeekOffset(Math.min(totalWeeks - 1, weekOffset + 1))
          }
          disabled={weekOffset >= totalWeeks - 1}
          className="px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Next Week →
        </button>
      </div>

      {/* CHANGE THIS - Use weekSummary instead of summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-3 bg-white rounded shadow text-gray-800">
          <div className="text-sm text-gray-500">Total Income</div>
          <div className="text-xl font-bold">
            {fmt(weekSummary.total_income || 0)}
          </div>
        </div>
        <div className="p-3 bg-white rounded shadow text-gray-800">
          <div className="text-sm text-gray-500">Total Expenses</div>
          <div className="text-xl font-bold">
            {fmt(weekSummary.total_expenses || 0)}
          </div>
        </div>
        <div className="p-3 bg-white rounded shadow text-gray-800">
          <div className="text-sm text-gray-500">Net</div>
          <div className="text-xl font-bold">{fmt(weekSummary.net || 0)}</div>
        </div>
        <div className="p-3 bg-white rounded shadow text-gray-800">
          <div className="text-sm text-gray-500">Avg daily spend</div>
          <div className="text-xl font-bold">
            {fmt(weekSummary.avg_daily_spend || 0)}
          </div>
        </div>
      </div>

      <div className="p-4 bg-white rounded shadow text-gray-800">
        <h4 className="font-semibold mb-2">Daily spend heatmap</h4>
        <div className="flex space-x-2">
          {/* CHANGE THIS - Use currentWeekData instead of daily_series */}
          {currentWeekData.map((d) => {
            const bg = heatColor(d.net, maxAbs);
            const textColor = getContrastColor(bg);
            return (
              <div
                key={d.date}
                title={`${d.date}: ${fmt(d.net)}`}
                style={{
                  width: 48,
                  height: 48,
                  background: bg,
                  color: textColor,
                }}
                className="flex items-center justify-center rounded"
              >
                <div className="text-xs font-semibold">
                  {new Date(d.date).toLocaleDateString(undefined, {
                    weekday: "short",
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 bg-white rounded shadow text-gray-800">
        <h4 className="font-semibold mb-2">Waterfall</h4>
        <div className="flex items-end space-x-2">
          {weekly_waterfall.map((w) => {
            const val = Math.abs(w.value || 0);
            const total = Math.max(
              1,
              weekly_waterfall.reduce((s, x) => s + Math.abs(x.value || 0), 0)
            );
            const width = Math.min(300, Math.round((val / total) * 300));
            const bg =
              w.label === "expense"
                ? "#ef4444"
                : w.label === "net"
                ? "#3b82f6"
                : "#10b981";
            const textColor = getContrastColor(bg);
            return (
              <div key={w.label} className="text-center" style={{ width }}>
                <div
                  style={{ height: 36, background: bg, color: textColor }}
                  className="rounded-t flex items-center justify-center text-xs"
                >
                  {w.label}
                </div>
                <div className="text-xs mt-1 text-gray-800">{fmt(w.value)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 bg-white rounded shadow text-gray-800">
        <h4 className="font-semibold mb-2">Category treemap</h4>
        <div className="flex flex-wrap gap-2">
          {category_tree.map((c) => {
            const area = Math.max(40, Math.round((c.total || 0) * 0.02));
            const bg = "#f3f4f6";
            const textColor = getContrastColor(bg);
            return (
              <div
                key={c.name}
                title={`${c.name}: ${fmt(c.total)}`}
                style={{
                  minWidth: area,
                  minHeight: 48,
                  background: bg,
                  color: textColor,
                }}
                className="p-2 rounded"
              >
                <div className="text-sm font-semibold">{c.name}</div>
                <div className="text-xs">{fmt(c.total)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded shadow text-gray-800">
          <h4 className="font-semibold mb-2">Distribution (boxplot)</h4>
          <div className="text-sm">median: {fmt(distribution.median || 0)}</div>
          <div className="text-sm">
            Q1: {fmt(distribution.q1 || 0)} Q3: {fmt(distribution.q3 || 0)}
          </div>
          <div className="mt-2 text-xs text-gray-600">
            Outliers: {distribution.outliers?.length || 0}
          </div>
        </div>

        <div className="p-4 bg-white rounded shadow col-span-2 text-gray-800">
          <h4 className="font-semibold mb-2">Category sparklines</h4>
          <div className="flex gap-3">
            {category_sparklines.map((s) => {
              const vals = s.series.map((pt) => pt.amount || 0);
              const min = Math.min(...vals, 0);
              const max = Math.max(...vals, 1);
              return (
                <div key={s.category} className="text-xs">
                  <div className="font-medium">{s.category}</div>
                  <svg
                    width="120"
                    height="34"
                    viewBox="0 0 120 34"
                    preserveAspectRatio="none"
                  >
                    <polyline
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      points={s.series
                        .map((pt, i) => {
                          const x =
                            (i / Math.max(1, s.series.length - 1)) * 120;
                          const y =
                            34 - ((pt.amount - min) / (max - min || 1)) * 30;
                          return `${x},${y}`;
                        })
                        .join(" ")}
                    />
                  </svg>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {flagged && flagged.length > 0 && (
        <div className="p-4 bg-white rounded shadow text-gray-800">
          <h4 className="font-semibold mb-2">Flagged transactions</h4>
          <FlaggedTransactions
            insights={{ flagged }}
            transactions={[].concat(
              ...Object.values(transactions_by_day || {})
            )}
          />
        </div>
      )}
    </div>
  );
}
