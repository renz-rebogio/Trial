import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Send } from 'lucide-react';

const inviteSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  role: z.enum(["Signer", "Reviewer", "Observer", "Legal Counsel", "Decision Maker"], {
    errorMap: () => ({ message: "Please select a role." }),
  }),
});

const InviteParticipantsForm = ({ projectId, onInvitationSent }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, control, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(inviteSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const { data: responseData, error } = await supabase.functions.invoke('send-invite', {
        body: { 
          invited_email: data.email,
          project_id: projectId,
          role: data.role,
        },
      });

      if (error) throw new Error(error.message);
      if (responseData.error) throw new Error(responseData.error);

      toast({
        title: "Invitation Sent!",
        description: `An invitation to join as ${data.role} has been sent to ${data.email}.`,
      });
      reset();
      if (onInvitationSent) onInvitationSent();
    } catch (error) {
      console.error("Invitation error:", error);
      toast({
        variant: "destructive",
        title: "Failed to Send Invitation",
        description: error.message || "An unexpected error occurred. The user might already be part of the project.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const roles = ["Signer", "Reviewer", "Observer", "Legal Counsel", "Decision Maker"];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email-invite">Participant's Email</Label>
        <Input
          id="email-invite"
          type="email"
          placeholder="collaborator@example.com"
          {...register("email")}
          className={errors.email ? 'border-destructive' : ''}
        />
        {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="role-select">Role</Label>
        <Select onValueChange={(value) => setValue("role", value)}>
            <SelectTrigger id="role-select" className={errors.role ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
                {roles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
            </SelectContent>
        </Select>
        {errors.role && <p className="text-sm text-destructive mt-1">{errors.role.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
        Send Invite
      </Button>
    </form>
  );
};

export default InviteParticipantsForm;