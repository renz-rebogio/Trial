import React, { useState } from 'react';
    import { useForm } from 'react-hook-form';
    import { zodResolver } from '@hookform/resolvers/zod';
    import * as z from 'zod';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Textarea } from '@/components/ui/textarea';
    import { Checkbox } from '@/components/ui/checkbox';
    import { useToast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useAuth } from '@/hooks/useAuth';
    import { Loader2, UploadCloud } from 'lucide-react';
    
    const sellerRegistrationSchema = z.object({
      companyName: z.string().min(2, 'Name must be at least 2 characters').max(100),
      contactEmail: z.string().email('Invalid email address'),
      billingAddress: z.string().min(10, 'Billing address is too short').max(200),
      phoneNumber: z.string().min(7, 'Phone number seems too short').max(20),
      websitePortfolio: z.string().url('Invalid URL').optional().or(z.literal('')),
      taxId: z.string().min(5, 'Tax ID seems too short').max(50), // Consider more specific validation based on region if possible
      agreeToTerms: z.boolean().refine(val => val === true, { message: 'You must agree to the terms and conditions.' }),
      digitalSignature: z.string().min(2, 'Signature must be at least 2 characters').max(100),
    });
    
    const BUCKET_NAME = 'boogasi';
    
    const SellerRegistrationForm = ({ onNext }) => {
      const { user } = useAuth();
      const { toast } = useToast();
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [governmentIdFile, setGovernmentIdFile] = useState(null);
      const [taxCertificateFile, setTaxCertificateFile] = useState(null);
    
      const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
        resolver: zodResolver(sellerRegistrationSchema),
        defaultValues: {
          companyName: '', contactEmail: user?.email || '', billingAddress: '', phoneNumber: '',
          websitePortfolio: '', taxId: '', agreeToTerms: false, digitalSignature: '',
        }
      });
    
      const handleFileChange = (setter) => (e) => {
        const file = e.target.files[0];
        if (file) {
          if (file.size > 5 * 1024 * 1024) { 
            toast({ variant: 'destructive', title: 'File too large', description: 'Please upload a file smaller than 5MB.' });
            e.target.value = null; // Clear the input
            return;
          }
          setter(file);
        }
      };
    
      const uploadFile = async (file, pathPrefix) => {
        if (!file || !user) return null;
        
        const fileName = `${pathPrefix}/${user.id}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
        try {
            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(fileName, file);
    
            if (error) throw error;
            
            const { data: publicURLData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);
            return publicURLData.publicUrl;
    
        } catch (error) {
            console.error(`Error uploading ${pathPrefix}:`, error);
            toast({ variant: 'destructive', title: `Upload Failed for ${file.name}`, description: error.message });
            throw error; // Re-throw to be caught by onSubmit
        }
      };
    
      const onSubmit = async (data) => {
        if (!user) {
          toast({ variant: "destructive", title: "Not Authenticated", description: "Please log in to register as a seller." });
          return;
        }
        setIsSubmitting(true);
        try {
          const governmentIdUrl = await uploadFile(governmentIdFile, 'seller-documents/government-ids');
          const taxCertificateUrl = await uploadFile(taxCertificateFile, 'seller-documents/tax-certificates');
    
          const { data: sellerData, error } = await supabase
            .from('sellers')
            .insert({ 
                user_id: user.id,
                company_name: data.companyName,
                contact_email: data.contactEmail,
                billing_address: data.billingAddress,
                phone_number: data.phoneNumber,
                website_portfolio: data.websitePortfolio || null,
                tax_id: data.taxId,
                government_id_url: governmentIdUrl,
                tax_certificate_url: taxCertificateUrl,
                agreed_to_terms: data.agreeToTerms, // This might be better suited for the agreement step
                digital_signature: data.digitalSignature, // Also for agreement step
                status: 'pending_agreement', // Initial status
             })
            .select()
            .single();
    
          if (error) throw error;
          
          toast({ title: 'Registration Step 1 Complete', description: 'Please review and sign the marketing agreement.' });
          onNext(sellerData); 
        } catch (error) {
          toast({ variant: 'destructive', title: 'Registration Failed', description: error.message });
        } finally {
          setIsSubmitting(false);
        }
      };
    
      return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="companyName">Company or Individual Name</Label>
              <Input id="companyName" {...register('companyName')} />
              {errors.companyName && <p className="text-sm text-destructive mt-1">{errors.companyName.message}</p>}
            </div>
            <div>
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input id="contactEmail" type="email" {...register('contactEmail')} />
              {errors.contactEmail && <p className="text-sm text-destructive mt-1">{errors.contactEmail.message}</p>}
            </div>
          </div>
    
          <div>
            <Label htmlFor="billingAddress">Billing Address</Label>
            <Textarea id="billingAddress" {...register('billingAddress')} />
            {errors.billingAddress && <p className="text-sm text-destructive mt-1">{errors.billingAddress.message}</p>}
          </div>
    
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input id="phoneNumber" type="tel" {...register('phoneNumber')} />
              {errors.phoneNumber && <p className="text-sm text-destructive mt-1">{errors.phoneNumber.message}</p>}
            </div>
            <div>
              <Label htmlFor="websitePortfolio">Website or Portfolio (Optional)</Label>
              <Input id="websitePortfolio" {...register('websitePortfolio')} placeholder="https://example.com" />
              {errors.websitePortfolio && <p className="text-sm text-destructive mt-1">{errors.websitePortfolio.message}</p>}
            </div>
          </div>
          
          <div>
            <Label htmlFor="taxId">EIN or SSN (based on region)</Label>
            <Input id="taxId" {...register('taxId')} />
            {errors.taxId && <p className="text-sm text-destructive mt-1">{errors.taxId.message}</p>}
          </div>
    
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="governmentIdFile">Upload Government-Issued ID (Required)</Label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md border-border hover:border-primary transition-colors">
                <div className="space-y-1 text-center">
                  <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground" />
                  <div className="flex text-sm text-muted-foreground">
                    <label htmlFor="governmentIdFile" className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                      <span>{governmentIdFile ? governmentIdFile.name : 'Upload a file'}</span>
                      <Input id="governmentIdFile" type="file" className="sr-only" onChange={handleFileChange(setGovernmentIdFile)} accept="image/*,application/pdf" required />
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">PDF, PNG, JPG up to 5MB</p>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="taxCertificateFile">Tax Certificate (Optional)</Label>
               <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md border-border hover:border-primary transition-colors">
                <div className="space-y-1 text-center">
                  <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground" />
                  <div className="flex text-sm text-muted-foreground">
                    <label htmlFor="taxCertificateFile" className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                      <span>{taxCertificateFile ? taxCertificateFile.name : 'Upload a file'}</span>
                      <Input id="taxCertificateFile" type="file" className="sr-only" onChange={handleFileChange(setTaxCertificateFile)} accept="image/*,application/pdf" />
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">PDF, PNG, JPG up to 5MB</p>
                </div>
              </div>
            </div>
          </div>
    
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="agreeToTerms" checked={watch('agreeToTerms')} onCheckedChange={(checked) => setValue('agreeToTerms', checked)} />
              <Label htmlFor="agreeToTerms" className="cursor-pointer">I agree to the Boogasi Seller Terms and Conditions.</Label>
            </div>
            {errors.agreeToTerms && <p className="text-sm text-destructive">{errors.agreeToTerms.message}</p>}
          </div>
    
          <div>
            <Label htmlFor="digitalSignature">Digital Signature (Type your full name)</Label>
            <Input id="digitalSignature" {...register('digitalSignature')} placeholder="Your Full Name" />
            {errors.digitalSignature && <p className="text-sm text-destructive mt-1">{errors.digitalSignature.message}</p>}
          </div>
    
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Proceed to Agreement
          </Button>
        </form>
      );
    };
    
    export default SellerRegistrationForm;