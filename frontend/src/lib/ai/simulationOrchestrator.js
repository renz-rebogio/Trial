import React from 'react';
import { simulateFinancialAnalysis, simulatePortfolioAction } from '@/lib/ai/analysisEngines';
import { ALL_PORTFOLIO_ACTION_TYPES, ALL_FINANCIAL_ANALYSIS_TYPES } from '@/lib/ai/constants';

export const simulateAIDocumentProcessing = (processedFilesDetails) => {
    let processingLog = "--- SECTION_TITLE_MARKER:Boogasi AI Document Processing & OCR Log ---\n";
    processingLog += "-------------------------------------------\n";
    
    if (!processedFilesDetails || processedFilesDetails.length === 0) {
        processingLog += "No files were provided for processing.\n";
        return processingLog;
    }

    processingLog += `Processing ${processedFilesDetails.length} file(s):\n`;
    processedFilesDetails.forEach(fileDetail => {
        processingLog += `\nFile: ${fileDetail.name} (${fileDetail.type})\n`;
        if (fileDetail.ocrError) {
            processingLog += ` - OCR Status: Error - ${fileDetail.ocrError}\n`;
        } else if (fileDetail.ocrRawText || (fileDetail.ocrFormattedTransactions && fileDetail.ocrFormattedTransactions.length > 0)) {
            processingLog += ` - OCR Status: Successful.\n`;
            processingLog += ` - Raw Text Snippet (first 100 chars): ${(fileDetail.ocrRawText || '').substring(0, 100).replace(/\s+/g, ' ')}...\n`;
            processingLog += ` - Formatted Transactions Found by OCR: ${fileDetail.ocrFormattedTransactions ? fileDetail.ocrFormattedTransactions.length : 0}\n`;
        } else if (fileDetail.type === 'text/csv') {
            processingLog += ` - CSV file detected. Data will be used as provided if manual input contains it.\n`;
        } else {
             processingLog += ` - OCR Status: No significant parseable text found or not an image/PDF.\n`;
        }
    });
    processingLog += "\n-------------------------------------------\nDocument processing log complete.\nBoogasi AI will now use this information for financial analysis if valid data exists.\n\n";
    return processingLog;
};


export const simulateRandomAIAction = (userName, ocrTransactions = []) => {
  const actionCategory = Math.random() > 0.5 ? 'portfolio' : 'financial';
  let selectedActionType;
  let report;

  if (actionCategory === 'portfolio') {
    selectedActionType = ALL_PORTFOLIO_ACTION_TYPES[Math.floor(Math.random() * ALL_PORTFOLIO_ACTION_TYPES.length)];
    report = simulatePortfolioAction(selectedActionType, userName);
  } else {
    selectedActionType = ALL_FINANCIAL_ANALYSIS_TYPES[Math.floor(Math.random() * ALL_FINANCIAL_ANALYSIS_TYPES.length)];
    const hasInputData = ocrTransactions && ocrTransactions.length > 0; 
    const allInputText = ""; 
    report = simulateFinancialAnalysis(selectedActionType, userName, hasInputData, allInputText, ocrTransactions);
  }
  
  return {
    actionType: selectedActionType,
    category: actionCategory,
    reportTitle: `Dynamic AI Report for ${userName}: ${selectedActionType}`,
    reportContent: report,
    timestamp: new Date().toISOString()
  };
};