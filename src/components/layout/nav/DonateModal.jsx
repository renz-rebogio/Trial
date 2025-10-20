import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const DonateModal = ({ isOpen, setIsOpen }) => {
  const [donationAmount, setDonationAmount] = useState('');
  const { toast } = useToast();

  const handleDonationSubmit = () => {
    toast({ title: "Thank You!", description: `Your donation of $${donationAmount} is appreciated (simulated).` });
    setIsOpen(false);
    setDonationAmount('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md glassmorphic">
        <DialogHeader>
          <DialogTitle className="text-2xl">Support Boogasi</DialogTitle>
          <DialogDescription>Your contribution helps us grow and support more entrepreneurs. (Stripe integration coming soon!)</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <Label htmlFor="donation-amount-modal">Donation Amount ($)</Label>
            <Input id="donation-amount-modal" type="number" value={donationAmount} onChange={(e) => setDonationAmount(e.target.value)} placeholder="e.g., 25" />
          </div>
          <Button onClick={handleDonationSubmit} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90">
            Donate Now (Simulated)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DonateModal;