import React, { useState, useEffect } from 'react';
    import { useSearchParams, useNavigate, Navigate } from 'react-router-dom';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import LoginForm from '@/components/auth/LoginForm';
    import RegisterForm from '@/components/auth/RegisterForm';
    import { motion } from 'framer-motion';
    import { Cpu, Mail, Loader2 } from 'lucide-react';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useToast } from '@/components/ui/use-toast';
    import { useAuth } from '@/hooks/useAuth';
    
    const ForgotPasswordForm = () => {
      const [email, setEmail] = useState('');
      const [loading, setLoading] = useState(false);
      const [message, setMessage] = useState('');
      const { toast } = useToast();
      const navigate = useNavigate();
    
      const handlePasswordReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
          });
          if (error) throw error;
          setMessage('Password reset email sent! Please check your inbox.');
          toast({ title: 'Success', description: 'Password reset email sent. Please check your inbox (and spam folder).' });
        } catch (error) {
          setMessage(`Error: ${error.message}`);
          toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
          setLoading(false);
        }
      };
    
      return (
        <motion.form
          onSubmit={handlePasswordReset}
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="space-y-2">
            <Label htmlFor="email-forgot">Email</Label>
            <Input
              id="email-forgot"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {message && <p className={`text-sm ${message.startsWith('Error') ? 'text-destructive' : 'text-[var(--brighter-green-text)]'}`}>{message}</p>}
          <Button type="submit" className="w-full" variant="default" disabled={loading}> {/* Default button variant */}
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
            Send Reset Link
          </Button>
          <Button variant="link" className="w-full" onClick={() => navigate('/auth?type=login')}> {/* Link button variant */}
            Back to Login
          </Button>
        </motion.form>
      );
    };
    
    
    const AuthPage = () => {
      const [searchParams] = useSearchParams();
      const type = searchParams.get('type') || 'login';
      const { user, loading: authLoading } = useAuth();
      const navigate = useNavigate();
    
      useEffect(() => {
        if (!authLoading && user) {
          navigate('/profile', { replace: true });
        }
      }, [user, authLoading, navigate]);
    
      if (authLoading) {
        return (
          <div className="flex justify-center items-center h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-[var(--primary)]" /> {/* Original primary color */}
          </div>
        );
      }
    
      if (user) {
        return <Navigate to="/profile" replace />;
      }
    
      return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)] py-12 brighter-theme-area"> 
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="w-full max-w-md"
          >
            <Card className="shadow-2xl"> 
              <CardHeader className="text-center">
                <div className="flex justify-center items-center mb-4">
                  <Cpu className="h-12 w-12 text-[var(--primary)] animate-pulse" /> {/* Original primary color */}
                </div>
                <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] via-[var(--secondary)] to-[var(--accent)]"> {/* Original accent colors */}
                  {type === 'forgot-password' ? 'Reset Password' : 'Welcome to Boogasi AI'}
                </CardTitle>
                <CardDescription>
                  {type === 'forgot-password' 
                    ? 'Enter your email to receive a password reset link.' 
                    : 'Access your AI-powered investment hub or create an account.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {type === 'forgot-password' ? (
                  <ForgotPasswordForm />
                ) : (
                  <>
                    <Tabs defaultValue={type} className="w-full pt-6">
                      <TabsList className="grid w-full grid-cols-2 mb-6"> 
                        <TabsTrigger value="login">Log In</TabsTrigger> 
                        <TabsTrigger value="register">Sign Up</TabsTrigger>
                      </TabsList>
                      <TabsContent value="login">
                        <LoginForm />
                      </TabsContent>
                      <TabsContent value="register">
                        <RegisterForm />
                      </TabsContent>
                    </Tabs>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      );
    };
    
    export default AuthPage;