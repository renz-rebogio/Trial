import React from "react";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    amount || 0
  );

const TransactionsTable = ({ transactions = [] }) => {
  if (!transactions || transactions.length === 0) return null;
  return (
    <div className="rounded-lg border bg-white shadow mb-6">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Transactions</h3>
      </div>
      <div className="p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-gray-700">Date</th>
              <th className="px-4 py-2 text-left text-gray-700">Description</th>
              <th className="px-4 py-2 text-right text-gray-700">Amount</th>
              <th className="px-4 py-2 text-left text-gray-700">Currency</th>
            </tr>
          </thead>
          <tbody className="divide-y bg-white">
            {transactions.map((t, i) => {
              const amt = Number(t.amount || 0);
              // infer display sign from type if present
              const isExpense = (t.type || "").toLowerCase() === "expense";
              const displayAmount = isExpense ? -Math.abs(amt) : Math.abs(amt);
              const colorClass =
                displayAmount < 0 ? "text-red-600" : "text-green-600";
              return (
                <tr key={i}>
                  <td className="px-4 py-2 text-gray-800">{t.date || "N/A"}</td>
                  <td className="px-4 py-2 text-gray-800">
                    {t.description || t.category || "-"}
                  </td>
                  <td
                    className={`px-4 py-2 text-right font-medium ${colorClass}`}
                  >
                    {displayAmount < 0 ? "-" : ""}
                    {formatCurrency(Math.abs(displayAmount))}
                  </td>
                  <td className="px-4 py-2 text-gray-800">
                    {t.currency || "PHP"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ExpenseSummaryView = ({ data }) => {
  if (!data?.summary || Object.keys(data.summary).length === 0) {
    return <p className="text-gray-500">No expense data available</p>;
  }
  return (
    <div className="rounded-lg border bg-white shadow">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Expense Summary</h3>
      </div>
      <div className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-gray-700">Category</th>
                <th className="px-4 py-2 text-left text-gray-700">Amount</th>
                <th className="px-4 py-2 text-left text-gray-700">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody className="divide-y bg-white">
              {Object.entries(data.summary).map(([category, details]) => {
                const total = Number(details?.total ?? 0) || 0;
                const pct = Number(details?.percentage ?? 0) || 0;
                return (
                  <tr key={category}>
                    <td className="px-4 py-2 text-gray-800 font-medium">
                      {category}
                    </td>
                    <td className="px-4 py-2 text-gray-800">
                      {formatCurrency(total)}
                    </td>
                    <td className="px-4 py-2 text-gray-800">
                      {pct.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {data.insight_text && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-700">{data.insight_text}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const AIReportDisplay = ({ result }) => {
  // DEBUG: ensure we know what arrived
  console.log("[AIReportDisplay] result prop:", result);

  if (!result) return null;
  const content = result.data || {};
  const transactions = result.transactions || result.inputTransactions || [];

  console.log(
    "[AIReportDisplay] content:",
    content,
    "transactions:",
    transactions
  );
  // Render transactions table first, then the existing summary view
  return (
    <div className="space-y-6">
      <TransactionsTable transactions={transactions} />
      {result.feature === "expense_summary" ? (
        <ExpenseSummaryView data={content} />
      ) : (
        // keep previous fallback for other features
        <div className="rounded-lg border bg-white shadow">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Analysis Results
            </h3>
          </div>
          <div className="p-4">
            <pre className="whitespace-pre-wrap overflow-auto bg-gray-50 p-4 rounded-lg text-sm">
              {JSON.stringify(content, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIReportDisplay;
