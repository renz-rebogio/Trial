import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
// import { supabase } from '@/lib/supabase'; // Supabase disconnected
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ShoppingBag, ExternalLink, Filter, Star, Package } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

const StorefrontPage = () => {
  const { sellerId } = useParams();
  const { toast } = useToast();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    const fetchStorefrontData = async () => {
      setIsLoading(true);
      try {
        // Simulate storefront data as Supabase is disconnected
        const mockSellerData = { id: sellerId, company_name: `Mock Seller ${sellerId}`, website_portfolio: 'https://example.com', user_id: `user_${sellerId}`, status: 'active' };
        setSeller(mockSellerData);

        const mockProductsData = [
          { id: 'prodA', seller_id: sellerId, status: 'active', title: 'Product Alpha', digital_product_categories: { name: 'Tools' }, digital_product_images: [{image_url: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f', alt_text: 'Alpha'}], short_description: 'A great tool for various tasks.', price: 19.99 },
          { id: 'prodB', seller_id: sellerId, status: 'active', title: 'Product Beta', digital_product_categories: { name: 'Services' }, digital_product_images: [{image_url: 'https://images.unsplash.com/photo-1573496774439-c9a7a1a8a2c7', alt_text: 'Beta'}], short_description: 'An excellent service offering.', price: 99.00 },
        ];
        setProducts(mockProductsData);
        
        const uniqueCategories = [...new Set(mockProductsData.map(p => p.digital_product_categories?.name).filter(Boolean))];
        setCategories(uniqueCategories);
        toast({ title: "Supabase Disconnected", description: "Displaying sample storefront data.", variant: "info" });

        // Original Supabase logic:
        // const { data: sellerData, error: sellerError } = await supabase.from('sellers').select('...').eq('id', sellerId).eq('status', 'active').single();
        // if (sellerError || !sellerData) throw sellerError || new Error('Seller not found or not active.');
        // setSeller(sellerData);
        // const { data: productData, error: productError } = await supabase.from('digital_products').select('...').eq('seller_id', sellerData.id).eq('status', 'active').order('created_at', { ascending: false });
        // if (productError) throw productError;
        // setProducts(productData || []);
        // const uniqueCategories = [...new Set(productData.map(p => p.digital_product_categories?.name).filter(Boolean))];
        // setCategories(uniqueCategories);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error loading storefront', description: error.message });
      } finally {
        setIsLoading(false);
      }
    };

    if (sellerId) {
      fetchStorefrontData();
    }
  }, [sellerId, toast]);

  const filteredProducts = selectedCategory 
    ? products.filter(p => p.digital_product_categories?.name === selectedCategory)
    : products;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5 },
    }),
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!seller) {
    return <div className="text-center py-10 text-xl">Seller storefront not found or is not active.</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl sm:text-5xl font-bold mb-3">{seller.company_name}'s Storefront</h1>
        {seller.website_portfolio && (
          <a 
            href={seller.website_portfolio} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-primary hover:underline inline-flex items-center"
          >
            Visit Website <ExternalLink className="ml-1 h-4 w-4" />
          </a>
        )}
      </motion.div>

      {products.length > 0 && categories.length > 1 && (
        <div className="mb-8 flex items-center gap-2">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 border rounded-md bg-background text-foreground focus:ring-primary focus:border-primary"
          >
            <option value="">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      )}

      {filteredProducts.length === 0 && !isLoading && (
        <div className="text-center py-10">
          <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No products found</h2>
          <p className="text-muted-foreground">
            {selectedCategory ? `No products in ${selectedCategory}. Try another category.` : 'This seller has not listed any products yet or they are pending approval.'}
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product, index) => (
          <motion.div key={product.id} custom={index} variants={cardVariants} initial="hidden" animate="visible">
            <Card className="h-full flex flex-col overflow-hidden shadow-lg hover:shadow-primary/30 transition-all duration-300 ease-out glassmorphic-card-hover">
              <Link to={`/product/${product.id}`} className="block">
                {product.digital_product_images && product.digital_product_images.length > 0 ? (
                  <div className="w-full h-56 overflow-hidden">
                    <img-replace 
                      src={product.digital_product_images[0].image_url} 
                      alt={product.digital_product_images[0].alt_text || product.title} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                    />
                  </div>
                ) : (
                  <div className="w-full h-56 bg-muted flex items-center justify-center">
                    <Package className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </Link>
              <CardHeader className="pb-3">
                <Link to={`/product/${product.id}`}>
                  <CardTitle className="text-xl leading-tight hover:text-primary transition-colors">{product.title}</CardTitle>
                </Link>
                {product.digital_product_categories?.name && (
                  <span className="text-xs py-0.5 px-1.5 rounded-full bg-secondary/20 text-secondary font-medium inline-block mt-1">
                    {product.digital_product_categories.name}
                  </span>
                )}
              </CardHeader>
              <CardContent className="flex-grow">
                <CardDescription className="text-sm line-clamp-3 h-[60px]">{product.short_description}</CardDescription>
                <div className="mt-3 flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                  ))}
                  <span className="ml-1 text-xs text-muted-foreground">(10+ reviews)</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center p-4 border-t">
                <p className="text-xl font-bold text-primary">${product.price}</p>
                <Button asChild size="sm">
                  <Link to={`/product/${product.id}`}>
                    View Product
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
      <footer className="mt-16 text-center text-sm text-muted-foreground">
        Powered by Boogasi
      </footer>
    </div>
  );
};

export default StorefrontPage;