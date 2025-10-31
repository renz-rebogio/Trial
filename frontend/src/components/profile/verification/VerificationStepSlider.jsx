import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { DollarSign, ArrowRight, Loader2 } from 'lucide-react';

const formatCurrency = (value) => {
  if (!value) return '$0';
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return `${value}`;
};

const VerificationStepSlider = ({ investmentRangeMax, setInvestmentRangeMax, onNext, onSaveRange, isSavingRange, isVerified, currentStatus }) => {
  const isDisabled = isVerified || currentStatus === 'pending_review' || isSavingRange;

  return (
    <div className="p-6 md:p-8 bg-card rounded-lg shadow-lg border border-border/30">
      <div className="flex items-center mb-6">
        <DollarSign className="h-8 w-8 text-primary mr-3" />
        <div>
          <h3 className="text-2xl font-semibold text-primary-foreground">Declare Your Investment Capacity</h3>
          <p className="text-sm text-muted-foreground">Set your approximate investment capacity. This will be displayed on your badge if approved.</p>
        </div>
      </div>
      
      <div className="space-y-4 my-8">
        <Label htmlFor="investmentRangeSlider" className="sr-only">Investment Capacity</Label>
        <Slider
          id="investmentRangeSlider"
          value={[investmentRangeMax]}
          onValueChange={(value) => setInvestmentRangeMax(value[0])}
          min={1}
          max={1000000000} // $1 Billion
          step={1000} // increments
          className="w-full [&>span:nth-child(2)]:bg-primary/80 [&>span>span]:bg-primary [&>span>span]:h-6 [&>span>span]:w-6 [&>span>span]:border-2"
          disabled={isDisabled}
        />
        <div className="flex justify-between text-sm text-muted-foreground/90 mt-2">
          <span>$1</span>
          <span className="text-2xl font-bold text-primary">{formatCurrency(investmentRangeMax)}</span>
          <span>$1B</span>
        </div>
      </div>

      {isVerified && <p className="text-sm text-green-500 mb-4 text-center">Your range is verified. To change, please contact support.</p>}
      {currentStatus === 'pending_review' && <p className="text-sm text-amber-500 mb-4 text-center">Your range is set and documents are pending review.</p>}


      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
        <Button 
          onClick={() => onSaveRange(investmentRangeMax)} 
          disabled={isDisabled}
          className="w-full sm:w-auto"
        >
          {isSavingRange && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSavingRange ? 'Saving Range...' : 'Save Investment Range'}
        </Button>
        <Button 
          onClick={onNext} 
          disabled={isSavingRange || isDisabled} // Also disable if range not saved yet or status prevents moving
          className="w-full sm:w-auto"
        >
          Next: Provide Details <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
       <p className="text-xs text-muted-foreground/70 mt-6 text-center">
        This range helps connect you with relevant opportunities. You can adjust this later by contacting support if verified.
      </p>
    </div>
  );
};

export default VerificationStepSlider;