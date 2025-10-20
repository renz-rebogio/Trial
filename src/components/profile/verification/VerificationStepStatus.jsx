import React from 'react';
import { Button } from '@/components/ui/button';
import { BadgeCheck, ShieldAlert, Clock, Mail, Trash2, MessageCircle as MessageCircleWarning, Info } from 'lucide-react';

const formatCurrency = (value) => {
  if (!value) return '$0';
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return `${value}`;
};

const VerificationStepStatus = ({ investmentProfile, onRestart }) => {
  const status = investmentProfile?.verification_status || 'not_started';
  const isVerified = investmentProfile?.is_verified || false;
  const range = investmentProfile?.investment_range_max;
  const denialReason = investmentProfile?.denial_reason || "We couldn’t approve your submission. Please review your documents and try again.";

  let icon, title, description, cardClass, policyReminder, additionalInfo;

  policyReminder = (
    <div className="mt-6 p-3 bg-muted/40 rounded-md border border-border/20 text-xs text-muted-foreground/80 flex items-center justify-center gap-2">
      <Trash2 className="h-4 w-4 text-primary" />
      <span>Remember: All submitted documents are permanently deleted after review.</span>
    </div>
  );

  if (isVerified) {
    icon = <BadgeCheck className="h-16 w-16 text-green-500" />;
    title = "Successfully Verified!";
    description = `Congratulations! You are now a Verified Boogasi Investor. Your badge displaying "Verified Boogasi Investor – ${formatCurrency(range)}" is active. You can now place offers on investment listings.`;
    cardClass = "bg-green-500/10 border-green-500/30";
    additionalInfo = (
      <div className="mt-4 p-3 bg-green-500/5 rounded-md border border-green-500/20 text-sm text-green-400/90">
        <Info className="inline h-4 w-4 mr-2" />
        You now have access to place offers on investment listings.
      </div>
    );
  } else if (status === 'pending_review') {
    icon = <Clock className="h-16 w-16 text-amber-500 animate-pulse" />;
    title = "Verification Under Review";
    description = "Your verification documents have been submitted and are currently under review by our admin team. You will be notified via email once the review is complete. This usually takes 1-3 business days. No badge is shown while pending.";
    cardClass = "bg-amber-500/10 border-amber-500/30";
  } else if (status === 'rejected') {
    icon = <ShieldAlert className="h-16 w-16 text-red-500" />;
    title = "Verification Denied";
    description = denialReason;
    cardClass = "bg-red-500/10 border-red-500/30";
    additionalInfo = (
        <div className="mt-4 p-3 bg-red-500/5 rounded-md border border-red-500/20 text-sm text-red-400/90">
            <MessageCircleWarning className="inline h-4 w-4 mr-2" />
            You cannot place offers on investments until your profile is verified.
        </div>
    );
  } else { 
    icon = <Mail className="h-16 w-16 text-primary" />;
    title = "Verification Incomplete";
    description = "Your verification process is not yet complete. Please ensure all steps are finished to establish your credibility on Boogasi and gain the ability to place offers.";
    cardClass = "bg-primary/10 border-primary/30";
    policyReminder = null; 
  }

  return (
    <div className={`p-6 md:p-10 text-center rounded-lg shadow-xl ${cardClass}`}>
      <div className="mb-6 flex justify-center">{icon}</div>
      <h2 className="text-3xl font-bold text-primary-foreground mb-3">{title}</h2>
      <p className="text-muted-foreground/90 mb-6 leading-relaxed">{description}</p>
      
      {additionalInfo}

      {status === 'rejected' && (
        <Button onClick={onRestart} variant="outline" size="lg" className="mt-8 mb-4">
          Resubmit Information
        </Button>
      )}
      {policyReminder}
      <p className="text-xs text-muted-foreground/70 mt-6">
        The Boogasi Investor Badge is for platform credibility only and not a legal accreditation.
        If you have any questions, please contact our support team.
      </p>
    </div>
  );
};

export default VerificationStepStatus;