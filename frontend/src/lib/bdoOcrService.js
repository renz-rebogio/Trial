import { supabase } from '@/lib/customSupabaseClient';

const IGNORE_KEYWORDS = [
  'previous', 'account', 'statement', 'cheque no', 'page \\d+ of \\d+', 'customer service',
  'contact us', 'important information', 'transactions since last statement', 'www\\.',
  '\\.com', '\\.net', '\\.org', 'total deposits', 'total withdrawals', 'interest paid',
  'fees charged', 'summary of account', 'account summary', 'card number', 'member number',
  'sort code', 'swift code', 'bic code', 'thank you for banking', 'visit us at', 'po box',
  'p\\.o\\. box', 'attn:', 'inc\\.', 'llc', 'ltd\\.', 'transaction id', 'reference no',
  'authorization code', 'processed on', 'credit limit', 'credit line', 'cash limit',
  'interest rate', 'available credit', 'closing balance', 'payments in', 'payments out',
  'total', 'account number', 'for ', 'your branch', 'we find ways', 'tel ', 'swift code',
  'hours a day', 'contact us by phone', 'bdo\\.com', 'laguna', 'philippines'
];

const normalizeDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    const cleanedDateStr = dateStr.trim().replace(/(\d+)(st|nd|rd|th)/, '$1');
    let dateObj;

    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanedDateStr)) {
      dateObj = new Date(cleanedDateStr);
    } else if (/^\d{2}[-\/]\d{2}[-\/]\d{4}$/.test(cleanedDateStr)) {
      const parts = cleanedDateStr.split(/[-\/]/);
      dateObj = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
      if (isNaN(dateObj.getTime()) || parseInt(parts[0], 10) > 12) {
        dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
    } else if (/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:,)?\s+\d{4}$/i.test(cleanedDateStr)) {
      dateObj = new Date(cleanedDateStr);
    } else if (/^\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}$/i.test(cleanedDateStr)) {
      dateObj = new Date(cleanedDateStr);
    } else if (/^\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?$/i.test(cleanedDateStr)) {
      const year = new Date().getFullYear();
      dateObj = new Date(`${cleanedDateStr} ${year}`);
    } else {
      dateObj = new Date(cleanedDateStr);
    }

    if (isNaN(dateObj.getTime())) return null;

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    return null;
  }
};

const CURRENCY_SYMBOLS = { 'USD': '$', 'JPY': '¥', 'ILS': '₪', 'PHP': '₱', 'EUR': '€' };
const CURRENCY_CODES = Object.keys(CURRENCY_SYMBOLS);

const detectFileCurrency = (rawText) => {
  const lowerText = rawText.toLowerCase();
  let currencyCounts = {};
  CURRENCY_CODES.forEach(code => currencyCounts[code] = 0);

  const currencyHeaderMatch = lowerText.match(/amount\s*\(([a-z]{3})\)/i);
  if (currencyHeaderMatch && CURRENCY_CODES.includes(currencyHeaderMatch[1].toUpperCase())) {
    return currencyHeaderMatch[1].toUpperCase();
  }

  const pesoMatches = [...lowerText.matchAll(/[\d,]+\.?\d*\s*p\b/gi)];
  if (pesoMatches.length > 3) {
    return 'PHP';
  }

  const textSymbols = [...lowerText.matchAll(/[$€£¥₹₽₱₪]/gi)];
  textSymbols.forEach(match => {
    const symbol = match[0];
    const foundEntry = Object.entries(CURRENCY_SYMBOLS).find(([_, s]) => s === symbol);
    if (foundEntry) currencyCounts[foundEntry[0]]++;
  });

  const textCodes = [...lowerText.matchAll(/\b(USD|JPY|ILS|PHP|EUR)\b/gi)];
  textCodes.forEach(match => currencyCounts[match[0].toUpperCase()]++);

  let mostLikelyCurrency = 'USD';
  let maxCount = 0;
  for (const [currency, count] of Object.entries(currencyCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostLikelyCurrency = currency;
    }
  }
  return mostLikelyCurrency;
};

const parseNumberValue = (numStr) => {
  if (!numStr) return null;
  let cleaned = numStr.trim();

  cleaned = cleaned.replace(/[$€£¥₹₽₱₪]/gi, '');
  cleaned = cleaned.replace(/\s*P\s*$/i, '').trim();
  cleaned = cleaned.replace(/(\d)\s+/g, '$1');
  cleaned = cleaned.replace(/\s+(\d)/g, '$1');
  cleaned = cleaned.replace(/[A-Za-z]/gi, '').trim();

  const periodCount = (cleaned.match(/\./g) || []).length;
  const commaCount = (cleaned.match(/,/g) || []).length;

  if (commaCount > 0 && periodCount > 0) {
    const lastComma = cleaned.lastIndexOf(',');
    const lastPeriod = cleaned.lastIndexOf('.');
    if (lastPeriod > lastComma) {
      cleaned = cleaned.replace(/,/g, '');
    } else {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    }
  } else if (commaCount > 0) {
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length === 2) {
      cleaned = cleaned.replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (periodCount > 1) {
    cleaned = cleaned.replace(/\./g, '');
  }

  const value = parseFloat(cleaned);
  return isNaN(value) ? null : value;
};

const detectColumnStructure = (lines) => {
  const headerPatterns = {
    date: /\b(date|trans\.?\s*date|transaction\s*date)\b/i,
    description: /\b(description|details|particulars|transaction|narration)\b/i,
    withdrawal: /\b(withdrawal|withdrawals|debit|debits|payment|payments?\s*out)\b/i,
    deposit: /\b(deposit|deposits|credit|credits|payment\s*received|payments?\s*in)\b/i,
    balance: /\b(balance|running\s*balance)\b/i,
  };

  let headerLineIndex = -1;

  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    const hasDate = headerPatterns.date.test(lowerLine);
    const hasDescription = headerPatterns.description.test(lowerLine);
    const hasWithdrawal = headerPatterns.withdrawal.test(lowerLine);
    const hasDeposit = headerPatterns.deposit.test(lowerLine);

    if (hasDate && (hasDescription || hasWithdrawal || hasDeposit)) {
      headerLineIndex = i;
      break;
    }
  }

  return headerLineIndex !== -1 ? { headerLineIndex } : null;
};

const parseTableRow = (line) => {
  const dateMatch = line.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/i);
  let date = null;
  let remainingLine = line;

  if (dateMatch) {
    date = normalizeDate(dateMatch[0]);
    remainingLine = line.substring(dateMatch[0].length).trim();
  } else {
    return { date: null };
  }

  const parts = remainingLine.split(/\t+|\s{2,}/);
  let description = '';
  let amounts = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;
    if (/[\d,.]/.test(part) && parseNumberValue(part) !== null) {
      amounts.push(parseNumberValue(part));
    } else if (!description) {
      description = part;
    }
  }

  let withdrawal = null;
  let deposit = null;
  let balance = null;

  if (amounts.length >= 2) {
    balance = amounts[amounts.length - 1];
    if (amounts.length === 2) {
      if (description.toLowerCase().includes('withdrawal')) {
        withdrawal = amounts[0];
      } else {
        deposit = amounts[0];
      }
    } else if (amounts.length >= 3) {
      withdrawal = amounts[0];
      deposit = amounts.length > 2 ? amounts[1] : null;
    }
  }

  let transactionAmount = null;
  let isDeposit = false;

  if (description.toLowerCase().includes('fund transfer') || description.toLowerCase().includes('deposit')) {
    transactionAmount = deposit;
    isDeposit = true;
  } else if (description.toLowerCase().includes('withdrawal')) {
    transactionAmount = withdrawal;
    isDeposit = false;
  }

  return { date, description, transactionAmount, isDeposit };
};

export const parseBdoTransactions = (rawText, file) => {
  console.log('=== BDO Philippines Bank Statement Parser ===');

  const lines = rawText.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
  console.log(`Total lines detected: ${lines.length}`);

  // Detect file currency
  const fileCurrency = detectFileCurrency(rawText);
  console.log('Detected Currency:', fileCurrency);

  // Detect column header
  const columnStructure = detectColumnStructure(lines);
  if (columnStructure) {
    console.log(`✓ Found transaction table header at line ${columnStructure.headerLineIndex}`);
  } else {
    console.log('⚠ No clear transaction table header found — attempting fallback parsing');
  }

  let startIndex = columnStructure ? columnStructure.headerLineIndex + 1 : 0;
  let formattedTransactions = [];
  let ignoredCount = 0;

  console.log('\n--- Beginning Transaction Parsing ---\n');

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Ignore metadata or non-transaction lines
    if (IGNORE_KEYWORDS.some(keyword => new RegExp(`\\b${keyword}\\b`, 'i').test(lowerLine))) {
      ignoredCount++;
      continue;
    }
    if (lowerLine.includes('closing balance') || lowerLine.match(/\btotal\b/i)) {
      ignoredCount++;
      continue;
    }

    const parsed = parseTableRow(line);

    // Handle skipped lines
    if (!parsed.date) {
      console.log(`⚠ [Line ${i}] Skipped — invalid or missing date`);
      continue;
    }
    if (!parsed.description || parsed.description.length < 2) {
      console.log(`⚠ [Line ${i}] Skipped — missing or too short description`);
      continue;
    }
    if (parsed.transactionAmount === null || parsed.transactionAmount === 0) {
      console.log(`⚠ [Line ${i}] Skipped — invalid or zero amount`);
      continue;
    }

    const finalAmount = parsed.isDeposit ? Math.abs(parsed.transactionAmount) : -Math.abs(parsed.transactionAmount);

    formattedTransactions.push({
      date: parsed.date,
      description: parsed.description.replace(/\s+/g, ' ').trim(),
      amount: finalAmount,
      currency: fileCurrency,
      sourceFile: file?.name || 'unknown'
    });

    console.log(`✓ [Line ${i}] Transaction added:`, {
      date: parsed.date,
      description: parsed.description.substring(0, 40) + (parsed.description.length > 40 ? '...' : ''),
      amount: finalAmount
    });
  }

  // Sort transactions by date
  formattedTransactions.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) ? 0 : dateA - dateB;
  });

  console.log('\n--- Parsing Summary ---');
  console.log('Ignored Lines:', ignoredCount);
  console.log('Transactions Parsed:', formattedTransactions.length);
  console.log(`=== Parsing Complete: ${formattedTransactions.length} transactions found ===\n`);

  // Return data in compatible format
  return { 
    formattedTransactions, 
    summary: {}, 
    bankName: 'BDO Philippines', 
    fileCurrency, 
    rawText 
  };
};
