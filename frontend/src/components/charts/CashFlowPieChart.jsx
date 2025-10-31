import React from "react";
import { Pie } from "react-chartjs-2";

const CashFlowPieChart = ({ data }) => {
  // Format data for pie chart
  const chartData = {
    labels: ["Income", "Expenses"],
    datasets: [
      {
        data: [
          Math.abs(data?.paymentsIn || 0),
          Math.abs(data?.paymentsOut || 0),
        ],
        backgroundColor: ["#4CAF50", "#f44336"],
      },
    ],
  };

  return (
    <div className="h-64">
      <Pie
        data={chartData}
        options={{ responsive: true, maintainAspectRatio: false }}
      />
    </div>
  );
};

export default CashFlowPieChart;
