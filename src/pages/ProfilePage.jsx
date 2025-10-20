import React, { useState, useEffect, useCallback } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { useAuth } from '@/hooks/useAuth';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useToast } from '@/components/ui/use-toast';
    import ProfileHeader from '@/components/profile/ProfileHeader';
    import AccountDetailsSection from '@/components/profile/AccountDetailsSection';
    import BusinessPlansSection from '@/components/profile/BusinessPlansSection';
    import UserNotesSection from '@/components/profile/UserNotesSection';
    import ProfileCalendar from '@/components/profile/ProfileCalendar';
    import InvestmentVerificationSection from '@/components/profile/InvestmentVerificationSection';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
    import { Button } from '@/components/ui/button';
    import { Calendar, FileText, User, Briefcase, ShieldCheck, Loader2 } from 'lucide-react';
    
    const ProfilePage = () => {
      const { user } = useAuth();
      const navigate = useNavigate();
      const { toast } = useToast();
      const [profile, setProfile] = useState(null);
      const [isEditModalOpen, setIsEditModalOpen] = useState(false);
      const [name, setName] = useState('');
      const [screenName, setScreenName] = useState('');
      const [country, setCountry] = useState('');
      const [stateProvince, setStateProvince] = useState('');
      const [avatarFile, setAvatarFile] = useState(null); // Store the file object
      const [avatarPreview, setAvatarPreview] = useState(null); // Store the preview URL
      const [updatingProfile, setUpdatingProfile] = useState(false);
      const [isLoading, setIsLoading] = useState(true);
    
      const [businessPlans, setBusinessPlans] = useState([]);
      const [isBusinessPlanModalOpen, setIsBusinessPlanModalOpen] = useState(false);
      const [businessPlanTitle, setBusinessPlanTitle] = useState('');
      const [businessPlanContent, setBusinessPlanContent] = useState('');
      const [savingBusinessPlan, setSavingBusinessPlan] = useState(false);
    
      const [investorVerificationInfo, setInvestorVerificationInfo] = useState({
        isVerified: false,
        range: 0,
        badgeVisible: true,
        status: 'not_started', 
      });
    
    
      const fetchProfileData = useCallback(async () => {
        if (!user) {
          setIsLoading(false);
          return;
        }
        setIsLoading(true);
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();
    
          if (profileError && profileError.code !== 'PGRST116') { // PGRST116: no rows found, which is fine for new users
             throw profileError;
          }
          
          if (profileData) {
            setProfile(profileData);
            setName(profileData.name || '');
            setScreenName(profileData.screen_name || '');
            setCountry(profileData.country || '');
            setStateProvince(profileData.state_province || '');
            setAvatarPreview(profileData.avatar_url ? `${profileData.avatar_url}?t=${new Date().getTime()}` : null);
          } else if (user) {
            // Pre-fill from auth if profile is empty
            setName(user.user_metadata?.name || '');
            setScreenName(user.user_metadata?.screen_name || '');
            setAvatarPreview(user.user_metadata?.avatar_url ? `${user.user_metadata?.avatar_url}?t=${new Date().getTime()}` : null);
          }
    
    
          const { data: plansData, error: plansError } = await supabase
            .from('user_notes') 
            .select('*')
            .eq('user_id', user.id)
            .eq('type', 'business_plan') 
            .order('created_at', { ascending: false });
    
          if (plansError) throw plansError;
          setBusinessPlans(plansData || []);
    
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Error fetching profile data",
            description: error.message
          });
        } finally {
          setIsLoading(false);
        }
      }, [user, toast]);
    
      useEffect(() => {
        fetchProfileData();
      }, [fetchProfileData]);
      
    
      const handleAvatarChange = (event) => {
        const file = event.target.files[0];
        if (file) {
          setAvatarFile(file);
          setAvatarPreview(URL.createObjectURL(file));
        }
      };
    
      const handleProfileUpdate = async () => {
        if (!user) return;
        setUpdatingProfile(true);
        let newAvatarUrl = profile?.avatar_url;
    
        try {
          if (avatarFile) {
            const fileExt = avatarFile.name.split('.').pop();
            const filePath = `avatars/${user.id}/${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
              .from('boogasi')
              .upload(filePath, avatarFile, { cacheControl: '0', upsert: true });
            
            if (uploadError) throw uploadError;
            
            const { data: { publicUrl } } = supabase.storage.from('boogasi').getPublicUrl(filePath);
            newAvatarUrl = `${publicUrl}?t=${new Date().getTime()}`; // Add timestamp for cache busting
          }
    
          const updates = {
            name,
            screen_name: screenName,
            country,
            state_province: stateProvince,
            avatar_url: newAvatarUrl,
            updated_at: new Date().toISOString(),
          };
          
          // Check if profile exists to decide on upsert or update
          const { data: existingProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('user_id', user.id)
            .single();
    
          if (fetchError && fetchError.code !== 'PGRST116') throw fetchError; // Handle actual errors
    
          if (existingProfile) {
             const { error } = await supabase.from('profiles').update(updates).eq('user_id', user.id);
             if (error) throw error;
          } else {
            // Insert new profile if one doesn't exist
            const { error } = await supabase.from('profiles').insert({ ...updates, user_id: user.id, id: user.id, email: user.email });
            if (error) throw error;
          }
    
    
          setProfile(prev => ({ ...(prev || {}), ...updates, avatar_url: newAvatarUrl }));
          setAvatarPreview(newAvatarUrl); // Update preview with potentially new URL
          setAvatarFile(null); // Clear the file after upload
          setIsEditModalOpen(false);
          toast({ title: "Profile Updated", description: "Your profile has been updated successfully." });
        } catch (error) {
          toast({ variant: "destructive", title: "Error updating profile", description: error.message });
        } finally {
          setUpdatingProfile(false);
        }
      };
    
      const handleSaveBusinessPlan = async () => {
        if (!businessPlanTitle.trim()) {
          toast({ variant: "destructive", title: "Title is required for business plan." });
          return;
        }
        setSavingBusinessPlan(true);
        try {
          const planData = {
            user_id: user.id,
            title: businessPlanTitle,
            content: { text: businessPlanContent }, 
            type: 'business_plan', 
            updated_at: new Date().toISOString(),
          };
    
          const { error } = await supabase.from('user_notes').insert(planData);
          if (error) throw error;
    
          toast({ title: "Business Plan Saved" });
          setIsBusinessPlanModalOpen(false);
          setBusinessPlanTitle('');
          setBusinessPlanContent('');
          fetchProfileData(); 
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Error saving business plan",
            description: error.message,
          });
        } finally {
          setSavingBusinessPlan(false);
        }
      };
      
      const handleVerificationStatusChange = useCallback((statusInfo) => {
        setInvestorVerificationInfo(statusInfo);
      }, []);
    
    
      if (isLoading && !profile) { // Show loader only if profile isn't loaded yet and isLoading is true
        return (
          <div className="flex justify-center items-center h-[calc(100vh-200px)] brighter-theme-area">
            <Loader2 className="h-16 w-16 animate-spin text-[hsl(var(--brighter-text-primary))]" />
          </div>
        );
      }
    
      if (!user && !isLoading) { 
        navigate('/auth?redirect=/profile');
        toast({title: "Login Required", description: "Please log in to view your profile.", variant: "destructive"});
        return null;
      }
      
      return (
        <div className="min-h-screen brighter-theme-area">
          <ProfileHeader
            profile={profile || { name: user?.user_metadata?.name || '', screen_name: user?.user_metadata?.screen_name || '', avatar_url: user?.user_metadata?.avatar_url }}
            user={user}
            avatarPreview={avatarPreview}
            isEditModalOpen={isEditModalOpen}
            setIsEditModalOpen={setIsEditModalOpen}
            name={name}
            setName={setName}
            screenName={screenName}
            setScreenName={setScreenName}
            country={country}
            setCountry={setCountry}
            stateProvince={stateProvince}
            setStateProvince={setStateProvince}
            handleAvatarChange={handleAvatarChange}
            handleProfileUpdate={handleProfileUpdate}
            updatingProfile={updatingProfile}
            investorVerificationInfo={investorVerificationInfo} 
          />
    
          <div className="container mx-auto px-2 sm:px-4 py-6">
            <Tabs defaultValue="verification" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 shadow-lg backdrop-blur-sm">
                <TabsTrigger value="verification">
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Verification
                </TabsTrigger>
                <TabsTrigger value="calendar">
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendar
                </TabsTrigger>
                <TabsTrigger value="notes">
                  <FileText className="h-4 w-4 mr-2" />
                  Notes
                </TabsTrigger>
                <TabsTrigger value="account">
                  <User className="h-4 w-4 mr-2" />
                  Account
                </TabsTrigger>
                <TabsTrigger value="business">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Business Plans
                </TabsTrigger>
              </TabsList>
    
              <TabsContent value="verification" className="space-y-6 p-4 md:p-6 rounded-lg shadow-xl backdrop-blur-sm">
                {user && <InvestmentVerificationSection user={user} onVerificationStatusChange={handleVerificationStatusChange} />}
              </TabsContent>
    
              <TabsContent value="calendar" className="space-y-6 p-4 md:p-6 rounded-lg shadow-xl backdrop-blur-sm">
                {user && <ProfileCalendar user={user} />}
              </TabsContent>
    
              <TabsContent value="notes" className="space-y-6 p-4 md:p-6 rounded-lg shadow-xl backdrop-blur-sm">
                {user && <UserNotesSection user={user} />}
              </TabsContent>
    
              <TabsContent value="account" className="space-y-6 p-4 md:p-6 rounded-lg shadow-xl backdrop-blur-sm">
                {user && profile && <AccountDetailsSection user={user} profile={profile} />}
                 {user && !profile && !isLoading && <p className="text-center text-muted-foreground">Loading account details or create profile...</p>}
              </TabsContent>
    
              <TabsContent value="business" className="space-y-6 p-4 md:p-6 rounded-lg shadow-xl backdrop-blur-sm">
                {user && (
                  <BusinessPlansSection
                    businessPlans={businessPlans}
                    isBusinessPlanModalOpen={isBusinessPlanModalOpen}
                    setIsBusinessPlanModalOpen={setIsBusinessPlanModalOpen}
                    businessPlanTitle={businessPlanTitle}
                    setBusinessPlanTitle={setBusinessPlanTitle}
                    businessPlanContent={businessPlanContent}
                    setBusinessPlanContent={setBusinessPlanContent}
                    handleSaveBusinessPlan={handleSaveBusinessPlan}
                    savingBusinessPlan={savingBusinessPlan}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      );
    };
    
    export default ProfilePage;