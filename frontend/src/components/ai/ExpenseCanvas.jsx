import React from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Colors,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, Colors);

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    amount
  );

const buildSummaryFromTransactions = (transactions = []) => {
  // Initialize summary objects for both amounts and categories
  const expenses = {
    amounts: {}, // For amount-based pie
    categories: {}, // For category-based pie
  };
  const incomes = {
    amounts: {}, // For amount-based pie
    categories: {}, // For category-based pie
  };

  transactions.forEach((t) => {
    const amt = Number(t.amount ?? 0);
    const isExpense = amt < 0;
    const absAmt = Math.abs(amt);
    const category = t.category || "uncategorized";

    // Sort into expenses or incomes
    if (isExpense) {
      // Track amount totals
      expenses.amounts[category] = (expenses.amounts[category] || 0) + absAmt;
      // Track category occurrences
      expenses.categories[category] = (expenses.categories[category] || 0) + 1;
    } else {
      // Track amount totals
      incomes.amounts[category] = (incomes.amounts[category] || 0) + absAmt;
      // Track category occurrences
      incomes.categories[category] = (incomes.categories[category] || 0) + 1;
    }
  });

  const formatSummary = (amounts, categories) => {
    // Calculate totals
    const amountTotal = Object.values(amounts).reduce((s, v) => s + v, 0);
    const categoryTotal = Object.values(categories).reduce((s, v) => s + v, 0);

    // Format both summaries
    const amountSummary = {};
    const categorySummary = {};

    // Process amounts (for amount-based pie)
    Object.entries(amounts).forEach(([k, v]) => {
      amountSummary[k] = {
        total: v,
        percentage:
          amountTotal > 0 ? Math.round((v / amountTotal) * 10000) / 100 : 0,
      };
    });

    // Process categories (for category-based pie)
    Object.entries(categories).forEach(([k, v]) => {
      categorySummary[k] = {
        total: v, // number of transactions in this category
        percentage:
          categoryTotal > 0 ? Math.round((v / categoryTotal) * 10000) / 100 : 0,
      };
    });

    return {
      byAmount: amountSummary,
      byCategory: categorySummary,
      totalAmount: amountTotal,
      totalTransactions: categoryTotal,
    };
  };

  return {
    expenses: formatSummary(expenses.amounts, expenses.categories),
    incomes: formatSummary(incomes.amounts, incomes.categories),
  };
};

const PieBlock = ({ summary, title }) => {
  const categories = Object.keys(summary || {});
  if (!categories.length) {
    return (
      <div className="text-sm text-gray-500">
        No {title.toLowerCase()} data available.
      </div>
    );
  }

  const amounts = categories.map((c) => summary[c].total);
  const labels = categories.map((c) => `${c} (${summary[c].percentage}%)`);
  const colors = [
    "#4F46E5",
    "#EF4444",
    "#10B981",
    "#F59E0B",
    "#6366F1",
    "#EC4899",
    "#8B5CF6",
    "#F97316",
    "#14B8A6",
  ];

  const data = {
    labels,
    datasets: [
      {
        data: amounts,
        backgroundColor: colors.slice(0, categories.length),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // allow flexible height
    plugins: {
      legend: { display: false }, // we'll render a custom legend to avoid overlap
      tooltip: {
        callbacks: {
          label: (ctx) =>
            `${formatCurrency(ctx.raw)} • ${
              summary[categories[ctx.dataIndex]].percentage
            }%`,
        },
      },
    },
    layout: {
      padding: 8,
    },
  };

  return (
    <div className="w-full">
      <h4 className="text-md font-semibold mb-2">{title}</h4>

      {/* container: chart left, custom legend right; stacks on small screens */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="w-full md:w-1/2 max-w-xs" style={{ minHeight: 220 }}>
          <Pie data={data} options={options} />
        </div>

        <div className="w-full md:w-1/2">
          <div className="flex flex-wrap gap-2 items-start">
            {categories.map((cat, idx) => (
              <div key={cat} className="flex items-center gap-2 min-w-[140px]">
                <span
                  className="inline-block rounded-sm"
                  style={{
                    width: 12,
                    height: 12,
                    backgroundColor: colors[idx % colors.length],
                  }}
                />
                <div className="text-sm">
                  <div
                    className="font-medium capitalize truncate"
                    style={{ maxWidth: 160 }}
                  >
                    {cat}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatCurrency(summary[cat].total)} •{" "}
                    {summary[cat].percentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const PercentagePieBlock = ({ summary, title }) => {
  const categories = Object.keys(summary || {});
  if (!categories.length) {
    return (
      <div className="text-sm text-gray-500">
        No {title.toLowerCase()} data available.
      </div>
    );
  }

  // For percentage pie, we only use the percentage values
  const percentages = categories.map((c) => summary[c].percentage);
  const labels = categories.map((c) => `${c} (${summary[c].percentage}%)`);
  const colors = [
    "#4F46E5",
    "#EF4444",
    "#10B981",
    "#F59E0B",
    "#6366F1",
    "#EC4899",
    "#8B5CF6",
    "#F97316",
    "#14B8A6",
  ];

  const data = {
    labels,
    datasets: [
      {
        data: percentages,
        backgroundColor: colors.slice(0, categories.length),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.raw}%`,
        },
      },
    },
    layout: {
      padding: 8,
    },
  };

  return (
    <div className="w-full">
      <h4 className="text-md font-semibold mb-2">{title} Distribution</h4>
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="w-full md:w-1/2 max-w-xs" style={{ minHeight: 220 }}>
          <Pie data={data} options={options} />
        </div>
        <div className="w-full md:w-1/2">
          <div className="flex flex-wrap gap-2 items-start">
            {categories.map((cat, idx) => (
              <div key={cat} className="flex items-center gap-2 min-w-[140px]">
                <span
                  className="inline-block rounded-sm"
                  style={{
                    width: 12,
                    height: 12,
                    backgroundColor: colors[idx % colors.length],
                  }}
                />
                <div className="text-sm">
                  <div
                    className="font-medium capitalize truncate"
                    style={{ maxWidth: 160 }}
                  >
                    {cat}
                  </div>
                  <div className="text-xs text-gray-500">
                    {summary[cat].percentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryTable = ({ summary = {}, top_category, insight_text }) => {
  const entries = Object.entries(summary || {});
  if (entries.length === 0) {
    return (
      <div className="text-sm text-gray-500">No expense summary available.</div>
    );
  }
  return (
    <div className="rounded-lg border bg-white p-4">
      <h4 className="text-md font-semibold">Summary</h4>
      <ul className="mt-2 space-y-2">
        {entries.map(([cat, info]) => (
          <li key={cat} className="flex justify-between">
            <span className="capitalize">{cat}</span>
            <span>
              {formatCurrency(info.total)} • {info.percentage}%
            </span>
          </li>
        ))}
      </ul>
      {insight_text && (
        <p className="mt-3 text-sm text-gray-600">{insight_text}</p>
      )}
    </div>
  );
};

const TransactionsTable = ({ transactions = [] }) => {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-sm text-gray-500">No transactions available.</div>
    );
  }

  return (
    <div className="rounded-lg border bg-white shadow mb-6 w-full overflow-x-auto">
      <div className="p-4 border-b">
        <h4 className="text-md font-semibold text-gray-900">Transactions</h4>
      </div>
      <div className="p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-gray-700">Date</th>
              <th className="px-4 py-2 text-left text-gray-700">Description</th>
              <th className="px-4 py-2 text-right text-gray-700">Amount</th>
              <th className="px-4 py-2 text-left text-gray-700">Category</th>
              <th className="px-4 py-2 text-left text-gray-700">Currency</th>
            </tr>
          </thead>
          <tbody className="divide-y bg-white">
            {transactions.map((t, i) => {
              const amt = Number(t.amount ?? 0);
              const color = amt < 0 ? "text-red-600" : "text-green-600";
              const category = t.category || "uncategorized";

              return (
                <tr key={i}>
                  <td className="px-4 py-2 text-gray-800">{t.date || "N/A"}</td>
                  <td className="px-4 py-2 text-gray-800">
                    {t.description || t.merchant || "-"}
                  </td>
                  <td className={`px-4 py-2 text-right font-medium ${color}`}>
                    {formatCurrency(Math.abs(amt))}
                  </td>
                  <td className="px-4 py-2 font-medium text-gray-700 capitalize">
                    {category}
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

const ExpenseCanvas = ({ result = {} }) => {
  if (!result) return null;

  const backendSummary =
    result.summary || (result.data && result.data.summary) || {};
  const transactions =
    result.transactions || (result.data && result.data.transactions) || [];

  const { expenses, incomes } = buildSummaryFromTransactions(transactions);

  // Create combined summary for overall transactions
  const overallSummary = {
    "Total Deposits": {
      total: incomes.totalAmount,
      percentage: Math.round(
        (incomes.totalAmount / (incomes.totalAmount + expenses.totalAmount)) *
          100
      ),
    },
    "Total Withdrawals": {
      total: expenses.totalAmount,
      percentage: Math.round(
        (expenses.totalAmount / (incomes.totalAmount + expenses.totalAmount)) *
          100
      ),
    },
  };

  return (
    <div
      className="space-y-6 w-full max-w-full"
      role="region"
      aria-label="Expense analysis canvas"
    >
      <div className="w-full">
        <TransactionsTable transactions={transactions} />
      </div>

      {/* Overall Transaction Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        <div className="col-span-2 bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 gap-6">
            <PieBlock summary={overallSummary} title="Overall Cash Flow" />
          </div>
        </div>
        <div>
          <SummaryTable
            summary={overallSummary}
            insight_text={`Total deposits: ${formatCurrency(
              incomes.totalAmount
            )}, Total withdrawals: ${formatCurrency(expenses.totalAmount)}`}
          />
        </div>
      </div>

      {/* Category-based pie charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <PercentagePieBlock
            summary={expenses.byCategory}
            title="Expense Categories"
          />
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <PercentagePieBlock
            summary={incomes.byCategory}
            title="Income Categories"
          />
        </div>
      </div>
    </div>
  );
};

export default ExpenseCanvas;
