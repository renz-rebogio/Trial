import React, { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertCircle, UploadCloud } from "lucide-react";

// Components
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import AIAssistantHeader from "@/components/ai/AIAssistantHeader";
import FileDataInput from "@/components/ai/FileDataInput";
import AIAnalysisActions from "@/components/ai/AIAnalysisActions";
import AIHowItWorks from "@/components/ai/AIHowItWorks";
import AIFinanceAssistantDisclaimer from "@/components/ai/AIFinanceAssistantDisclaimer";
import DataPrivacyNotice from "@/components/ai/DataPrivacyNotice";
import AIInsightsDisplay from "@/components/ai/AIInsightsDisplay";

// Services & Hooks
import { useAuth } from "@/hooks/useAuth";
import { boogasiAI } from "@/lib/ai/boogasiAiClient";
import { ocrImageAndParseTransactions } from "@/lib/ocrService";
import {
  simulateAIDocumentProcessing,
  simulateFinancialAnalysis,
  simulatePortfolioAction,
} from "@/lib/aiSimulation";
import { getAIInsights } from "@/services/aiInsightsService";

// Constants
const API_URL = "http://localhost:8000";
const FEATURES = {
  EXPENSE_SUMMARY: "expense_summary",
  CASH_FLOW: "cash_flow_forecast",
  UNUSUAL_TRANSACTIONS: "flag_unusual_transactions",
  WEEKLY_REPORT: "weekly_report",
  COMBINED: "combined_insights",
};

const MAX_FILES = 10;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const BannerDisclaimer = () => (
  <div
    className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-8 rounded-md shadow-md dark:bg-[hsl(var(--boogasi-yellow))]/20 dark:text-[hsl(var(--brighter-yellow-text))] dark:border-[hsl(var(--boogasi-yellow))]"
    role="alert"
  >
    <div className="flex items-center">
      <AlertCircle className="h-6 w-6 mr-3" />
      <p className="font-bold">
        ⚠️ This tool is for research purposes only. Boogasi does not provide
        financial advice. Learn more below.
      </p>
    </div>
  </div>
);

const AIAssistantPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [manualTransactions, setManualTransactions] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [portfolioFeaturesResult, setPortfolioFeaturesResult] = useState("");
  const [ocrProcessedData, setOcrProcessedData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [userName, setUserName] = useState("Valued User");

  // Add this line for the AI toggle state
  const [useAI, setUseAI] = useState(false);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    if (user && user.user_metadata) {
      setUserName(
        user.user_metadata.name ||
          user.user_metadata.screen_name ||
          "Valued User"
      );
    }
  }, [user]);

  const acceptedFileTypes = ".csv, .pdf, .png, .jpeg, .jpg";
  const acceptedMimeTypes = [
    "text/csv",
    "application/pdf",
    "image/png",
    "image/jpeg",
  ];

  const handleFileChange = useCallback(
    async (event) => {
      const files = Array.from(event.target.files);
      let currentFilesCount = selectedFiles.length;
      const newFilesToProcess = [];

      for (const file of files) {
        if (currentFilesCount >= MAX_FILES) {
          toast({
            variant: "destructive",
            title: "File Limit Reached",
            description: `Maximum of ${MAX_FILES} files allowed.`,
          });
          break;
        }
        if (
          !acceptedMimeTypes.includes(file.type) &&
          !acceptedFileTypes
            .split(", ")
            .some((ext) => file.name.toLowerCase().endsWith(ext))
        ) {
          toast({
            variant: "destructive",
            title: "Invalid file type",
            description: `File "${file.name}" is not a valid type.`,
          });
          continue;
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
          toast({
            variant: "destructive",
            title: "File Too Large",
            description: `File "${file.name}" exceeds ${MAX_FILE_SIZE_MB}MB limit.`,
          });
          continue;
        }
        newFilesToProcess.push(file);
        currentFilesCount++;
      }

      if (newFilesToProcess.length === 0) {
        if (event.target) event.target.value = null;
        return;
      }

      // 🔥 AUTO-ENABLE AI when files are attached
      // Around line 80, after newFilesToProcess validation
      setUseAI(true); // 🔥 Auto-enable AI

      setLoadingMessage(
        `Processing ${newFilesToProcess.length} file(s)... AI enhancement will be enabled.`
      );

      setIsLoading(true);
      setLoadingMessage(
        `Processing ${newFilesToProcess.length} file(s)... This may take a moment.`
      );

      const processedFileObjectsForState = [];
      let ocrAttemptedCount = 0;

      try {
        for (const file of newFilesToProcess) {
          let fileProcessedData = {
            file,
            rawText: null,
            formattedTransactions: [],
            error: null,
          };
          if (
            file.type.startsWith("image/") ||
            file.type === "application/pdf"
          ) {
            ocrAttemptedCount++;
            setLoadingMessage(
              `Boogasi AI is performing OCR & parsing transactions for ${file.name}...`
            );
            try {
              const {
                rawText,
                formattedTransactions,
                error: ocrError,
              } = await ocrImageAndParseTransactions(file);
              fileProcessedData.rawText = rawText;
              fileProcessedData.formattedTransactions =
                formattedTransactions || [];
              fileProcessedData.error = ocrError;

              setOcrProcessedData((prev) => ({
                ...prev,
                [file.name]: {
                  rawText,
                  formattedTransactions: formattedTransactions || [],
                  error: ocrError,
                },
              }));

              let toastDescription = "OCR & Parsing Attempted by Boogasi AI.";
              if (ocrError) {
                toastDescription = `OCR Error: ${ocrError}`;
              } else {
                toastDescription = `Text extracted. Found ${
                  formattedTransactions ? formattedTransactions.length : 0
                } potential transactions. Review results.`;
              }
              toast({
                title: `Processed: ${file.name}`,
                description: toastDescription,
                duration: 7000,
              });
            } catch (error) {
              console.error(`OCR & Parsing failed for ${file.name}:`, error);
              const errorMsg = `OCR Error for ${file.name}: ${error.message}`;
              toast({
                variant: "destructive",
                title: `OCR & Parsing Failed`,
                description: errorMsg,
                duration: 7000,
              });
              setOcrProcessedData((prev) => ({
                ...prev,
                [file.name]: {
                  rawText: errorMsg,
                  formattedTransactions: [],
                  error: errorMsg,
                },
              }));
              fileProcessedData.rawText = errorMsg;
              fileProcessedData.error = errorMsg;
            }
          }
          processedFileObjectsForState.push(fileProcessedData.file);
        }

        if (processedFileObjectsForState.length > 0) {
          setSelectedFiles((prev) =>
            [...prev, ...processedFileObjectsForState].slice(0, MAX_FILES)
          );
          const baseMessage = `${processedFileObjectsForState.length} file(s) processed.`;
          const ocrMessage =
            ocrAttemptedCount > 0
              ? ` OCR & transaction parsing attempted by Boogasi AI on ${ocrAttemptedCount} image/PDF file(s).`
              : "";
          toast({
            title: "File Processing Complete",
            description:
              baseMessage + ocrMessage + " 🤖 AI enhancement enabled!",
            duration: 5000,
          });
        }
      } catch (error) {
        console.error("Error during file processing loop:", error);
        toast({
          variant: "destructive",
          title: "File Processing Error",
          description: "An unexpected error occurred while processing files.",
          duration: 7000,
        });
      } finally {
        setIsLoading(false);
        setLoadingMessage("");
        if (event.target) event.target.value = null;
      }
    },
    [selectedFiles, toast, acceptedMimeTypes, acceptedFileTypes]
  );

  const removeFile = useCallback(
    (indexToRemove) => {
      const fileNameToRemove = selectedFiles[indexToRemove]?.name;
      setSelectedFiles((prev) =>
        prev.filter((_, index) => index !== indexToRemove)
      );
      if (fileNameToRemove) {
        setOcrProcessedData((prev) => {
          const updatedResults = { ...prev };
          delete updatedResults[fileNameToRemove];
          return updatedResults;
        });
      }
      toast({
        title: "File Removed",
        description: `"${fileNameToRemove}" has been removed.`,
      });
    },
    [selectedFiles, toast]
  );

  const callAIInsights = async (transactions, feature) => {
    try {
      const response = await fetch(`${API_URL}/api/insights`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactions,
          feature,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to get insights");
      }

      return await response.json();
    } catch (error) {
      console.error("AI Insights Error:", error);
      setApiError(error.message);
      throw error;
    }
  };

  const handleAnalyzeClick = async () => {
    setIsLoading(true);
    setApiError(null);

    try {
      // Get transactions from your OCR data or manual input
      const transactions = ocrProcessedData?.transactions || [];

      // Call the AI insights API
      const result = await callAIInsights(transactions, FEATURES.COMBINED);

      // Update UI with results
      setAnalysisResult(JSON.stringify(result, null, 2));

      toast({
        title: "Analysis Complete",
        description: "AI insights are ready to view",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIRequest = async (action) => {
    setIsLoading(true);
    setLoadingMessage("Analyzing your data...");

    try {
      // Map action names to API feature types
      const featureMap = {
        "Analyze Expenses": "expense_summary",
        "Forecast Cash Flow": "cash_flow_forecast",
        "Flag Unusual Transactions": "flag_unusual_transactions",
        "Generate Weekly Report": "weekly_report",
        "Combined Analysis": "combined_insights",
      };

      const feature = featureMap[action];
      if (!feature) {
        throw new Error(`Unknown action: ${action}`);
      }

      // Get transactions from OCR - they already have AI categorization applied
      const transactions = Object.values(ocrProcessedData || {})
        .flatMap((r) => r?.formattedTransactions || [])
        .filter(
          (tx) =>
            tx &&
            (tx.date || tx.description) &&
            typeof tx.amount !== "undefined"
        );

      console.log(
        "[AI] Sending transactions to backend:",
        transactions.slice(0, 3)
      );

      // Special handling for combined analysis
      if (feature === "combined_insights") {
        setLoadingMessage("Running all analyses... This may take a moment.");

        // Call all features
        const [expenseSummary, cashFlow, flagged, weeklyReport] =
          await Promise.all([
            getAIInsights(transactions, "expense_summary"),
            getAIInsights(transactions, "cash_flow_forecast"),
            getAIInsights(transactions, "flag_unusual_transactions"),
            getAIInsights(transactions, "weekly_report"),
          ]);

        // 🔍 DEBUG: Check what flagged returns
        console.log("🚨 Flagged transactions from API:", {
          flagged,
          hasFlagged: !!flagged,
          flaggedKeys: Object.keys(flagged || {}),
          flaggedArray: flagged?.flagged || flagged?.flags,
        });

        const combinedResult = {
          feature: "combined_insights",
          generated_at: new Date().toISOString(),
          summary: {
            total_transactions: transactions.length,
            date_range: {
              start: transactions[0]?.date,
              end: transactions[transactions.length - 1]?.date,
            },
          },
          detailed_analyses: {
            expense_summary: expenseSummary,
            cash_flow_forecast: cashFlow,
            flagged_transactions: flagged,
            weekly_report: weeklyReport,
          },
        };

        console.log("📦 Combined result structure:", {
          hasFlagged: !!combinedResult.detailed_analyses.flagged_transactions,
          flaggedData: combinedResult.detailed_analyses.flagged_transactions,
        });

        const uiResult = {
          feature: "combined_insights",
          data: combinedResult,
          transactions: transactions, // ✅ Make sure this is here
        };

        console.log("📦 Setting combined analysis result:", {
          hasTransactions: !!uiResult.transactions,
          transactionCount: uiResult.transactions?.length,
          hasFlagged: !!uiResult.data.detailed_analyses.flagged_transactions,
        });

        setAnalysisResult(uiResult);

        toast({
          title: "Combined Analysis Complete",
          description: "All financial analyses have been generated.",
        });
      } else {
        // Individual feature analysis
        const result = await getAIInsights(transactions, feature);
        const uiResult = {
          feature,
          data: result,
          transactions: transactions,
        };

        setAnalysisResult(uiResult);

        toast({
          title: "Analysis Complete",
          description: `AI insights for "${action}" are ready.`,
        });
      }
    } catch (error) {
      console.error("Error during AI analysis:", error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error.message || "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  return (
    <motion.div
      className="container mx-auto py-12 px-4 space-y-12 brighter-theme-area"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <AIAssistantHeader />
      <BannerDisclaimer />

      <div className="grid md:grid-cols-2 gap-8 items-start">
        <FileDataInput
          selectedFiles={selectedFiles}
          handleFileChange={handleFileChange}
          removeFile={removeFile}
          manualTransactions={manualTransactions}
          setManualTransactions={setManualTransactions}
          acceptedFileTypes={acceptedFileTypes}
        />
        <AIAnalysisActions
          onAnalyze={handleAIRequest}
          isLoading={isLoading}
          portfolioFeaturesResult={portfolioFeaturesResult}
        />
      </div>

      {/* Dedicated Results Canvas Area - RIGHT AFTER TOOLS */}
      {analysisResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-8 w-full"
        >
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-indigo-900">
                  📊 Analysis Results
                </h2>
                <p className="text-sm text-indigo-600 mt-1">
                  Feature:{" "}
                  {analysisResult.feature?.replace(/_/g, " ").toUpperCase()} •
                  Generated at {new Date().toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setAnalysisResult(null)}
                className="px-4 py-2 bg-white text-indigo-600 rounded-lg shadow hover:bg-indigo-50 transition-all font-semibold"
              >
                ✕ Clear Results
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-none">
              <AIInsightsDisplay
                feature={analysisResult.feature}
                data={analysisResult.data}
              />
            </div>
          </div>
        </motion.div>
      )}

      {apiError && (
        <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-700">
          <strong>⚠️ Error:</strong> {apiError}
        </div>
      )}

      {/* AI Enhancement Toggle */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg shadow-md">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={useAI}
            onChange={(e) => setUseAI(e.target.checked)}
            className="mr-3 w-6 h-6 accent-blue-600"
          />
          <div>
            <span className="font-bold text-blue-900 text-lg">
              🤖 AI Enhancement {useAI ? "(Active)" : "(Inactive)"}
            </span>
            <p className="text-sm text-blue-700 mt-1">
              {selectedFiles.length > 0
                ? "✅ Auto-enabled with uploaded files • Trained on 5+ bank statements"
                : "Automatically activates when you upload bank statements"}
            </p>
          </div>
        </label>
        {useAI && (
          <div className="mt-3 p-3 bg-green-50 border border-green-300 rounded">
            <p className="text-sm text-green-800 font-semibold">
              ✅ AI Active: {Object.keys(boogasiAI.categories).length}{" "}
              categories • Version {boogasiAI.trainingData.version}
            </p>
            {boogasiAI.modelArtifacts && (
              <div className="mt-2 text-xs text-green-700">
                🤖 Trained Model: {boogasiAI.modelArtifacts.version} •
                {boogasiAI.modelArtifacts.training_samples} datasets •
                {boogasiAI.modelArtifacts.total_transactions} transactions
                learned
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-12 space-y-6">
        <AIFinanceAssistantDisclaimer />
        <DataPrivacyNotice />
      </div>

      <AIHowItWorks />

      <div className="text-center">
        <Button
          variant="neonGreen"
          size="lg"
          onClick={() =>
            document.getElementById("transactions-file-input")?.click()
          }
        >
          <UploadCloud className="mr-2 h-5 w-5" />
          Upload Files
        </Button>
      </div>
    </motion.div>
  );
};

export default AIAssistantPage;
