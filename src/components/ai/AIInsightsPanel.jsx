import React from "react";
import {
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
} from "lucide-react";

const InsightIcon = ({ type }) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-600" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
    alert: <AlertCircle className="w-5 h-5 text-red-600" />,
    info: <Info className="w-5 h-5 text-blue-600" />,
    tip: <Lightbulb className="w-5 h-5 text-purple-600" />,
    analysis: <TrendingUp className="w-5 h-5 text-indigo-600" />,
    overview: <TrendingUp className="w-5 h-5 text-gray-700" />,
  };

  return icons[type] || icons.info;
};

const InsightCard = ({ insight }) => {
  const bgColors = {
    success: "bg-green-50 border-green-200",
    warning: "bg-yellow-50 border-yellow-200",
    alert: "bg-red-50 border-red-200",
    info: "bg-blue-50 border-blue-200",
    tip: "bg-purple-50 border-purple-200",
    analysis: "bg-indigo-50 border-indigo-200",
    overview: "bg-gray-50 border-gray-200",
  };

  return (
    <div
      className={`p-4 rounded-lg border-2 ${
        bgColors[insight.type] || bgColors.info
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <InsightIcon type={insight.type} />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">
            {insight.icon} {insight.title}
          </h4>
          <p className="text-sm text-gray-700 mb-2">{insight.message}</p>

          {insight.details && (
            <pre className="text-xs text-gray-600 bg-white bg-opacity-50 p-2 rounded whitespace-pre-wrap font-mono mb-2">
              {insight.details}
            </pre>
          )}

          {insight.suggestion && (
            <div className="mt-2 p-2 bg-white bg-opacity-70 rounded">
              <p className="text-xs font-medium text-gray-800">
                💡 <span className="font-semibold">Suggestion:</span>{" "}
                {insight.suggestion}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AIInsightsPanel = ({ insights }) => {
  if (!insights || insights.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          AI-Powered Insights
        </h3>
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <InsightCard key={index} insight={insight} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIInsightsPanel;
