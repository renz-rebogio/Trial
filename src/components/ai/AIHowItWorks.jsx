import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AIHowItWorks = () => {
  return (
    <Card className="glassmorphic shadow-xl mt-12 border-[hsl(var(--brighter-teal))]/30 bg-[hsl(var(--card-bg-bright-teal-tint))]">
      <CardHeader>
          <CardTitle className="text-2xl text-primary-foreground">How it Works (Conceptual Overview)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-muted-foreground">
          <p>1. <span className="font-semibold text-primary-foreground">Data Input:</span> You provide your financial data by uploading up to 10 files (CSV, PDF, or images like bank statements/invoices), or by manually pasting transaction data in CSV format.</p>
          <p>2. <span className="font-semibold text-primary-foreground">File Processing (Simulated):</span> For PDFs and images, the system would conceptually perform OCR (Optical Character Recognition) to extract textual data. For CSVs, it parses the structured data. This data is then organized (conceptually like a spreadsheet) for analysis.</p>
          <p>3. <span className="font-semibold text-primary-foreground">AI Analysis (Simulated):</span> The extracted or provided data is then (conceptually) analyzed by an AI. This simulation mimics an AI understanding financial patterns, identifying key metrics, and generating insights on:</p>
          <ul className="list-disc list-inside pl-4 space-y-1">
              <li>Income, expenses, and overall profitability, presented in a clear, invoice-like format with a clean white background.</li>
              <li>Top spending categories and potential areas for savings, with actionable advice.</li>
              <li>Unnecessary or unusually high expenses, flagged for review.</li>
              <li>Cash flow forecasts based on historical data and trends.</li>
              <li>Weekly financial summaries with practical suggestions.</li>
              <li>Investment suggestions based on (mock) analysis of recent financial articles from credible sources, focusing on diversification, risk management, and long-term growth strategies. Data is "crunched" into shorter, digestible summaries.</li>
          </ul>
          <p>4. <span className="font-semibold text-primary-foreground">Portfolio Tools (Simulated):</span> The assistant also provides tools to help manage your investments:</p>
           <ul className="list-disc list-inside pl-4 space-y-1">
              <li>Track contributions to different investment accounts.</li>
              <li>Set reminders to rebalance your portfolio according to your target asset allocation.</li>
              <li>Generate portfolio performance reports (e.g., returns, growth over time - visualized with mock charts).</li>
              <li>Monitor progress towards your financial goals.</li>
              <li>Receive smart alerts, for example, if your portfolio becomes too heavily weighted in a single asset or sector.</li>
          </ul>
          <p>5. <span className="font-semibold text-primary-foreground">Continuous Improvement (Conceptual):</span> The Horizons AI platform is designed for continuous learning and improvement. New features, data sources, and analytical capabilities are regularly integrated to enhance accuracy and provide even greater benefits to users over time.</p>
          <p className="text-sm italic">Note: Full OCR, live AI model integration, real-time market data, and connections to external services like Zapier require backend capabilities. This page currently simulates these advanced functionalities to demonstrate the potential of an AI finance assistant.</p>
      </CardContent>
    </Card>
  );
};

export default AIHowItWorks;