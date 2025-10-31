import React from 'react';

export const INVESTMENT_ARTICLES_DATA = [
  { 
    id: "investopedia-diversification-2025",
    title: "The Power of Diversification in June 2025", 
    summary: "As of early June 2025, diversifying across asset classes (stocks, bonds, real estate, commodities) and geographies remains crucial to mitigate risk. Consider low-cost ETFs for broad market exposure. Rebalance periodically to maintain target allocations.",
    sourceName: "Investopedia",
    sourceUrl: "https://www.investopedia.com/terms/d/diversification.asp", 
    publishedDate: "2025-06-01",
    tags: ["Diversification", "Risk Management", "ETFs"]
  },
  { 
    id: "bloomberg-innovation-investing",
    title: "Long-Term Growth: Investing in Innovation (Q2 2025 Update)", 
    summary: "Current analysis (June 2025) suggests identifying companies with strong fundamentals in innovative sectors like AI, renewable energy, and biotechnology. Focus on long-term growth potential rather than short-term market fluctuations. Dollar-cost averaging can be an effective strategy.",
    sourceName: "Bloomberg",
    sourceUrl: "https://www.bloomberg.com/technology", 
    publishedDate: "2025-05-28",
    tags: ["Innovation", "Growth Investing", "Tech Stocks", "AI"]
  },
  { 
    id: "wsj-volatility-guide",
    title: "Navigating Volatility: Risk Management for Mid-2025 Investors", 
    summary: "Understand your risk tolerance before investing. High-yield investments often come with higher risk. Consider a 'core-satellite' portfolio approach: a stable core with smaller, riskier satellite investments for potential alpha. (Updated June 2025)",
    sourceName: "Wall Street Journal",
    sourceUrl: "https://www.wsj.com/finance/investing", 
    publishedDate: "2025-06-03",
    tags: ["Volatility", "Risk Management", "Portfolio Strategy"]
  },
  { 
    id: "reuters-esg-trends",
    title: "The Rise of ESG Investing: Trends and Opportunities for H2 2025", 
    summary: "Environmental, Social, and Governance (ESG) factors are increasingly important. Investing in companies with strong ESG practices can align with your values and potentially offer sustainable long-term returns. Look for transparency in ESG reporting (Insights for June 2025).",
    sourceName: "Reuters",
    sourceUrl: "https://www.reuters.com/sustainability/", 
    publishedDate: "2025-05-30",
    tags: ["ESG", "Sustainable Investing", "Ethical Investing"]
  },
  { 
    id: "nerdwallet-digital-retirement",
    title: "Retirement Planning in the Digital Age: June 2025 Strategies", 
    summary: "Maximize contributions to tax-advantaged retirement accounts (e.g., 401(k), IRA). Regularly review your retirement goals and adjust your investment strategy as you approach retirement age. Consider inflation's impact on long-term savings and explore digital tools for planning.",
    sourceName: "NerdWallet",
    sourceUrl: "https://www.nerdwallet.com/investing/retirement-plans", 
    publishedDate: "2025-06-05",
    tags: ["Retirement", "401k", "IRA", "Long-term Planning"]
  }
];

export const fetchInvestmentArticles = () => {
  return INVESTMENT_ARTICLES_DATA.map(article => ({
    ...article,
    summary: article.summary.length > 250 ? article.summary.substring(0, 247) + "..." : article.summary,
  }));
};


export const getInvestmentSuggestions = (userName) => {
  let suggestions = `--- SECTION_TITLE_MARKER:General Investment Wisdom for ${userName} by Boogasi AI (based on recent trends) ---\n`;
  INVESTMENT_ARTICLES_DATA.slice(0, 2).forEach((article, index) => { 
    suggestions += `${index + 1}. ${article.title} (Source: ${article.sourceName}): ${article.summary}\n\n`;
  });
  suggestions += "--- SECTION_TITLE_MARKER:Key Takeaways ---\n- Prioritize diversification.\n- Focus on long-term growth in innovation.\n- Understand your risk tolerance.\n- Consider ESG factors.";
  return suggestions;
};