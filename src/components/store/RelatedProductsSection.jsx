import React, { useState, useEffect } from 'react';
    import { motion } from 'framer-motion';
    import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Link } from 'react-router-dom';
    import { supabase } from '@/lib/customSupabaseClient';
    import { Package, Loader2, AlertTriangle } from 'lucide-react';
    
    const RelatedProductsSection = ({ currentProductId, categoryId, sellerId }) => {
      const [relatedProducts, setRelatedProducts] = useState([]);
      const [isLoading, setIsLoading] = useState(true);
      const [error, setError] = useState(null);
    
      useEffect(() => {
        const fetchRelatedProducts = async () => {
          if (!categoryId && !sellerId) {
            setIsLoading(false);
            return;
          }
          setIsLoading(true);
          setError(null);
    
          try {
            let query = supabase
              .from('digital_products')
              .select('id, title, price, short_description, sellers(company_name), digital_product_images(image_url, alt_text)')
              .eq('status', 'active')
              .neq('id', currentProductId) // Exclude the current product
              .limit(4);
    
            if (categoryId) {
              query = query.eq('category_id', categoryId);
            } else if (sellerId) {
              // Fallback to seller if no categoryId, or could be an additional filter
              query = query.eq('seller_id', sellerId);
            }
            
            const { data, error: fetchError } = await query;
    
            if (fetchError) throw fetchError;
            
            setRelatedProducts(data || []);
    
          } catch (err) {
            console.error("Error fetching related products:", err);
            setError("Could not load related products.");
          } finally {
            setIsLoading(false);
          }
        };
    
        fetchRelatedProducts();
      }, [currentProductId, categoryId, sellerId]);
    
      if (isLoading) {
        return (
          <div className="mt-12 lg:mt-16 py-8 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Loading related products...</p>
          </div>
        );
      }
    
      if (error) {
        return (
          <div className="mt-12 lg:mt-16 py-8 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto text-destructive mb-2" />
            <p className="text-destructive">{error}</p>
          </div>
        );
      }
    
      if (relatedProducts.length === 0) {
        return null; // Or a message like "No related products found."
      }
    
      const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i) => ({
          opacity: 1,
          y: 0,
          transition: {
            delay: i * 0.1,
            duration: 0.4,
            ease: "easeOut"
          }
        })
      };
    
      return (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="mt-12 lg:mt-16"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6 md:mb-8">You Might Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {relatedProducts.map((product, index) => (
              <motion.custom
                key={product.id}
                variants={cardVariants}
                custom={index}
                className="flex"
                component={Card} // Using motion.custom with component prop for shadcn Card
              >
                <Card className="w-full flex flex-col bg-card hover:shadow-xl transition-shadow duration-300 border-border">
                  <CardHeader className="p-0">
                    <Link to={`/product/${product.id}`} className="block aspect-video overflow-hidden rounded-t-lg">
                      {product.digital_product_images && product.digital_product_images.length > 0 && product.digital_product_images[0].image_url ? (
                        <img
                          src={product.digital_product_images[0].image_url}
                          alt={product.digital_product_images[0].alt_text || product.title}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Package size={48} className="text-muted-foreground/50" />
                        </div>
                      )}
                    </Link>
                  </CardHeader>
                  <CardContent className="p-4 flex-grow">
                    <CardTitle className="text-lg font-semibold leading-tight mb-1">
                      <Link to={`/product/${product.id}`} className="hover:text-primary transition-colors">
                        {product.title.length > 50 ? `${product.title.substring(0, 47)}...` : product.title}
                      </Link>
                    </CardTitle>
                    {product.sellers && <p className="text-xs text-muted-foreground mb-2">by {product.sellers.company_name}</p>}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.short_description || "No description available."}
                    </p>
                  </CardContent>
                  <CardFooter className="p-4 border-t border-border/50 flex justify-between items-center">
                    <p className="text-xl font-bold text-primary">${parseFloat(product.price).toFixed(2)}</p>
                    <Button asChild size="sm" variant="outline" className="hover:bg-primary hover:text-primary-foreground transition-colors">
                      <Link to={`/product/${product.id}`}>View</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.custom>
            ))}
          </div>
        </motion.div>
      );
    };
    
    export default RelatedProductsSection;