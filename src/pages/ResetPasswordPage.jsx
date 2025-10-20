import React, { useState, useEffect } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { supabase } from '@/lib/customSupabaseClient';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
    import { Loader2, KeyRound } from 'lucide-react';
    import { useToast } from '@/components/ui/use-toast';
    import { motion } from 'framer-motion';
    
    const ResetPasswordPage = () => {
      const [password, setPassword] = useState('');
      const [confirmPassword, setConfirmPassword] = useState('');
      const [loading, setLoading] = useState(false);
      const [message, setMessage] = useState('');
      const [error, setError] = useState('');
      const navigate = useNavigate();
      const { toast } = useToast();
    
      // This effect handles the session update after password reset
      // Supabase automatically signs in the user after a successful password update via recovery link
      useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY') {
            // The user is now signed in. You can redirect them or update UI.
            // No explicit navigation here, as the form submission will handle it.
          }
        });
        return () => subscription.unsubscribe();
      }, []);
    
    
      const handlePasswordReset = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
    
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          toast({ variant: 'destructive', title: 'Error', description: 'Passwords do not match.' });
          return;
        }
        if (password.length < 8) {
          setError('Password must be at least 8 characters long.');
          toast({ variant: 'destructive', title: 'Error', description: 'Password must be at least 8 characters long.' });
          return;
        }
    
        setLoading(true);
        try {
          // The access_token is in the URL fragment when the user clicks the reset link.
          // Supabase JS client handles this automatically when updateUser is called.
          const { error: updateError } = await supabase.auth.updateUser({ password });
    
          if (updateError) throw updateError;
    
          setMessage('Password updated successfully! You can now log in with your new password.');
          toast({ title: 'Success', description: 'Password updated successfully!' });
          setTimeout(() => navigate('/auth?type=login'), 3000); // Redirect to login after a delay
        } catch (err) {
          setError(err.message);
          toast({ variant: 'destructive', title: 'Error updating password', description: err.message });
        } finally {
          setLoading(false);
        }
      };
    
      return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="w-full max-w-md"
          >
            <Card className="shadow-2xl">
              <CardHeader className="text-center">
                <div className="flex justify-center items-center mb-4">
                  <KeyRound className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                  Set New Password
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Enter your new password below.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordReset} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  {message && <p className="text-sm text-green-600">{message}</p>}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Update Password
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      );
    };
    
    export default ResetPasswordPage;