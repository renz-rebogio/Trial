import React from 'react';
import { motion } from 'framer-motion';

const AIReportDisplay = ({ reportContent }) => {
  if (!reportContent) return null;

  const applyStylingToLine = (line, isSummaryLine = false, isSuggestionSection = false) => {
    let styledLine = line;

    styledLine = styledLine.replace(/\b(Boogasi AI)\b/gi, '<span class="text-boogasi-ai-brand">$1</span>');
    styledLine = styledLine.replace(/\bUSD\b/g, '<span class="text-content-currency">USD</span>');
    styledLine = styledLine.replace(/\(Source: (.*?)\)/g, '(<span class="text-content-source">Source: $1</span>)');
    
    const dateRegex = /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{1,2},?\s\d{4})\b/g;
    styledLine = styledLine.replace(dateRegex, '<span class="text-content-date-description">$1</span>');
    
    const knownBusinessKeywords = ['Store', 'Inc.', 'Ltd.', 'Corp.', 'Shop', 'Market', 'Company', 'Services', 'Solutions', 'Bank', 'Restaurant', 'Cafe', 'LLC', 'HOTEL', 'SUPERMARKET', 'ELECTRONICS', 'INTERAC'];
    knownBusinessKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b([A-Z][a-zA-Z'’&]+(?:\\s+[A-Z][a-zA-Z'’&]+)*\\s*${keyword})\\b`, 'gi'); // Added 'i' for case-insensitive
        styledLine = styledLine.replace(regex, (match) => {
            if (match.toLowerCase().includes('boogasi ai')) return match; 
            return `<span class="text-content-business-name">${match}</span>`;
        });
    });
    const generalCapsWordsRegex = /\b([A-Z][a-zA-Z'’&]{2,}(?:\s+[A-Z][a-zA-Z'’&]+)*)\b/g;
    styledLine = styledLine.replace(generalCapsWordsRegex, (match, p1) => {
        if (match.toUpperCase() === match || 
            match.toLowerCase().includes('boogasi ai') || 
            p1.toLowerCase() === 'usd' ||
            dateRegex.test(p1) ||
            knownBusinessKeywords.some(kw => p1.includes(kw))) {
            return match;
        }
        if (p1.split(' ').length > 1 && p1.split(' ').length < 5) { 
             return `<span class="text-content-business-name">${p1}</span>`;
        }
        return match;
    });

    if (isSummaryLine) {
      if (styledLine.match(/Total Deposits:\s*\+?[\d,.]+/i)) {
        styledLine = styledLine.replace(/(\+?[\d,.]+)/g, '<span class="text-amount-positive">$1</span>');
      }
      if (styledLine.match(/Total Withdrawals:\s*-[\d,.]+/i)) {
         styledLine = styledLine.replace(/(-[\d,.]+)/g, '<span class="text-amount-negative">$1</span>');
      }
      if (styledLine.match(/Final Balance:\s*([\d,.-]+)/i)) {
        styledLine = styledLine.replace(/(Final Balance:\s*)([\d,.-]+)/g, '$1<span class="text-balance-number">$2</span>');
      }
    } else {
      styledLine = styledLine.replace(/(\b(?:balance|amount|total|deposit|withdrawal|fee|payment|refund|purchase)\b[\s:]*[\$€£]?\s*)(\+?-?[\d,.]+)/gi, (match, p1, p2) => {
        const amount = parseFloat(p2.replace(/[^\d.-]/g, ''));
        if (p1.toLowerCase().includes('deposit') || (amount > 0 && !p1.toLowerCase().includes('withdrawal') && !p1.toLowerCase().includes('fee') && !p1.toLowerCase().includes('payment') && !p1.toLowerCase().includes('purchase')) ) {
          return `${p1}<span class="text-amount-positive">${p2}</span>`;
        } else if (p1.toLowerCase().includes('withdrawal') || p1.toLowerCase().includes('fee') || p1.toLowerCase().includes('payment') || p1.toLowerCase().includes('purchase') || amount < 0) {
          return `${p1}<span class="text-amount-negative">${p2}</span>`;
        }
        return `${p1}<span class="text-balance-number">${p2}</span>`;
      });
    }
    
    if (isSuggestionSection) {
        styledLine = `<span class="text-content-suggestion">${styledLine}</span>`;
    }


    return styledLine;
  };
  
  const getTitleClass = (title) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('expense & profitability report') || 
        lowerTitle.includes('top spending categories') || 
        lowerTitle.includes('analysis focus') || 
        lowerTitle.includes('post-transaction information')) {
      return 'report-title-orange';
    }
    if (lowerTitle.includes('warning') || lowerTitle.includes('negative') || lowerTitle.includes('loss') || lowerTitle.includes('unusual transactions')) {
      return 'report-title-red';
    }
    if (lowerTitle.includes('positive') || lowerTitle.includes('gains') || lowerTitle.includes('income') || lowerTitle.includes('deposits') || lowerTitle.includes('profitability report') || lowerTitle.includes('transaction details')) {
      return 'report-title-green';
    }
    if (lowerTitle.includes('suggestion') || lowerTitle.includes('wisdom') || lowerTitle.includes('remarks')) {
      return 'report-title-suggestion-yellow';
    }
    // Make all general headlines blue
    if (lowerTitle.includes('general information') || lowerTitle.includes('forecast') || lowerTitle.includes('cash flow') || lowerTitle.includes('(boogasi ai)') || lowerTitle.includes('header details') || lowerTitle.includes('details')) {
      return 'report-title-blue';
    }
    return 'report-title-blue'; // Default to blue if no other specific match
  };


  const parseReport = (content) => {
    const mainTitleRegex = /MAIN_TITLE_MARKER:(.*?)(?=\s*={20,}|=|$)/;
    const sectionTitleRegex = /--- SECTION_TITLE_MARKER:(.*?) ---/;
    const transactionTableHeaders = "Date        | Description                         | Amount      | Currency | Running Balance";
    const transactionTableSeparator = "------------|-------------------------------------|-------------|----------|----------------";

    let sections = [];
    let currentSection = { title: "General Information", titleClass: getTitleClass("General Information"), contentLines: [] };

    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const mainTitleMatch = line.match(mainTitleRegex);
      const sectionTitleMatch = line.match(sectionTitleRegex);

      if (mainTitleMatch && mainTitleMatch[1]) {
        if (currentSection.contentLines.length > 0) sections.push({...currentSection, content: currentSection.contentLines.join('\n')});
        currentSection = { title: mainTitleMatch[1].trim(), titleClass: getTitleClass(mainTitleMatch[1].trim()), contentLines: [] };
      } else if (sectionTitleMatch && sectionTitleMatch[1]) {
        if (currentSection.contentLines.length > 0) sections.push({...currentSection, content: currentSection.contentLines.join('\n')});
        const newTitle = sectionTitleMatch[1].trim();
        currentSection = { title: newTitle, titleClass: getTitleClass(newTitle), contentLines: [] };
        if (newTitle.toLowerCase().includes('suggestion') || newTitle.toLowerCase().includes('remarks')) {
            currentSection.isSuggestionSection = true;
        }
      } else if (line.trim() === transactionTableHeaders) {
        if (currentSection.contentLines.length > 0) sections.push({...currentSection, content: currentSection.contentLines.join('\n')});
        currentSection = { 
          title: "Transaction Details (Boogasi AI)", 
          titleClass: getTitleClass("Transaction Details (Boogasi AI)"), 
          isTransactionBlock: true, 
          transactions: [], 
          headerContent: currentSection.contentLines.join('\n').trim(),
          summaryLines: [],
          contentLines: [] 
        };
        
        i++; 
        while (lines[++i] && lines[i].trim() !== transactionTableSeparator && lines[i].trim() !== "--------------------------------------------------") {
          const parts = lines[i].split('|').map(p => p.trim());
          if (parts.length >= 5) {
            currentSection.transactions.push({
              date: parts[0] !== 'N/A' ? parts[0] : null,
              description: parts[1] !== 'N/A' ? parts[1] : 'No Description',
              amount: parts[2] !== 'N/A' ? parseFloat(parts[2].replace(/[^\d.-]/g, '')) : null,
              currency: parts[3] !== 'N/A' ? parts[3] : 'USD',
              runningBalance: parts[4] !== 'N/A' ? parseFloat(parts[4].replace(/[^\d.-]/g, '')) : null,
            });
          }
        }
        
        while(lines[++i] && (lines[i].startsWith("Total Deposits:") || lines[i].startsWith("Total Withdrawals:") || lines[i].startsWith("Final Balance:") || lines[i].startsWith("(Based on processed transactions"))) {
           currentSection.summaryLines.push(lines[i]);
        }
        if (lines[i] && lines[i].trim() === "--------------------------------------------------") i++; 
        sections.push({...currentSection, transactions: [...currentSection.transactions], summary: currentSection.summaryLines.join('\n')});
        currentSection = { title: "Post-Transaction Information", titleClass: getTitleClass("Post-Transaction Information"), contentLines: [] }; 
        i--; 
      } else if (!line.startsWith("==========") && !line.startsWith("----------") && line.trim() !== "") {
         currentSection.contentLines.push(line);
      }
    }
    if (currentSection.contentLines.length > 0 || currentSection.isTransactionBlock) {
      sections.push({...currentSection, content: currentSection.contentLines.join('\n')});
    }
    
    return sections.filter(s => (s.content && s.content.trim() !== "") || (s.isTransactionBlock && s.transactions && s.transactions.length > 0) || (s.summary && s.summary.trim() !== "") || (s.headerContent && s.headerContent.trim() !== ""));
  };
  
  const parsedReport = parseReport(reportContent);

  return (
    <motion.div
      className="mt-6 max-h-[700px] overflow-y-auto ai-report-invoice"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {parsedReport.map((section, index) => (
        <div key={index} className="mb-4 last:mb-0">
          <h3 className={`report-section-title ${section.titleClass || 'report-title-blue'}`}>{section.title}</h3>
          {section.headerContent && (
            <pre 
              className={`whitespace-pre-wrap ${section.sectionContentClass || ''}`}
              dangerouslySetInnerHTML={{ __html: applyStylingToLine(section.headerContent, false, section.isSuggestionSection) }}
            />
          )}
          {section.content && !section.isTransactionBlock && (
             <pre 
              className={`whitespace-pre-wrap ${section.sectionContentClass || ''}`}
              dangerouslySetInnerHTML={{ __html: applyStylingToLine(section.content, false, section.isSuggestionSection) }}
            />
          )}
          {section.isTransactionBlock && section.transactions && section.transactions.length > 0 && (
            <div className="overflow-x-auto mt-2 mb-2">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th className="text-right">Amount</th>
                    <th className="text-center">Currency</th>
                    <th className="text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {section.transactions.map((tx, txIdx) => (
                    <tr key={txIdx} className="border-b border-[hsl(var(--clean-white-border-color))] last:border-b-0">
                      <td className="text-content-date-description">{tx.date || 'N/A'}</td>
                      <td>
                        <span dangerouslySetInnerHTML={{ __html: applyStylingToLine(tx.description || 'N/A') }} />
                      </td>
                      <td className={`text-right ${tx.amount && tx.amount < 0 ? 'text-amount-negative' : 'text-amount-positive'}`}>
                        {tx.amount !== null ? (tx.amount > 0 ? '+' : '') + tx.amount.toFixed(2) : 'N/A'}
                      </td>
                      <td className="text-center"><span className="text-content-currency">{tx.currency || 'N/A'}</span></td>
                      <td className="text-right text-balance-number">{tx.runningBalance !== null ? tx.runningBalance.toFixed(2) : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
           {section.summary && (
            <pre 
              className={`whitespace-pre-wrap mt-2 ${section.sectionContentClass || ''}`}
              dangerouslySetInnerHTML={{ __html: applyStylingToLine(section.summary, true, section.isSuggestionSection) }}
            />
          )}
        </div>
      ))}
    </motion.div>
  );
};

export default AIReportDisplay;