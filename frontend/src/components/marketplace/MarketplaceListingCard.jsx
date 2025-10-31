import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Users, DollarSign, MessageSquare } from 'lucide-react';

const MarketplaceListingCard = ({ listing, index, user, onContact, onOffer, onManageOffer }) => {
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: (i) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { delay: i * 0.07, duration: 0.4 },
    }),
  };
  
  const hasOffers = listing.bids && listing.bids.length > 0;

  return (
    <motion.div
      key={listing.id}
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="marketplace-page-container"
    >
      <Card className="h-full flex flex-col overflow-hidden shadow-xl hover:shadow-[hsl(var(--boogasi-cyan-val))]/40 transition-all duration-300 ease-out glassmorphic-card-hover group border-2 border-[hsl(var(--marketplace-border))] hover:border-[hsl(var(--marketplace-hover-border))] bg-[hsl(var(--marketplace-card-bg))]">
        {listing.images && listing.images.length > 0 ? (
          <div className="w-full h-48 overflow-hidden relative">
            <img src={listing.images[0].image_url} alt={listing.images[0].alt_text || listing.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md shadow-lg">
              {listing.category}
            </div>
          </div>
        ) : (
           <div className="w-full h-48 overflow-hidden relative bg-slate-700/50 flex items-center justify-center">
            <img  alt="Abstract 3D rendering of financial data and charts" className="w-full h-full object-cover opacity-50 group-hover:opacity-75 transition-opacity duration-300" src="https://images.unsplash.com/photo-1681392841332-63de1b3fce46" />
            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md shadow-lg">
              {listing.category || 'General'}
            </div>
          </div>
        )}
        <CardHeader className="pt-4">
          <CardTitle className="text-xl leading-tight truncate group-hover:text-[hsl(var(--boogasi-blue-val))] text-slate-100">{listing.title}</CardTitle>
          <CardDescription className="text-xs line-clamp-2 pt-1 h-[30px] text-slate-400 group-hover:text-slate-300">{listing.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-2 text-sm text-slate-300">
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-2 text-[hsl(var(--boogasi-green-val))]" />
            <span>Seeking: <span className="font-semibold text-[hsl(var(--boogasi-green-val))]">${listing.amount_sought?.toLocaleString()}</span></span>
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2 text-[hsl(var(--boogasi-blue-val))]" />
            <span>By: <span className="font-semibold text-[hsl(var(--boogasi-blue-val))]">{listing.ownerScreenName}</span> {listing.ownerLocation && `(${listing.ownerLocation})`}</span>
          </div>
          <div className="flex items-center">
            <Briefcase className="h-4 w-4 mr-2 text-[hsl(var(--boogasi-orange-val))]" />
            <span>Offers: <span className="font-semibold text-[hsl(var(--boogasi-orange-val))]">{listing.bids?.length || 0}</span></span>
          </div>
          {user && user.id === listing.ownerId && hasOffers && (
            <div className="mt-1">
              <h4 className="text-xs font-semibold text-slate-400 mb-0.5">Offers:</h4>
              <div className="max-h-16 overflow-y-auto space-y-0.5 text-xs">
                {listing.bids.map(offer => (
                  <div key={offer.id} className="flex justify-between items-center p-1 bg-slate-700/50 rounded text-slate-300">
                    <span>{offer.profiles?.screen_name || offer.profiles?.name || 'Bidder'}: ${offer.amount.toLocaleString()} ({offer.status})</span>
                    <Button size="sm" variant="ghost" onClick={() => onManageOffer(offer, listing)} className="h-5 px-1 py-0 text-xs text-[hsl(var(--boogasi-blue-val))] hover:text-[hsl(var(--boogasi-teal-val))]">Manage</Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="grid grid-cols-2 gap-2 p-3 border-t border-[hsl(var(--marketplace-border))]">
          <Button variant="outline" size="sm" onClick={() => onContact(listing)} className="border-[hsl(var(--boogasi-blue-val))] text-[hsl(var(--boogasi-blue-val))] hover:bg-[hsl(var(--boogasi-blue-val))]/20 hover:text-white">
            <MessageSquare className="mr-1 h-3 w-3" /> Contact
          </Button>
          <Button size="sm" onClick={() => onOffer(listing)} className="bg-gradient-to-r from-[hsl(var(--boogasi-orange-val))] to-[hsl(var(--boogasi-pink-val))] hover:from-[hsl(var(--boogasi-orange-val))]/90 hover:to-[hsl(var(--boogasi-pink-val))]/90 text-white" disabled={!user || user.id === listing.ownerId}>
            <DollarSign className="mr-1 h-3 w-3" /> Offer
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default MarketplaceListingCard;