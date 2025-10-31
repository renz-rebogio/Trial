import React, { useState, useEffect, useCallback } from 'react';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useToast } from '@/components/ui/use-toast';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Loader2, CheckCircle, XCircle, FileText, User, ExternalLink, RefreshCw } from 'lucide-react';
    import { formatDistanceToNow } from 'date-fns';
    
    const VerificationManagement = () => {
      const [requests, setRequests] = useState([]);
      const [isLoading, setIsLoading] = useState(true);
      const [isProcessing, setIsProcessing] = useState(null); // store ID of request being processed
      const { toast } = useToast();
    
      const fetchRequests = useCallback(async () => {
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from('verification_documents')
            .select(`
              *,
              profiles:user_id (
                name,
                email,
                screen_name,
                investment_profiles:investment_profiles!user_id(investment_range_max, applicant_type)
              )
            `)
            .eq('verification_status', 'pending_review')
            .order('upload_date', { ascending: true });
    
          if (error) throw error;
    
          const groupedRequests = data.reduce((acc, doc) => {
            if (!acc[doc.user_id]) {
              acc[doc.user_id] = {
                user_id: doc.user_id,
                profile: doc.profiles,
                documents: [],
                submitted_at: doc.upload_date, 
              };
            }
            acc[doc.user_id].documents.push(doc);
            if (new Date(doc.upload_date) < new Date(acc[doc.user_id].submitted_at)) {
                acc[doc.user_id].submitted_at = doc.upload_date;
            }
            return acc;
          }, {});
    
          setRequests(Object.values(groupedRequests));
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error fetching requests', description: error.message });
        } finally {
          setIsLoading(false);
        }
      }, [toast]);
    
      useEffect(() => {
        fetchRequests();
      }, [fetchRequests]);
    
      const handleVerification = async (userId, newStatus) => {
        setIsProcessing(userId);
        try {
          // Update investment_profiles table
          const { error: profileError } = await supabase
            .from('investment_profiles')
            .update({
              verification_status: newStatus,
              is_verified: newStatus === 'approved',
              verification_date: new Date().toISOString()
            })
            .eq('user_id', userId);
    
          if (profileError) throw new Error(`Profile update failed: ${profileError.message}`);
    
          // Update verification_documents table
          const { error: docsError } = await supabase
            .from('verification_documents')
            .update({ verification_status: newStatus, verified_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('verification_status', 'pending_review');
    
          if (docsError) throw new Error(`Documents update failed: ${docsError.message}`);
    
          toast({ title: 'Success', description: `User verification has been ${newStatus}.` });
          fetchRequests(); // Refresh the list
    
        } catch (error) {
          toast({ variant: 'destructive', title: 'Action Failed', description: error.message });
        } finally {
          setIsProcessing(null);
        }
      };
    
      if (isLoading) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /> <span className="ml-2">Loading verification requests...</span></div>;
      }
    
      return (
        <Card className="shadow-lg bg-card/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Investor Verification Queue</CardTitle>
              <CardDescription>Review and process pending investor verification requests.</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={fetchRequests} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No pending verification requests. Great job!</p>
            ) : (
              <div className="space-y-4">
                {requests.map(req => (
                  <div key={req.user_id} className="border p-4 rounded-lg bg-background/50">
                    <div className="flex flex-col sm:flex-row justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <User className="h-5 w-5 text-primary"/>
                            {req.profile?.name || req.profile?.screen_name || 'Unnamed User'}
                        </h3>
                        <p className="text-sm text-muted-foreground">{req.profile?.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">Submitted: {formatDistanceToNow(new Date(req.submitted_at), { addSuffix: true })}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-3 sm:mt-0">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-green-500 text-green-500 hover:bg-green-500/10 hover:text-green-400"
                          onClick={() => handleVerification(req.user_id, 'approved')}
                          disabled={isProcessing === req.user_id}
                        >
                          {isProcessing === req.user_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-red-500 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                          onClick={() => handleVerification(req.user_id, 'rejected')}
                          disabled={isProcessing === req.user_id}
                        >
                           {isProcessing === req.user_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                          Deny
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4 border-t pt-4">
                      <h4 className="font-medium mb-2">Submitted Documents:</h4>
                      <ul className="space-y-2">
                        {req.documents.map(doc => (
                          <li key={doc.id} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded-md">
                            <span className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              {doc.document_type}
                            </span>
                            <a href={doc.document_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                              View Document <ExternalLink className="h-3 w-3" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      );
    };
    
    export default VerificationManagement;