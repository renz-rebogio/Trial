export const parseMetrobankBankStatement = (rawText, file) => {
  const transactions = [];
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  let statementYear = null;
  const yearMatch = rawText.match(/(20\d{2})/);
  if (yearMatch) statementYear = yearMatch[1];

  // --- Ensure 'previous balance' is not silently ignored by global ignore lists ---
  try {
    if (typeof ignoreWords !== 'undefined' && Array.isArray(ignoreWords)) {
      const idx = ignoreWords.findIndex(w => /previous\s*balance/i.test(String(w)));
      if (idx !== -1) ignoreWords.splice(idx, 1);
    }
  } catch (e) {
    // fallback: cannot access/modify global ignore list — proceed
  }

  // Local helper to parse amounts robustly
  const parseAmountLocal = (s) => {
    if (s === null || typeof s === 'undefined' || s === '') return 0;
    const cleaned = String(s)
      .replace(/\(([^)]+)\)/g, (_m, p1) => `-${p1}`) // (1,234.56) -> -1,234.56
      .replace(/[^0-9\.\-\,]/g, '')
      .replace(/,/g, '');
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : 0;
  };

  // --- Fallback: scan entire rawText for "previous balance" / opening balance and add as first transaction ---
  const prevRegexes = [
    /previous\s+balance[:\s]*([-\d,().,]+)/i,
    /balance\s+brought\s+forward[:\s]*([-\d,().,]+)/i,
    /opening\s+balance[:\s]*([-\d,().,]+)/i,
    /opening[:\s]*balance[:\s]*([-\d,().,]+)/i
  ];
  for (const r of prevRegexes) {
    const m = rawText.match(r);
    if (m && m[1]) {
      const openingAmt = parseAmountLocal(m[1]);
      const already = transactions.some(t => /previous\s*balance/i.test(t.description || '') || t.category === 'opening_balance');
      if (!already && openingAmt !== 0) {
        transactions.unshift({
          date: `${statementYear || new Date().getFullYear()}-03-02`,
          description: 'Previous balance',
          amount: openingAmt,
          category: 'opening_balance',
          currency: 'PHP',
          sourceFile: file?.name || 'Metrobank Statement'
        });
      }
      break;
    }
  }

  // --- Main transaction loop ---
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const columns = line.split(/\s{2,}|\t+/).map(col => col.trim()).filter(Boolean);

    if (columns.length < 3) continue;

    // Detect date
    let dateStr = null;
    for (const dp of [
      /^\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?/,
      /^\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4}/,
      /^\d{1,2}\s+[A-Za-z]{3,9}/
    ]) {
      if (columns[0].match(dp)) {
        dateStr = columns[0];
        break;
      }
    }
    if (!dateStr) continue;

    // Description
    let description = columns[1];

    // Withdrawal and deposit columns
    let withdrawal = columns[2] && columns[2] !== '-' ? parseFloat(columns[2].replace(/,/g, '')) : 0;
    let deposit = columns[3] && columns[3] !== '-' ? parseFloat(columns[3].replace(/,/g, '')) : 0;

    // Amount logic: negative for withdrawal, positive for deposit
    let amount = withdrawal ? -Math.abs(withdrawal) : deposit;

    // --- Fix sign for known deposit descriptions ---
    if (/check|deposit|payment/i.test(description)) {
      amount = Math.abs(deposit || withdrawal);
    }

    // --- Fix sign for known withdrawal descriptions ---
    if (/water bill|rent bill|payroll|main office wholesale|debit transaction/i.test(description)) {
      amount = -Math.abs(withdrawal || deposit);
    }

    // Skip "Previous balance"
    if (/previous balance/i.test(description)) continue;

    // --- Fix date format to YYYY-MM-DD ---
    const normalizeDate = (dateStr) => {
      const parts = dateStr.split(/[\/\-]/);
      if (parts.length === 3) {
        // Assume MM-DD-YYYY or DD-MM-YYYY
        let [mm, dd, yy] = parts;
        if (yy.length === 2) yy = `20${yy}`;
        if (mm.length === 1) mm = `0${mm}`;
        if (dd.length === 1) dd = `0${dd}`;
        return `${yy}-${mm}-${dd}`;
      }
      return dateStr;
    };

    transactions.push({
      date: normalizeDate(dateStr),
      description,
      amount,
      currency: 'PHP',
      sourceFile: file?.name || 'Metrobank Statement'
    });
  }

  // Attempt to parse opening/closing balances with more liberal regex
  const openingMatch = rawText.match(/opening\s+balance[:\s]*([-\d,().,]+)\b/i);
  const closingMatch = rawText.match(/closing\s+balance[:\s]*([-\d,().,]+)\b/i);
  const summary = {
    openingBalance: openingMatch ? parseAmountLocal(openingMatch[1]) : null,
    closingBalance: closingMatch ? parseAmountLocal(closingMatch[1]) : null
  };
  
  // If still no transactions, provide an informative message in summary
  if (transactions.length === 0) {
    console.warn('Metrobank parser: no transactions detected in primary passes. Raw text sample:', rawText.slice(0, 200));
  }
  
  // Normalize dates to full format where possible
  const normalized = transactions.map(tx => ({
    ...tx,
    date: tx.date || null
  }));
  
  return {
    formattedTransactions: normalized,
    summary,
    bankName: 'METROBANK'
  };
};