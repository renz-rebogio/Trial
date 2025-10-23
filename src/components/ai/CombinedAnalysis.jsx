import React from "react";
import ExpenseCanvas from "./ExpenseCanvas";
import CashFlowForecast from "./CashFlowCanvas";
import FlaggedTransactions from "./FlaggedTransactions";
import WeeklyReport from "./WeeklyReport";

const fmt = (v = 0) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(v);

export default function CombinedAnalysis({ result }) {
  if (!result?.summary) return null;

  const { summary, detailed_analyses } = result;

  return (
    <div className="space-y-8">
      {/* Executive Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Financial Overview</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-600">Net Position</div>
            <div className="text-2xl font-bold text-blue-700">
              {fmt(summary.financial_health.net_position)}
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-sm text-green-600">Total Income</div>
            <div className="text-2xl font-bold text-green-700">
              {fmt(summary.financial_health.total_income)}
            </div>
          </div>

          <div className="p-4 bg-red-50 rounded-lg">
            <div className="text-sm text-red-600">Total Expenses</div>
            <div className="text-2xl font-bold text-red-700">
              {fmt(summary.financial_health.total_expenses)}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="border rounded p-4">
            <h3 className="font-medium mb-2">Top Expenses</h3>
            <ul className="space-y-2">
              {summary.top_expenses.map(([category, data]) => (
                <li key={category} className="flex justify-between text-sm">
                  <span>{category}</span>
                  <span className="font-medium">{fmt(data.total)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border rounded p-4">
            <h3 className="font-medium mb-2">Key Metrics</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span>Transactions Analyzed</span>
                <span className="font-medium">
                  {summary.total_transactions}
                </span>
              </li>
              <li className="flex justify-between">
                <span>Flagged Transactions</span>
                <span className="font-medium">{summary.flagged_count}</span>
              </li>
              <li className="flex justify-between">
                <span>Cash Flow Trend</span>
                <span className="font-medium capitalize">
                  {summary.cash_flow_trend}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Detailed Analysis Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Expense Breakdown</h3>
          <ExpenseCanvas result={detailed_analyses.expense_summary} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Cash Flow Forecast</h3>
          <CashFlowForecast data={detailed_analyses.cash_flow_forecast} />
        </div>
      </div>

      {detailed_analyses.flagged_transactions?.flagged?.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Flagged Transactions</h3>
            <FlaggedTransactions
              insights={detailed_analyses.flagged_transactions}
              transactions={result.transactions}
            />
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Weekly Analysis</h3>
          <WeeklyReport report={detailed_analyses.weekly_report} />
        </div>
      </div>
    </div>
  );
}
