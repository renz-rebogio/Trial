import React, { useState, useEffect, useCallback } from 'react';
    import { Button } from '@/components/ui/button';
    import { useToast } from '@/components/ui/use-toast';
    import { motion } from 'framer-motion';
    import { Briefcase, Loader2, Lock, PlusCircle } from 'lucide-react';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useAuth } from '@/hooks/useAuth';
    import CreateListingForm from '@/components/marketplace/CreateListingForm';
    
    import { useNavigate } from 'react-router-dom';
    import MarketplaceFilterBar from '@/components/marketplace/MarketplaceFilterBar';
    import MarketplaceListingCard from '@/components/marketplace/MarketplaceListingCard';
    import MarketplaceModals from '@/components/marketplace/MarketplaceModals';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';

    const MarketplacePage = () => {
      const [listings, setListings] = useState([]);
      const [searchTerm, setSearchTerm] = useState('');
      const [selectedListing, setSelectedListing] = useState(null);
      const [bidAmount, setBidAmount] = useState('');
      const [isBidModalOpen, setIsBidModalOpen] = useState(false);
      const [isContactModalOpen, setIsContactModalOpen] = useState(false);
      const [isCreateListingModalOpen, setIsCreateListingModalOpen] = useState(false);
      const [isManageOfferModalOpen, setIsManageOfferModalOpen] = useState(false);
      const [selectedOffer, setSelectedOffer] = useState(null);
      const [contactMessage, setContactMessage] = useState('');
      const [loadingListings, setLoadingListings] = useState(true);
      const { toast } = useToast();
      const { user, loading: authLoading } = useAuth();
      const navigate = useNavigate();
    
      const [categories, setCategories] = useState([]);
      const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
      const [amountRangeFilter, setAmountRangeFilter] = useState([0, 1000000]);
    
      const fetchListingsAndCategories = useCallback(async () => {
        if (!user) return; 
        setLoadingListings(true);
        try {
          const { data: categoriesData, error: categoriesError } = await supabase.from('categories').select('id, name').order('name');
          if (categoriesError) throw categoriesError;
          setCategories(categoriesData || []);
    
          let query = supabase
            .from('listings')
            .select(`
              *,
              profiles (id, screen_name, name, avatar_url, country, state_province),
              categories (name),
              listing_images (id, image_url, alt_text),
              offers (id, amount, status, bidder_id, profiles (screen_name, name))
            `)
            .eq('status', 'open') 
            .order('created_at', { ascending: false });
    
          if (selectedCategoryFilter && selectedCategoryFilter !== 'all') {
            query = query.eq('category_id', selectedCategoryFilter);
          }
          query = query.gte('amount_sought', amountRangeFilter[0]);
          query = query.lte('amount_sought', amountRangeFilter[1]);
          if (searchTerm) {
            query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
          }
    
          const { data, error } = await query;
          if (error) throw error;
    
          setListings(data.map(l => ({
            ...l,
            ownerScreenName: l.profiles?.screen_name || l.profiles?.name || 'Anonymous',
            ownerId: l.profiles?.id,
            ownerLocation: `${l.profiles?.state_province || ''}${l.profiles?.state_province && l.profiles?.country ? ', ' : ''}${l.profiles?.country || ''}`,
            category: l.categories?.name || 'Uncategorized',
            bids: l.offers || [],
            images: l.listing_images || [],
          })));
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error fetching data', description: error.message });
        } finally {
          setLoadingListings(false);
        }
      }, [user, toast, selectedCategoryFilter, amountRangeFilter, searchTerm]);
    
      useEffect(() => {
        if (!authLoading && !user) {
          navigate('/auth?type=login&redirect=/marketplace');
          toast({ title: "Login Required", description: "Please log in to access the marketplace.", variant: "destructive" });
        } else if (user) {
          fetchListingsAndCategories();
        }
      }, [user, authLoading, navigate, toast, fetchListingsAndCategories]);
    
      const handleBidSubmit = async () => {
        if (!user) {
          toast({ variant: 'destructive', title: 'Not Authenticated', description: 'You must be logged in to make an offer.' });
          return;
        }
        if (!selectedListing || !bidAmount || isNaN(parseFloat(bidAmount)) || parseFloat(bidAmount) <= 0) {
          toast({ variant: 'destructive', title: 'Invalid Offer', description: 'Please enter a valid offer amount.' });
          return;
        }
        try {
          const { error } = await supabase.from('offers').insert({
            listing_id: selectedListing.id,
            bidder_id: user.id, 
            amount: parseFloat(bidAmount),
            status: 'pending' 
          });
          if (error) throw error;
          toast({ title: 'Offer Submitted!', description: `Your offer of ${bidAmount} for "${selectedListing.title}" has been placed.` });
          setIsBidModalOpen(false);
          setBidAmount('');
          fetchListingsAndCategories(); 
        } catch (error) {
          toast({ variant: 'destructive', title: 'Offer Submission Failed', description: error.message });
        }
      };
    
      const handleContactSubmit = () => {
        if(!selectedListing || !contactMessage.trim()){
           toast({ variant: 'destructive', title: 'Empty Message', description: 'Please type a message before sending.' });
           return;
        }
        toast({ title: 'Message Sent (Simulated)', description: `Your message to the owner of "${selectedListing.title}" has been sent.`});
        setIsContactModalOpen(false); setContactMessage(''); setSelectedListing(null);
      }
    
      const handleManageOffer = async (offerId, newStatus) => {
        try {
          const { error } = await supabase.from('offers').update({ status: newStatus }).eq('id', offerId);
          if (error) throw error;
          toast({ title: 'Offer Updated', description: `The offer has been ${newStatus}.` });
          setIsManageOfferModalOpen(false);
          fetchListingsAndCategories(); 
        } catch(error) {
          toast({ variant: 'destructive', title: 'Offer Update Failed', description: error.message });
        }
      };
      
      const openBidModal = (listing) => {
        if (!user || user.id === listing.ownerId) {
          toast({ variant: 'destructive', title: 'Action Not Allowed', description: user.id === listing.ownerId ? 'You cannot make an offer on your own listing.' : 'Please log in to make an offer.'});
          return;
        }
        setSelectedListing(listing);
        setIsBidModalOpen(true);
      };
      
      const openContactModal = (listing) => {
        setSelectedListing(listing);
        setIsContactModalOpen(true);
      };
    
      const openManageOfferModal = (offer, listing) => {
        setSelectedOffer(offer);
        setSelectedListing(listing);
        setIsManageOfferModalOpen(true);
      }
      
      if (authLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin text-[hsl(var(--boogasi-blue-val))]" /></div>;
      }
    
      if (!user) {
        return (
          <div className="text-center py-12 brighter-theme-area min-h-screen flex flex-col justify-center items-center">
            <Lock className="h-24 w-24 mx-auto text-[hsl(var(--boogasi-pink-val))] mb-4" />
            <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
            <p className="mb-6">This is a private marketplace. Please log in to view listings.</p>
            <Button onClick={() => navigate('/auth?type=login&redirect=/marketplace')} className="bg-[hsl(var(--boogasi-blue-val))] hover:bg-[hsl(var(--boogasi-blue-val))]/90 text-primary-foreground">Log In</Button>
          </div>
        );
      }
    
      return (
        <div className="py-8 space-y-8 marketplace-page-container min-h-screen px-4">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[hsl(var(--boogasi-blue-val))] via-[hsl(var(--boogasi-teal-val))] to-[hsl(var(--boogasi-orange-val))]">Investment Marketplace</h1>
            <p className="text-xl max-w-2xl mx-auto text-muted-foreground">
              Discover, bid on, and fund promising projects. Connect with entrepreneurs and grow your portfolio.
            </p>
             <div className="mt-2 inline-flex items-center justify-center px-3 py-1 text-xs font-medium text-[hsl(var(--boogasi-orange-val))] bg-[hsl(var(--boogasi-orange-val))]/20 rounded-full border border-[hsl(var(--boogasi-orange-val))]/40">
                <Lock size={12} className="mr-1" />
                Private Network
              </div>
          </motion.div>
          
          <div className="flex flex-col md:flex-row gap-4 items-end p-4 border rounded-lg shadow-xl backdrop-blur-sm bg-card/70 border-border">
            <div className="flex-grow w-full">
              <MarketplaceFilterBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedCategoryFilter={selectedCategoryFilter}
                setSelectedCategoryFilter={setSelectedCategoryFilter}
                categories={categories}
                amountRangeFilter={amountRangeFilter}
                setAmountRangeFilter={setAmountRangeFilter}
              />
            </div>
             <Dialog open={isCreateListingModalOpen} onOpenChange={setIsCreateListingModalOpen}>
              <DialogTrigger asChild>
                <Button variant="aiFutureGlow" className="w-full md:w-auto h-12">
                  <PlusCircle className="mr-2 h-5 w-5" /> List a Project
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] bg-card border-boogasi-blue text-foreground">
                <DialogHeader>
                  <DialogTitle className="text-2xl text-boogasi-blue">Create New Listing</DialogTitle>
                  <DialogDescription className="text-muted-foreground">Fill in the details for your investment opportunity.</DialogDescription>
                </DialogHeader>
                <CreateListingForm onSuccess={() => { setIsCreateListingModalOpen(false); fetchListingsAndCategories(); }} />
              </DialogContent>
            </Dialog>
          </div>
    
    
          {loadingListings ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-boogasi-blue" />
            </div>
          ) : listings.length === 0 ? (
             <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-center py-12"
            >
              <Briefcase className="h-24 w-24 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-semibold mb-2 text-foreground">No listings found</h2>
              <p className="text-muted-foreground">Try adjusting your search or filter terms, or create the first listing!</p>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing, index) => (
                <MarketplaceListingCard
                  key={listing.id}
                  listing={listing}
                  index={index}
                  user={user}
                  onContact={openContactModal}
                  onOffer={openBidModal}
                  onManageOffer={openManageOfferModal}
                />
              ))}
            </div>
          )}
    
          <MarketplaceModals
            isBidModalOpen={isBidModalOpen}
            setIsBidModalOpen={setIsBidModalOpen}
            selectedListing={selectedListing}
            bidAmount={bidAmount}
            setBidAmount={setBidAmount}
            handleBidSubmit={handleBidSubmit}
            isContactModalOpen={isContactModalOpen}
            setIsContactModalOpen={setIsContactModalOpen}
            contactMessage={contactMessage}
            setContactMessage={setContactMessage}
            handleContactSubmit={handleContactSubmit}
            userEmail={user?.email}
            isManageOfferModalOpen={isManageOfferModalOpen}
            setIsManageOfferModalOpen={setIsManageOfferModalOpen}
            selectedOffer={selectedOffer}
            handleManageOffer={handleManageOffer}
          />
        </div>
      );
    };
    
    export default MarketplacePage;