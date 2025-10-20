import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRightLeft, X, CheckCircle } from 'lucide-react';

const MarketplaceModals = ({
  isBidModalOpen,
  setIsBidModalOpen,
  selectedListing,
  bidAmount,
  setBidAmount,
  handleBidSubmit,
  isContactModalOpen,
  setIsContactModalOpen,
  contactMessage,
  setContactMessage,
  handleContactSubmit,
  userEmail,
  isManageOfferModalOpen,
  setIsManageOfferModalOpen,
  selectedOffer,
  handleManageOffer,
}) => {
  return (
    <>
      <Dialog open={isBidModalOpen} onOpenChange={setIsBidModalOpen}>
        <DialogContent className="sm:max-w-[425px] glassmorphic bg-[hsl(var(--card))] border-[hsl(var(--boogasi-blue-val))] text-foreground">
          <DialogHeader>
            <DialogTitle className="text-[hsl(var(--boogasi-blue-val))]">Make an Offer for "{selectedListing?.title}"</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Enter the amount you'd like to offer. All offers are binding if accepted.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bid-amount" className="text-right text-foreground">
                Amount ($)
              </Label>
              <Input
                id="bid-amount"
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="col-span-3 bg-input border-border focus:border-[hsl(var(--boogasi-blue-val))] focus:ring-[hsl(var(--boogasi-blue-val))]"
                placeholder="e.g., 5000"
              />
            </div>
            <div className="col-span-4 space-y-2 mt-2 p-3 border rounded-md bg-muted/30 border-[hsl(var(--boogasi-teal-val))]/30">
              <p className="text-xs text-muted-foreground font-semibold">Buyer's Agreement:</p>
              <p className="text-xs text-muted-foreground">
                By submitting this offer, you agree that it is a binding commitment to proceed with the deal if accepted by the seller. Failure to proceed may subject you to legal action by Boogasi LLC.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsBidModalOpen(false)} className="border-[hsl(var(--boogasi-teal-val))] text-[hsl(var(--boogasi-teal-val))] hover:bg-[hsl(var(--boogasi-teal-val))]/10">Cancel</Button>
            <Button type="submit" onClick={handleBidSubmit} className="bg-gradient-to-r from-[hsl(var(--boogasi-orange-val))] to-[hsl(var(--boogasi-pink-val))] text-primary-foreground hover:opacity-90">Submit Offer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
        <DialogContent className="sm:max-w-[425px] glassmorphic bg-[hsl(var(--card))] border-[hsl(var(--boogasi-blue-val))] text-foreground">
          <DialogHeader>
            <DialogTitle className="text-[hsl(var(--boogasi-blue-val))]">Contact Owner of "{selectedListing?.title}"</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Send a message to the project owner. Your contact information ({userEmail}) will be shared.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="contact-message" className="text-foreground">Your Message</Label>
            <Textarea
              id="contact-message"
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              className="col-span-4 min-h-[100px] bg-input border-border focus:border-[hsl(var(--boogasi-blue-val))] focus:ring-[hsl(var(--boogasi-blue-val))]"
              placeholder="Type your message here..."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsContactModalOpen(false)} className="border-[hsl(var(--boogasi-teal-val))] text-[hsl(var(--boogasi-teal-val))] hover:bg-[hsl(var(--boogasi-teal-val))]/10">Cancel</Button>
            <Button type="submit" onClick={handleContactSubmit} className="bg-gradient-to-r from-[hsl(var(--boogasi-blue-val))] to-[hsl(var(--boogasi-teal-val))] text-primary-foreground hover:opacity-90">Send Message</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isManageOfferModalOpen} onOpenChange={setIsManageOfferModalOpen}>
        <DialogContent className="sm:max-w-md glassmorphic bg-[hsl(var(--card))] border-[hsl(var(--boogasi-blue-val))] text-foreground">
          <DialogHeader>
            <DialogTitle className="text-[hsl(var(--boogasi-blue-val))]">Manage Offer for "{selectedListing?.title}"</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Offer from: {selectedOffer?.profiles?.screen_name || selectedOffer?.profiles?.name || 'Bidder'} for <span className="text-[hsl(var(--boogasi-green-val))]">${selectedOffer?.amount?.toLocaleString()}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <p className="text-sm text-muted-foreground">Current status: <span className="font-semibold text-[hsl(var(--boogasi-blue-val))]">{selectedOffer?.status}</span></p>
            <p className="text-xs text-muted-foreground p-3 border rounded-md bg-muted/30 border-[hsl(var(--boogasi-teal-val))]/30">
              Marketing Fee (25%): If you accept this offer, a marketing fee of <span className="text-[hsl(var(--boogasi-orange-val))]">${((selectedOffer?.amount || 0) * 0.25).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> will be applicable to Boogasi LLC upon deal commitment. This fee is payable by the seller.
            </p>
            <div className="col-span-4 space-y-2 mt-2 p-3 border rounded-md bg-muted/30 border-[hsl(var(--boogasi-teal-val))]/30">
              <p className="text-xs text-muted-foreground font-semibold">Seller's Agreement:</p>
              <p className="text-xs text-muted-foreground">
                By accepting this offer, you agree to pay the 25% marketing fee to Boogasi LLC once the deal is committed.
              </p>
            </div>
          </div>
          <DialogFooter className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Button variant="destructive" onClick={() => handleManageOffer(selectedOffer.id, 'declined')}>
              <X className="mr-2 h-4 w-4" /> Decline
            </Button>
            <Button variant="outline" onClick={() => handleManageOffer(selectedOffer.id, 'countered')} disabled className="border-[hsl(var(--boogasi-orange-val))] text-[hsl(var(--boogasi-orange-val))] hover:bg-[hsl(var(--boogasi-orange-val))]/10">
              <ArrowRightLeft className="mr-2 h-4 w-4" /> Counter (Soon)
            </Button>
            <Button className="bg-[hsl(var(--boogasi-green-val))] hover:bg-[hsl(var(--boogasi-green-val))]/90 col-span-2 sm:col-span-1 text-primary-foreground" onClick={() => handleManageOffer(selectedOffer.id, 'accepted')}>
              <CheckCircle className="mr-2 h-4 w-4" /> Accept Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MarketplaceModals;