/**
 * HSBC UK Bank Statement Parser
 * Handles HSBC UK personal bank account statements (multiple formats)
 */

export const parseHsbcUKBankStatement = (rawText, file) => {
  console.log('=== HSBC UK Bank Statement Parser ===');
  
  const lines = rawText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Detect format type
  const format = detectFormat(lines);
  console.log('Detected format:', format);
  
  // Extract statement period
  const statementPeriod = extractStatementPeriod(lines, rawText);
  console.log('Statement Period:', statementPeriod);
  
  // Extract account summary
  const accountSummary = extractAccountSummary(lines);
  console.log('Account Summary:', accountSummary);
  
  // Extract account details
  const accountDetails = extractAccountDetails(lines);
  console.log('Account Details:', accountDetails);
  
  // Extract transactions based on format
  const transactions = format === 'simple-table' 
    ? extractTransactionsSimpleTable(lines, statementPeriod.year)
    : extractTransactions(lines, statementPeriod.year);
  
  console.log(`\n=== Parsing Complete: ${transactions.length} transactions found ===`);
  
  return {
    formattedTransactions: transactions,
    summary: accountSummary,
    accountSummary: accountSummary,
    accountDetails: accountDetails,
    statementPeriod: statementPeriod,
    bankName: 'HSBC UK',
    statementYear: statementPeriod.year
  };
};

const detectFormat = (lines) => {
  // Check for simple table format with "Withdrawals (£)" and "Deposits (£)" headers
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if ((lowerLine.includes('withdrawals') && lowerLine.includes('deposits') && lowerLine.includes('balance')) ||
        (lowerLine.includes('withdrawal') && lowerLine.includes('deposit')) ||
        (line.includes('Details of your account activity'))) {
      return 'simple-table';
    }
  }
  return 'standard';
};

const extractTransactionsSimpleTable = (lines, statementYear) => {
  const transactions = [];
  
  // Find the transaction table start - look for "Date" and "Description" or "Details of your account activity"
  let transactionStartIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if ((line.includes('date') && line.includes('description')) ||
        line.includes('details of your account activity')) {
      transactionStartIndex = i + 1;
      console.log(`✓ Found simple table header at line ${i}: "${lines[i]}"`);
      break;
    }
  }
  
  if (transactionStartIndex === -1) {
    console.log('⚠ Could not find transaction table');
    return transactions;
  }
  
  // Skip header lines (Date, Description, Withdrawals (£), Deposits (£), Balance (£), Opening balance)
  while (transactionStartIndex < lines.length) {
    const line = lines[transactionStartIndex].toLowerCase();
    if (line.includes('withdrawal') || 
        line.includes('deposit') || 
        line.includes('balance') ||
        line.includes('opening balance') ||
        line === 'date' ||
        line === 'description') {
      console.log(`  Skipping header/opening line: "${lines[transactionStartIndex]}"`);
      transactionStartIndex++;
    } else {
      break;
    }
  }
  
  let i = transactionStartIndex;
  let currentTransaction = null;
  
  while (i < lines.length) {
    const line = lines[i];
    console.log(`Line ${i}: "${line}"`);
    
    // Stop conditions
    if (line.toLowerCase().includes('correspondence:') ||
        line.toLowerCase().includes('statement page') ||
        line.toLowerCase().includes('centenary square') ||
        line.toLowerCase().includes('end of statement') ||
        line.toLowerCase().includes('your closing balance')) {
      console.log(`⏹ End of transaction section at line ${i}`);
      break;
    }
    
    // Date pattern: "15 Jun" or "17 Jun" or "15 Jun 24"
    const dateMatch = line.match(/^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)(\s+\d{2,4})?/i);
    
    if (dateMatch) {
      // Save previous transaction
      if (currentTransaction) {
        transactions.push(finalizeTransaction(currentTransaction));
      }
      
      // Start new transaction
      const day = dateMatch[1].padStart(2, '0');
      const month = dateMatch[2];
      let year = dateMatch[3] ? dateMatch[3].trim() : statementYear;
      
      if (year.length === 2) {
        year = parseInt(year) > 50 ? '19' + year : '20' + year;
      }
      
      currentTransaction = {
        date: `${day} ${month} ${year}`,
        type: null,
        description: '',
        paidOut: null,
        paidIn: null,
        balance: null,
        rawLines: [line]
      };
      
      console.log(`\n📅 New transaction: ${currentTransaction.date}`);
      
      // Get the description from the same line
      const afterDate = line.substring(dateMatch[0].length).trim();
      if (afterDate) {
        currentTransaction.description = afterDate;
        console.log(`  Description: ${afterDate}`);
      }
    } 
    else if (currentTransaction) {
      // Check if this line contains amounts (withdrawal, deposit, balance)
      const amountMatches = line.match(/(\d+(?:,\d{3})*\.\d{2})/g);
      
      if (amountMatches && amountMatches.length > 0) {
        // Parse amounts - they appear in order: withdrawal, deposit, balance
        parseAmountsSimpleTable(line, currentTransaction);
      } 
      else if (line.trim() && !line.match(/^(Withdrawals|Deposits|Balance)/i)) {
        // Add to description if it's not an amount or header
        if (currentTransaction.description) {
          currentTransaction.description += ' ' + line.trim();
        } else {
          currentTransaction.description = line.trim();
        }
        console.log(`  Description extended: ${currentTransaction.description}`);
      }
    }
    
    i++;
  }
  
  // Save last transaction
  if (currentTransaction) {
    transactions.push(finalizeTransaction(currentTransaction));
  }
  
  console.log(`\n✅ Total transactions extracted: ${transactions.length}`);
  return transactions;
};

const parseAmountsSimpleTable = (line, transaction) => {
  console.log(`  💰 Parsing amounts from: "${line}"`);
  
  const amounts = [];
  const amountRegex = /(\d+(?:,\d{3})*\.\d{2})/g;
  let match;
  
  while ((match = amountRegex.exec(line)) !== null) {
    const cleanAmount = match[1].replace(/,/g, '');
    amounts.push(parseFloat(cleanAmount));
  }
  
  console.log(`     Found ${amounts.length} amounts:`, amounts);
  
  if (amounts.length === 0) return;
  
  // In simple table format, amounts can appear as:
  // 1 amount: balance only (for balance brought forward)
  // 2 amounts: [withdrawal/deposit, balance]
  // 3 amounts: [withdrawal, deposit, balance]
  
  if (amounts.length === 3) {
    // All three columns present
    if (amounts[0] > 0) transaction.paidOut = amounts[0];
    if (amounts[1] > 0) transaction.paidIn = amounts[1];
    transaction.balance = amounts[2];
  } else if (amounts.length === 2) {
    // Two amounts: [withdrawal/deposit, balance]
    transaction.balance = amounts[1];
    
    // Determine if first amount is withdrawal or deposit based on description
    const desc = (transaction.description || '').toLowerCase();
    
    // Keywords that indicate deposits/credits
    const depositKeywords = ['transfer', 'interest paid', 'deposit', 'credit', 'payment received', 'refund'];
    // Keywords that indicate withdrawals/debits
    const withdrawalKeywords = ['withdrawal', 'atm', 'cheque', 'purchase', 'payment', 'debit', 'fee'];
    
    const isDeposit = depositKeywords.some(keyword => desc.includes(keyword));
    const isWithdrawal = withdrawalKeywords.some(keyword => desc.includes(keyword));
    
    if (isDeposit && !isWithdrawal) {
      transaction.paidIn = amounts[0];
    } else if (isWithdrawal || !isDeposit) {
      // Default to withdrawal if unclear
      transaction.paidOut = amounts[0];
    } else {
      // If both or neither, check the balance change
      // If we have a previous balance, we can infer the type
      transaction.paidOut = amounts[0];
    }
  } else if (amounts.length === 1) {
    // Single amount - this is likely just a balance line (opening/closing balance)
    // Or it could be the balance for the current transaction
    if (transaction.paidOut === null && transaction.paidIn === null) {
      // No transaction amount set yet, so this is probably just the balance
      transaction.balance = amounts[0];
    } else {
      // Transaction amount already set, so this is the resulting balance
      transaction.balance = amounts[0];
    }
  }
  
  console.log(`     Assigned - PaidOut: ${transaction.paidOut}, PaidIn: ${transaction.paidIn}, Balance: ${transaction.balance}`);
};

const extractStatementPeriod = (lines, rawText) => {
  // Look for date range like "25 November to 2 December 2023" or "FromJun15,2024toJun24,202"
  const periodRegex = /(\d{1,2})\s+([A-Za-z]+)\s+to\s+(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i;
  const compactRegex = /From[A-Za-z]{3}(\d{1,2}),(\d{4})to[A-Za-z]{3}(\d{1,2}),(\d{4})/i;
  
  for (const line of lines) {
    const match = line.match(periodRegex);
    if (match) {
      return {
        startDay: match[1],
        startMonth: match[2],
        endDay: match[3],
        endMonth: match[4],
        year: match[5],
        fullText: match[0]
      };
    }
    
    const compactMatch = line.match(compactRegex);
    if (compactMatch) {
      return {
        startDay: compactMatch[1],
        startMonth: '',
        endDay: compactMatch[3],
        endMonth: '',
        year: compactMatch[4],
        fullText: line
      };
    }
  }
  
  // Look for "Your opening balance on Jun 15, 2024"
  const balanceDateRegex = /on\s+([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})/i;
  for (const line of lines) {
    const match = line.match(balanceDateRegex);
    if (match) {
      return {
        startDay: match[2],
        startMonth: match[1],
        endDay: '',
        endMonth: '',
        year: match[3],
        fullText: match[0]
      };
    }
  }
  
  // Fallback: try to extract year from anywhere in the statement
  const yearMatch = rawText.match(/\b(20\d{2})\b/);
  const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
  
  return {
    startDay: '',
    startMonth: '',
    endDay: '',
    endMonth: '',
    year: year,
    fullText: ''
  };
};

const extractAccountSummary = (lines) => {
  const summary = {
    openingBalance: null,
    paymentsIn: null,
    paymentsOut: null,
    closingBalance: null
  };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
    
    // Handle both formats: "opening balance on Jun 15, 2024" and "Opening balance"
    if (line.toLowerCase().includes('opening balance')) {
      const amount = extractAmount(line) || extractAmount(nextLine);
      if (amount !== null) summary.openingBalance = amount;
    } else if (line.toLowerCase().includes('total deposits into your account')) {
      const amount = extractAmount(line) || extractAmount(nextLine);
      if (amount !== null) summary.paymentsIn = amount;
    } else if (line.toLowerCase().includes('total withdrawals from your account')) {
      const amount = extractAmount(line) || extractAmount(nextLine);
      if (amount !== null) summary.paymentsOut = amount;
    } else if (line.toLowerCase().includes('closing balance')) {
      const amount = extractAmount(line) || extractAmount(nextLine);
      if (amount !== null) summary.closingBalance = amount;
    } else if (line.toLowerCase().includes('payments in')) {
      const amount = extractAmount(nextLine) || extractAmount(line);
      if (amount !== null) summary.paymentsIn = amount;
    } else if (line.toLowerCase().includes('payments out')) {
      const amount = extractAmount(nextLine) || extractAmount(line);
      if (amount !== null) summary.paymentsOut = amount;
    }
  }
  
  return summary;
};

const extractAccountDetails = (lines) => {
  const details = {
    accountName: null,
    iban: null,
    bic: null,
    sortCode: null,
    accountNumber: null
  };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // IBAN (starts with GB and has digits)
    if (line.match(/^GB\d{2}[A-Z]{4}\d+$/)) {
      details.iban = line;
    }
    
    // BIC/SWIFT (like HBUKGB4195W)
    if (line.match(/^[A-Z]{4}GB[A-Z0-9]+$/)) {
      details.bic = line;
    }
    
    // Sort Code (format: 40-25-01 or just the numbers)
    const sortCodeMatch = line.match(/(\d{2}[-]\d{2}[-]\d{2})/);
    if (sortCodeMatch) {
      details.sortCode = sortCodeMatch[1];
    }
    
    // Account Number (8 digits) - from "Your account number: 93678268"
    const accountMatch = line.match(/account number:\s*(\d{8})/i);
    if (accountMatch) {
      details.accountNumber = accountMatch[1];
    } else {
      const justNumberMatch = line.match(/\b(\d{8})\b/);
      if (justNumberMatch && !details.accountNumber) {
        details.accountNumber = justNumberMatch[1];
      }
    }
    
    // Account Name - look for name lines
    if (line.match(/^[A-Z\s]{3,50}$/) && !line.match(/HSBC|LONDON|STREET|ACCOUNT|BALANCE|STATEMENT/i)) {
      if (!details.accountName && i > 0 && lines[i-1].includes('HSBC')) {
        details.accountName = line;
      }
    }
    
    // Explicit "Account Name" label
    if (line.toLowerCase().includes('account name')) {
      const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
      if (nextLine && !nextLine.match(/^\d/) && nextLine.length < 50) {
        details.accountName = nextLine;
      }
    }
  }
  
  return details;
};

const extractTransactions = (lines, statementYear) => {
  const transactions = [];
  const transactionTypes = ['BP', 'CR', 'DD', 'SO', 'CHQ', 'ATM', 'TFR', 'FEE', 'INT', 'BAC', 'FPI', 'Debit', 'Credit'];

  // Find the transaction table header
  let transactionStartIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if ((line.includes('paid out') && line.includes('paid in')) || 
        (line.includes('money out') && line.includes('money in')) ||
        (line.includes('payment type') && line.includes('details')) ||
        line === 'transactions') {
      transactionStartIndex = i + 1;
      console.log(`✓ Found transaction table header at line ${i}: "${lines[i]}"`);
      break;
    }
  }

  if (transactionStartIndex === -1) {
    console.log('⚠ Could not find transaction section start');
    // Try alternate approach - look for first date pattern after "transactions"
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes('transaction')) {
        console.log(`Found "transactions" keyword at line ${i}, searching for first date...`);
        transactionStartIndex = i + 1;
        break;
      }
    }
  }

  if (transactionStartIndex === -1) {
    console.log('⚠ Still could not find start, aborting');
    return transactions;
  }

  let i = transactionStartIndex;
  let currentTransaction = null;
  
  // Skip table header lines
  while (i < lines.length && (
    lines[i].toLowerCase().includes('description') ||
    lines[i].toLowerCase().includes('continued') ||
    lines[i].toLowerCase().includes('details') ||
    lines[i].toLowerCase().includes('money') ||
    lines[i].toLowerCase().includes('balance') ||
    lines[i].toLowerCase() === 'date'
  )) {
    console.log(`  Skipping header line: "${lines[i]}"`);
    i++;
  }

  while (i < lines.length) {
    const line = lines[i];
    
    console.log(`Line ${i}: "${line}"`);

    // Stop conditions
    if (
      line.toLowerCase().includes('balance carried forward') ||
      line.toLowerCase().includes('continued on next page') ||
      line.toLowerCase().includes('correspondence:') ||
      line.toLowerCase().includes('statement page') ||
      line.toLowerCase().includes('centenary square') ||
      line.match(/^\d+\s+(High Street|Centenary Square)/)
    ) {
      console.log(`⏹ End of transaction section at line ${i}`);
      break;
    }

    // Skip balance lines
    if (line.toUpperCase().includes('BALANCE BROUGHT FORWARD') ||
        line.toUpperCase().includes('BALANCE B/F') ||
        line.toUpperCase().includes('CLOSING BALANCE')) {
      i++;
      continue;
    }

    // Date pattern
    const dateMatch = line.match(/^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{2,4})/i);

    if (dateMatch) {
      // Save previous transaction
      if (currentTransaction) {
        transactions.push(finalizeTransaction(currentTransaction));
      }

      // Start new transaction
      const day = dateMatch[1].padStart(2, '0');
      const month = dateMatch[2];
      const year = dateMatch[3];
      const fullYear = year.length === 2 ? (parseInt(year) > 50 ? '19' + year : '20' + year) : year;

      currentTransaction = {
        date: `${day} ${month} ${fullYear}`,
        type: null,
        description: '',
        paidOut: null,
        paidIn: null,
        balance: null,
        rawLines: [line]
      };

      console.log(`\n📅 New transaction started: ${currentTransaction.date}`);
      
      // Check if there's content after the date on the same line
      const afterDate = line.substring(dateMatch[0].length).trim();
      if (afterDate) {
        const amountMatches = afterDate.match(/(\d+(?:,\d{3})*\.\d{2})/g);
        if (amountMatches) {
          const firstAmountPos = afterDate.indexOf(amountMatches[0]);
          const descPart = afterDate.substring(0, firstAmountPos).trim();
          if (descPart) {
            currentTransaction.description = descPart;
            console.log(`  Description (from same line): ${descPart}`);
          }
          parseAmountsFromLine(afterDate, currentTransaction);
        } else {
          currentTransaction.description = afterDate;
          console.log(`  Description (from same line): ${afterDate}`);
        }
      }
    } 
    else if (currentTransaction) {
      currentTransaction.rawLines.push(line);

      if (!currentTransaction.type && transactionTypes.includes(line.trim())) {
        currentTransaction.type = line.trim();
        console.log(`  Type: ${currentTransaction.type}`);
      } 
      else if (line.match(/\d+\.\d{2}/)) {
        parseAmountsFromLine(line, currentTransaction);
      } 
      else if (line.trim() && !line.match(/^[\d,]+\.?\d*$/) && line.trim().length > 1) {
        const skipWords = ['continued', 'details', 'out', 'in', 'balance'];
        if (!skipWords.includes(line.trim().toLowerCase())) {
          if (currentTransaction.description) {
            currentTransaction.description += ' ' + line.trim();
          } else {
            currentTransaction.description = line.trim();
          }
          console.log(`  Description: ${currentTransaction.description}`);
        }
      }
    }

    i++;
  }

  if (currentTransaction) {
    transactions.push(finalizeTransaction(currentTransaction));
  }

  console.log(`\n✅ Total transactions extracted: ${transactions.length}`);
  return transactions;
};

const parseAmountsFromLine = (line, transaction) => {
  console.log(`  💰 Parsing amounts from: "${line}"`);
  
  const amounts = [];
  const amountRegex = /(\d+(?:,\d{3})*\.\d{2})/g;
  let match;
  
  while ((match = amountRegex.exec(line)) !== null) {
    const cleanAmount = match[1].replace(/,/g, '');
    amounts.push(parseFloat(cleanAmount));
  }
  
  console.log(`     Found ${amounts.length} amounts:`, amounts);
  
  if (amounts.length === 0) return;
  
  if (amounts.length >= 3) {
    if (amounts[0] > 0) transaction.paidOut = amounts[0];
    if (amounts[1] > 0) transaction.paidIn = amounts[1];
    transaction.balance = amounts[2];
  } else if (amounts.length === 2) {
    if (transaction.type === 'CR' || transaction.paidOut !== null) {
      transaction.paidIn = amounts[0];
    } else {
      transaction.paidOut = amounts[0];
    }
    transaction.balance = amounts[1];
  } else if (amounts.length === 1) {
    if (transaction.paidOut !== null || transaction.paidIn !== null) {
      transaction.balance = amounts[0];
    } else {
      if (transaction.type === 'CR') {
        transaction.paidIn = amounts[0];
      } else {
        transaction.paidOut = amounts[0];
      }
    }
  }
  
  console.log(`     Assigned - PaidOut: ${transaction.paidOut}, PaidIn: ${transaction.paidIn}, Balance: ${transaction.balance}`);
};

const finalizeTransaction = (transaction) => {
  let amount = 0;
  let transactionType = 'debit';
  
  if (transaction.paidIn !== null && transaction.paidIn > 0) {
    amount = transaction.paidIn;
    transactionType = 'credit';
  } else if (transaction.paidOut !== null && transaction.paidOut > 0) {
    amount = -transaction.paidOut;
    transactionType = 'debit';
  }
  
  const formatted = {
    date: transaction.date,
    type: transaction.type || 'UNKNOWN',
    description: cleanDescription(transaction.description),
    amount: amount,
    debit: transaction.paidOut,
    credit: transaction.paidIn,
    balance: transaction.balance,
    transactionType: transactionType,
    category: categorizeTransaction(transaction.type, transaction.description)
  };
  
  console.log(`✓ Finalized: ${formatted.date} | ${formatted.type} | ${formatted.description} | Amount: ${formatted.amount}`);
  
  return formatted;
};

const cleanDescription = (description) => {
  if (!description) return '';
  description = description.replace(/\s+/g, ' ').trim();
  description = description.replace(/[|]/g, '');
  return description;
};

const categorizeTransaction = (type, description) => {
  const descLower = (description || '').toLowerCase();
  
  switch (type) {
    case 'BP':
      return 'Bill Payment';
    case 'CR':
      return 'Credit/Deposit';
    case 'DD':
      return 'Direct Debit';
    case 'SO':
      return 'Standing Order';
    case 'CHQ':
      return 'Cheque';
    case 'ATM':
      return 'ATM Withdrawal';
    case 'TFR':
      return 'Transfer';
    case 'FEE':
      return 'Fee';
    case 'INT':
      return 'Interest';
    case 'BAC':
      return 'BACS Payment';
    case 'FPI':
      return 'Faster Payment';
    default:
      if (descLower.includes('salary') || descLower.includes('wages')) return 'Income';
      if (descLower.includes('transfer')) return 'Transfer';
      if (descLower.includes('deposit')) return 'Deposit';
      if (descLower.includes('rent')) return 'Rent';
      if (descLower.includes('groceries') || descLower.includes('supermarket')) return 'Groceries';
      if (descLower.includes('restaurant') || descLower.includes('cafe') || descLower.includes('coffee')) return 'Dining';
      if (descLower.includes('gas') || descLower.includes('electric') || descLower.includes('water')) return 'Utilities';
      if (descLower.includes('uber') || descLower.includes('taxi')) return 'Transport';
      return 'Other';
  }
};

const extractAmount = (text) => {
  const amountMatch = text.match(/(\d+(?:,\d{3})*\.\d{2})/);
  if (amountMatch) {
    return parseFloat(amountMatch[1].replace(/,/g, ''));
  }
  return null;
};