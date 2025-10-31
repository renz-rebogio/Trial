import React, { useRef, useState } from 'react';
    import SignatureCanvas from 'react-signature-canvas';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useAuth } from '@/hooks/useAuth';
    import {
      Dialog,
      DialogContent,
      DialogHeader,
      DialogTitle,
      DialogDescription,
      DialogFooter,
    } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { useToast } from '@/components/ui/use-toast';
    import { Loader2, RefreshCw, Save } from 'lucide-react';
    
    const SignaturePadModal = ({ isOpen, setIsOpen, project, participant, contractVersion, onSignatureSaved }) => {
      const { user } = useAuth();
      const { toast } = useToast();
      const sigPadRef = useRef(null);
      const [isLoading, setIsLoading] = useState(false);
    
      const clearPad = () => {
        sigPadRef.current.clear();
      };
    
      const handleSaveSignature = async () => {
        if (sigPadRef.current.isEmpty()) {
          toast({ title: 'Empty Signature', description: 'Please provide your signature before saving.', variant: 'destructive' });
          return;
        }
    
        setIsLoading(true);
        const signatureData = sigPadRef.current.toDataURL('image/png');
    
        const { error } = await supabase.from('signatures').insert({
          project_id: project.id,
          participant_id: participant.id,
          contract_version_id: contractVersion.id,
          signature_data: { png: signatureData },
        });
    
        setIsLoading(false);
        if (error) {
          toast({ title: 'Error Saving Signature', description: error.message, variant: 'destructive' });
        } else {
          toast({ title: 'Signature Saved!', description: 'Your signature has been securely recorded.' });
          onSignatureSaved();
          setIsOpen(false);
        }
      };
    
      return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Sign Contract</DialogTitle>
              <DialogDescription>
                Please sign in the box below. This signature is legally binding.
              </DialogDescription>
            </DialogHeader>
            <div className="border rounded-lg overflow-hidden">
              <SignatureCanvas
                ref={sigPadRef}
                penColor="hsl(var(--foreground))"
                canvasProps={{ className: 'w-full h-48 bg-muted/30' }}
              />
            </div>
            <DialogFooter className="sm:justify-between">
              <Button variant="outline" onClick={clearPad}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Clear
              </Button>
              <Button onClick={handleSaveSignature} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Confirm and Save Signature
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    };
    
    export default SignaturePadModal;