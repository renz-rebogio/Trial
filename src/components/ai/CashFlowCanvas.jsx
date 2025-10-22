import React from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Colors,
} from "chart.js";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, Colors);

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);

const CashFlowPieChart = ({ data }) => {
  if (!data?.summary) return null;

  const categories = Object.keys(data.summary);
  const amounts = Object.values(data.summary).map((item) =>
    Math.abs(item.total)
  );
  const percentages = Object.values(data.summary).map(
    (item) => item.percentage
  );

  const chartData = {
    labels: categories.map(
      (cat) => `${cat} (${percentages[categories.indexOf(cat)]}%)`
    ),
    datasets: [
      {
        data: amounts,
        backgroundColor: [
          "#4F46E5", // indigo
          "#EF4444", // red
          "#10B981", // green
          "#F59E0B", // yellow
          "#6366F1", // blue
          "#EC4899", // pink
          "#8B5CF6", // purple
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "right",
        labels: {
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => ({
                text: `${label} (${formatCurrency(amounts[i])})`,
                fillStyle: data.datasets[0].backgroundColor[i],
                index: i,
              }));
            }
            return [];
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw;
            return ` ${formatCurrency(value)} (${
              percentages[context.dataIndex]
            }%)`;
          },
        },
      },
    },
  };

  return (
    <div className="rounded-lg border bg-white shadow p-4">
      <h4 className="text-md font-semibold text-gray-900 mb-4">
        Cash Flow Distribution
      </h4>
      <div className="w-full aspect-square max-w-2xl mx-auto">
        <Pie data={chartData} options={options} />
      </div>
      {data.summary_text && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-700">{data.summary_text}</p>
        </div>
      )}
    </div>
  );
};

export default CashFlowPieChart;
