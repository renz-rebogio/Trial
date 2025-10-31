import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Mail } from 'lucide-react';

const InvestModal = ({ isOpen, setIsOpen }) => {
  const [investorInfo, setInvestorInfo] = useState({ name: '', amount: '', phone: '', email: '' });
  const { toast } = useToast();

  const handleInvestmentSubmit = (e) => {
    e.preventDefault();
    toast({ title: "Inquiry Received", description: "Thank you for your interest! Our team will contact you shortly." });
    setIsOpen(false);
    setInvestorInfo({ name: '', amount: '', phone: '', email: '' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg glassmorphic">
        <DialogHeader>
          <DialogTitle className="text-2xl">Invest in Boogasi Platform</DialogTitle>
          <DialogDescription>Interested in becoming an equity partner? Fill out the form below and our management team will reach out.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleInvestmentSubmit} className="py-4 space-y-4">
          <div>
            <Label htmlFor="investor-name-modal">Company/Individual Name</Label>
            <Input id="investor-name-modal" value={investorInfo.name} onChange={(e) => setInvestorInfo({...investorInfo, name: e.target.value})} required />
          </div>
          <div>
            <Label htmlFor="investor-amount-modal">Investment Amount ($)</Label>
            <Input id="investor-amount-modal" type="number" value={investorInfo.amount} onChange={(e) => setInvestorInfo({...investorInfo, amount: e.target.value})} required />
          </div>
          <div>
            <Label htmlFor="investor-phone-modal">Phone Number</Label>
            <Input id="investor-phone-modal" type="tel" value={investorInfo.phone} onChange={(e) => setInvestorInfo({...investorInfo, phone: e.target.value})} required />
          </div>
          <div>
            <Label htmlFor="investor-email-modal">Email</Label>
            <Input id="investor-email-modal" type="email" value={investorInfo.email} onChange={(e) => setInvestorInfo({...investorInfo, email: e.target.value})} required />
          </div>
          <Button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90">
            <Mail className="mr-2 h-4 w-4" /> Submit Inquiry
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InvestModal;