import React from 'react';

import {
  ALL_PORTFOLIO_ACTION_TYPES,
  ALL_FINANCIAL_ANALYSIS_TYPES,
  MOCK_BANK_STATEMENT_TRANSACTIONS
} from '@/lib/ai/constants';

import {
  INVESTMENT_ARTICLES_DATA,
  fetchInvestmentArticles,
  getInvestmentSuggestions
} from '@/lib/ai/investmentData';

import {
  generateProfessionalReport
} from '@/lib/ai/reportFormatter';

import {
  simulateFinancialAnalysis,
  simulatePortfolioAction,
  detectDocumentType
} from '@/lib/ai/analysisEngines';

import {
  simulateAIDocumentProcessing,
  simulateRandomAIAction
} from '@/lib/ai/simulationOrchestrator';


export {
  ALL_PORTFOLIO_ACTION_TYPES,
  ALL_FINANCIAL_ANALYSIS_TYPES,
  MOCK_BANK_STATEMENT_TRANSACTIONS,
  INVESTMENT_ARTICLES_DATA,
  fetchInvestmentArticles,
  getInvestmentSuggestions,
  generateProfessionalReport,
  simulateFinancialAnalysis,
  simulatePortfolioAction,
  simulateAIDocumentProcessing,
  simulateRandomAIAction,
  detectDocumentType
};