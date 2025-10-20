import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import AuthPage from '@/pages/AuthPage';

const AcceptInvitePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [status, setStatus] = useState('loading'); // loading, authenticating, processing, success, error
  const [message, setMessage] = useState('Verifying your invitation...');
  const [token, setToken] = useState(null);

  useEffect(() => {
    const inviteToken = searchParams.get('token');
    if (!inviteToken) {
      setStatus('error');
      setMessage('No invitation token found. Please use the link from your email.');
      return;
    }
    setToken(inviteToken);
  }, [searchParams]);

  useEffect(() => {
    if (authLoading || !token) return;

    if (!user) {
      setStatus('authenticating');
      setMessage('Please log in or create an account to accept your invitation.');
    } else {
      setStatus('processing');
      setMessage('Processing your invitation...');
      acceptInvitation();
    }
  }, [user, authLoading, token]);

  const acceptInvitation = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-and-accept-invite', {
        body: { token },
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      setStatus('success');
      setMessage(`Successfully joined the project! Redirecting you now...`);
      toast({
        title: 'Invitation Accepted!',
        description: 'You have been added to the project.',
      });
      setTimeout(() => {
        navigate(`/project/${data.projectId}/editor`);
      }, 2000);

    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'An unknown error occurred.');
      toast({
        variant: 'destructive',
        title: 'Failed to Accept Invitation',
        description: err.message,
      });
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-8 w-8 animate-spin text-primary" />;
      case 'processing':
        return (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p>{message}</p>
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle className="h-8 w-8 text-green-500 mb-4" />
            <p>{message}</p>
          </>
        );
      case 'error':
        return (
          <>
            <AlertTriangle className="h-8 w-8 text-destructive mb-4" />
            <p>{message}</p>
            <Button onClick={() => navigate('/')} className="mt-4">Go to Homepage</Button>
          </>
        );
      case 'authenticating':
        return (
          <div className="w-full max-w-md">
            <p className="text-center mb-4">{message}</p>
            <AuthPage isModal={true} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-12 flex justify-center">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader>
          <CardTitle>Accept Project Invitation</CardTitle>
          <CardDescription>Welcome to Boogasi Deal Maker</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center min-h-[200px]">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvitePage;