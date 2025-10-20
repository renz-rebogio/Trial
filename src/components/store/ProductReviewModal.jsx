import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Loader2 } from 'lucide-react';

const ProductReviewModal = ({ 
  isOpen, 
  onOpenChange, 
  productTitle, 
  reviewRating, 
  setReviewRating, 
  reviewText, 
  setReviewText, 
  onSubmit, 
  isSubmitting 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg glassmorphic">
        <DialogHeader>
          <DialogTitle>Write a Review for {productTitle}</DialogTitle>
          <DialogDescription>Share your thoughts about this product with the community.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium text-foreground">Rating</label>
            <div className="flex mt-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={24}
                  className={`cursor-pointer ${i < reviewRating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30 hover:text-yellow-300"}`}
                  onClick={() => setReviewRating(i + 1)}
                />
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="reviewText" className="text-sm font-medium text-foreground">Your Review</label>
            <Textarea
              id="reviewText"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="What did you like or dislike?"
              rows={4}
              className="mt-1 bg-input text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductReviewModal;