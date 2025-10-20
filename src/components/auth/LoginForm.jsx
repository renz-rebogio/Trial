import React, { useState } from 'react';
    import { useForm } from 'react-hook-form';
    import { zodResolver } from '@hookform/resolvers/zod';
    import * as z from 'zod';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { useAuth } from '@/hooks/useAuth';
    import { useNavigate, useLocation, Link } from 'react-router-dom';
    import { Loader2, Eye, EyeOff, MailWarning } from 'lucide-react';
    import { motion } from 'framer-motion';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useToast } from '@/components/ui/use-toast';
    
    const loginSchema = z.object({
      email: z.string().email({ message: "Invalid email address." }),
      password: z.string().min(6, { message: "Password must be at least 6 characters." }),
    });
    
    const LoginForm = () => {
      const [isLoading, setIsLoading] = useState(false);
      const [isResending, setIsResending] = useState(false);
      const [showPassword, setShowPassword] = useState(false);
      const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
      const [unconfirmedEmail, setUnconfirmedEmail] = useState('');
      const { login } = useAuth();
      const { toast } = useToast();
      const navigate = useNavigate();
      const location = useLocation();
      const from = location.state?.from?.pathname || "/profile";
    
      const { register, handleSubmit, formState: { errors }, getValues } = useForm({
        resolver: zodResolver(loginSchema),
      });
    
      const onSubmit = async (data) => {
        setIsLoading(true);
        setEmailNotConfirmed(false);
        try {
          await login(data.email, data.password);
          navigate(from, { replace: true }); 
        } catch (error) {
          if (error.message.toLowerCase().includes("email not confirmed")) {
            setEmailNotConfirmed(true);
            setUnconfirmedEmail(data.email);
          }
          // Error toast is handled in AuthContext, including the one for unconfirmed email
        } finally {
          setIsLoading(false);
        }
      };
    
      const handleResendConfirmation = async () => {
        if (!unconfirmedEmail) return;
        setIsResending(true);
        try {
          const { error } = await supabase.auth.resend({
            type: 'signup',
            email: unconfirmedEmail,
          });
          if (error) throw error;
          toast({
            title: "Confirmation Email Resent!",
            description: `A new confirmation link has been sent to ${unconfirmedEmail}. Please check your inbox and spam folder.`,
            duration: 9000,
          });
          setEmailNotConfirmed(false); // Hide button after successful resend
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Failed to Resend Email",
            description: error.message || "An unexpected error occurred. Please try again later.",
          });
        } finally {
          setIsResending(false);
        }
      };
    
      return (
        <motion.form 
          onSubmit={handleSubmit(onSubmit)} 
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="space-y-2">
            <Label htmlFor="email-login" className="text-foreground">Email</Label>
            <Input 
              id="email-login" 
              type="email" 
              placeholder="you@example.com" 
              {...register("email")}
              className={`bg-input border-border focus:border-[hsl(var(--brighter-blue))] focus:ring-[hsl(var(--brighter-blue))] ${errors.email ? 'border-destructive' : ''}`}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password-login" className="text-foreground">Password</Label>
              <Link to="/auth?type=forgot-password" className="text-sm text-[hsl(var(--brighter-pink))] hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input 
                id="password-login" 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                {...register("password")}
                className={`bg-input border-border focus:border-[hsl(var(--brighter-blue))] focus:ring-[hsl(var(--brighter-blue))] ${errors.password ? 'border-destructive' : ''}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          
          {emailNotConfirmed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full border-yellow-500 text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-400"
                onClick={handleResendConfirmation}
                disabled={isResending}
              >
                {isResending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MailWarning className="mr-2 h-4 w-4" />}
                Resend Confirmation Email
              </Button>
            </motion.div>
          )}
    
          <Button type="submit" className="w-full bg-gradient-to-r from-[hsl(var(--brighter-blue))] to-[hsl(var(--brighter-teal))] hover:opacity-90 transition-opacity duration-300 text-primary-foreground" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Log In
          </Button>
        </motion.form>
      );
    };
    
    export default LoginForm;