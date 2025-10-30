import React from "react";
import { useState } from "react";
import AIInsightsPanel from "./AIInsightsPanel";
import { aiInsightsGenerator } from "@/services/aiInsightsGenerator";

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

// Generate week-specific insights
const generateWeekInsights = (weekData, weekNumber, totalWeeks) => {
  const insights = [];
  const { income, expense, net } = weekData.summary;

  // Insight 1: Week performance
  if (net > 0) {
    const savingsRate = income > 0 ? ((net / income) * 100).toFixed(1) : 0;
    insights.push({
      type: "success",
      icon: "💰",
      title: `Week ${weekNumber}: Positive Balance`,
      message: `You saved ₱${fmt(
        net
      )} this week (${savingsRate}% savings rate).`,
      suggestion:
        savingsRate > 20
          ? `Excellent! You're exceeding the 20% savings benchmark.`
          : `Good progress. Try to reach 20% savings rate for optimal financial health.`,
    });
  } else {
    insights.push({
      type: "alert",
      icon: "🚨",
      title: `Week ${weekNumber}: Deficit Alert`,
      message: `You overspent by ₱${fmt(Math.abs(net))} this week.`,
      suggestion: `Review your expenses below to identify areas for cost reduction.`,
    });
  }

  // Insight 2: Daily spending pattern
  const avgDaily = expense / 7;
  const dailyBudget = income / 7;

  if (avgDaily > dailyBudget * 1.2) {
    insights.push({
      type: "warning",
      icon: "⚠️",
      title: "High Daily Spending",
      message: `Your average daily spend (₱${fmt(
        avgDaily
      )}) is 20% above your daily income (₱${fmt(dailyBudget)}).`,
      suggestion: `Reduce daily expenses by ₱${fmt(
        avgDaily - dailyBudget
      )} to break even.`,
    });
  } else if (avgDaily < dailyBudget * 0.8) {
    insights.push({
      type: "success",
      icon: "✅",
      title: "Efficient Spending",
      message: `You're spending 20% less than your daily income. Great discipline!`,
      suggestion: `Consider allocating the surplus (₱${fmt(
        (dailyBudget - avgDaily) * 7
      )} weekly) to savings or investments.`,
    });
  }

  // Insight 3: Top spending day
  const days = weekData.daily_series;
  if (days && days.length > 0) {
    const maxSpendDay = days.reduce(
      (max, day) => (Math.abs(day.net) > Math.abs(max.net) ? day : max),
      days[0]
    );

    const dayName = new Date(maxSpendDay.date).toLocaleDateString("en-US", {
      weekday: "long",
    });
    insights.push({
      type: "info",
      icon: "📊",
      title: "Peak Spending Day",
      message: `${dayName} (${
        maxSpendDay.date
      }) had the highest net flow at ₱${fmt(maxSpendDay.net)}.`,
      suggestion: `Review transactions on high-spending days to identify patterns.`,
    });
  }

  // Insight 4: Progress indicator
  insights.push({
    type: "analysis",
    icon: "📈",
    title: `Week ${weekNumber} of ${totalWeeks}`,
    message: `This is ${((weekNumber / totalWeeks) * 100).toFixed(
      0
    )}% through your statement period.`,
    details: `Income: ${fmt(income)} | Expenses: ${fmt(expense)} | Net: ${fmt(
      net
    )}`,
  });

  return insights;
};

export default function WeeklyReport({ report, hiddenTxIndices }) {
  console.log("DEBUG WeeklyReport received:", report);

  const [weekOffset, setWeekOffset] = useState(0);

  if (!report) return null;

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

  const DAYS_PER_WEEK = 7;
  const totalDays = daily_series.length;
  const totalWeeks = Math.ceil(totalDays / DAYS_PER_WEEK);
  const currentWeek = Math.max(0, Math.min(weekOffset, totalWeeks - 1));

  const startIdx = currentWeek * DAYS_PER_WEEK;
  const endIdx = Math.min(startIdx + DAYS_PER_WEEK, totalDays);
  const currentWeekData = daily_series.slice(startIdx, endIdx);

  // Recalculate summary for current week
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

  const maxAbs = Math.max(
    ...currentWeekData.map((d) => Math.abs(d.net || 0)),
    1
  );

  // Generate week-specific insights
  const weekInsights = generateWeekInsights(
    { summary: weekSummary, daily_series: currentWeekData },
    currentWeek + 1,
    totalWeeks
  );

  // Categorize transactions for the current week
  const weekCategories = {};
  const weekIncomeCategories = {};

  currentWeekData.forEach((day) => {
    const dayTransactions = transactions_by_day[day.date] || [];
    dayTransactions.forEach((tx) => {
      const category = tx.category || "uncategorized";
      const amount = Math.abs(tx.amount || 0);

      // Separate income and expenses
      if (tx.amount >= 0 || tx.type === "income") {
        weekIncomeCategories[category] =
          (weekIncomeCategories[category] || 0) + amount;
      } else {
        weekCategories[category] = (weekCategories[category] || 0) + amount;
      }
    });
  });

  // Get top expense categories (exclude income from this list)
  const topWeekCategories = Object.entries(weekCategories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="w-full p-4 space-y-6 text-gray-800">
      {/* Week navigation header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow">
        <button
          onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
          disabled={weekOffset === 0}
          className="px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          ← Previous Week
        </button>

        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">
            Week {currentWeek + 1} of {totalWeeks}
          </div>
          <div className="text-sm text-gray-600">
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

      {/* AI Insights for this week */}
      <AIInsightsPanel insights={weekInsights} />

      {/* Week summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-3 bg-white rounded shadow text-gray-800">
          <div className="text-sm text-gray-500">Total Income</div>
          <div className="text-xl font-bold text-green-600">
            {fmt(weekSummary.total_income || 0)}
          </div>
        </div>
        <div className="p-3 bg-white rounded shadow text-gray-800">
          <div className="text-sm text-gray-500">Total Expenses</div>
          <div className="text-xl font-bold text-red-600">
            {fmt(weekSummary.total_expenses || 0)}
          </div>
        </div>
        <div className="p-3 bg-white rounded shadow text-gray-800">
          <div className="text-sm text-gray-500">Net</div>
          <div
            className={`text-xl font-bold ${
              weekSummary.net >= 0 ? "text-blue-600" : "text-red-600"
            }`}
          >
            {fmt(weekSummary.net || 0)}
          </div>
        </div>
        <div className="p-3 bg-white rounded shadow text-gray-800">
          <div className="text-sm text-gray-500">Avg daily spend</div>
          <div className="text-xl font-bold">
            {fmt(weekSummary.avg_daily_spend || 0)}
          </div>
        </div>
      </div>

      {/* Daily spend heatmap */}
      <div className="p-4 bg-white rounded shadow text-gray-800">
        <h4 className="font-semibold mb-2">Daily spend heatmap</h4>
        <div className="flex space-x-2">
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
                className="flex items-center justify-center rounded text-xs font-semibold"
              >
                {new Date(d.date).toLocaleDateString(undefined, {
                  weekday: "short",
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Week-specific category breakdown - EXPENSES */}
      {topWeekCategories.length > 0 && (
        <div className="p-4 bg-white rounded shadow text-gray-800">
          <h4 className="font-semibold mb-3">
            Top expense categories this week
          </h4>
          <div className="space-y-3">
            {topWeekCategories.map(([cat, amount]) => {
              const percentage =
                weekSummary.total_expenses > 0
                  ? ((amount / weekSummary.total_expenses) * 100).toFixed(1)
                  : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium capitalize">
                      {cat}
                    </span>
                    <span className="text-sm font-bold text-red-600">
                      {fmt(amount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-red-500 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 font-medium min-w-[45px] text-right">
                      {percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week-specific category breakdown - INCOME */}
      {Object.keys(weekIncomeCategories).length > 0 && (
        <div className="p-4 bg-white rounded shadow text-gray-800">
          <h4 className="font-semibold mb-3">Income sources this week</h4>
          <div className="space-y-3">
            {Object.entries(weekIncomeCategories)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amount]) => {
                const percentage =
                  weekSummary.total_income > 0
                    ? ((amount / weekSummary.total_income) * 100).toFixed(1)
                    : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium capitalize">
                        {cat}
                      </span>
                      <span className="text-sm font-bold text-green-600">
                        {fmt(amount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-green-500 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 font-medium min-w-[45px] text-right">
                        {percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Daily transactions breakdown */}
      <div className="p-4 bg-white rounded shadow text-gray-800">
        <h4 className="font-semibold mb-3">Daily breakdown</h4>
        <div className="space-y-3">
          {currentWeekData.map((day) => (
            <div
              key={day.date}
              className="border-l-4 border-blue-500 pl-3 py-2 bg-gray-50 rounded"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{day.date}</div>
                  <div className="text-xs text-gray-500">
                    {day.transactions_count || 0} transactions
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    Income: {fmt(day.income || 0)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Expenses: {fmt(day.expense || 0)}
                  </div>
                  <div
                    className={`font-bold ${
                      day.net >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    Net: {fmt(day.net || 0)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
