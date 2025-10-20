import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

const AIFinanceAssistantDisclaimer = () => {
  return (
    <Card className="border-[hsl(var(--brighter-yellow))]/50 bg-[hsl(var(--brighter-yellow))]/10 dark:bg-[hsl(var(--brighter-yellow))]/5 mt-8 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg md:text-xl text-[hsl(var(--brighter-yellow))] dark:text-[hsl(var(--brighter-yellow))]">
          <AlertTriangle className="h-6 w-6 mr-3 text-[hsl(var(--brighter-yellow))] dark:text-[hsl(var(--brighter-yellow))]" />
          AI Finance Assistant Disclaimer
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm md:text-base text-[hsl(var(--brighter-yellow))]/90 dark:text-[hsl(var(--brighter-yellow))]/80 space-y-3">
        <p>
          Boogasi’s AI-powered financial tools and insights are provided for informational and educational purposes only. The features currently simulate AI analysis and do not constitute professional financial advice.
        </p>
        <p>
          You should not rely solely on this information to make investment, tax, or financial decisions. Always consult a qualified financial advisor, accountant, or other professional before taking any action based on these insights.
        </p>
        <p>
          Boogasi does not guarantee the accuracy, completeness, or timeliness of any data, analysis, or recommendations provided by the platform. Use these tools at your own risk.
        </p>
      </CardContent>
    </Card>
  );
};

export default AIFinanceAssistantDisclaimer;