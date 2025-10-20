import React, { useState, useEffect } from 'react';
    import { useForm } from 'react-hook-form';
    import { zodResolver } from '@hookform/resolvers/zod';
    import * as z from 'zod';
    import { useAuth } from '@/hooks/useAuth';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Loader2, UserPlus } from 'lucide-react';
    import { useSearchParams } from 'react-router-dom';
    import { supabase } from '@/lib/customSupabaseClient'; 
    import { useToast } from '@/components/ui/use-toast';
    
    const registerSchema = z.object({
      name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
      screenName: z.string()
        .min(3, { message: 'Screen name must be at least 3 characters.' })
        .max(30, { message: 'Screen name cannot exceed 30 characters.' })
        .regex(/^[a-zA-Z0-9_]+$/, { message: 'Screen name can only contain letters, numbers, and underscores.' }),
      email: z.string().email({ message: 'Invalid email address.' }),
      password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
      company: z.string().min(2, { message: 'Company name is required.' }).optional().or(z.literal('')),
      role: z.string().min(2, { message: 'Your role is required.' }).optional().or(z.literal('')),
      country: z.string().min(2, { message: 'Country is required (e.g., United States).' }).optional().or(z.literal('')),
      stateProvince: z.string().min(2, { message: 'State/Province is required (e.g., California).' }).optional().or(z.literal('')),
    });
    
    const RegisterForm = () => {
      const { register: signUp, loading: authLoading } = useAuth();
      const { toast } = useToast();
      const [searchParams] = useSearchParams();
      const [formError, setFormError] = useState('');
      const [isSubmittingManual, setIsSubmittingManual] = useState(false); 
      const [inviteToken, setInviteToken] = useState(null);
      const [isEmailFromInvite, setIsEmailFromInvite] = useState(false);
    
      const { register, handleSubmit, setError, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(registerSchema),
      });
    
      useEffect(() => {
        const token = searchParams.get('invite_token');
        if (token) {
          setInviteToken(token);
          const fetchInvitation = async () => {
            const { data, error } = await supabase
              .from('project_invitations')
              .select('invited_email')
              .eq('token', token)
              .eq('status', 'pending')
              .single();
    
            if (error || !data) {
              toast({ variant: "destructive", title: "Invalid Invitation", description: "This invitation link is invalid or has expired." });
            } else {
              setValue('email', data.invited_email, { shouldValidate: true });
              setIsEmailFromInvite(true);
              toast({ title: "Invitation Found!", description: `You've been invited! Please complete your registration for ${data.invited_email}.` });
            }
          };
          fetchInvitation();
        }
      }, [searchParams, setValue, toast]);
    
      const onSubmit = async (data) => {
        setFormError('');
        setIsSubmittingManual(true);
        try {
          const { data: existingProfile, error: screenNameCheckError } = await supabase
            .from('profiles')
            .select('screen_name')
            .eq('screen_name', data.screenName)
            .maybeSingle();
    
          if (screenNameCheckError && screenNameCheckError.code !== 'PGRST116') { 
            throw new Error("Could not verify screen name. Please try again.");
          }
          if (existingProfile) {
            setError('screenName', { type: 'manual', message: 'This screen name is already taken.' });
            toast({ variant: "destructive", title: "Registration Failed", description: "Screen name already taken." });
            setIsSubmittingManual(false);
            return;
          }
          
          await signUp(data, inviteToken);
          
        } catch (error) {
          if (error.message.includes("Email rate limit exceeded")) {
            setFormError("Too many registration attempts. Please try again later.");
          } else if (error.message.toLowerCase().includes("user already registered")) {
            setError('email', { type: 'manual', message: 'This email is already registered. Please log in.'});
          } else if (error.message.includes("Screen name already taken")) { 
             setError('screenName', { type: 'manual', message: 'This screen name is already taken.' });
          }
          else {
            setFormError(error.message || 'An unexpected error occurred during registration.');
          }
        } finally {
          setIsSubmittingManual(false);
        }
      };
    
      return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
          <div>
            <Label htmlFor="name-register" className="text-foreground">Full Name</Label>
            <Input id="name-register" {...register('name')} placeholder="e.g., Jane Doe" className="bg-input border-border focus:border-[hsl(var(--brighter-blue))] focus:ring-[hsl(var(--brighter-blue))]" />
            {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="screenName-register" className="text-foreground">Screen Name (Public)</Label>
            <Input id="screenName-register" {...register('screenName')} placeholder="e.g., InvestorPro_123" className="bg-input border-border focus:border-[hsl(var(--brighter-blue))] focus:ring-[hsl(var(--brighter-blue))]" />
            {errors.screenName && <p className="text-sm text-destructive mt-1">{errors.screenName.message}</p>}
          </div>
          <div>
            <Label htmlFor="email-register" className="text-foreground">Email</Label>
            <Input id="email-register" type="email" {...register('email')} placeholder="you@example.com" className="bg-input border-border focus:border-[hsl(var(--brighter-blue))] focus:ring-[hsl(var(--brighter-blue))]" disabled={isEmailFromInvite} />
            {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="password-register" className="text-foreground">Password</Label>
            <Input id="password-register" type="password" {...register('password')} placeholder="Min. 8 characters" className="bg-input border-border focus:border-[hsl(var(--brighter-blue))] focus:ring-[hsl(var(--brighter-blue))]" />
            {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <Label htmlFor="company-register" className="text-foreground">Company (Optional)</Label>
            <Input id="company-register" {...register('company')} placeholder="e.g., Acme Inc." className="bg-input border-border focus:border-[hsl(var(--brighter-blue))] focus:ring-[hsl(var(--brighter-blue))]" />
            {errors.company && <p className="text-sm text-destructive mt-1">{errors.company.message}</p>}
          </div>
          <div>
            <Label htmlFor="role-register" className="text-foreground">Role (Optional)</Label>
            <Input id="role-register" {...register('role')} placeholder="e.g., Founder, Legal Counsel" className="bg-input border-border focus:border-[hsl(var(--brighter-blue))] focus:ring-[hsl(var(--brighter-blue))]" />
            {errors.role && <p className="text-sm text-destructive mt-1">{errors.role.message}</p>}
          </div>
          {formError && <p className="text-sm text-destructive text-center">{formError}</p>}
          <Button type="submit" className="w-full bg-gradient-to-r from-[hsl(var(--brighter-blue))] to-[hsl(var(--brighter-teal))] hover:opacity-90 text-primary-foreground" disabled={isSubmittingManual || authLoading}>
            {(isSubmittingManual || authLoading) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
            Register
          </Button>
        </form>
      );
    };
    
    export default RegisterForm;