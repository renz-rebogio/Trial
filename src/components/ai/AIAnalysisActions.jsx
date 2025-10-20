import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, AlertTriangle, CalendarDays, Brain, Combine, Loader2, TrendingUp, PieChart, BellRing, Target } from 'lucide-react';
import AIReportDisplay from './AIReportDisplay'; 
import { cn } from '@/lib/utils';

const AIAnalysisActions = ({ 
  handleAIRequest, 
  isLoading, 
  loadingMessage, 
  analysisResult,
  portfolioFeaturesResult
}) => {
  const buttonBaseClass = "w-full justify-start text-primary-foreground button-outline-on-dark bg-[hsl(var(--boogasi-black-val))]"; 
  const iconBaseClass = "mr-2 h-5 w-5";

  return (
    <Card className="ai-analysis-actions-card shadow-xl"> 
      <CardHeader>
        <CardTitle className="text-2xl">Boogasi AI Analysis & Portfolio Tools</CardTitle>
        <CardDescription>Get insights from your data and manage your portfolio.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={() => handleAIRequest('Analyze Expenses')} className={cn(buttonBaseClass, "border-[hsl(var(--boogasi-blue-val))] hover:bg-[hsl(var(--boogasi-blue-val))]/20")} variant="outline" disabled={isLoading}>
          <BarChart className={cn(iconBaseClass, "text-[hsl(var(--boogasi-blue-val))] icon-neon-blue")} /> Analyze Expense Summary
        </Button>
        <Button onClick={() => handleAIRequest('Forecast Cash Flow')} className={cn(buttonBaseClass, "border-[hsl(var(--boogasi-green-val))] hover:bg-[hsl(var(--boogasi-green-val))]/20")} variant="outline" disabled={isLoading}>
          <CalendarDays className={cn(iconBaseClass, "text-[hsl(var(--boogasi-green-val))] icon-neon-green")} /> Forecast Cash Flow
        </Button>
        <Button onClick={() => handleAIRequest('Flag Unusual Transactions')} className={cn(buttonBaseClass, "border-[hsl(var(--boogasi-orange-val))] hover:bg-[hsl(var(--boogasi-orange-val))]/20")} variant="outline" disabled={isLoading}>
          <AlertTriangle className={cn(iconBaseClass, "text-[hsl(var(--boogasi-orange-val))] icon-neon-orange")} /> Flag Unusual Transactions
        </Button>
        <Button onClick={() => handleAIRequest('Generate Weekly Report')} className={cn(buttonBaseClass, "border-[hsl(var(--boogasi-purple-val))] hover:bg-[hsl(var(--boogasi-purple-val))]/20")} variant="outline" disabled={isLoading}>
          <Brain className={cn(iconBaseClass, "text-[hsl(var(--boogasi-purple-val))] icon-neon-purple")} /> Generate Weekly Report
        </Button>
        <Button onClick={() => handleAIRequest('Combined Analysis')} className="w-full justify-start bg-gradient-to-r from-[hsl(var(--boogasi-blue-val))] to-[hsl(var(--boogasi-teal-val))] text-primary-foreground hover:opacity-90" variant="default" disabled={isLoading}>
          <Combine className={cn(iconBaseClass, "icon-neon-cyan")} /> Combine All Financial Analyses
        </Button>
        
        <div className="pt-4 mt-4 border-t border-[hsl(var(--boogasi-purple-val))]/20">
          <h4 className="text-lg font-semibold mb-2">Portfolio Tools (Simulated by Boogasi AI)</h4>
          <Button onClick={() => handleAIRequest('Track Contributions')} className={cn(buttonBaseClass, "border-[hsl(var(--boogasi-teal-val))] hover:bg-[hsl(var(--boogasi-teal-val))]/20")} variant="outline" disabled={isLoading}>
            <PieChart className={cn(iconBaseClass, "text-[hsl(var(--boogasi-teal-val))] icon-neon-teal")} /> Track Contributions
          </Button>
          <Button onClick={() => handleAIRequest('Rebalance Reminders')} className={cn(buttonBaseClass, "border-[hsl(var(--boogasi-pink-val))] hover:bg-[hsl(var(--boogasi-pink-val))]/20 mt-2")} variant="outline" disabled={isLoading}>
            <BellRing className={cn(iconBaseClass, "text-[hsl(var(--boogasi-pink-val))] icon-neon-pink")} /> Rebalance Reminders
          </Button>
          <Button onClick={() => handleAIRequest('Portfolio Performance')} className={cn(buttonBaseClass, "border-[hsl(var(--boogasi-blue-val))] hover:bg-[hsl(var(--boogasi-blue-val))]/20 mt-2")} variant="outline" disabled={isLoading}>
            <TrendingUp className={cn(iconBaseClass, "text-[hsl(var(--boogasi-blue-val))] icon-neon-blue")} /> Portfolio Performance Report
          </Button>
           <Button onClick={() => handleAIRequest('Goal Progress')} className={cn(buttonBaseClass, "border-[hsl(var(--boogasi-green-val))] hover:bg-[hsl(var(--boogasi-green-val))]/20 mt-2")} variant="outline" disabled={isLoading}>
            <Target className={cn(iconBaseClass, "text-[hsl(var(--boogasi-green-val))] icon-neon-green")} /> Goal Progress Tracking
          </Button>
           <Button onClick={() => handleAIRequest('Smart Alerts')} className={cn(buttonBaseClass, "border-[hsl(var(--boogasi-orange-val))] hover:bg-[hsl(var(--boogasi-orange-val))]/20 mt-2")} variant="outline" disabled={isLoading}>
            <AlertTriangle className={cn(iconBaseClass, "text-[hsl(var(--boogasi-orange-val))] icon-neon-orange")} /> Smart Portfolio Alerts
          </Button>
        </div>
        
        {isLoading && (
          <div className="flex flex-col items-center justify-center p-4 text-[hsl(var(--primary-foreground))]">
            <Loader2 className="mr-2 h-8 w-8 animate-spin icon-neon-purple" />
            <span className="mt-2 text-sm">{loadingMessage || 'Boogasi AI is thinking...'}</span>
          </div>
        )}

        {!isLoading && analysisResult && (
          <AIReportDisplay reportContent={analysisResult} />
        )}
        {!isLoading && portfolioFeaturesResult && (
          <AIReportDisplay reportContent={portfolioFeaturesResult} />
        )}
      </CardContent>
    </Card>
  );
};

export default AIAnalysisActions;