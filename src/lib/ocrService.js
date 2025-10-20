import { supabase } from '@/lib/customSupabaseClient';
import { parseBdoTransactions } from '@/lib/bdoOcrService';
import parseHsbcPhilippinesCreditCard from '@/lib/hsbcPHOcrService';
import { parseHsbcUKBankStatement } from '@/lib/hsbcUKOcrService';
import { parseMetrobankBankStatement } from '@/lib/metrobankOcrService';
import { parseLandbankStatement } from '@/lib/landbankOcrService';
import { boogasiAI } from '@/lib/ai/boogasiAiClient';

let fetchedApiKey = null;

const fetchOcrApiKey = async () => {
  if (fetchedApiKey) return fetchedApiKey;
  try {
    const { data, error } = await supabase.functions.invoke('get-ocr-api-key');
    if (error) throw new Error(`Failed to fetch OCR API key: ${error.message}`);
    if (!data || !data.apiKey) throw new Error('OCR API key was not returned from the server.');
    fetchedApiKey = data.apiKey;
    return fetchedApiKey;
  } catch (e) {
    console.error('Exception fetching OCR API key:', e);
    throw e;
  }
};

const detectBank = (rawText) => {
  const lowerText = rawText.toLowerCase();
  
  // HSBC detection - supports both UK bank statements and Philippines credit cards
  if (lowerText.includes('hsbc')) {
    return 'HSBC';
  }
  
  // BDO detection
  if (lowerText.includes('bdo unibank') || 
      lowerText.includes('banco de oro') ||
      (lowerText.includes('transaction date') && lowerText.includes('value date'))) {
    return 'BDO';
  }

  // BPI detection
  if (lowerText.includes('bank of the philippine islands') || 
      lowerText.includes('bpi') ||
      lowerText.includes('bpi family savings bank')) {
    return 'BPI';
  }

  // Metrobank detection
  if (lowerText.includes('metrobank') || 
      lowerText.includes('metropolitan bank') ||
      lowerText.includes('metro bank')) {
    return 'METROBANK';
  }

  // Landbank detection
  if (lowerText.includes('land bank') || 
      lowerText.includes('landbank') ||
      lowerText.includes('land bank of the philippines')) {
    return 'LANDBANK';
  }

  // Security Bank detection
  if (lowerText.includes('security bank')) {
    return 'SECURITY_BANK';
  }

  // Citibank detection
  if (lowerText.includes('citibank') || lowerText.includes('citi')) {
    return 'CITIBANK';
  }

  return 'UNKNOWN';
};

const detectHsbcStatementType = (rawText) => {
  const lowerText = rawText.toLowerCase();
  
  // HSBC UK Bank Statement indicators
  const ukIndicators = [
    lowerText.includes('paid out') && lowerText.includes('paid in'),
    lowerText.includes('payments out') && lowerText.includes('payments in'),
    lowerText.includes('your statement'),
    lowerText.includes('sort code') || lowerText.includes('sortcode'),
    /international bank account number/i.test(rawText),
    /branch identifier code/i.test(rawText),
    /\d{2}[-]\d{2}[-]\d{2}/.test(rawText), // Sort code format
    /balance brought forward/i.test(rawText),
    /balance carried forward/i.test(rawText),
  ];
  
  // HSBC Philippines Credit Card indicators
  const philippinesIndicators = [
    lowerText.includes('credit card statement'),
    lowerText.includes('post date') && lowerText.includes('tran date'),
    lowerText.includes('hsbc gold visa'),
    lowerText.includes('credit limit'),
    lowerText.includes('minimum amount due'),
    lowerText.includes('payment due date'),
    lowerText.includes('previous balance') && lowerText.includes('new balance'),
    /available credit/i.test(rawText),
  ];
  
  // Count matches
  const ukScore = ukIndicators.filter(Boolean).length;
  const philippinesScore = philippinesIndicators.filter(Boolean).length;
  
  console.log('HSBC Type Detection - UK Score:', ukScore, '| Philippines Score:', philippinesScore);
  
  // Determine type based on scores
  if (ukScore > philippinesScore && ukScore >= 2) {
    return 'UK_BANK_STATEMENT';
  } else if (philippinesScore > ukScore && philippinesScore >= 2) {
    return 'PHILIPPINES_CREDIT_CARD';
  }
  
  // Fallback: check for specific strong indicators
  if (lowerText.includes('paid out') || lowerText.includes('paid in')) {
    return 'UK_BANK_STATEMENT';
  }
  
  if (lowerText.includes('credit card statement') || lowerText.includes('minimum amount due')) {
    return 'PHILIPPINES_CREDIT_CARD';
  }
  
  return 'UNKNOWN';
};

// 🆕 NEW: Extract OCR confidence scores
const extractConfidenceScores = (ocrResult) => {
  try {
    if (ocrResult.ParsedResults && ocrResult.ParsedResults[0]) {
      const parsed = ocrResult.ParsedResults[0];
      
      // OCR.space returns TextOverlay with word-level confidence
      const textOverlay = parsed.TextOverlay;
      if (textOverlay && textOverlay.Lines) {
        const allWords = textOverlay.Lines.flatMap(line => 
          line.Words || []
        );
        
        const confidences = allWords
          .map(word => word.Confidence || 0)
          .filter(conf => conf > 0);
        
        const avgConfidence = confidences.length > 0
          ? confidences.reduce((a, b) => a + b, 0) / confidences.length
          : 0;
        
        return {
          average: avgConfidence,
          words: allWords,
          hasLowConfidenceRegions: confidences.some(c => c < 60)
        };
      }
    }
  } catch (error) {
    console.warn('Could not extract confidence scores:', error);
  }
  
  return {
    average: 0,
    words: [],
    hasLowConfidenceRegions: false
  };
};

// 🆕 NEW: Multi-pass OCR with AI recovery
const performOcrWithRecovery = async (file, apiKey, initialParseResult) => {
  const { rawText, formattedTransactions, detectedBank } = initialParseResult;
  
  // Skip recovery if we have good results
  if (formattedTransactions && formattedTransactions.length > 5) {
    console.log('✅ Initial OCR successful, skipping recovery');
    return initialParseResult;
  }
  
  console.log('🔄 Performing AI-enhanced recovery...');
  
  try {
    // PASS 2: Enhanced OCR with table detection
    const enhancedFormData = new FormData();
    enhancedFormData.append('file', file);
    enhancedFormData.append('apikey', apiKey);
    enhancedFormData.append('language', 'eng');
    enhancedFormData.append('isOverlayRequired', 'true'); // Get word positions
    enhancedFormData.append('detectOrientation', 'true');
    enhancedFormData.append('scale', 'true');
    enhancedFormData.append('OCREngine', '2');
    enhancedFormData.append('isTable', 'true');
    
    const enhancedResponse = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: enhancedFormData
    });
    
    if (!enhancedResponse.ok) {
      console.warn('Enhanced OCR failed, using original results');
      return initialParseResult;
    }
    
    const enhancedResult = await enhancedResponse.json();
    
    if (enhancedResult.ParsedResults && enhancedResult.ParsedResults[0]?.ParsedText) {
      const enhancedText = enhancedResult.ParsedResults[0].ParsedText;
      
      // Parse with the enhanced text
      const enhancedParseResult = parseWithBankParser(
        enhancedText, 
        detectedBank, 
        file
      );
      
      // Combine results from both passes
      const combinedTransactions = mergeTransactionResults(
        formattedTransactions,
        enhancedParseResult.formattedTransactions
      );
      
      console.log(`🔄 Recovery found ${combinedTransactions.length - formattedTransactions.length} additional transactions`);
      
      return {
        ...initialParseResult,
        formattedTransactions: combinedTransactions,
        recoveryPerformed: true,
        originalCount: formattedTransactions.length,
        recoveredCount: combinedTransactions.length - formattedTransactions.length
      };
    }
  } catch (error) {
    console.error('Recovery failed:', error);
  }
  
  return initialParseResult;
};

// 🆕 NEW: Merge transaction results (deduplication)
const mergeTransactionResults = (original, recovered) => {
  if (!recovered || recovered.length === 0) return original;
  if (!original || original.length === 0) return recovered;
  
  const merged = [...original];
  
  for (const recoveredTx of recovered) {
    // Check if transaction already exists (fuzzy matching)
    const isDuplicate = original.some(origTx => 
      isSimilarTransaction(origTx, recoveredTx)
    );
    
    if (!isDuplicate) {
      merged.push({
        ...recoveredTx,
        recovered: true,
        confidence: 0.7
      });
    }
  }
  
  // Sort by date
  return merged.sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return new Date(a.date) - new Date(b.date);
  });
};

// 🆕 NEW: Check if two transactions are similar
const isSimilarTransaction = (tx1, tx2) => {
  // Same date and similar amount (within 2 cents)
  if (tx1.date === tx2.date && 
      Math.abs((tx1.amount || 0) - (tx2.amount || 0)) < 0.02) {
    return true;
  }
  
  // Similar description (at least 80% match)
  if (tx1.description && tx2.description) {
    const similarity = stringSimilarity(
      tx1.description.toLowerCase(),
      tx2.description.toLowerCase()
    );
    
    if (similarity > 0.8) return true;
  }
  
  return false;
};

// 🆕 NEW: Calculate string similarity
const stringSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;
  
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

// 🆕 NEW: Levenshtein distance (edit distance)
const levenshteinDistance = (str1, str2) => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

// 🆕 NEW: Infer missing transactions from balance discrepancies
const inferMissingTransactions = (transactions, summary, detectedBank) => {
  const inferred = [];
  
  try {
    // Check if we have opening and closing balances
    if (!summary.openingBalance || !summary.closingBalance) {
      return inferred;
    }
    
    const opening = parseFloat(summary.openingBalance) || 0;
    const closing = parseFloat(summary.closingBalance) || 0;
    
    // Calculate expected closing balance from transactions
    const calculatedClosing = transactions.reduce((balance, tx) => {
      const amount = parseFloat(tx.amount) || 0;
      return balance + amount;
    }, opening);
    
    const discrepancy = Math.abs(closing - calculatedClosing);
    
    // If discrepancy > 1 peso/dollar, there might be missing transactions
    if (discrepancy > 1) {
      console.log(`⚠️ Balance discrepancy detected: ${discrepancy.toFixed(2)}`);
      
      inferred.push({
        date: 'Unknown',
        description: 'INFERRED: Missing Transaction(s)',
        amount: closing - calculatedClosing,
        category: 'uncategorized',
        inferred: true,
        confidence: 0.5,
        note: `Balance discrepancy of ${discrepancy.toFixed(2)} detected. This may represent one or more missing transactions.`
      });
    }
  } catch (error) {
    console.error('Error inferring missing transactions:', error);
  }
  
  return inferred;
};

/**
 * Lightweight receipt parser + unified parse dispatcher.
 * Ensures parseWithBankParser is defined so perform/recovery passes can call it.
 */
const isBankStatement = (text = '') => {
  const t = (text || '').toLowerCase();
  return (
    // Common bank statement headers and terms
    /account statement|bank statement|statement period|statement date/i.test(t) ||
    /opening balance|closing balance|beginning balance|ending balance/i.test(t) ||
    /transaction history|account activity|account summary/i.test(t) ||
    // Bank-specific identifiers
    /bdo|hsbc|metrobank|landbank|bpi|security bank|citibank/i.test(t) ||
    // Common bank statement column headers
    /(date|description|amount|balance).+(date|description|amount|balance)/i.test(t)
  );
};

const isReceiptText = (text = '') => {
  const t = (text || '').toLowerCase();
  
  // First check common receipt-specific patterns
  const receiptPatterns = [
    // Receipt-specific headers
    /(?:store\s+)?receipt|sales slip|tax invoice/i,
    // Common receipt sections
    /(?:sub-?total|tax|amount|balance).+total/i,
    // Store/merchant indicators
    /(?:cashier|terminal|register|store)\s+#?\d/i,
    // Item listings with prices
    /qty|@|each|item|price.+\$?\d+\.\d{2}/i,
    // Thank you messages
    /thank you|please come again|come again/i,
    // Card transaction details
    /card\s+(?:auth|number|type)|approved/i
  ];

  // Count how many receipt patterns match
  const receiptScore = receiptPatterns.filter(pattern => pattern.test(t)).length;

  // Only identify as receipt if:
  // 1. Has multiple receipt patterns
  // 2. Not looking like a bank statement
  // 3. Text is relatively short (receipts are usually shorter than statements)
  return (
    receiptScore >= 2 && 
    !isBankStatement(t) && 
    t.length < 2000
  );
};

// Update parseWithBankParser to use both checks
const parseWithBankParser = (rawText = '', detectedBank = 'UNKNOWN', file = {}) => {
  if (!rawText) return { formattedTransactions: [], summary: {}, rawText: '' };

  // First check if it's clearly a bank statement
  if (isBankStatement(rawText)) {
    // Use bank-specific parsers
    switch ((detectedBank || '').toUpperCase()) {
      case 'BDO':
        try { return parseBdoTransactions(rawText, file); } 
        catch (e) { console.warn('BDO parse failed', e); }
        break;
      case 'HSBC': {
        const hsbcType = detectHsbcStatementType(rawText);
        if (hsbcType === 'UK_BANK_STATEMENT') {
          try { return parseHsbcUKBankStatement(rawText, file); }
          catch (e) { console.warn('HSBC UK parse failed', e); }
        }
        try { return parseHsbcPhilippinesCreditCard(rawText, file); }
        catch (e) { console.warn('HSBC PH parse failed', e); }
        break;
      }
      case 'METROBANK':
        try { return parseMetrobankBankStatement(rawText, file); }
        catch (e) { console.warn('Metrobank parse failed', e); }
        break;
      case 'LANDBANK':
        try { return parseLandbankStatement(rawText, file); }
        catch (e) { console.warn('Landbank parse failed', e); }
        break;
    }
  }

  // If not clearly a bank statement, check if it's a receipt
  if (isReceiptText(rawText)) {
    return parseReceiptFromText(rawText, file);
  }

  // If neither, fall back to bank parser for detected bank
  switch ((detectedBank || '').toUpperCase()) {
    case 'BDO':
      return parseBdoTransactions(rawText, file);
    case 'HSBC': {
      const hsbcType = detectHsbcStatementType(rawText);
      return hsbcType === 'UK_BANK_STATEMENT' 
        ? parseHsbcUKBankStatement(rawText, file)
        : parseHsbcPhilippinesCreditCard(rawText, file);
    }
    case 'METROBANK':
      return parseMetrobankBankStatement(rawText, file);
    case 'LANDBANK':
      return parseLandbankStatement(rawText, file);
    default:
      return { formattedTransactions: [], summary: {}, rawText };
  }
};

// 🆕 ENHANCED: Main OCR function with AI recovery
export const ocrImageAndParseTransactions = async (file, manualBank, useAIRecovery = true) => {
  let apiKeyToUse;
  try {
    apiKeyToUse = await fetchOcrApiKey();
  } catch (error) {
    const errorMessage = `OCR functionality is disabled. Failed to retrieve API key: ${error.message}`;
    return { 
      rawText: errorMessage, 
      formattedTransactions: [], 
      error: errorMessage, 
      detectedBank: 'UNKNOWN', 
      summary: {} 
    };
  }

  if (!apiKeyToUse) {
    const errorMessage = "OCR functionality is disabled. API key could not be retrieved.";
    return { 
      rawText: errorMessage, 
      formattedTransactions: [], 
      error: errorMessage, 
      detectedBank: 'UNKNOWN', 
      summary: {} 
    };
  }

  // PASS 1: Standard OCR
  const formData = new FormData();
  formData.append('file', file);
  formData.append('apikey', apiKeyToUse);
  formData.append('language', 'eng');
  formData.append('isOverlayRequired', 'false');
  formData.append('detectOrientation', 'true');
  formData.append('scale', 'true');
  formData.append('OCREngine', '2');
  formData.append('isTable', 'true');

  try {
    console.log('🔍 PASS 1: Standard OCR extraction...');
    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorResult = await response.json().catch(() => ({ 
        ErrorMessage: ["Failed to parse error response from OCR API."] 
      }));
      let errorMessage = `OCR API request failed with status ${response.status}.`;
      if (errorResult?.ErrorMessage?.length > 0) {
        errorMessage += ` Details: ${errorResult.ErrorMessage.join(", ")}`;
      }
      return { 
        rawText: errorMessage, 
        formattedTransactions: [], 
        error: errorMessage, 
        detectedBank: 'UNKNOWN', 
        summary: {} 
      };
    }

    const result = await response.json();

    if (result.IsErroredOnProcessing) {
      const processingErrorMsg = result.ErrorMessage?.join(", ") || "Unknown processing error";
      return { 
        rawText: `OCR processing error: ${processingErrorMsg}`, 
        formattedTransactions: [], 
        error: `OCR processing error: ${processingErrorMsg}`, 
        detectedBank: 'UNKNOWN', 
        summary: {} 
      };
    }

    if (result.ParsedResults && result.ParsedResults[0]?.ParsedText) {
      const rawText = result.ParsedResults[0].ParsedText;
      const detectedBank = manualBank || detectBank(rawText);

      let hsbcType = null;

      // Use unified parser that includes receipt detection & heuristics
      let parseResult;
      try {
        parseResult = parseWithBankParser(rawText, detectedBank, file);
      } catch (err) {
        console.error('parseWithBankParser failed, falling back to empty parseResult:', err);
        parseResult = { formattedTransactions: [], summary: {} };
      }

      console.log(`📊 PASS 1 Results: ${(parseResult?.formattedTransactions || []).length} transactions found`);

      // Build an initial finalResult from pass 1
      let finalResult = {
        rawText,
        formattedTransactions: parseResult.formattedTransactions || [],
        detectedBank,
        summary: parseResult.summary || {},
        recoveryPerformed: false,
        originalCount: (parseResult.formattedTransactions || []).length
      };

      // Optionally perform AI-enhanced recovery (multi-pass)
      if (useAIRecovery) {
        try {
          const recovered = await performOcrWithRecovery(
            file,
            apiKeyToUse,
            {
              rawText,
              formattedTransactions: finalResult.formattedTransactions,
              detectedBank,
              summary: finalResult.summary
            }
          );

          // If recovery returned enhanced data, merge/replace
          if (recovered && recovered.formattedTransactions) {
            finalResult = {
              ...finalResult,
              formattedTransactions: recovered.formattedTransactions,
              recoveryPerformed: recovered.recoveryPerformed || true,
              recoveredCount: (recovered.formattedTransactions || []).length - finalResult.originalCount,
              summary: recovered.summary || finalResult.summary
            };
          }
        } catch (reErr) {
          console.warn('AI recovery step failed:', reErr);
        }
      }

      // Return the assembled result for PASS 1 (and any recovery)
      return finalResult;
    } // end if (result.ParsedResults && ...)
    
    // Fallback when OCR returns no parsed text
    return { rawText: '', formattedTransactions: [], detectedBank: 'UNKNOWN', summary: {} };
  } catch (err) {
    console.error('OCR request failed:', err);
    return { rawText: '', formattedTransactions: [], error: err.message || String(err), detectedBank: 'UNKNOWN', summary: {} };
  }
}; // end export const ocrImageAndParseTransactions