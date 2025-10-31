// AI-powered insights generator for financial analysis
class AIInsightsGenerator {
  constructor() {
    this.insightTemplates = {
      expense_summary: [
        { threshold: 0.3, message: (cat, pct) => `⚠️ You're spending ${pct}% on ${cat}. Consider reducing this category to improve savings.` },
        { threshold: 0.2, message: (cat, pct) => `💡 ${cat} accounts for ${pct}% of your expenses. This is a significant portion of your budget.` },
        { threshold: 0.1, message: (cat, pct) => `📊 ${cat} represents ${pct}% of your spending - within normal range.` },
      ]
    };
  }

  generateExpenseSummaryInsights(data) {
    const insights = [];
    
    if (!data?.summary) return insights;

    const categories = Object.entries(data.summary).sort((a, b) => b[1].percentage - a[1].percentage);
    const totalAmount = categories.reduce((sum, [_, info]) => sum + info.total, 0);

    // Insight 1: Highest spending category
    if (categories.length > 0) {
      const [topCat, topInfo] = categories[0];
      const pct = topInfo.percentage;
      
      if (pct > 40) {
        insights.push({
          type: 'warning',
          icon: '⚠️',
          title: 'High Concentration Risk',
          message: `${topCat} dominates your spending at ${pct}%. Diversifying expenses could improve financial flexibility.`,
          actionable: true,
          suggestion: `Try to reduce ${topCat} spending by 10% next month. This could save you ₱${(topInfo.total * 0.1).toLocaleString('en-PH')}.`
        });
      } else if (pct > 25) {
        insights.push({
          type: 'info',
          icon: '💡',
          title: 'Major Expense Category',
          message: `${topCat} is your largest expense at ${pct}% (₱${topInfo.total.toLocaleString('en-PH')}).`,
          suggestion: `This is reasonable, but monitoring this category could help optimize your budget.`
        });
      }
    }

    // Insight 2: Small frequent expenses
    const smallCategories = categories.filter(([_, info]) => info.percentage < 5 && info.percentage > 0);
    if (smallCategories.length >= 3) {
      const smallTotal = smallCategories.reduce((sum, [_, info]) => sum + info.total, 0);
      insights.push({
        type: 'tip',
        icon: '💰',
        title: 'Small Expenses Add Up',
        message: `You have ${smallCategories.length} minor expense categories totaling ₱${smallTotal.toLocaleString('en-PH')}.`,
        suggestion: `These "small" expenses represent ${((smallTotal / totalAmount) * 100).toFixed(1)}% of your spending. Cutting back here could yield significant savings.`
      });
    }

    // Insight 3: Spending distribution
    const categoryCount = categories.length;
    if (categoryCount > 8) {
      insights.push({
        type: 'info',
        icon: '📊',
        title: 'Diverse Spending Pattern',
        message: `Your expenses are spread across ${categoryCount} categories, showing good financial diversity.`,
        suggestion: 'Continue monitoring all categories to maintain balanced spending habits.'
      });
    } else if (categoryCount < 4) {
      insights.push({
        type: 'tip',
        icon: '🎯',
        title: 'Concentrated Spending',
        message: `Most of your expenses fall into just ${categoryCount} categories.`,
        suggestion: 'Consider if this reflects your actual spending or if some transactions need better categorization.'
      });
    }

    // Insight 4: Comparative analysis (if we have historical data)
    insights.push({
      type: 'analysis',
      icon: '📈',
      title: 'Spending Breakdown',
      message: `Total expenses: ₱${totalAmount.toLocaleString('en-PH')} across ${categoryCount} categories.`,
      details: categories.slice(0, 3).map(([cat, info]) => 
        `• ${cat}: ₱${info.total.toLocaleString('en-PH')} (${info.percentage}%)`
      ).join('\n')
    });

    return insights;
  }

  generateCashFlowInsights(data) {
    const insights = [];
    
    if (!data?.weekly_series || data.weekly_series.length === 0) return insights;

    const weeks = data.weekly_series;
    const totalIncome = weeks.reduce((sum, w) => sum + (w.income || 0), 0);
    const totalExpense = weeks.reduce((sum, w) => sum + (w.expense || 0), 0);
    const netFlow = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (netFlow / totalIncome) * 100 : 0;

    // Insight 1: Overall financial health
    if (savingsRate > 20) {
      insights.push({
        type: 'success',
        icon: '🎉',
        title: 'Excellent Savings Rate',
        message: `You're saving ${savingsRate.toFixed(1)}% of your income - well above the recommended 20% benchmark!`,
        suggestion: `Consider investing ₱${((netFlow * 0.5).toLocaleString('en-PH'))} of your surplus into long-term savings or investments.`
      });
    } else if (savingsRate > 10) {
      insights.push({
        type: 'success',
        icon: '✅',
        title: 'Good Savings Habit',
        message: `Your ${savingsRate.toFixed(1)}% savings rate is on track. Keep it up!`,
        suggestion: `Try to increase your savings rate to 20% for optimal financial health.`
      });
    } else if (savingsRate > 0) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Low Savings Rate',
        message: `You're only saving ${savingsRate.toFixed(1)}% of your income. The recommended rate is 20%.`,
        suggestion: `Identify areas to cut expenses by ${(20 - savingsRate).toFixed(1)}% to reach the 20% savings goal.`
      });
    } else {
      insights.push({
        type: 'alert',
        icon: '🚨',
        title: 'Negative Cash Flow',
        message: `You're spending ₱${Math.abs(netFlow).toLocaleString('en-PH')} more than you earn.`,
        suggestion: `Urgent action needed: Review expenses immediately and create a budget to avoid debt accumulation.`
      });
    }

    // Insight 2: Weekly volatility
    const weeklyNetFlows = weeks.map(w => w.net);
    const avgWeeklyNet = weeklyNetFlows.reduce((a, b) => a + b, 0) / weeklyNetFlows.length;
    const volatility = Math.sqrt(
      weeklyNetFlows.reduce((sum, val) => sum + Math.pow(val - avgWeeklyNet, 2), 0) / weeklyNetFlows.length
    );
    
    if (volatility > avgWeeklyNet * 0.5) {
      insights.push({
        type: 'tip',
        icon: '📉',
        title: 'Irregular Cash Flow',
        message: `Your weekly cash flow varies significantly (σ = ₱${volatility.toFixed(2)}).`,
        suggestion: `Build an emergency fund of 3-6 months expenses to handle income fluctuations.`
      });
    }

    // Insight 3: Income vs Expense trend
    insights.push({
        type: 'analysis',
      icon: '💰',
      title: 'Cash Flow Summary',
      message: `Income: ₱${totalIncome.toLocaleString('en-PH')} | Expenses: ₱${totalExpense.toLocaleString('en-PH')} | Net: ₱${netFlow.toLocaleString('en-PH')}`,
      details: `Average weekly surplus: ₱${(netFlow / weeks.length).toLocaleString('en-PH')}`
    });

    return insights;
  }

  generateFlaggedTransactionsInsights(data) {
    const insights = [];
    
    if (!data?.flagged || data.flagged.length === 0) {
      insights.push({
        type: 'success',
        icon: '✅',
        title: 'No Unusual Activity',
        message: 'All transactions appear normal. Great financial consistency!',
        suggestion: 'Continue monitoring your spending patterns to maintain this stability.'
      });
      return insights;
    }

    const flagged = data.flagged;
    const highSeverity = flagged.filter(f => f.severity === 'high').length;
    const mediumSeverity = flagged.filter(f => f.severity === 'medium').length;

    // Insight 1: Severity breakdown
    if (highSeverity > 0) {
      insights.push({
        type: 'alert',
        icon: '🚨',
        title: 'High-Risk Transactions Detected',
        message: `${highSeverity} transaction(s) flagged as high risk.`,
        suggestion: `Review these immediately to ensure they are legitimate and not fraudulent activity.`
      });
    }

    if (mediumSeverity > 0) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Unusual Spending Patterns',
        message: `${mediumSeverity} transaction(s) deviate from your normal spending habits.`,
        suggestion: `Verify these transactions and consider if they represent one-time events or new spending patterns.`
      });
    }

    // Insight 2: Common reasons
    const reasons = {};
    flagged.forEach(f => {
      (f.reasons || [f.reason]).forEach(r => {
        reasons[r] = (reasons[r] || 0) + 1;
      });
    });

    const topReason = Object.entries(reasons).sort((a, b) => b[1] - a[1])[0];
    if (topReason) {
      insights.push({
        type: 'info',
        icon: '💡',
        title: 'Primary Flag Reason',
        message: `Most flags are due to: "${topReason[0]}" (${topReason[1]} occurrences)`,
        suggestion: `Understanding why transactions are flagged helps you adjust spending patterns or budgets accordingly.`
      });
    }

    // Insight 3: Total flagged amount
    const totalFlagged = flagged.reduce((sum, f) => sum + Math.abs(f.amount || 0), 0);
    insights.push({
      type: 'analysis',
      icon: '📊',
      title: 'Flagged Transactions Impact',
      message: `Total flagged amount: ₱${totalFlagged.toLocaleString('en-PH')}`,
      details: `This represents ${flagged.length} transaction(s) requiring your attention.`
    });

    return insights;
  }

  generateWeeklyReportInsights(data) {
    const insights = [];
    
    if (!data?.summary) return insights;

    const { total_income, total_expenses, net, avg_daily_spend } = data.summary;
    const dailyBudget = total_income / 7; // Assuming weekly data

    // Insight 1: Daily spending vs budget
    if (avg_daily_spend > dailyBudget) {
      const overspend = avg_daily_spend - dailyBudget;
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Overspending Alert',
        message: `Your daily spending (₱${avg_daily_spend.toLocaleString('en-PH')}) exceeds your daily budget (₱${dailyBudget.toLocaleString('en-PH')}) by ₱${overspend.toLocaleString('en-PH')}.`,
        suggestion: `Reduce daily expenses by ₱${overspend.toLocaleString('en-PH')} to stay within budget.`
      });
    } else {
      const surplus = dailyBudget - avg_daily_spend;
      insights.push({
        type: 'success',
        icon: '✅',
        title: 'Within Budget',
        message: `You're spending ₱${surplus.toLocaleString('en-PH')} less than your daily budget. Well done!`,
        suggestion: `Consider saving or investing this ₱${(surplus * 7).toLocaleString('en-PH')} weekly surplus.`
      });
    }

    // Insight 2: Net position
    if (net > 0) {
      insights.push({
        type: 'success',
        icon: '💰',
        title: 'Positive Weekly Balance',
        message: `You ended the week with a surplus of ₱${net.toLocaleString('en-PH')}.`,
        suggestion: `Great job! This weekly surplus compounds to ₱${(net * 52).toLocaleString('en-PH')} annually if maintained.`
      });
    } else {
      insights.push({
        type: 'alert',
        icon: '🚨',
        title: 'Weekly Deficit',
        message: `You spent ₱${Math.abs(net).toLocaleString('en-PH')} more than you earned this week.`,
        suggestion: `Review your expenses to identify areas for cost reduction. This deficit rate could lead to ₱${(Math.abs(net) * 52).toLocaleString('en-PH')} annual shortfall.`
      });
    }

    // Insight 3: Expense ratio
    const expenseRatio = total_income > 0 ? (total_expenses / total_income) * 100 : 0;
    insights.push({
      type: 'analysis',
      icon: '📊',
      title: 'Weekly Expense Ratio',
      message: `You spent ${expenseRatio.toFixed(1)}% of your weekly income.`,
      details: `Income: ₱${total_income.toLocaleString('en-PH')} | Expenses: ₱${total_expenses.toLocaleString('en-PH')}`,
      suggestion: expenseRatio > 80 ? 'Try to keep expenses below 80% of income for healthy savings.' : 'Your expense ratio is healthy!'
    });

    return insights;
  }

  generateCombinedInsights(data) {
    const insights = [];
    
    if (!data?.detailed_analyses) return insights;

    const { expense_summary, cash_flow_forecast, flagged_transactions, weekly_report } = data.detailed_analyses;

    // Generate insights for each component
    const expenseInsights = this.generateExpenseSummaryInsights(expense_summary);
    const cashFlowInsights = this.generateCashFlowInsights(cash_flow_forecast);
    const flaggedInsights = this.generateFlaggedTransactionsInsights(flagged_transactions);
    const weeklyInsights = this.generateWeeklyReportInsights(weekly_report);

    // Combined overview insight
    insights.push({
      type: 'overview',
      icon: '🎯',
      title: 'Financial Health Overview',
      message: 'Comprehensive analysis of your financial activities',
      details: [
        `✅ ${expenseInsights.length} expense insights`,
        `📈 ${cashFlowInsights.length} cash flow insights`,
        `⚠️ ${flaggedInsights.length} transaction alerts`,
        `📊 ${weeklyInsights.length} weekly patterns`
      ].join('\n')
    });

    // Return all insights organized by category
    return {
      overview: insights,
      expenses: expenseInsights,
      cashFlow: cashFlowInsights,
      flagged: flaggedInsights,
      weekly: weeklyInsights
    };
  }

  // Main entry point
  generateInsights(feature, data) {
    switch (feature) {
      case 'expense_summary':
        return this.generateExpenseSummaryInsights(data);
      case 'cash_flow_forecast':
        return this.generateCashFlowInsights(data);
      case 'flag_unusual_transactions':
        return this.generateFlaggedTransactionsInsights(data);
      case 'weekly_report':
        return this.generateWeeklyReportInsights(data);
      case 'combined_insights':
        return this.generateCombinedInsights(data);
      default:
        return [];
    }
  }
}

export const aiInsightsGenerator = new AIInsightsGenerator();