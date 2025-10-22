import React from "react";

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

const AIInsightsDisplay = ({ feature, data }) => {
  if (!data) return null;

  switch (feature) {
    case "expense_summary":
      return <ExpenseSummaryTable data={data} />;

    // Add more cases for other features here

    default:
      // Fallback to JSON display for other features
      return (
        <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
          {JSON.stringify(data, null, 2)}
        </pre>
      );
  }
};

export default AIInsightsDisplay;
