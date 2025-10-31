import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const FeedbackButtons = ({ messageId, onFeedback }) => {
  const [feedbackGiven, setFeedbackGiven] = useState(null);

  const handleFeedbackClick = (type) => {
    if (!feedbackGiven) {
      setFeedbackGiven(type);
      onFeedback(messageId, type);
    }
  };

  return (
    <div className="flex items-center space-x-2 mt-1.5 ml-10">
      <p className="text-xs text-muted-foreground">Was this helpful?</p>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-6 w-6 p-0.5 hover:bg-green-500/10",
          feedbackGiven === 'positive' ? 'text-green-500 bg-green-500/10' : 'text-muted-foreground'
        )}
        onClick={() => handleFeedbackClick('positive')}
        disabled={feedbackGiven !== null}
        aria-label="Helpful"
      >
        <ThumbsUp size={14} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-6 w-6 p-0.5 hover:bg-red-500/10",
          feedbackGiven === 'negative' ? 'text-red-500 bg-red-500/10' : 'text-muted-foreground'
        )}
        onClick={() => handleFeedbackClick('negative')}
        disabled={feedbackGiven !== null}
        aria-label="Not helpful"
      >
        <ThumbsDown size={14} />
      </Button>
    </div>
  );
};

export default FeedbackButtons;