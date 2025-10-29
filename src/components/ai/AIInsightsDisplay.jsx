import React from "react";
import ExpenseCanvas from "./ExpenseCanvas.jsx";
import CashFlowCanvas from "./CashFlowCanvas.jsx";
import FlaggedTransactions from "./FlaggedTransactions.jsx";
import WeeklyReport from "./WeeklyReport.jsx";

const ExpenseSummaryTable = ({ data }) => {
  if (!data?.summary || Object.keys(data.summary).length === 0) {
    return <p className="text-gray-500 italic">No expense data available</p>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Percentage
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.entries(data.summary).map(([category, details]) => (
              <tr
                key={category}
                className={category === data.top_category ? "bg-blue-50" : ""}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ₱
                  {details.total.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {details.percentage}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.insight_text && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-700">{data.insight_text}</p>
        </div>
      )}
    </div>
  );
};

const CombinedAnalysis = ({ data }) => {
  if (!data?.detailed_analyses) {
    return (
      <div className="text-gray-500 italic">
        No combined analysis data available
      </div>
    );
  }

  const { detailed_analyses } = data;

  return (
    <div className="space-y-8">
      {/* Summary Overview */}
      {data.summary && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
          <h3 className="text-xl font-bold text-blue-900 mb-3">
            📊 Analysis Overview
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Transactions:</span>
              <span className="font-semibold ml-2">
                {data.summary.total_transactions}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Date Range:</span>
              <span className="font-semibold ml-2">
                {data.summary.date_range?.start} to{" "}
                {data.summary.date_range?.end}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Expense Summary */}
      {detailed_analyses.expense_summary && (
        <div className="border-2 border-gray-200 rounded-lg p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            💰 Expense Summary
          </h3>
          <ExpenseCanvas result={detailed_analyses.expense_summary} />
        </div>
      )}

      {/* Cash Flow Forecast */}
      {detailed_analyses.cash_flow_forecast && (
        <div className="border-2 border-gray-200 rounded-lg p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            📈 Cash Flow Forecast
          </h3>
          <CashFlowCanvas data={detailed_analyses.cash_flow_forecast} />
        </div>
      )}

      {/* Flagged Transactions */}
      {detailed_analyses.flagged_transactions && (
        <div className="border-2 border-gray-200 rounded-lg p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            ⚠️ Flagged Transactions
          </h3>
          <FlaggedTransactions
            insights={detailed_analyses.flagged_transactions}
            transactions={data.transactions || []}
          />
        </div>
      )}

      {/* Weekly Report */}
      {detailed_analyses.weekly_report && (
        <div className="border-2 border-gray-200 rounded-lg p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            📅 Weekly Report
          </h3>
          <WeeklyReport report={detailed_analyses.weekly_report} />
        </div>
      )}
    </div>
  );
};

const AIInsightsDisplay = ({ feature, data }) => {
  console.log("AIInsightsDisplay received:", { feature, data });

  if (!data) {
    return (
      <div className="text-gray-500 italic">No analysis data available</div>
    );
  }

  switch (feature) {
    case "expense_summary":
      return <ExpenseCanvas result={data} />;

    case "cash_flow_forecast":
      return <CashFlowCanvas data={data} />;

    case "flag_unusual_transactions":
      return (
        <FlaggedTransactions
          insights={data}
          transactions={data.transactions || []}
        />
      );

    case "weekly_report":
      return <WeeklyReport report={data} />;

    case "combined_insights":
      return <CombinedAnalysis data={data} />;

    default:
      // Fallback to JSON display for unknown features
      return (
        <div>
          <p className="text-yellow-600 mb-4">
            ⚠️ Unknown feature type: {feature}
          </p>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm max-h-96">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      );
  }
};

export default AIInsightsDisplay;
