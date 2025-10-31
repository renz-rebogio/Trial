// HSBC Philippines Credit Card Statement Parser
// Compatible with existing OCR service architecture

const parseNumberValue = (numStr) => {
  if (!numStr) return null;
  const cleaned = numStr.trim().replace(/,/g, '');
  const value = parseFloat(cleaned);
  return isNaN(value) ? null : value;
};

const normalizeDate = (dateStr, year) => {
  if (!dateStr) return null;
  
  try {
    // Handle formats like "20 Aug" or "04 Aug"
    const months = {
      'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
      'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
      'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
    };
    
    const parts = dateStr.toLowerCase().trim().split(/\s+/);
    if (parts.length < 2) return null;
    
    const day = parts[0].padStart(2, '0');
    const monthAbbr = parts[1].substring(0, 3);
    const month = months[monthAbbr];
    
    if (!month) return null;
    
    return `${year}-${month}-${day}`;
  } catch (e) {
    return null;
  }
};

const extractAccountSummary = (text) => {
  const summary = {};
  
  const patterns = {
    previousBalance: /Previous\s+Balance\s+([\d,]+\.?\d*)/i,
    paymentsAndCredits: /Payments?\s+(?:&|and)\s+Credits?\s+([\d,]+\.?\d*)/i,
    purchases: /Purchases\s+([\d,]+\.?\d*)/i,
    currentBalance: /Current\s+Balance\s+([\d,]+\.?\d*)/i,
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    if (match) {
      summary[key] = parseNumberValue(match[1]);
    }
  }
  
  return summary;
};

const extractPaymentSummary = (text) => {
  const payment = {};
  
  const patterns = {
    totalDue: /Total\s+Due\s+([\d,]+\.?\d*)/i,
    minimumPayment: /Minimum\s+Payment\s+([\d,]+\.?\d*)/i,
    paymentDueDate: /Payment\s+Due\s+Date\s+(\d{1,2}\s+\w+\s+\d{4})/i,
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    if (match) {
      if (key === 'paymentDueDate') {
        payment[key] = match[1];
      } else {
        payment[key] = parseNumberValue(match[1]);
      }
    }
  }
  
  return payment;
};

const extractCreditLimit = (text) => {
  const creditInfo = {};
  
  const patterns = {
    creditLimit: /Credit\s+Limit\s+(?:\(PHP\))?\s+([\d,]+\.?\d*)/i,
    availableCredit: /Available\s+Credit\s+(?:\(PHP\))?\s+([\d,]+\.?\d*)/i,
    cashLimit: /Cash\s+Limit\s+(?:\(PHP\))?\s+([\d,]+\.?\d*)/i,
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    if (match) {
      creditInfo[key] = parseNumberValue(match[1]);
    }
  }
  
  return creditInfo;
};

const getStatementYear = (text) => {
  // Look for statement period like "Statement from 04 AUG 2025 to 03 SEP 2025"
  const periodMatch = text.match(/Statement\s+from\s+\d{1,2}\s+\w+\s+(\d{4})/i);
  if (periodMatch) {
    return parseInt(periodMatch[1], 10);
  }
  
  // Look for any 4-digit year
  const yearMatch = text.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    return parseInt(yearMatch[1], 10);
  }
  
  return new Date().getFullYear();
};

// Main parsing function compatible with existing system
export const parseHsbcTransactions = (rawText, file) => {
  console.log('=== HSBC Philippines Credit Card Parser ===');
  
  const lines = rawText.split(/\r?\n/).map(l => l.trim());
  
  // Extract metadata
  const accountSummary = extractAccountSummary(rawText);
  const paymentSummary = extractPaymentSummary(rawText);
  const creditLimit = extractCreditLimit(rawText);
  const statementYear = getStatementYear(rawText);
  
  console.log('Statement Year:', statementYear);
  console.log('Account Summary:', accountSummary);
  console.log('Payment Summary:', paymentSummary);
  console.log('Credit Limit:', creditLimit);
  
  const formattedTransactions = [];
  let inTransactionSection = false;
  
  // Patterns to exclude from transactions
  const excludePatterns = [
    /Previous\s+Statement\s+Balance/i,
    /ACCOUNT\s+SUMMARY/i,
    /PAYMENT\s+SUMMARY/i,
    /CREDIT\s+LIMIT/i,
    /INTEREST\s+RATES/i,
    /Total\s+Due/i,
    /Minimum\s+Payment/i,
    /Page\s+\d+\s+of\s+\d+/i,
    /CONTACT\s+US/i,
    /Customer\s+Service/i,
    /Continued\s+on\s+next\s+page/i,
    /HSBC\s+GOLD\s+VISA/i,
    /Card\s+Products/i,
    /The\s+Hongkong/i,
    /Makati\s+City/i,
    /Metro\s+Manila/i,
    /\d{4}[-\s]?X{4}[-\s]?X{4}[-\s]?\d{4}/i, // Card number pattern
  ];
  
  // Find transaction table header - can be on one or two lines
  let headerFound = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (!line || line.length < 5) continue;
    
    // Check if we've reached the transaction section
    // Header can be: "POST DATE TRAN DATE DESCRIPTION AMOUNT" (one line)
    // OR: "POST TRAN" on one line, then "DATE DATE DESCRIPTION AMOUNT(PHP)" on next
    if (!inTransactionSection) {
      const headerPattern1 = /POST\s+DATE\s+TRAN\s+DATE\s+DESCRIPTION\s+AMOUNT/i;
      const headerPattern2 = /POST[\s\t]+TRAN/i;
      const headerPattern3 = /DATE[\s\t]+DATE[\s\t]+DESCRIPTION[\s\t]+AMOUNT/i;
      
      if (headerPattern1.test(line) || headerPattern2.test(line) || headerPattern3.test(line)) {
        inTransactionSection = true;
        headerFound = true;
        console.log('✓ Found transaction table header at line', i);
        continue;
      }
    }
    
    if (!inTransactionSection) continue;
    
    // Check exclusion patterns
    if (excludePatterns.some(pattern => pattern.test(line))) {
      continue;
    }
    
    // Stop at "Total Due" which marks end of transactions
    if (/^[\d,]+\.\d{2}$/.test(line) && parseNumberValue(line) > 50000) {
      console.log('✓ Reached end of transactions (Total Due line)');
      break;
    }
    
    // Look for transaction lines: starts with "DD Mon" date pattern
    const transactionPattern = /^(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec))\s+(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec))\s+(.+?)\s+([\d,]+\.\d{2})$/i;
    const match = line.match(transactionPattern);
    
    if (!match) continue;
    
    const postDateStr = match[1];
    const tranDateStr = match[2];
    const description = match[3].trim();
    const amountStr = match[4];
    
    // Parse dates
    const postDate = normalizeDate(postDateStr, statementYear);
    const tranDate = normalizeDate(tranDateStr, statementYear);
    
    if (!postDate) {
      console.log('⚠ Failed to parse date:', postDateStr);
      continue;
    }
    
    // Parse amount
    const amount = parseNumberValue(amountStr);
    
    if (amount === null || amount === 0) {
      console.log('⚠ Invalid amount:', amountStr);
      continue;
    }
    
    // Determine transaction type
    // Credit card: purchases are negative, payments/credits are positive
    let transactionType = 'PURCHASE';
    let finalAmount = -amount; // Default: purchases are negative (money spent)
    
    const descLower = description.toLowerCase();
    
    // Check if it's a payment or credit
    if (descLower.includes('payment') || 
        descLower.includes('credit') || 
        descLower.includes('reversal') ||
        descLower.includes('refund') ||
        descLower.includes('cashback')) {
      transactionType = 'PAYMENT';
      finalAmount = amount; // Payments are positive
    }
    
    // Add transaction
    formattedTransactions.push({
      date: postDate,
      transactionDate: tranDate,
      description: description,
      amount: finalAmount,
      currency: 'PHP',
      sourceFile: file?.name || 'unknown',
      type: transactionType
    });
    
    console.log('✓ Transaction added:', {
      date: postDate,
      description: description.substring(0, 30) + '...',
      amount: finalAmount
    });
  }
  
  console.log(`\n=== Parsing Complete: ${formattedTransactions.length} transactions found ===\n`);
  
  // Combine all summaries into one object for compatibility
  const summary = {
    ...accountSummary,
    ...paymentSummary,
    ...creditLimit,
    statementYear
  };
  
  // Return in format compatible with existing system
  return { 
    formattedTransactions,
    summary,
    accountSummary,
    paymentSummary,
    creditLimit,
    bankName: 'HSBC Philippines',
    statementYear,
    rawText
  };
};

// Export default for compatibility
export default parseHsbcTransactions;