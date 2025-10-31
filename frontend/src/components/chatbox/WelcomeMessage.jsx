import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const WelcomeMessage = ({ onQuickAction, userName }) => {
  const quickActions = [
    { text: "Learn about Verified Supporters", action: "learn_verified_supporters" },
    { text: "Explore current listings", action: "explore_listings" },
    { text: "Understand Boogasi AI tools", action: "understand_ai_tools" },
    { text: "Ask a financial question (Research Mode)", action: "ask_financial_question" },
  ];

  return (
    <div className="p-3 bg-muted/50 rounded-lg shadow">
      <p className="text-sm mb-2">
        👋 Welcome to Boogasi Assistant, {userName}!
      </p>
      <p className="text-xs text-muted-foreground mb-3">
        I’m here to help you explore exclusive products, learn about our platform, and provide research-based insights.
      </p>
      <div className="text-xs text-muted-foreground mb-3 p-2 border border-dashed border-border rounded-md bg-background/30">
        <p className="font-semibold mb-1">To keep things safe and clear:</p>
        <ul className="list-disc list-inside pl-2 space-y-0.5">
          <li>I provide information and research — <strong className="text-foreground">not financial advice.</strong></li>
          <li>For personalized advice, please consult a licensed professional.</li>
        </ul>
      </div>
      <p className="text-sm mb-3">How can I assist you today?</p>
      <div className="space-y-2">
        {quickActions.map((item) => (
          <Button
            key={item.action}
            variant="outline"
            size="sm"
            className="w-full justify-start text-left h-auto py-1.5 hover:bg-primary/10 hover:border-primary/50"
            onClick={() => onQuickAction(item.action, item.text)}
          >
            <ArrowRight size={14} className="mr-2 text-primary flex-shrink-0" />
            {item.text}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default WelcomeMessage;