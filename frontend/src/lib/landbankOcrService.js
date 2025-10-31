import { boogasiAI } from './ai/boogasiAiClient';

// Update the parseLandbankStatement function to handle signs correctly
export const parseLandbankStatement = (rawText, file = {}) => {
  console.log('=== Landbank Statement Parser ===');
  
  const lines = rawText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const transactions = [];
  
  // Extract statement year
  const yearMatch = rawText.match(/(20\d{2})/);
  const statementYear = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
  
  // Landbank specific patterns
  const datePattern = /^(\d{2}\/\d{2}\/\d{2,4}|\d{2}-\d{2}-\d{2,4}|\d{2}\s+[A-Za-z]{3}\s+\d{2,4})/i;
  const amountPattern = /([\d,]+\.\d{2})/;
  const balancePattern = /(?:balance|bal).*?([\d,]+\.\d{2})/i;
  
  // Landbank specific keywords to exclude
  const excludePatterns = [
    /page\s+\d+\s+of\s+\d+/i,
    /land\s*bank\s*of\s*the\s*philippines/i,
    /statement\s+of\s+account/i,
    /account\s+number/i,
    /branch:/i,
    /date\s+printed/i,
    /transaction\s+history/i,
    /currency:\s*php/i
  ];

  const parseAmount = (str) => {
    if (!str) return null;
    const isNegative = str.includes('(') || str.includes('-');
    const cleaned = str.replace(/[(),\s]/g, '');
    const amount = parseFloat(cleaned);
    return isNaN(amount) ? null : (isNegative ? -amount : amount);
  };

  const normalizeDate = (dateStr) => {
    if (!dateStr) return null;
    
    try {
      // Handle DD/MM/YY format
      const slashMatch = dateStr.match(/(\d{2})[\/-](\d{2})[\/-](\d{2,4})/);
      if (slashMatch) {
        const [_, day, month, year] = slashMatch;
        const fullYear = year.length === 2 ? '20' + year : year;
        return `${fullYear}-${month}-${day}`;
      }

      // Handle DD MMM YYYY format
      const monthNames = {
        'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06',
        'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
      };
      
      const spacedMatch = dateStr.match(/(\d{2})\s+([A-Za-z]{3})\s+(\d{2,4})/i);
      if (spacedMatch) {
        const [_, day, monthStr, year] = spacedMatch;
        const month = monthNames[monthStr.toUpperCase()];
        const fullYear = year.length === 2 ? '20' + year : year;
        return `${fullYear}-${month}-${day}`;
      }
    } catch (e) {
      console.warn('Date parsing failed:', e);
    }
    return null;
  };

  const determineTransactionSign = (description) => {
    // Explicit positive transactions (money coming in)
    const positivePatterns = [
      /transfer from banknet/i,
      /visa transfer from/i,
      /cash-?in from pay\s?&?\s?go/i
    ];

    // Check if description matches any positive pattern
    if (positivePatterns.some(pattern => pattern.test(description))) {
      return 1; // Positive multiplier
    }

    // All other transactions should be negative
    return -1; // Negative multiplier
  };

  // Process each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip excluded lines
    if (!line || excludePatterns.some(p => p.test(line))) continue;
    
    // Look for date at start of line
    const dateMatch = line.match(datePattern);
    if (!dateMatch) continue;
    
    const dateStr = dateMatch[0];
    let description = line.replace(dateStr, '').trim();
    
    // Look for amount at end of line
    const amountMatches = description.match(new RegExp(amountPattern, 'g')) || [];
    if (amountMatches.length === 0) continue;
    
    // Landbank usually has Debit, Credit, and Balance columns
    let amount = null;
    if (amountMatches.length >= 2) {
      // Last amount is usually the balance, second to last is the transaction amount
      const debitStr = amountMatches[amountMatches.length - 2];
      amount = parseAmount(debitStr);
      description = description.replace(new RegExp(amountPattern, 'g'), '').trim();
    } else {
      amount = parseAmount(amountMatches[0]);
      description = description.replace(amountPattern, '').trim();
    }

    if (amount !== null) {
      // Get the sign multiplier based on description
      const signMultiplier = determineTransactionSign(description);
      
      // Create transaction with correct sign
      const transaction = {
        date: normalizeDate(dateStr),
        description: description || 'UNKNOWN TRANSACTION',
        amount: Math.abs(amount) * signMultiplier, // Apply correct sign
        currency: 'PHP',
        sourceFile: file?.name || 'Landbank Statement'
      };

      // Integrate with Boogasi AI
      const categorized = boogasiAI.categorizeTransaction(transaction.description, transaction.amount);
      const corrected = boogasiAI.correctTransaction(transaction);
      
      transactions.push({
        ...corrected,
        category: categorized,
        category_confidence: boogasiAI.getConfidence(transaction.description, categorized)
      });
    }
  }

  // Extract summary information
  const summary = {
    openingBalance: null,
    closingBalance: null,
    totalCredits: 0,
    totalDebits: 0
  };

  // Look for balance information
  const openingMatch = rawText.match(/(?:opening|previous|beginning)\s+balance\s*:?\s*([\d,]+\.\d{2})/i);
  const closingMatch = rawText.match(/(?:closing|ending)\s+balance\s*:?\s*([\d,]+\.\d{2})/i);
  
  summary.openingBalance = openingMatch ? parseAmount(openingMatch[1]) : null;
  summary.closingBalance = closingMatch ? parseAmount(closingMatch[1]) : null;

  // Calculate totals
  transactions.forEach(tx => {
    if (tx.amount > 0) {
      summary.totalCredits += tx.amount;
    } else {
      summary.totalDebits += Math.abs(tx.amount);
    }
  });

  console.log(`\n=== Parsing Complete: ${transactions.length} transactions found ===\n`);
  
  return {
    formattedTransactions: transactions,
    summary,
    bankName: 'LANDBANK',
    statementYear
  };
};

export default parseLandbankStatement;