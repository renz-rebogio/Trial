import React, { useState, useEffect, useCallback } from 'react';
    import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { useToast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/customSupabaseClient';
    import { Shield, Loader2, BadgeCheck, Eye, EyeOff, Clock, Info, Trash2, FileText } from 'lucide-react';
    import {
      Tooltip,
      TooltipContent,
      TooltipProvider,
      TooltipTrigger,
    } from "@/components/ui/tooltip";
    
    import VerificationStepWelcome from '@/components/profile/verification/VerificationStepWelcome';
    import VerificationStepSlider from '@/components/profile/verification/VerificationStepSlider';
    import VerificationStepForm from '@/components/profile/verification/VerificationStepForm';
    import VerificationStepStatus from '@/components/profile/verification/VerificationStepStatus';
    
    const formatCurrency = (value) => {
      if (!value && value !== 0) return '$0';
      if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
      if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
      if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
      return `${value}`;
    };
    
    const InvestmentVerificationSection = ({ user, onVerificationStatusChange }) => {
      const { toast } = useToast();
      const [currentStep, setCurrentStep] = useState(0); 
      
      const [investmentProfile, setInvestmentProfile] = useState(null);
      const [documents, setDocuments] = useState([]); 
    
      const [investmentRangeMax, setInvestmentRangeMax] = useState(1000000); 
      const [badgeVisible, setBadgeVisible] = useState(true);
      
      const [isLoadingProfile, setIsLoadingProfile] = useState(true);
      const [isSavingRange, setIsSavingRange] = useState(false);
      const [deletingDocId, setDeletingDocId] = useState(null);
    
      const fetchInvestmentProfileAndDocuments = useCallback(async () => {
        if (!user) return;
        setIsLoadingProfile(true);
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('investment_profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle(); 
    
          if (profileError && profileError.code !== 'PGRST116') { 
            throw profileError;
          }
          
          setInvestmentProfile(profileData); 
          
          if (profileData) {
            setInvestmentRangeMax(profileData.investment_range_max || 1000000);
            setBadgeVisible(profileData.badge_visible_to_verified_users === null ? true : profileData.badge_visible_to_verified_users);
            
            if (profileData.is_verified || profileData.verification_status === 'pending_review' || profileData.verification_status === 'rejected') {
              setCurrentStep(3); 
            } else if (profileData.investment_range_max && !profileData.verification_status) { 
               setCurrentStep(1); 
            } else if (profileData.id && !profileData.investment_range_max) { 
                setCurrentStep(1); 
            }
            else {
              setCurrentStep(0); 
            }
    
            if (onVerificationStatusChange) {
              onVerificationStatusChange({
                isVerified: profileData.is_verified || false,
                range: profileData.investment_range_max || 0,
                badgeVisible: profileData.badge_visible_to_verified_users === null ? true : profileData.badge_visible_to_verified_users,
                status: profileData.verification_status || 'not_started'
              });
            }
          } else { 
            setCurrentStep(0); 
            setInvestmentRangeMax(1000000);
            setBadgeVisible(true);
            if (onVerificationStatusChange) {
              onVerificationStatusChange({ isVerified: false, range: 0, badgeVisible: true, status: 'not_started' });
            }
          }
    
          const { data: docsData, error: docsError } = await supabase
            .from('verification_documents')
            .select('*')
            .eq('user_id', user.id)
            .neq('document_url', 'MARKED_FOR_DELETION_BY_TRIGGER') 
            .order('upload_date', { ascending: false });
    
          if (docsError) throw docsError;
          setDocuments(docsData || []);
    
        } catch (error) {
          console.error('Error fetching investment data:', error);
          toast({ variant: "destructive", title: "Error", description: "Could not load investment verification data. " + error.message });
        } finally {
          setIsLoadingProfile(false);
        }
      }, [user, toast, onVerificationStatusChange]);
    
      useEffect(() => {
        fetchInvestmentProfileAndDocuments();
      }, [fetchInvestmentProfileAndDocuments]);
    
      const handleRangeSave = async (newRangeMax) => {
        if (!user) return;
        setIsSavingRange(true);
        try {
          const upsertData = {
            user_id: user.id,
            investment_range_min: 1, 
            investment_range_max: newRangeMax,
            verification_status: investmentProfile?.verification_status || 'not_started',
            is_verified: investmentProfile?.is_verified || false,
            badge_visible_to_verified_users: badgeVisible,
            updated_at: new Date().toISOString(),
          };
          if (!investmentProfile) { 
            upsertData.created_at = new Date().toISOString();
          }
    
          const { data, error } = await supabase
            .from('investment_profiles')
            .upsert(upsertData, { onConflict: 'user_id' })
            .select()
            .single(); 
    
          if (error) throw error;
          
          setInvestmentProfile(data);
          setInvestmentRangeMax(data.investment_range_max);
          toast({ title: "Range Saved", description: "Your investment capacity range has been saved." });
          if (onVerificationStatusChange) {
            onVerificationStatusChange({
              isVerified: data.is_verified,
              range: data.investment_range_max,
              badgeVisible: data.badge_visible_to_verified_users,
              status: data.verification_status
            });
          }
        } catch (error) {
          toast({ variant: "destructive", title: "Save Failed", description: error.message || "Could not save investment range." });
        } finally {
          setIsSavingRange(false);
        }
      };
      
      const handleBadgeVisibilityToggle = async () => {
        if (!investmentProfile || !investmentProfile.is_verified) {
          toast({ title: "Not Verified", description: "Badge visibility can only be changed for verified profiles."});
          return;
        }
        const newVisibility = !badgeVisible;
        try {
          const { error } = await supabase
            .from('investment_profiles')
            .update({ badge_visible_to_verified_users: newVisibility })
            .eq('user_id', user.id);
          if (error) throw error;
          setBadgeVisible(newVisibility);
          setInvestmentProfile(prev => ({...prev, badge_visible_to_verified_users: newVisibility}));
          toast({ title: "Visibility Updated", description: `Badge is now ${newVisibility ? 'visible' : 'hidden'} to other verified users.` });
          if (onVerificationStatusChange) {
            onVerificationStatusChange({
              isVerified: investmentProfile.is_verified,
              range: investmentProfile.investment_range_max,
              badgeVisible: newVisibility,
              status: investmentProfile.verification_status
            });
          }
        } catch (error) {
          toast({ variant: "destructive", title: "Update Failed", description: "Could not update badge visibility." });
        }
      };
    
      const handleNextStep = () => {
        if (currentStep === 1 && (!investmentProfile || !investmentProfile.investment_range_max)) {
            toast({ variant: "destructive", title: "Range Not Saved", description: "Please save your investment range before proceeding." });
            return;
        }
        setCurrentStep(prev => Math.min(prev + 1, 3)); 
      };
      const handlePrevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0)); 
      const handleRestart = () => {
        setCurrentStep(0);
        fetchInvestmentProfileAndDocuments(); 
      };

      const handleDeleteDocument = async (docId, docUrl) => {
        if (!window.confirm("Are you sure you want to permanently delete this document? This action cannot be undone.")) {
          return;
        }
        setDeletingDocId(docId);
        try {
          // 1. Delete from storage
          const filePath = docUrl.substring(docUrl.indexOf('/boogasi/') + '/boogasi/'.length);
          const { error: storageError } = await supabase.storage.from('boogasi').remove([filePath]);
          if (storageError && storageError.message !== 'The resource was not found') {
            // We ignore "not found" errors to handle cases where the file is already gone
            throw new Error(`Storage deletion failed: ${storageError.message}`);
          }
    
          // 2. Delete from database
          const { error: dbError } = await supabase.from('verification_documents').delete().eq('id', docId);
          if (dbError) {
            throw new Error(`Database record deletion failed: ${dbError.message}`);
          }
    
          toast({ title: "Document Deleted", description: "The document has been permanently removed." });
          setDocuments(prev => prev.filter(doc => doc.id !== docId));
    
        } catch (error) {
          console.error("Error deleting document:", error);
          toast({ variant: "destructive", title: "Deletion Failed", description: error.message });
        } finally {
          setDeletingDocId(null);
        }
      };
    
      if (isLoadingProfile) {
        return (
          <Card className="shadow-xl min-h-[300px] bg-[hsl(var(--card-bg-bright-purple-tint))]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[hsl(var(--brighter-purple))]"><Shield className="h-5 w-5" /> Boogasi Investor Verification</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center items-center p-10">
              <Loader2 className="h-12 w-12 animate-spin text-[hsl(var(--brighter-purple))]" />
            </CardContent>
          </Card>
        );
      }
    
      const isProfileVerified = investmentProfile?.is_verified || false;
      const verificationStatus = investmentProfile?.verification_status;
    
      let cardHeaderDescription = "Verify your investment capacity to build trust and unlock features.";
      if (isProfileVerified) {
        cardHeaderDescription = `Your investment capacity is verified: ${formatCurrency(investmentProfile.investment_range_max)}.`;
      } else if (verificationStatus === 'pending_review') {
        cardHeaderDescription = "Your verification is currently under review.";
      } else if (verificationStatus === 'rejected') {
        cardHeaderDescription = "Your verification was denied. You can resubmit your information.";
      }
    
    
      return (
        <Card className="shadow-2xl bg-[hsl(var(--card-bg-bright-purple-tint))] backdrop-blur-lg border-[hsl(var(--brighter-purple))]/30">
          <CardHeader className="border-b border-[hsl(var(--brighter-purple))]/30">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl text-primary-foreground">
                  <Shield className="h-7 w-7 text-[hsl(var(--brighter-purple))]" />
                  Boogasi Investor Verification
                </CardTitle>
                <CardDescription className="text-muted-foreground/80 mt-1">
                  {cardHeaderDescription}
                </CardDescription>
              </div>
              {isProfileVerified && (
                <div className="text-right space-y-2 shrink-0">
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[hsl(var(--brighter-green))]/10 border border-[hsl(var(--brighter-green))]/30 shadow-md cursor-default">
                          <BadgeCheck className="h-7 w-7 text-[hsl(var(--brighter-green))]" />
                          <div>
                            <p className="font-semibold text-[hsl(var(--brighter-green))] text-sm">Verified Boogasi Investor</p>
                            <p className="text-xs text-[hsl(var(--brighter-green))]/80">Capacity: {formatCurrency(investmentProfile.investment_range_max)}</p>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-background border-[hsl(var(--brighter-purple))]/30 text-foreground">
                         <p className="flex items-center gap-1.5"><Info className="h-4 w-4 text-[hsl(var(--brighter-purple))]" /> This user has verified their investment capacity with Boogasi. Trust and transparency matter here.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                   <Button variant="ghost" size="sm" onClick={handleBadgeVisibilityToggle} className="w-full text-xs text-muted-foreground hover:text-primary-foreground">
                    {badgeVisible ? <Eye className="mr-1.5 h-3.5 w-3.5" /> : <EyeOff className="mr-1.5 h-3.5 w-3.5" />}
                    {badgeVisible ? 'Badge Visible' : 'Badge Hidden'}
                  </Button>
                </div>
              )}
              {!isProfileVerified && verificationStatus === 'pending_review' && (
                 <div className="text-right space-y-2 shrink-0">
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[hsl(var(--brighter-yellow))]/10 border border-[hsl(var(--brighter-yellow))]/30 shadow-md">
                    <Clock className="h-7 w-7 text-[hsl(var(--brighter-yellow))]" />
                    <div>
                      <p className="font-semibold text-[hsl(var(--brighter-yellow))] text-sm">Verification Pending</p>
                      <p className="text-xs text-[hsl(var(--brighter-yellow))]/80">Under Review</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-2 md:p-4">
            {currentStep === 0 && <VerificationStepWelcome onNext={handleNextStep} />}
            {currentStep === 1 && (
              <VerificationStepSlider 
                investmentRangeMax={investmentRangeMax}
                setInvestmentRangeMax={setInvestmentRangeMax}
                onNext={handleNextStep}
                onSaveRange={handleRangeSave}
                isSavingRange={isSavingRange}
                isVerified={isProfileVerified}
                currentStatus={verificationStatus}
              />
            )}
            {currentStep === 2 && user && (
              <VerificationStepForm 
                user={user}
                investmentProfile={investmentProfile} 
                onNext={handleNextStep}
                onBack={handlePrevStep}
                fetchInvestmentProfile={fetchInvestmentProfileAndDocuments} 
                fetchDocuments={fetchInvestmentProfileAndDocuments} 
              />
            )}
            {currentStep === 3 && (
              <VerificationStepStatus 
                investmentProfile={investmentProfile}
                onRestart={handleRestart}
              />
            )}
          </CardContent>

          {documents.length > 0 && (
            <div className="p-4 md:p-6 border-t border-[hsl(var(--brighter-purple))]/30">
              <h4 className="text-lg font-semibold text-primary-foreground mb-3">Uploaded Documents</h4>
              <div className="space-y-2">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-2 bg-primary/5 rounded-md border border-primary/10">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary/80" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{doc.document_type}</p>
                        <p className="text-xs text-muted-foreground">
                          Uploaded on {new Date(doc.upload_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDeleteDocument(doc.id, doc.document_url)}
                      disabled={deletingDocId === doc.id}
                    >
                      {deletingDocId === doc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(currentStep !== 0 && currentStep !== 3) && ( 
            <CardFooter className="border-t border-[hsl(var(--brighter-purple))]/30 pt-4 mt-6">
              <p className="text-xs text-muted-foreground/70 text-center w-full">
                For assistance, please contact support. All data is handled with strict confidentiality.
              </p>
            </CardFooter>
          )}
        </Card>
      );
    };
    
    export default InvestmentVerificationSection;