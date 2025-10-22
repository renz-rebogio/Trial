import React, { useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

// ADDED imports
import { Button } from "@/components/ui/button";
import {
  BarChart,
  CalendarDays,
  AlertTriangle,
  Brain,
  PieChart,
  BellRing,
  TrendingUp,
  Target,
  Loader2,
  Combine,
} from "lucide-react";

import ExpenseCanvas from "./ExpenseCanvas";
import CashFlowPieChart from "./CashFlowCanvas";
import AIReportDisplay from "./AIReportDisplay";

// Simple className helper (fallback if you don't have a shared `cn`/`classNames` util)
const cn = (...parts) => parts.flat().filter(Boolean).join(" ");

// Lightweight inference for missing categories (fallback only)
const inferCategoryFromDescription = (tx) => {
  const desc = (tx?.description || tx?.merchant || "").toLowerCase();
  if (!desc) return "uncategorized";
  if (desc.includes("atm") || desc.includes("withdrawal")) return "withdrawal";
  if (desc.includes("transfer") || desc.includes("deposit")) return "transfer";
  if (desc.includes("payroll") || desc.includes("salary")) return "payroll";
  if (desc.includes("rent")) return "rent";
  if (
    desc.includes("water") ||
    desc.includes("electric") ||
    desc.includes("bill")
  )
    return "utilities";
  if (
    desc.includes("coffee") ||
    desc.includes("restaurant") ||
    desc.includes("food") ||
    desc.includes("grocery") ||
    desc.includes("supermarket")
  )
    return "food";
  if (
    desc.includes("shop") ||
    desc.includes("lazada") ||
    desc.includes("mr diy") ||
    desc.includes("wilcon") ||
    desc.includes("allhome")
  )
    return "shopping";
  return "other";
};

const AIAnalysisActions = ({
  onAnalyze,
  isLoading,
  loadingMessage,
  analysisResult,
  portfolioFeaturesResult,
  result,
}) => {
  // Log detected categories whenever new result/analysisResult arrives
  useEffect(() => {
    const txs =
      (result && result.transactions) ||
      (analysisResult && analysisResult.transactions) ||
      [];
    if (!txs || txs.length === 0) return;

    const detected = txs.map((t, idx) => {
      const detected_category = t.category || inferCategoryFromDescription(t);
      const amount = Number(t.amount ?? 0);
      const inferred_type = amount < 0 ? "expense" : "income";
      return {
        index: idx,
        date: t.date || null,
        description: t.description || t.merchant || null,
        amount,
        currency: t.currency || t.currency_code || "PHP",
        source_category: t.category || null,
        detected_category,
        inferred_type,
      };
    });

    console.log("[AI] Detected categories for transactions:", detected);
  }, [result, analysisResult]);

  const buttonBaseClass =
    "w-full justify-start text-primary-foreground button-outline-on-dark bg-[hsl(var(--boogasi-black-val))]";
  const iconBaseClass = "mr-2 h-5 w-5";

  return (
    <Card className="ai-analysis-actions-card shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">
          Boogasi AI Analysis & Portfolio Tools
        </CardTitle>
        <CardDescription>
          Get insights from your data and manage your portfolio.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={() => {
            console.log("[AIAction] Clicking Analyze Expenses");
            if (typeof onAnalyze === "function") {
              onAnalyze("Analyze Expenses");
            } else {
              console.warn("AIAnalysisActions: onAnalyze prop not provided");
            }
          }}
          className={cn(
            buttonBaseClass,
            "border-[hsl(var(--boogasi-blue-val))] hover:bg-[hsl(var(--boogasi-blue-val))]/20"
          )}
          variant="outline"
          disabled={isLoading}
        >
          <BarChart
            className={cn(
              iconBaseClass,
              "text-[hsl(var(--boogasi-blue-val))] icon-neon-blue"
            )}
          />{" "}
          Analyze Expense Summary
        </Button>
        <Button
          onClick={() => onAnalyze("Forecast Cash Flow")}
          className={cn(
            buttonBaseClass,
            "border-[hsl(var(--boogasi-green-val))] hover:bg-[hsl(var(--boogasi-green-val))]/20"
          )}
          variant="outline"
          disabled={isLoading}
        >
          <CalendarDays
            className={cn(
              iconBaseClass,
              "text-[hsl(var(--boogasi-green-val))] icon-neon-green"
            )}
          />{" "}
          Forecast Cash Flow
        </Button>
        <Button
          onClick={() => onAnalyze("Flag Unusual Transactions")}
          className={cn(
            buttonBaseClass,
            "border-[hsl(var(--boogasi-orange-val))] hover:bg-[hsl(var(--boogasi-orange-val))]/20"
          )}
          variant="outline"
          disabled={isLoading}
        >
          <AlertTriangle
            className={cn(
              iconBaseClass,
              "text-[hsl(var(--boogasi-orange-val))] icon-neon-orange"
            )}
          />{" "}
          Flag Unusual Transactions
        </Button>
        <Button
          onClick={() => onAnalyze("Generate Weekly Report")}
          className={cn(
            buttonBaseClass,
            "border-[hsl(var(--boogasi-purple-val))] hover:bg-[hsl(var(--boogasi-purple-val))]/20"
          )}
          variant="outline"
          disabled={isLoading}
        >
          <Brain
            className={cn(
              iconBaseClass,
              "text-[hsl(var(--boogasi-purple-val))] icon-neon-purple"
            )}
          />{" "}
          Generate Weekly Report
        </Button>
        <Button
          onClick={() => onAnalyze("Combined Analysis")}
          className="w-full justify-start bg-gradient-to-r from-[hsl(var(--boogasi-blue-val))] to-[hsl(var(--boogasi-teal-val))] text-primary-foreground hover:opacity-90"
          variant="default"
          disabled={isLoading}
        >
          <Combine className={cn(iconBaseClass, "icon-neon-cyan")} /> Combine
          All Financial Analyses
        </Button>

        <div className="pt-4 mt-4 border-t border-[hsl(var(--boogasi-purple-val))]/20">
          <h4 className="text-lg font-semibold mb-2">
            Portfolio Tools (Simulated by Boogasi AI)
          </h4>
          <Button
            onClick={() => onAnalyze("Track Contributions")}
            className={cn(
              buttonBaseClass,
              "border-[hsl(var(--boogasi-teal-val))] hover:bg-[hsl(var(--boogasi-teal-val))]/20"
            )}
            variant="outline"
            disabled={isLoading}
          >
            <PieChart
              className={cn(
                iconBaseClass,
                "text-[hsl(var(--boogasi-teal-val))] icon-neon-teal"
              )}
            />{" "}
            Track Contributions
          </Button>
          <Button
            onClick={() => onAnalyze("Rebalance Reminders")}
            className={cn(
              buttonBaseClass,
              "border-[hsl(var(--boogasi-pink-val))] hover:bg-[hsl(var(--boogasi-pink-val))]/20 mt-2"
            )}
            variant="outline"
            disabled={isLoading}
          >
            <BellRing
              className={cn(
                iconBaseClass,
                "text-[hsl(var(--boogasi-pink-val))] icon-neon-pink"
              )}
            />{" "}
            Rebalance Reminders
          </Button>
          <Button
            onClick={() => onAnalyze("Portfolio Performance")}
            className={cn(
              buttonBaseClass,
              "border-[hsl(var(--boogasi-blue-val))] hover:bg-[hsl(var(--boogasi-blue-val))]/20 mt-2"
            )}
            variant="outline"
            disabled={isLoading}
          >
            <TrendingUp
              className={cn(
                iconBaseClass,
                "text-[hsl(var(--boogasi-blue-val))] icon-neon-blue"
              )}
            />{" "}
            Portfolio Performance Report
          </Button>
          <Button
            onClick={() => onAnalyze("Goal Progress")}
            className={cn(
              buttonBaseClass,
              "border-[hsl(var(--boogasi-green-val))] hover:bg-[hsl(var(--boogasi-green-val))]/20 mt-2"
            )}
            variant="outline"
            disabled={isLoading}
          >
            <Target
              className={cn(
                iconBaseClass,
                "text-[hsl(var(--boogasi-green-val))] icon-neon-green"
              )}
            />{" "}
            Goal Progress Tracking
          </Button>
          <Button
            onClick={() => onAnalyze("Smart Alerts")}
            className={cn(
              buttonBaseClass,
              "border-[hsl(var(--boogasi-orange-val))] hover:bg-[hsl(var(--boogasi-orange-val))]/20 mt-2"
            )}
            variant="outline"
            disabled={isLoading}
          >
            <AlertTriangle
              className={cn(
                iconBaseClass,
                "text-[hsl(var(--boogasi-orange-val))] icon-neon-orange"
              )}
            />{" "}
            Smart Portfolio Alerts
          </Button>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center p-4 text-[hsl(var(--primary-foreground))]">
            <Loader2 className="mr-2 h-8 w-8 animate-spin icon-neon-purple" />
            <span className="mt-2 text-sm">
              {loadingMessage || "Boogasi AI is thinking..."}
            </span>
          </div>
        )}

        {result &&
          (result.feature === "expense_summary" ? (
            <ExpenseCanvas result={result} />
          ) : result.feature === "cash_flow_forecast" ? (
            <CashFlowPieChart data={result.data} />
          ) : (
            <AIReportDisplay result={result} />
          ))}
      </CardContent>
    </Card>
  );
};

export default AIAnalysisActions;
