import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Colors,
  Filler,
} from "chart.js";
import { Chart } from "react-chartjs-2";

// Register Chart.js components including Filler
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Colors,
  Filler
);

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount);

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
};

const parseDate = (dateStr) => {
  if (!dateStr && dateStr !== 0) return null;
  const s = String(dateStr).trim();

  // quick ISO / native parse first
  const tryNative = (input) => {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  };

  // 1) ISO / normal parse
  let d = tryNative(s);
  if (d) return d;

  // 2) YYYY-MM-DD but possibly YYYY-DD-MM (some OCR swaps)
  const ymd = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymd) {
    const [_, y, a, b] = ymd;
    // try as-is (already failed), so try swapping day/month
    const trySwap = tryNative(
      `${y}-${String(b).padStart(2, "0")}-${String(a).padStart(2, "0")}`
    );
    if (trySwap) return trySwap;
    // fallback: construct explicitly (month index is 0-based)
    const mm = parseInt(b, 10) - 1;
    const dd = parseInt(a, 10);
    const constructed = new Date(Number(y), mm, dd);
    if (!isNaN(constructed.getTime())) return constructed;
  }

  // 3) MM/DD or M/D (no year) -> assume current year
  const md = s.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (md) {
    const year = new Date().getFullYear();
    const mm = parseInt(md[1], 10) - 1;
    const dd = parseInt(md[2], 10);
    const constructed = new Date(year, mm, dd);
    if (!isNaN(constructed.getTime())) return constructed;
  }

  // 4) MM/DD/YYYY or M/D/YYYY
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    const mm = parseInt(mdy[1], 10) - 1;
    const dd = parseInt(mdy[2], 10);
    const yy = parseInt(mdy[3], 10);
    const constructed = new Date(yy, mm, dd);
    if (!isNaN(constructed.getTime())) return constructed;
  }

  // 5) DD-MM-YYYY or D-M-YYYY (day-first)
  const dmy = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmy) {
    const dd = parseInt(dmy[1], 10);
    const mm = parseInt(dmy[2], 10) - 1;
    const yy = parseInt(dmy[3], 10);
    const constructed = new Date(yy, mm, dd);
    if (!isNaN(constructed.getTime())) return constructed;
  }

  // 6) If we have something like "2024-23-01" (year-day-month) attempt swap when middle >12
  const parts = s.split(/[-\/\.]/).map((p) => p.replace(/^0+/, "") || "0");
  if (parts.length === 3 && /^\d+$/.test(parts.join(""))) {
    // detect patterns with year first
    if (parts[0].length === 4) {
      const year = parseInt(parts[0], 10);
      let p1 = parseInt(parts[1], 10);
      let p2 = parseInt(parts[2], 10);
      // if middle looks like day (>12) and last looks like month (<=12) swap
      if (p1 > 12 && p2 >= 1 && p2 <= 12) {
        const constructed = new Date(year, p2 - 1, p1);
        if (!isNaN(constructed.getTime())) return constructed;
      }
      // if last looks like day and middle looks like month
      if (p2 > 12 && p1 >= 1 && p1 <= 12) {
        const constructed = new Date(year, p1 - 1, p2);
        if (!isNaN(constructed.getTime())) return constructed;
      }
      // fallback try year-month-day explicitly
      const constructed = new Date(
        year,
        (parseInt(parts[1], 10) || 1) - 1,
        parseInt(parts[2], 10) || 1
      );
      if (!isNaN(constructed.getTime())) return constructed;
    }
  }

  // 7) last resort: try Date.parse after replacing common separators
  const cleaned = s.replace(/(\d)\.(\d)/g, "$1/$2");
  d = tryNative(cleaned);
  if (d) return d;

  console.warn(`Could not parse date: ${s}`);
  return null;
};

const groupTransactionsByWeek = (transactions) => {
  if (!transactions) return [];
  // if an object with transactions array was passed, normalize
  const txs = Array.isArray(transactions)
    ? transactions
    : transactions.transactions || transactions.data || [];
  if (!Array.isArray(txs)) return [];

  // Sort transactions by parsed date (invalid dates go to end)
  const sorted = [...txs].sort((a, b) => {
    const da = parseDate(a?.date);
    const db = parseDate(b?.date);
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return da - db;
  });

  const weeks = {};
  sorted.forEach((tx) => {
    const date = parseDate(tx?.date);
    if (!date) {
      console.warn("Skipping transaction with invalid date:", tx);
      return;
    }

    // start of week (Sunday)
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekKey = weekStart.toISOString().split("T")[0];

    if (!weeks[weekKey]) {
      weeks[weekKey] = {
        week_start: weekKey,
        income: 0,
        expense: 0,
        net: 0,
        transactions: [],
      };
    }

    const amount = Number(tx.amount) || 0;
    if (amount >= 0) weeks[weekKey].income += amount;
    else weeks[weekKey].expense += Math.abs(amount);
    weeks[weekKey].net += amount;
    weeks[weekKey].transactions.push(tx);
  });

  return Object.values(weeks);
};

const CashFlowForecast = ({ data }) => {
  // Early return if no data at all
  if (!data) {
    console.log("No data provided to CashFlowForecast");
    return null;
  }

  // Transform raw transactions into weekly series if needed
  const weekly_series = data.weekly_series || groupTransactionsByWeek(data);

  // Debug logs
  console.log("Input data:", data);
  console.log("Processed weekly series:", weekly_series);

  if (!weekly_series?.length) {
    console.log("No weekly series data available");
    return (
      <div className="rounded-lg border bg-white shadow p-6">
        <h4 className="text-lg font-semibold mb-4">Weekly Cash Flow</h4>
        <p className="text-gray-500">No transactions available for forecast.</p>
      </div>
    );
  }

  // Calculate overall summary
  const overall_summary = weekly_series.reduce(
    (acc, week) => ({
      total_income: acc.total_income + week.income,
      total_expenses: acc.total_expenses + week.expense,
      total_net: acc.total_net + week.net,
    }),
    { total_income: 0, total_expenses: 0, total_net: 0 }
  );

  const chartData = {
    labels: weekly_series.map((week) => formatDate(week.week_start)),
    datasets: [
      {
        type: "bar",
        label: "Income",
        data: weekly_series.map((week) => week.income),
        backgroundColor: "rgba(16, 185, 129, 0.7)",
        borderColor: "rgb(16, 185, 129)",
        borderWidth: 1,
        borderRadius: 4,
        order: 2,
      },
      {
        type: "bar",
        label: "Expenses",
        data: weekly_series.map((week) => -week.expense), // Negative for visual stacking
        backgroundColor: "rgba(239, 68, 68, 0.7)",
        borderColor: "rgb(239, 68, 68)",
        borderWidth: 1,
        borderRadius: 4,
        order: 1,
      },
      {
        type: "line",
        label: "Net Flow",
        data: weekly_series.map((week) => week.net),
        borderColor: "rgb(79, 70, 229)",
        backgroundColor: "rgba(79, 70, 229, 0.1)",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        order: 0,
        yAxisID: "net",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw;
            return `${context.dataset.label}: ${formatCurrency(
              Math.abs(value)
            )}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        stacked: true, // Stack the bars
      },
      y: {
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        stacked: true, // Stack the bars
        ticks: {
          callback: (value) => formatCurrency(value),
        },
      },
      net: {
        // Separate axis for net flow
        position: "right",
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: (value) => formatCurrency(value),
        },
      },
    },
  };

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Monthly Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        <div className="rounded-lg border bg-white shadow p-4">
          <h5 className="text-sm font-medium text-gray-500 mb-2">
            Total Income
          </h5>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(overall_summary.total_income)}
          </p>
        </div>
        <div className="rounded-lg border bg-white shadow p-4">
          <h5 className="text-sm font-medium text-gray-500 mb-2">
            Total Expenses
          </h5>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(overall_summary.total_expenses)}
          </p>
        </div>
        <div className="rounded-lg border bg-white shadow p-4">
          <h5 className="text-sm font-medium text-gray-500 mb-2">
            Net Balance
          </h5>
          <p className="text-2xl font-bold text-indigo-600">
            {formatCurrency(overall_summary.total_net)}
          </p>
        </div>
      </div>

      {/* Cash Flow Chart */}
      <div className="rounded-lg border bg-white shadow p-6">
        <h4 className="text-lg font-semibold mb-4">Weekly Cash Flow</h4>
        <div className="h-[400px]">
          <Chart data={chartData} options={options} type="bar" />
        </div>
      </div>

      {/* Weekly Breakdown */}
      <div className="rounded-lg border bg-white shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Week
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Income
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Expenses
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Net
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {weekly_series.map((week) => (
              <tr key={week.week_start}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(week.week_start)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                  {formatCurrency(week.income)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                  {formatCurrency(week.expense)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-indigo-600">
                  {formatCurrency(week.net)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CashFlowForecast;
