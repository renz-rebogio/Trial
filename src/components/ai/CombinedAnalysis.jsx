import React from "react";
import ExpenseCanvas from "./ExpenseCanvas";
import CashFlowForecast from "./CashFlowCanvas";
import FlaggedTransactions from "./FlaggedTransactions";
import WeeklyReport from "./WeeklyReport";

export default function CombinedAnalysis({ result }) {
  if (!result || !result.data) {
    return (
      <div className="p-4 text-gray-700">
        No combined analysis data available.
      </div>
    );
  }

  const { summary, detailed_analyses } = result.data;

  return (
    <div className="space-y-8 p-4">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold mb-4 text-gray-800">
          📊 Combined Financial Analysis
        </h2>
        <div className="grid grid-cols-3 gap-4 text-gray-700">
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">Total Transactions</div>
            <div className="text-2xl font-bold">
              {summary?.total_transactions || 0}
            </div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">Date Range</div>
            <div className="text-sm font-semibold">
              {summary?.date_range?.start} to {summary?.date_range?.end}
            </div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">Generated</div>
            <div className="text-sm">
              {new Date(result.data.generated_at).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Expense Summary Section */}
      {detailed_analyses?.expense_summary && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-2xl font-bold mb-4 text-gray-800">
            💰 Expense Summary
          </h3>
          <ExpenseCanvas
            result={{
              feature: "expense_summary",
              ...detailed_analyses.expense_summary,
            }}
          />
        </div>
      )}

      {/* Cash Flow Forecast Section */}
      {detailed_analyses?.cash_flow_forecast && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-2xl font-bold mb-4 text-gray-800">
            📈 Cash Flow Forecast
          </h3>
          <CashFlowForecast data={detailed_analyses.cash_flow_forecast} />
        </div>
      )}

      {/* Flagged Transactions Section */}
      {detailed_analyses?.flagged_transactions && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-2xl font-bold mb-4 text-gray-800">
            ⚠️ Unusual Transactions
          </h3>
          <FlaggedTransactions
            insights={detailed_analyses.flagged_transactions}
            transactions={result.transactions}
          />
        </div>
      )}

      {/* Weekly Report Section */}
      {detailed_analyses?.weekly_report && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-2xl font-bold mb-4 text-gray-800">
            📅 Weekly Report
          </h3>
          <WeeklyReport report={detailed_analyses.weekly_report} />
        </div>
      )}
    </div>
  );
}
