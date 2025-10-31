import React from 'react';

export const ALL_PORTFOLIO_ACTION_TYPES = [
  'Track Contributions',
  'Rebalance Reminders',
  'Portfolio Performance',
  'Goal Progress',
  'Smart Alerts'
];

export const ALL_FINANCIAL_ANALYSIS_TYPES = [
  'Analyze Expenses',
  'Forecast Cash Flow',
  'Flag Unusual Transactions',
  'Generate Weekly Report'
];

export const MOCK_BANK_STATEMENT_TRANSACTIONS = [ 
  { date: "2025-05-01", description: "Sample Grocery Store", amount: -75.50, currency: "USD", sourceFile: "statement_may.pdf" },
  { date: "2025-05-02", description: "Sample Salary Deposit", amount: 2500.00, currency: "USD", sourceFile: "statement_may.pdf" },
  { date: "2025-05-03", description: "Sample Utility Bill", amount: -120.15, currency: "USD", sourceFile: "statement_may.pdf" },
];