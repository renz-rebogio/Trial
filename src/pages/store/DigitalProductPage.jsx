import React, { useState, useEffect, useCallback } from 'react';
    import { useParams, Link, useNavigate } from 'react-router-dom';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useAuth } from '@/hooks/useAuth';
    import { Button } from '@/components/ui/button';
    import { Loader2, ArrowLeft, MessageSquare, AlertTriangle } from 'lucide-react';
    import { useToast } from '@/components/ui/use-toast';
    import { motion } from 'framer-motion';
    
    import ProductImageGallery from '@/components/store/ProductImageGallery';
    import ProductPrimaryDetails from '@/components/store/ProductPrimaryDetails';
    import ProductInformationTabs from '@/components/store/ProductInformationTabs';
    import ProductReviewModal from '@/components/store/ProductReviewModal';
    import RelatedProductsSection from '@/components/store/RelatedProductsSection';
    
    const DigitalProductPage = () => {
      const { productId } = useParams();
      const { user } = useAuth();
      const { toast } = useToast();
      const navigate = useNavigate();
    
      const [product, setProduct] = useState(null);
      const [seller, setSeller] = useState(null);
      const [images, setImages] = useState([]);
      const [activeImageIndex, setActiveImageIndex] = useState(0);
      const [isLoading, setIsLoading] = useState(true);
      const [isPurchasing, setIsPurchasing] = useState(false);
      const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
      const [reviewRating, setReviewRating] = useState(5);
      const [reviewText, setReviewText] = useState('');
      const [isSubmittingReview, setIsSubmittingReview] = useState(false);
      const [reviews, setReviews] = useState([]); // Placeholder for reviews
      const [averageRating, setAverageRating] = useState(0); // Placeholder
      const [error, setError] = useState(null);
    
      const fetchProductData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
          const { data: productData, error: productError } = await supabase
            .from('digital_products')
            .select(`
              *,
              sellers (id, company_name, user_id, website_portfolio, profiles(screen_name, avatar_url)),
              digital_product_categories (id, name)
            `)
            .eq('id', productId)
            .eq('status', 'active')
            .single();
    
          if (productError || !productData) {
            throw productError || new Error('Product not found or not active.');
          }
          setProduct(productData);
          setSeller(productData.sellers);
    
          const { data: imageData, error: imageError } = await supabase
            .from('digital_product_images')
            .select('id, image_url, alt_text')
            .eq('product_id', productId)
            .order('display_order', { ascending: true });
          
          if (imageError) console.warn("Error fetching product images:", imageError.message); // Don't throw, allow page to load
          setImages(imageData || []);
    
          // TODO: Fetch actual reviews and calculate averageRating
          // For now, using placeholders
          // const { data: reviewData, error: reviewError } = await supabase
          //   .from('product_reviews') // Assuming a table named 'product_reviews'
          //   .select('*, profiles(screen_name, avatar_url)')
          //   .eq('product_id', productId);
          // if (reviewError) console.warn("Error fetching reviews:", reviewError);
          // setReviews(reviewData || []);
          // const avgRating = reviewData && reviewData.length > 0 ? reviewData.reduce((acc, r) => acc + r.rating, 0) / reviewData.length : 0;
          // setAverageRating(avgRating);
    
        } catch (err) {
          console.error('Error fetching product data:', err);
          setError(err.message || 'Failed to load product details.');
          toast({ variant: 'destructive', title: 'Error', description: err.message });
          // Optional: navigate('/404') or show error inline
        } finally {
          setIsLoading(false);
        }
      }, [productId, toast]);
    
      useEffect(() => {
        fetchProductData();
      }, [fetchProductData]);
    
      const handlePurchase = async () => {
        if (!user) {
          toast({ variant: 'warning', title: 'Login Required', description: 'Please log in to purchase this product.' });
          navigate('/auth');
          return;
        }
        setIsPurchasing(true);
        toast({ title: 'Processing Purchase...', description: 'This is a simulated purchase.' });
        
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
    
        // In a real scenario, integrate with Stripe or other payment provider
        // Then record the sale in `digital_product_sales` table
        
        toast({ title: 'Simulated Purchase Complete!', description: `You can now (conceptually) access ${product.title}.` });
        if (product.access_link_after_purchase) {
          toast({ title: 'Access Link', description: `Access at: ${product.access_link_after_purchase}`});
        } else if (product.product_file_url) {
           toast({ title: 'Download Link', description: `Download from: ${product.product_file_url}`});
        }
        setIsPurchasing(false);
      };
    
      const handleSubmitReview = async () => {
        if (!user) {
          toast({ variant: 'warning', title: 'Login Required', description: 'Please log in to submit a review.' });
          return;
        }
        if (!reviewText.trim()) {
          toast({ variant: 'warning', title: 'Empty Review', description: 'Please write your review.' });
          return;
        }
        setIsSubmittingReview(true);
        // TODO: Implement actual review submission to a 'product_reviews' table
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        toast({ title: 'Review Submitted!', description: 'Thank you for your feedback (simulated).' });
        setIsReviewModalOpen(false);
        setReviewText('');
        setReviewRating(5);
        setIsSubmittingReview(false);
        // fetchProductData(); // Re-fetch to update reviews if implemented
      };
    
      if (isLoading) {
        return <div className="flex justify-center items-center h-[calc(100vh-200px)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
      }
    
      if (error) {
        return (
          <div className="container mx-auto py-10 px-4 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-2xl font-semibold text-destructive mb-2">Could not load product</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => navigate('/')}>Go to Homepage</Button>
          </div>
        );
      }
    
      if (!product) {
        // This case should ideally be handled by the error state if fetch fails
        return <div className="text-center py-10">Product not found. It might have been removed or is no longer active.</div>;
      }
    
      return (
        <div className="container mx-auto py-8 px-4">
          <Button variant="outline" onClick={() => navigate(-1)} className="mb-6 text-muted-foreground hover:text-primary">
            <ArrowLeft size={18} className="mr-2" /> Back
          </Button>
    
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <ProductImageGallery 
              images={images} 
              product={product} 
              activeImageIndex={activeImageIndex} 
              setActiveImageIndex={setActiveImageIndex} 
            />
            <ProductPrimaryDetails 
              product={product}
              seller={seller}
              averageRating={averageRating}
              reviewsCount={reviews.length}
              isPurchasing={isPurchasing}
              onPurchase={handlePurchase}
              user={user}
            />
          </div>
    
          <ProductInformationTabs product={product} />
    
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
            className="mt-12 pt-8 border-t border-border"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-foreground">Customer Reviews ({reviews.length})</h2>
              {user && (
                <Button variant="outline" onClick={() => setIsReviewModalOpen(true)}>
                  <MessageSquare size={16} className="mr-2" /> Write a Review
                </Button>
              )}
            </div>
            {reviews.length === 0 ? (
              <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
            ) : (
              <div className="space-y-6">
                {/* Map through actual reviews here when implemented */}
              </div>
            )}
          </motion.div>
    
          <ProductReviewModal 
            isOpen={isReviewModalOpen}
            onOpenChange={setIsReviewModalOpen}
            productTitle={product.title}
            reviewRating={reviewRating}
            setReviewRating={setReviewRating}
            reviewText={reviewText}
            setReviewText={setReviewText}
            onSubmit={handleSubmitReview}
            isSubmitting={isSubmittingReview}
          />
          
          <RelatedProductsSection 
            currentProductId={product.id} 
            categoryId={product.category_id}
            sellerId={product.seller_id}
          />
    
        </div>
      );
    };
    
    export default DigitalProductPage;