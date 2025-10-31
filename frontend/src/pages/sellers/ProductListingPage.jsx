import React from 'react';
    import { useNavigate } from 'react-router-dom';
    import ProductSubmissionForm from '@/components/sellers/ProductSubmissionForm';
    import { useAuth } from '@/hooks/useAuth'; 
    import { supabase } from '@/lib/customSupabaseClient';
    import { Loader2 } from 'lucide-react';
    import { useToast } from '@/components/ui/use-toast';
    
    const ProductListingPage = () => {
      const navigate = useNavigate();
      const { user } = useAuth();
      const { toast } = useToast();
      const [sellerData, setSellerData] = React.useState(null);
      const [isLoading, setIsLoading] = React.useState(true);
    
      React.useEffect(() => {
        const fetchSellerData = async () => {
          if (!user) {
            navigate('/auth?type=login&redirect=/seller/list-product');
            setIsLoading(false);
            return;
          }
          setIsLoading(true);
          try {
            const { data, error } = await supabase
              .from('sellers')
              .select('id, status')
              .eq('user_id', user.id)
              .maybeSingle(); // Changed to maybeSingle()
    
            if (error && error.code !== 'PGRST116') { // PGRST116 is handled by maybeSingle returning null
              toast({ variant: 'destructive', title: 'Error fetching seller data', description: error.message });
              navigate('/seller-dashboard');
              return;
            }
            
            if (!data) {
              toast({ variant: 'warning', title: 'Seller Account Not Found', description: 'Please complete your seller registration first.' });
              navigate('/sell-on-boogasi');
              return;
            }
    
            if (data.status !== 'active' && data.status !== 'pending_approval' && data.status !== 'pending_agreement') {
              toast({ variant: 'warning', title: 'Seller Account Inactive', description: 'Your seller account is not active or pending approval. Please complete onboarding.' });
              navigate('/sell-on-boogasi');
              return;
            }
            setSellerData(data);
          } catch (e) {
            toast({ variant: 'destructive', title: 'Failed to load seller data', description: 'An unexpected error occurred.' });
            navigate('/seller-dashboard');
          } finally {
            setIsLoading(false);
          }
        };
        fetchSellerData();
      }, [user, navigate, toast]);
    
      const handleProductSubmitted = (submittedProduct) => {
        toast({ title: "Product Submitted!", description: `${submittedProduct.title} is now pending approval.`});
        navigate('/seller-dashboard'); 
      };
    
      if (isLoading) {
        return (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Loading product form...</p>
          </div>
        );
      }
      
      if (!sellerData) {
         return (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
            <p className="text-lg text-muted-foreground">Seller account not found or not active. Redirecting...</p>
          </div>
        );
      }
    
      return (
        <div className="container mx-auto py-8 px-4">
          <h1 className="text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            List a New Digital Product
          </h1>
          <div className="max-w-3xl mx-auto p-6 sm:p-8 bg-card text-card-foreground rounded-xl shadow-2xl glassmorphic">
            <ProductSubmissionForm sellerData={sellerData} onProductSubmitted={handleProductSubmitted} />
          </div>
        </div>
      );
    };
    
    export default ProductListingPage;