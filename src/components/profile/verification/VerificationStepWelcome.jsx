import React from 'react';
import { Button } from '@/components/ui/button';
import { Shield, Zap, LockKeyhole, Trash2, Users } from 'lucide-react';

const VerificationStepWelcome = ({ onNext }) => {
  return (
    <div className="p-6 md:p-8 text-center bg-gradient-to-br from-primary/5 via-background to-background rounded-lg shadow-inner border border-primary/20">
      <Shield className="h-16 w-16 text-primary mx-auto mb-6 animate-pulse" />
      <h2 className="text-3xl font-bold text-primary-foreground mb-4">
        Become a Verified Boogasi Investor
      </h2>
      <p className="text-muted-foreground/90 mb-3 text-lg leading-relaxed">
        You're a few steps away from unlocking the full potential of Boogasi.
        Verification builds trust, grants you access to place offers, and signals
        your credibility to other serious members of our community.
      </p>
      
      <div className="mt-6 mb-8 space-y-4 text-left max-w-2xl mx-auto">
        <div className="flex items-start space-x-3 p-3 bg-muted/30 rounded-md border border-border/20">
          <LockKeyhole className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold text-primary-foreground/90">Privacy First</h4>
            <p className="text-sm text-muted-foreground/80">Documents are used <strong className="text-primary-foreground/90">only for verification purposes</strong> by our internal team.</p>
          </div>
        </div>
        <div className="flex items-start space-x-3 p-3 bg-muted/30 rounded-md border border-border/20">
          <Trash2 className="h-5 w-5 text-destructive flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold text-primary-foreground/90">Permanent Deletion</h4>
            <p className="text-sm text-muted-foreground/80">After approval or denial, your submitted files are <strong className="text-primary-foreground/90">automatically and permanently deleted</strong>. We do not store them.</p>
          </div>
        </div>
        <div className="flex items-start space-x-3 p-3 bg-muted/30 rounded-md border border-border/20">
          <Users className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold text-primary-foreground/90">No Third-Party Access</h4>
            <p className="text-sm text-muted-foreground/80">Your sensitive data <strong className="text-primary-foreground/90">will never be shared with or sold to third parties</strong>.</p>
          </div>
        </div>
         <div className="flex items-start space-x-3 p-3 bg-muted/30 rounded-md border border-border/20">
          <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold text-primary-foreground/90">Platform Credibility</h4>
            <p className="text-sm text-muted-foreground/80">The Boogasi Investor Badge is for establishing credibility <strong className="text-primary-foreground/90">within our platform only</strong>. It is not a legal accreditation outside of Boogasi.</p>
          </div>
        </div>
      </div>

      <Button onClick={onNext} size="lg" className="w-full sm:w-auto group mt-6">
        Get Verified
        <Zap className="ml-2 h-5 w-5 group-hover:animate-ping" />
      </Button>
    </div>
  );
};

export default VerificationStepWelcome;