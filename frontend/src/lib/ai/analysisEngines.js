import React from 'react';
import { getInvestmentSuggestions } from '@/lib/ai/investmentData';
import { generateProfessionalReport } from '@/lib/ai/reportFormatter';
import { MOCK_BANK_STATEMENT_TRANSACTIONS } from '@/lib/ai/constants';
import { boogasiAI } from './boogasiAiClient'; // Use the client-side AI

// Helper function to check if AI enhancement is available
const isAIAvailable = () => boogasiAI !== null;

export const detectDocumentType = (text) => {
    if (!text) return 'Unknown Financial Document';

    const lowerText = text.toLowerCase();

    const creditKeywords = ['minimum payment', 'credit limit', 'payment due date', 'statement balance', 'late fee', 'available credit', 'new balance'];
    const bankKeywords = ['available balance', 'checking account', 'savings account', 'withdrawal', 'deposit', 'account summary', 'ach', 'atm'];

    let creditHits = 0;
    let bankHits = 0;

    creditKeywords.forEach(word => {
        if (lowerText.includes(word)) {
            creditHits++;
        }
    });

    bankKeywords.forEach(word => {
        if (lowerText.includes(word)) {
            bankHits++;
        }
    });

    if (creditHits > bankHits) {
        return 'Credit Card Statement';
    } else if (bankHits > creditHits) {
        return 'Bank Statement';
    } else {
        return 'Unknown Financial Document';
    }
};

// 🆕 New function: Enhance transactions with AI categorization
export const enhanceTransactionsWithAI = async (transactions) => {
  if (!isAIAvailable() || !transactions || transactions.length === 0) {
    return transactions;
  }

  try {
    // Create a statement object for AI analysis
    const statementForAI = {
      transactions: transactions.map(tx => ({
        date: tx.date,
        description: tx.description || 'Unknown',
        amount: typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount) || 0,
        currency: tx.currency || 'USD'
      }))
    };

    // Get AI enhancement
    const aiEnhanced = await boogasiAI.analyzeStatement(statementForAI);
    
    // Return enhanced transactions
    return aiEnhanced.transactions || transactions;
  } catch (error) {
    console.error('AI enhancement failed:', error);
    return transactions; // Fallback to original
  }
};

// 🆕 Modified function with AI support
// Around line 50, modify the function signature:
// Fixed simulateFinancialAnalysis function
export const simulateFinancialAnalysis = (actionType, userName, hasInputData, allInputText, ocrTransactions = [], useAI = false) => {
  const investmentAdvice = "Consider diversifying your investments and reviewing your spending patterns for better financial health.";

  let transactionsToAnalyze = ocrTransactions && ocrTransactions.length > 0 ? 
    ocrTransactions.map(tx => ({...tx, sourceFile: tx.sourceFile || "Uploaded Document"})) : 
    (hasInputData ? MOCK_BANK_STATEMENT_TRANSACTIONS : []); 
  
  // Enhance with AI if enabled
  if (useAI && transactionsToAnalyze.length > 0) {
    const aiResult = boogasiAI.analyzeStatement({ transactions: transactionsToAnalyze });
    transactionsToAnalyze = aiResult.transactions;
  }
    
  const primaryCurrency = transactionsToAnalyze[0]?.currency || "USD";

  if (!hasInputData && (!ocrTransactions || ocrTransactions.length === 0) && actionType !== "Get Investment Suggestions") {
    let greeting = userName ? `Hello ${userName}! ` : '';
    return `${greeting}No transaction data provided or extracted by Boogasi AI. Please upload files, ensure OCR is successful, or enter transactions manually for analysis.\n`;
  }
  
  const incomeValues = transactionsToAnalyze.map(tx => typeof tx.amount === 'number' ? tx.amount : 0).filter(amount => amount > 0);
  const expenseValues = transactionsToAnalyze.map(tx => typeof tx.amount === 'number' ? tx.amount : 0).filter(amount => amount < 0);

  const totalIncome = incomeValues.reduce((sum, amount) => sum + amount, 0);
  const totalExpenses = Math.abs(expenseValues.reduce((sum, amount) => sum + amount, 0));
  
  const documentType = detectDocumentType(allInputText);
  
  const placeholderData = {
      totalIncome: `${totalIncome.toFixed(2)} ${primaryCurrency}`,
      totalExpenses: `${totalExpenses.toFixed(2)} ${primaryCurrency}`,
      topSpendingCategories: {},
      detectedDocumentType: documentType,
      aiEnhanced: useAI && isAIAvailable()
  };

  placeholderData.profitMargin = totalIncome > 0 ? 
    (((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(2) + "%" 
    : "N/A (No income to calculate margin)";

  // Generate AI insights if AI is enabled
  let aiInsights = [];
  let aiCorrectionsCount = 0;
  if (useAI && isAIAvailable() && transactionsToAnalyze.length > 0) {
    try {
      console.log('🤖 AI: Analyzing', transactionsToAnalyze.length, 'transactions for corrections...');
      const aiResult = boogasiAI.analyzeStatement({ transactions: transactionsToAnalyze });
      aiInsights = aiResult.insights || [];
      aiCorrectionsCount = aiResult.corrections_made || 0;
      
      // Update transactions with AI corrections
      transactionsToAnalyze = aiResult.transactions || transactionsToAnalyze;
      
      console.log('✅ AI: Made', aiCorrectionsCount, 'corrections to match labeled data quality');
    } catch (error) {
      console.error('Failed to generate AI insights:', error);
      aiInsights = [];
    }
  }
  
  const expenseItems = {};
transactionsToAnalyze
  .filter(tx => typeof tx.amount === 'number' && tx.amount < 0)
  .forEach(tx => {
    // Prioritize AI category
    const category = tx.ai_category || tx.category || tx.description || "Unknown Expense";
    
    // Format nicely: "cash_withdrawal" → "Cash Withdrawal"
    const formattedCategory = category.replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    expenseItems[formattedCategory] = (expenseItems[formattedCategory] || 0) + Math.abs(tx.amount);
    
    // Debug logging
    if (tx.ai_category && useAI) {
      console.log(`🏷️ AI: "${tx.description}" → ${formattedCategory} (${(tx.category_confidence * 100).toFixed(0)}% confidence)`);
    }
  });
  
  placeholderData.topSpendingCategories = Object.entries(expenseItems)
    .sort(([,a],[,b]) => a-b) 
    .slice(0,3)
    .reduce((obj, [key, value]) => {
      obj[key] = `${Math.abs(value).toFixed(2)} ${primaryCurrency}`; 
      return obj;
    }, {});


  if (allInputText && (allInputText.toLowerCase().includes("manual transaction data") || allInputText.toLowerCase().includes("paste transactions here"))) {
    placeholderData.manualDataAcknowledgement = "Manual transaction data input was conceptually included in this analysis by Boogasi AI.";
  }

  // Add AI correction summary
  if (aiCorrectionsCount > 0) {
    placeholderData.aiCorrectionSummary = `🤖 AI Enhancement: Corrected ${aiCorrectionsCount} transactions from parsed OCR data to match labeled data quality. This improves accuracy by using patterns learned from ${boogasiAI.modelArtifacts?.training_samples || 5} training datasets.`;
  }

  // 🔥 FIX: Declare reportData before using it
  let reportData = {};

  switch (actionType) {
    case 'Analyze Expenses':
      reportData = {
        ...placeholderData,
        analysisFocus: `Detailed Expense Breakdown & Profitability based on the provided ${documentType}.`,
        suggestions: `Based on the analyzed transactions, review major spending categories like '${Object.keys(placeholderData.topSpendingCategories)[0] || 'your top expense'}'. If OCR data was used, ensure vendor names from files like '${transactionsToAnalyze[0]?.sourceFile || 'your document'}' are clear for better categorization.\n` + investmentAdvice,
        aiInsights: aiInsights,
        aiCorrectionSummary: placeholderData.aiCorrectionSummary
      };
      return generateProfessionalReport("Expense & Profitability Report (Boogasi AI)", reportData, userName, transactionsToAnalyze);
      
    case 'Forecast Cash Flow':
      reportData = {
        ...placeholderData,
        currentCashBalance: "$10,300.00 (example - not from OCR/input)",
        expectedIncomeNextMonth: `${(totalIncome * 1.05).toFixed(2)} ${primaryCurrency} (projected with 5% growth based on analyzed income)`,
        projectedExpensesNextMonth: `${(totalExpenses * 0.98).toFixed(2)} ${primaryCurrency} (projected with 2% reduction based on analyzed expenses)`,
        projectedNetCashFlow: `${((totalIncome * 1.05) - (totalExpenses * 0.98)).toFixed(2)} ${primaryCurrency}`,
        outlook: `Positive cash flow expected based on recent transaction patterns from the ${documentType}.`,
        suggestions: "With the projected net cash flow, consider allocating to savings or investments. Review recurring expenses identified in the transactions for potential optimization.\n" + investmentAdvice,
        aiInsights: aiInsights,
        aiCorrectionSummary: placeholderData.aiCorrectionSummary
      };
      return generateProfessionalReport("Cash Flow Forecast (Boogasi AI)", reportData, userName, transactionsToAnalyze);
      
    case 'Flag Unusual Transactions':
      let flaggedTransactions = [];
      if (aiInsights) {
        const unusualInsight = aiInsights.find(i => i.type === 'alert' && i.category === 'unusual');
        if (unusualInsight && unusualInsight.transactions) {
          flaggedTransactions = unusualInsight.transactions.map(tx => 
            `${tx.description}: ${tx.amount > 0 ? '+' : ''}${tx.amount.toFixed(2)} ${primaryCurrency} on ${tx.date}`
          );
        }
      }
      
      if (flaggedTransactions.length === 0 && transactionsToAnalyze.length > 0) {
        flaggedTransactions = [
          `Large Expense: '${Object.keys(placeholderData.topSpendingCategories)[0] || 'N/A'}' for ${placeholderData.topSpendingCategories[Object.keys(placeholderData.topSpendingCategories)[0]] || 'N/A'}. Verify if this was a planned expense from source '${transactionsToAnalyze.find(tx => (tx.description) === Object.keys(placeholderData.topSpendingCategories)[0])?.sourceFile || 'document'}'.`,
          `Multiple Small Debits: Small, frequent debits can add up. Monitor categories with many small transactions if present in your data.`
        ];
      }
      
      reportData = {
        ...placeholderData,
        flaggedTransactionsBasedOnAnalysis: flaggedTransactions.length > 0 ? flaggedTransactions : ["No specific transactions to flag from provided data."],
        suggestions: "Review any large one-time expenses. Track small, frequent purchases to understand their cumulative impact. Ensure all income sources are recurring or expected, based on your financial documents.\n" + investmentAdvice,
        aiInsights: aiInsights,
        aiCorrectionSummary: placeholderData.aiCorrectionSummary
      };
      return generateProfessionalReport("Unusual Transactions & Spending Habits Review (Boogasi AI)", reportData, userName, transactionsToAnalyze);
      
    case 'Generate Weekly Report':
      const today = new Date();
      const oneWeekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
      
      const weeklyTransactions = transactionsToAnalyze.filter(tx => {
          if (!tx.date) return false;
          const txDate = new Date(tx.date);
          return !isNaN(txDate.getTime()) && txDate >= oneWeekAgo && txDate <= today;
      });

      const weeklyIncome = weeklyTransactions.filter(tx => typeof tx.amount === 'number' && tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0);
      const weeklyExpenses = Math.abs(weeklyTransactions.filter(tx => typeof tx.amount === 'number' && tx.amount < 0).reduce((sum, tx) => sum + tx.amount, 0));
      
      reportData = {
        ...placeholderData,
        periodCovered: `Last 7 days (${oneWeekAgo.toLocaleDateString()} - ${today.toLocaleDateString()})`,
        incomeThisWeek: `${weeklyIncome.toFixed(2)} ${primaryCurrency}`,
        expensesThisWeek: `${weeklyExpenses.toFixed(2)} ${primaryCurrency}`,
        netBalanceThisWeek: `${(weeklyIncome - weeklyExpenses).toFixed(2)} ${primaryCurrency}`,
        savingsRateThisWeek: weeklyIncome > 0 ? `${((weeklyIncome - weeklyExpenses) / weeklyIncome * 100).toFixed(2)}%` : "N/A (No income this week)",
        actionableInsights: [
            "Review transactions from the past week (if data covers this period) to ensure accurate categorization.",
            "Identify any unexpected expenses from the weekly transaction list."
        ],
        suggestions: "Focus on maximizing the net balance by reviewing weekly spending patterns. Allocate savings towards your financial goals.\n" + investmentAdvice,
        aiInsights: aiInsights,
        aiCorrectionSummary: placeholderData.aiCorrectionSummary
      };
      return generateProfessionalReport("Weekly Financial Summary & Insights (Boogasi AI)", reportData, userName, weeklyTransactions);
      
    case 'Get Investment Suggestions':
        return getInvestmentSuggestions(userName); 
        
    default:
      let greetingDefault = userName ? `Hello ${userName}! ` : '';
      return `${greetingDefault}Financial action not recognized by Boogasi AI.\n`;
  }
};

export const simulatePortfolioAction = (actionType, userName) => {
    let reportData = {};
    switch (actionType) {
        case 'Track Contributions':
            reportData = {
              totalContributionsYTD: "$15,200.00",
              contributionBreakdown: {
                "Tax-Advantaged Retirement (401k/IRA)": "$8,000.00",
                "Taxable Brokerage Account": "$6,200.00",
                "High-Yield Savings (Emergency Fund)": "$1,000.00",
              },
              nextContributionTarget: "Increase taxable brokerage by $750 next month to catch up on annual goal.",
              suggestions: "Excellent progress on retirement accounts. Consider setting up recurring investments for the brokerage account to ensure consistency and benefit from dollar-cost averaging."
            };
            return generateProfessionalReport("Investment Contributions Tracker (Boogasi AI)", reportData, userName);
        case 'Rebalance Reminders':
            reportData = {
              portfolioName: "Aggressive Growth Portfolio",
              currentAllocation: "Domestic Stocks: 55%, International Stocks: 25%, Bonds: 10%, Real Estate (REITs): 5%, Cash: 5%",
              targetAllocation: "Domestic Stocks: 50%, International Stocks: 30%, Bonds: 10%, Real Estate (REITs): 5%, Cash: 5%",
              rebalanceActionRequired: [
                  "Sell 5% of Domestic Stocks.",
                  "Buy 5% of International Stocks."
              ],
              reminderFrequency: "Semi-Annually (Next review: Nov 1, 2025)",
              suggestions: "Your portfolio is slightly overweight in Domestic Stocks and underweight in International Stocks compared to your target. Rebalancing now will help maintain your desired risk exposure and capture potential international growth."
            };
            return generateProfessionalReport("Portfolio Rebalance Reminder & Analysis (Boogasi AI)", reportData, userName);
        case 'Portfolio Performance':
            reportData = {
              portfolioName: "Balanced Portfolio",
              totalPortfolioValue: "$275,890.50",
              timePeriod: "Year-to-Date (Jan 1, 2025 - Jun 7, 2025)",
              overallReturnAbsolute: "+$18,340.75",
              overallReturnPercentage: "+7.12%",
              benchmarkReturnSAndP500: "+6.50%",
              performanceVsBenchmark: "Outperformed S&P 500 by 0.62%",
              bestPerformingHoldings: ["Tech Innovators ETF (+18.2% YTD)", "Global Healthcare Fund (+12.5% YTD)"],
              worstPerformingHoldings: ["Small-Cap Value Fund (-3.1% YTD)"],
              suggestions: "Your portfolio is performing well against the benchmark. The Tech and Healthcare sectors are driving growth. Monitor the Small-Cap Value Fund; if underperformance continues for another quarter, consider reducing allocation or switching to a different small-cap strategy. (Mock Chart: Bar chart comparing asset class returns would be here)."
            };
            return generateProfessionalReport("Portfolio Performance Report (Boogasi AI)", reportData, userName);
        case 'Goal Progress':
            reportData = {
              financialGoal: "Purchase Vacation Property",
              targetAmount: "$150,000 (Down Payment & Closing Costs)",
              currentAmountSavedForGoal: "$85,600.00 (57.07% of target)",
              targetDate: "December 31, 2027",
              timeRemaining: "2 years, 6 months",
              requiredMonthlySavings: "$1,981.82 (to reach target by date, assuming 0% growth on savings)",
              currentMonthlySavingsRateForGoal: "$1,500.00",
              projectedShortfallOrSurplus: "Projected shortfall of $481.82/month at current rate.",
              suggestions: "You are making good progress, but at the current rate, you might miss your target date. To get back on track, consider: 1. Increasing monthly savings by ~$482. 2. Allocating a portion of these savings to a low-risk investment vehicle that could offer modest growth. 3. Re-evaluating the target date or amount if increasing savings isn't feasible."
            };
            return generateProfessionalReport("Financial Goal Progress Report (Boogasi AI)", reportData, userName);
        case 'Smart Alerts':
            reportData = {
              alertsTriggered: [
                "High Cash Balance: Your portfolio's cash allocation (12%) exceeds your target of 5%. Potential 'cash drag' reducing overall returns.",
                "Sector Overconcentration: Technology sector now represents 45% of your equity holdings. Target is 30%. Consider trimming positions to reduce sector-specific risk.",
                "Dividend Income Received: $575.30 from 'XYZ Dividend ETF' has been credited to your account. Reinvest or allocate as per your strategy."
              ],
              actionableRecommendations: [
                "Deploy excess cash: Identify suitable investment opportunities for at least 7% of your cash holding.",
                "Rebalance tech sector: Systematically reduce tech exposure over the next month.",
                "Confirm dividend reinvestment: Ensure the received dividend is handled according to your plan."
              ],
              suggestions: "Regularly review and act on these alerts to keep your portfolio aligned with your financial plan and risk tolerance. Automate reinvestment of dividends if that's part of your strategy."
            };
            return generateProfessionalReport("Smart Portfolio Alerts & Recommendations (Boogasi AI)", reportData, userName);
        default:
          let greetingPortfolio = userName ? `Hello ${userName}! ` : '';
          return `${greetingPortfolio}Portfolio action not recognized by Boogasi AI.\n`;
      }
};