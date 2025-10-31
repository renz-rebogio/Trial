import React, { useState } from 'react';
    import { useForm } from 'react-hook-form';
    import { zodResolver } from '@hookform/resolvers/zod';
    import * as z from 'zod';
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
    import { Input } from '@/components/ui/input';
    import { Textarea } from '@/components/ui/textarea';
    import { Label } from '@/components/ui/label';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { DatePicker } from '@/components/ui/datepicker';
    import { useToast } from '@/components/ui/use-toast';
    import { Loader2 } from 'lucide-react';
    import { format } from 'date-fns';
    
    const projectSchema = z.object({
      projectName: z.string().min(3, "Project name must be at least 3 characters."),
      caseNumber: z.string().optional(),
      dealType: z.enum(["NDA", "Investment", "Partnership", "Employment", "Real Estate", "Service"], {
        errorMap: () => ({ message: "Please select a deal type." }),
      }),
      description: z.string().min(10, "Description must be at least 10 characters."),
      deadline: z.date().optional().nullable(),
    });
    
    const NewProjectDialog = ({ isOpen, setIsOpen, onProjectCreated }) => {
      const { user } = useAuth();
      const { toast } = useToast();
      const [isLoading, setIsLoading] = useState(false);
      const [deadline, setDeadline] = useState(null);
    
      const { register, handleSubmit, control, setValue, watch, reset, formState: { errors } } = useForm({
        resolver: zodResolver(projectSchema),
      });
    
      const onSubmit = async (data) => {
        if (!user || !user.profile) {
          console.warn('Unauthenticated project creation attempt blocked.', { timestamp: new Date() });
          toast({ title: "Error", description: "You must be logged in to create a project.", variant: "destructive" });
          return;
        }
        setIsLoading(true);
    
        const projectData = {
          user_id: user.profile.id,
          project_name: data.projectName,
          case_number: data.caseNumber,
          deal_type: data.dealType,
          description: data.description,
          deadline: deadline ? format(deadline, 'yyyy-MM-dd') : null,
          status: 'draft',
          created_by: user.id
        };
    
        const { data: newProject, error } = await supabase
          .from('projects')
          .insert(projectData)
          .select()
          .single();
    
        if (error) {
          toast({ title: "Error creating project", description: error.message, variant: "destructive" });
        } else {
          // Also add the creator as a participant with 'Admin' role
          await supabase.from('project_participants').insert({
            project_id: newProject.id,
            user_id: user.profile.id,
            role: 'Admin',
            status: 'accepted'
          });
          toast({ title: "Project Created!", description: `"${newProject.project_name}" is ready.` });
          reset();
          setDeadline(null);
          onProjectCreated();
        }
        setIsLoading(false);
      };
    
      const dealTypeOptions = ["NDA", "Investment", "Partnership", "Employment", "Real Estate", "Service"];
    
      return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create a New Deal</DialogTitle>
              <DialogDescription>
                Fill in the details below to start a new deal project.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="projectName">Project Name <span className="text-destructive">*</span></Label>
                <Input id="projectName" {...register("projectName")} />
                {errors.projectName && <p className="text-sm text-destructive">{errors.projectName.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dealType">Deal Type <span className="text-destructive">*</span></Label>
                <Select onValueChange={(value) => setValue("dealType", value)}>
                  <SelectTrigger><SelectValue placeholder="Select a type..." /></SelectTrigger>
                  <SelectContent>
                    {dealTypeOptions.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.dealType && <p className="text-sm text-destructive">{errors.dealType.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
                <Textarea id="description" {...register("description")} />
                {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="caseNumber">Case Number (Optional)</Label>
                  <Input id="caseNumber" {...register("caseNumber")} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="deadline">Deadline (Optional)</Label>
                  <DatePicker date={deadline} setDate={setDeadline} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Project
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      );
    };
    
    export default NewProjectDialog;