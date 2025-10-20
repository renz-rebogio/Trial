import React, { useState } from 'react';
    import { useForm } from 'react-hook-form';
    import { zodResolver } from '@hookform/resolvers/zod';
    import * as z from 'zod';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useAuth } from '@/hooks/useAuth';
    import { useNavigate } from 'react-router-dom';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Textarea } from '@/components/ui/textarea';
    import { Label } from '@/components/ui/label';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
    import { DatePicker } from '@/components/ui/datepicker';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { useToast } from '@/components/ui/use-toast';
    import { Loader2, UploadCloud, FileText, XCircle } from 'lucide-react';
    import { format } from 'date-fns';
    
    const dealSchema = z.object({
      dealName: z.string().min(3, { message: "Deal name must be at least 3 characters." }),
      dealType: z.enum(["NDA", "Investment", "Partnership", "Employment", "Real Estate", "Service"], {
        errorMap: () => ({ message: "Please select a deal type." }),
      }),
      projectDescription: z.string().min(10, { message: "Project description must be at least 10 characters." }),
      targetDate: z.date().optional().nullable(),
      contractMethod: z.enum(["upload", "template", "ai_generate"], {
        errorMap: () => ({ message: "Please select a contract method." }),
      }),
      contractFile: z.custom().optional(),
    });
    
    const NewDealForm = () => {
      const { user } = useAuth();
      const navigate = useNavigate();
      const { toast } = useToast();
      const [isLoading, setIsLoading] = useState(false);
      const [targetDate, setTargetDate] = useState(null);
      const [contractFile, setContractFile] = useState(null);
    
      const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm({
        resolver: zodResolver(dealSchema),
        defaultValues: {
          dealName: '',
          dealType: undefined,
          projectDescription: '',
          targetDate: null,
          contractMethod: undefined,
        }
      });
    
      const selectedContractMethod = watch('contractMethod');
    
      const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
          if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast({ title: "File too large", description: "Please upload a file smaller than 5MB.", variant: "destructive" });
            setContractFile(null);
            setValue('contractFile', null);
            event.target.value = null; // Clear the input
            return;
          }
          if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
            toast({ title: "Invalid file type", description: "Please upload a PDF or DOC file.", variant: "destructive" });
            setContractFile(null);
            setValue('contractFile', null);
            event.target.value = null; // Clear the input
            return;
          }
          setContractFile(file);
          setValue('contractFile', file);
        }
      };
    
      const removeFile = () => {
        setContractFile(null);
        setValue('contractFile', null);
        const fileInput = document.getElementById('contract-file-input');
        if (fileInput) fileInput.value = null;
      }
    
      const onSubmit = async (data) => {
        if (!user || !user.profile || !user.profile.id) {
          toast({ title: "Error", description: "User profile not found. Please re-login.", variant: "destructive" });
          return;
        }
        setIsLoading(true);
        let contractFileUrl = null;
    
        if (data.contractMethod === 'upload' && contractFile) {
          const fileExt = contractFile.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}.${fileExt}`;
          const filePath = `deals_contracts/${fileName}`;
    
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('boogasi') 
            .upload(filePath, contractFile);
    
          if (uploadError) {
            toast({ title: "Upload Error", description: uploadError.message, variant: "destructive" });
            setIsLoading(false);
            return;
          }
          const { data: urlData } = supabase.storage.from('boogasi').getPublicUrl(filePath);
          contractFileUrl = urlData.publicUrl;
        } else if (data.contractMethod === 'template') {
          toast({ title: "Info", description: "Template library coming soon! Proceeding without a contract for now." });
        } else if (data.contractMethod === 'ai_generate') {
          toast({ title: "Info", description: "AI clause generation coming soon! Proceeding without a contract for now." });
        }
        
        const dealData = {
          user_id: user.profile.id,
          deal_name: data.dealName,
          deal_type: data.dealType,
          project_description: data.projectDescription,
          target_date: targetDate ? format(targetDate, 'yyyy-MM-dd') : null,
          contract_method: data.contractMethod,
          contract_file_url: contractFileUrl,
          status: 'draft',
        };
    
        const { data: newDeal, error: insertError } = await supabase
          .from('deals')
          .insert([dealData])
          .select()
          .single();
    
        setIsLoading(false);
    
        if (insertError) {
          toast({ title: "Error creating deal", description: insertError.message, variant: "destructive" });
        } else {
          toast({ title: "Deal Created!", description: `Deal "${newDeal.deal_name}" has been successfully created.` });
          navigate(`/deal-manager/${newDeal.id}/edit`);
        }
      };
      
      const dealTypeOptions = ["NDA", "Investment", "Partnership", "Employment", "Real Estate", "Service"];
    
      return (
        <Card className="shadow-2xl border-border/40 bg-card/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-foreground">Deal Details</CardTitle>
            <CardDescription className="text-muted-foreground">
              Fill in the information below to create your new deal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="dealName" className={errors.dealName ? 'text-destructive' : ''}>Deal Name <span className="text-destructive">*</span></Label>
                <Input id="dealName" {...register("dealName")} className={errors.dealName ? 'border-destructive' : ''} />
                {errors.dealName && <p className="text-xs text-destructive mt-1">{errors.dealName.message}</p>}
              </div>
    
              <div>
                <Label htmlFor="dealType" className={errors.dealType ? 'text-destructive' : ''}>Deal Type <span className="text-destructive">*</span></Label>
                <Select onValueChange={(value) => setValue("dealType", value)} value={watch("dealType")}>
                  <SelectTrigger id="dealType" className={errors.dealType ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select deal type" />
                  </SelectTrigger>
                  <SelectContent>
                    {dealTypeOptions.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.dealType && <p className="text-xs text-destructive mt-1">{errors.dealType.message}</p>}
              </div>
    
              <div>
                <Label htmlFor="projectDescription" className={errors.projectDescription ? 'text-destructive' : ''}>Project Description <span className="text-destructive">*</span></Label>
                <Textarea id="projectDescription" {...register("projectDescription")} rows={4} className={errors.projectDescription ? 'border-destructive' : ''} />
                {errors.projectDescription && <p className="text-xs text-destructive mt-1">{errors.projectDescription.message}</p>}
              </div>
    
              <div>
                <Label htmlFor="targetDate">Target Date (Optional)</Label>
                <DatePicker date={targetDate} setDate={setTargetDate} placeholder="Select target date" />
              </div>
              
              <div className="space-y-3">
                <Label className={errors.contractMethod ? 'text-destructive' : ''}>Start Contract Method <span className="text-destructive">*</span></Label>
                <RadioGroup onValueChange={(value) => setValue("contractMethod", value)} value={watch("contractMethod")} className="flex flex-col sm:flex-row sm:space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="upload" id="upload" />
                    <Label htmlFor="upload">Upload existing contract (PDF/DOC)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="template" id="template" />
                    <Label htmlFor="template">Select from template library</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ai_generate" id="ai_generate" />
                    <Label htmlFor="ai_generate">Use AI to generate clauses</Label>
                  </div>
                </RadioGroup>
                {errors.contractMethod && <p className="text-xs text-destructive mt-1">{errors.contractMethod.message}</p>}
              </div>
    
              {selectedContractMethod === 'upload' && (
                <div className="space-y-2">
                  <Label htmlFor="contract-file-input">Upload Contract File</Label>
                  {contractFile ? (
                    <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="text-sm text-foreground">{contractFile.name}</span>
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={removeFile} className="text-destructive hover:text-destructive/80">
                        <XCircle className="h-5 w-5" />
                      </Button>
                    </div>
                  ) : (
                    <label htmlFor="contract-file-input" className="flex flex-col items-center justify-center w-full h-32 p-5 text-center border-2 border-dashed rounded-lg cursor-pointer border-border hover:border-primary transition-colors">
                        <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Click to upload or drag and drop</span>
                        <span className="text-xs text-muted-foreground/70">PDF or DOC, Max 5MB</span>
                        <Input id="contract-file-input" type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx" />
                    </label>
                  )}
                </div>
              )}
              
              {selectedContractMethod === 'template' && (
                 <div className="p-3 border rounded-md bg-muted/30 text-sm text-muted-foreground">
                  Based on your deal type and description, we’ll generate 3–5 relevant contract clauses. You can edit and insert them into your draft. (Template library coming soon!)
                </div>
              )}
    
              {selectedContractMethod === 'ai_generate' && (
                <div className="p-3 border rounded-md bg-muted/30 text-sm text-muted-foreground">
                  Based on your deal type and description, we’ll generate 3–5 relevant contract clauses. You can edit and insert them into your draft. (AI generation coming soon!)
                </div>
              )}
    
    
              <Button type="submit" size="lg" className="w-full bg-gradient-to-r from-[hsl(var(--boogasi-pink-val))] to-[hsl(var(--boogasi-purple-val))] text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                Continue
              </Button>
            </form>
          </CardContent>
        </Card>
      );
    };
    
    export default NewDealForm;