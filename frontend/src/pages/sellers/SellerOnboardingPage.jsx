import React, { useState, useEffect, useCallback } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { useAuth } from '@/hooks/useAuth';
    import { supabase } from '@/lib/customSupabaseClient';
    import { Button } from '@/components/ui/button';
    import { Loader2, CheckCircle, UserPlus, FileText, LayoutDashboard, Circle, Check } from 'lucide-react';
    import { useToast } from '@/components/ui/use-toast';
    import SellerRegistrationForm from '@/components/sellers/SellerRegistrationForm';
    import DigitalMarketingAgreement from '@/components/sellers/DigitalMarketingAgreement';
    import ProductSubmissionForm from '@/components/sellers/ProductSubmissionForm';
    import { motion } from 'framer-motion';
    
    const steps = [
      { id: 'registration', title: 'Seller Registration', icon: UserPlus },
      { id: 'agreement', title: 'Marketing Agreement', icon: FileText },
      { id: 'first_product', title: 'List First Product', icon: LayoutDashboard },
      { id: 'completed', title: 'Onboarding Complete', icon: CheckCircle },
    ];
    
    const SellerOnboardingPage = () => {
      const { user, loading: authLoading } = useAuth();
      const navigate = useNavigate();
      const { toast } = useToast();
      const [currentStep, setCurrentStep] = useState('registration');
      const [isLoading, setIsLoading] = useState(true);
      const [sellerData, setSellerData] = useState(null);
      const [initialDataLoaded, setInitialDataLoaded] = useState(false);
    
    
      const fetchSellerStatus = useCallback(async () => {
        if (!user || initialDataLoaded) return;
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from('sellers')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle(); // Changed to maybeSingle()
    
          if (error && error.code !== 'PGRST116') { 
            throw error;
          }
          
          setSellerData(data);
    
          if (data) {
            if (data.status === 'pending_approval' || data.status === 'active') {
              const { data: products, error: productError } = await supabase
                .from('digital_products')
                .select('id', { count: 'exact', head: true }) // More efficient way to check for existence
                .eq('seller_id', data.id)
                .limit(1);
    
              if (productError && productError.code !== 'PGRST116') {
                 console.warn("Error checking products:", productError.message);
              }
    
    
              if (products && products.length > 0) { // If products is not null and has items
                setCurrentStep('completed');
              } else if (data.agreed_to_terms_current) { // Check for the correct field from schema
                setCurrentStep('first_product');
              } else {
                setCurrentStep('agreement');
              }
            } else if (data.status === 'pending_agreement') {
              setCurrentStep('agreement');
            } else {
              setCurrentStep('registration'); 
            }
          } else {
            setCurrentStep('registration');
          }
          setInitialDataLoaded(true);
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error fetching seller status', description: error.message });
          setCurrentStep('registration'); 
        } finally {
          setIsLoading(false);
        }
      }, [user, toast, initialDataLoaded]);
    
      useEffect(() => {
        if (!authLoading && user) {
          fetchSellerStatus();
        } else if (!authLoading && !user) {
          navigate('/auth?type=login&redirect=/sell-on-boogasi');
          setIsLoading(false);
        }
      }, [user, authLoading, navigate, fetchSellerStatus]);
    
      const handleNextStep = (updatedSellerData) => {
        setSellerData(updatedSellerData || sellerData); 
        if (currentStep === 'registration') setCurrentStep('agreement');
        else if (currentStep === 'agreement') setCurrentStep('first_product');
        else if (currentStep === 'first_product') setCurrentStep('completed');
      };
      
      const handleRegistrationSuccess = (newSellerData) => {
        setSellerData(newSellerData);
        handleNextStep(newSellerData);
      };
    
      const handleAgreementSuccess = (updatedSellerData) => {
        setSellerData(updatedSellerData);
        handleNextStep(updatedSellerData);
      };
      
      const handleProductSubmissionSuccess = (updatedSellerData) => {
        setSellerData(updatedSellerData); 
        handleNextStep(updatedSellerData);
      };
    
    
      if (isLoading || authLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
      }
    
      const getCurrentStepIndex = () => steps.findIndex(step => step.id === currentStep);
    
      return (
        <div className="container mx-auto py-8 px-4">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Become a Seller on Boogasi</h1>
            <p className="text-lg text-muted-foreground">Follow these steps to start selling your digital products.</p>
          </motion.div>
    
          <div className="max-w-3xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
              {steps.map((step, index) => {
                const currentIdx = getCurrentStepIndex();
                const isCompleted = index < currentIdx;
                const isActive = index === currentIdx;
                const Icon = step.icon;
    
                return (
                  <React.Fragment key={step.id}>
                    <div className={`flex flex-col items-center text-center ${isActive ? 'text-primary' : (isCompleted ? 'text-green-500' : 'text-muted-foreground')}`}>
                      <div className={`p-3 rounded-full border-2 mb-2 transition-all duration-300
                        ${isActive ? 'bg-primary/10 border-primary' : (isCompleted ? 'bg-green-500/10 border-green-500' : 'border-border')}
                      `}>
                        {isCompleted ? <Check className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                      </div>
                      <span className="text-xs sm:text-sm font-medium">{step.title}</span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-1 mx-2 rounded-full transition-all duration-500 ${
                        isCompleted || (isActive && index < currentIdx) ? 'bg-green-500' : 
                        isActive ? 'bg-primary' : 'bg-border'
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
    
            <motion.div 
                key={currentStep}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="p-6 sm:p-8 border rounded-xl shadow-xl bg-card"
            >
              {currentStep === 'registration' && <SellerRegistrationForm onNext={handleRegistrationSuccess} />}
              {currentStep === 'agreement' && sellerData && <DigitalMarketingAgreement sellerData={sellerData} onNext={handleAgreementSuccess} />}
              {currentStep === 'agreement' && !sellerData && (
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">Loading seller details for agreement...</p>
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                </div>
              )}
              {currentStep === 'first_product' && sellerData && <ProductSubmissionForm sellerData={sellerData} onNext={handleProductSubmissionSuccess} />}
               {currentStep === 'first_product' && !sellerData && (
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">Loading seller details for product submission...</p>
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                </div>
              )}
              {currentStep === 'completed' && (
                <div className="text-center py-12">
                  <CheckCircle className="h-24 w-24 text-green-500 mx-auto mb-6" />
                  <h2 className="text-3xl font-semibold mb-4">Onboarding Complete!</h2>
                  <p className="text-muted-foreground mb-8">
                    Congratulations! Your seller account is set up and your first product is listed (or pending approval). You can now manage your store and products from your dashboard.
                  </p>
                  <Button onClick={() => navigate('/seller-dashboard')} size="lg">
                    Go to Seller Dashboard
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      );
    };
    
    export default SellerOnboardingPage;