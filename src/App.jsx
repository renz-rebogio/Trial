import React, { Suspense, lazy } from 'react';
    import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
    import Layout from '@/components/layout/Layout';
    import ProtectedRoute from '@/components/ProtectedRoutes';
    import { AuthProvider } from '@/contexts/AuthContext';
    import { Toaster } from '@/components/ui/toaster';
    import { Loader2 } from 'lucide-react';
    
    const HomePage = lazy(() => import('@/pages/HomePage'));
    const AuthPage = lazy(() => import('@/pages/AuthPage'));
    const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
    const MarketplacePage = lazy(() => import('@/pages/MarketplacePage'));
    const AIAssistantPage = lazy(() => import('@/pages/AIAssistantPage'));
    const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
    const SellerOnboardingPage = lazy(() => import('@/pages/sellers/SellerOnboardingPage'));
    const SellerDashboardPage = lazy(() => import('@/pages/sellers/SellerDashboardPage'));
    const ProductListingPage = lazy(() => import('@/pages/sellers/ProductListingPage'));
    const StorefrontPage = lazy(() => import('@/pages/store/StorefrontPage'));
    const DigitalProductPage = lazy(() => import('@/pages/store/DigitalProductPage'));
    const AboutPage = lazy(() => import('@/pages/AboutPage'));
    const FeedPage = lazy(() => import('@/pages/FeedPage'));
    const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
    const MyInvestmentsPage = lazy(() => import('@/pages/MyInvestmentsPage')); 
    const DealMakerPage = lazy(() => import('@/pages/deals/DealMakerPage'));
    const ContractEditorPage = lazy(() => import('@/pages/deals/ContractEditorPage'));
    const AcceptInvitePage = lazy(() => import('@/pages/deals/AcceptInvitePage'));
    const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
    
    // Lazy load legal pages
    const TermsAndConditionsPage = lazy(() => import('@/pages/legal/TermsAndConditionsPage'));
    const PrivacyPolicyPage = lazy(() => import('@/pages/legal/PrivacyPolicyPage'));
    const ServiceLevelAgreementPage = lazy(() => import('@/pages/legal/ServiceLevelAgreementPage'));
    
    
    const CompanyProductsPage = () => {
      return (
        <div className="text-center py-12 container mx-auto">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary mb-6">Company Product Marketplace</h1>
          <p className="text-lg text-muted-foreground mb-8">Discover verified company products, software, and white-label solutions.</p>
          <div className="bg-card p-8 rounded-lg shadow-xl text-center border border-border">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2 text-foreground">Feature Coming Soon!</h2>
            <p className="text-muted-foreground">A dedicated space for verified B2B products and services is under development.</p>
          </div>
           <img  alt="Illustration of gears and cogs meshing together, symbolizing business solutions" className="mx-auto mt-8 w-1/2 max-w-md opacity-70" src="https://images.unsplash.com/photo-1665722651423-7010eeef4c40" />
        </div>
      );
    };
    
    
    const App = () => {
      return (
        <AuthProvider>
          <Router>
            <Layout>
              <Suspense fallback={<div className="flex justify-center items-center h-[calc(100vh-200px)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/accept-invite" element={<AcceptInvitePage />} />
                  
                  <Route path="/company-products" element={<CompanyProductsPage />} />
                  <Route path="/store/:sellerId" element={<StorefrontPage />} />
                  <Route path="/product/:productId" element={<DigitalProductPage />} />
    
                  {/* Legal Pages Routes */}
                  <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                  <Route path="/service-level-agreement" element={<ServiceLevelAgreementPage />} />
                  
                  <Route element={<ProtectedRoute />}>
                    <Route path="/marketplace" element={<MarketplacePage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/my-investments" element={<MyInvestmentsPage />} />
                    <Route path="/ai-assistant" element={<AIAssistantPage />} />
                    <Route path="/deal-maker" element={<DealMakerPage />} />
                    <Route path="/project/:projectId/editor" element={<ContractEditorPage />} />
                    <Route path="/sell-on-boogasi" element={<SellerOnboardingPage />} />
                    <Route path="/seller-dashboard" element={<SellerDashboardPage />} />
                    <Route path="/seller/list-product" element={<ProductListingPage />} />
                    <Route path="/feed" element={<FeedPage />} />
                    <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="admin"><AdminDashboardPage /></ProtectedRoute>} />
                  </Route>
                  
                  <Route path="/404" element={<NotFoundPage />} />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Routes>
              </Suspense>
            </Layout>
            <Toaster />
          </Router>
        </AuthProvider>
      );
    };
    
    export default App;