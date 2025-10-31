import React, { useState, useEffect } from 'react';
    import { supabase } from '@/lib/customSupabaseClient';
    import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { Button } from '@/components/ui/button';
    import { useToast } from '@/components/ui/use-toast';
    import { Users, Loader2, Send, CheckCircle, Clock, UserPlus } from 'lucide-react';
    import InviteParticipantsForm from '@/components/deals/InviteParticipantsForm';
    import {
      Tooltip,
      TooltipContent,
      TooltipProvider,
      TooltipTrigger,
    } from "@/components/ui/tooltip";
    
    const ParticipantsPanel = ({ project, participants, signatures, onlineUsers, isCreator, onParticipantsUpdate }) => {
      const { toast } = useToast();
      const [isRequesting, setIsRequesting] = useState(false);
    
      const handleRequestSignatures = async () => {
        setIsRequesting(true);
        const { error } = await supabase.functions.invoke('request-signatures', {
          body: { projectId: project.id },
        });
        setIsRequesting(false);
        if (error) {
          toast({ title: 'Error', description: `Failed to send requests: ${error.message}`, variant: 'destructive' });
        } else {
          toast({ title: 'Success', description: 'Signature requests have been sent to all pending signers.' });
        }
      };
    
      const getParticipantStatus = (participant) => {
        if (participant.role !== 'Signer') {
          return { text: 'Not Required', icon: <span className="text-xs text-muted-foreground/80">-</span>, color: 'text-muted-foreground' };
        }
        const hasSigned = signatures.some(sig => sig.participant_id === participant.id);
        if (hasSigned) {
          return { text: 'Signed', icon: <CheckCircle className="h-4 w-4 text-green-500" />, color: 'text-green-500' };
        }
        return { text: 'Pending', icon: <Clock className="h-4 w-4 text-yellow-500" />, color: 'text-yellow-500' };
      };
    
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users /> Participants</CardTitle>
            <CardDescription>Manage and view project participants.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {participants.map(p => {
                const status = getParticipantStatus(p);
                const isOnline = onlineUsers.some(online => online.user_id === p.profiles.user_id);
                return (
                  <div key={p.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="relative">
                              <Avatar>
                                <AvatarImage src={p.profiles.avatar_url} alt={p.profiles.name} />
                                <AvatarFallback>{p.profiles.name?.[0] || 'U'}</AvatarFallback>
                              </Avatar>
                              {isOnline && <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-card" />}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{isOnline ? 'Online' : 'Offline'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <div>
                        <p className="font-medium text-sm">{p.profiles.name}</p>
                        <p className="text-xs text-muted-foreground">{p.role}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-semibold ${status.color}`}>
                      {status.icon}
                      <span>{status.text}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {isCreator && (
              <>
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><UserPlus className="h-4 w-4" /> Invite New Participant</h4>
                  <InviteParticipantsForm projectId={project.id} onInvitationSent={onParticipantsUpdate} />
                </div>
                <div className="border-t pt-4">
                  <Button onClick={handleRequestSignatures} disabled={isRequesting} className="w-full">
                    {isRequesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Request Signatures
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      );
    };
    
    export default ParticipantsPanel;