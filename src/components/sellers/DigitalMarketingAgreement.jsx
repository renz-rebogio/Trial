import React, { useState } from 'react';
    import { useForm } from 'react-hook-form';
    import { zodResolver } from '@hookform/resolvers/zod';
    import * as z from 'zod';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Checkbox } from '@/components/ui/checkbox';
    import { useToast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useAuth } from '@/hooks/useAuth';
    import { Loader2 } from 'lucide-react';
    
    const agreementSchema = z.object({
      agreeToContractTerms: z.boolean().refine(val => val === true, { message: 'You must agree to the contract terms.' }),
      typedName: z.string().min(2, 'Signature must be at least 2 characters').max(100),
    });
    
    const DigitalMarketingAgreement = ({ sellerData, onNext }) => {
      const { user } = useAuth();
      const { toast } = useToast();
      const [isSubmitting, setIsSubmitting] = useState(false);
    
      const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
        resolver: zodResolver(agreementSchema),
        defaultValues: {
          agreeToContractTerms: sellerData?.agreed_to_terms_current || false,
          typedName: sellerData?.digital_signature || user?.user_metadata?.name || '',
        }
      });
    
      const agreementText = `
    Digital Marketing & Seller Agreement
    Boogasi Seller Agreement
    Last Updated: ${new Date().toLocaleDateString()}
    
    1. Commission Terms
    You (the Seller) agree that Boogasi ("Platform") will collect payment on your behalf for any digital product sold through the platform.
    We retain 25% of the final sale price as a service and marketing fee.
    You receive 75% of each sale.
    No listing fees, registration fees, or marketing charges. Lifetime free membership for all vendors.
    Payouts are made according to the Platform's payout schedule (e.g., biweekly or monthly, to be detailed separately).
    
    2. What We Provide
    - SEO-friendly public seller page.
    - Tools for 1-click purchase and automated delivery of digital goods.
    - Access to buyers and exposure through our marketplace.
    - Dedicated product listing form and management tools.
    - Secure payment collection.
    
    3. What You Must Provide
    - A working digital product with clear instructions for use.
    - Reliable delivery via file download or access link.
    - Product photos (up to 5 per listing).
    - Clear warranty or refund information for your products.
    - Accurate tax and identification information (e.g., SSN, EIN) as required.
    
    4. Legal Terms
    - You certify that all content and products you list are owned by you or that you have the legal right to sell them.
    - Refunds will be processed based on the policy you provide for each product. The Platform will facilitate this.
    - The Platform may remove listings or suspend accounts for products that violate laws, intellectual property rights, or marketplace guidelines.
    - Commission rates and payout terms are as stated herein and are non-negotiable. Payouts are automated based on sales.
    
    5. Signature
    By checking the box and submitting this form with your typed full name, you acknowledge that you have read, understood, and agree to be bound by the terms of this Digital Marketing & Seller Agreement.
      `;
    
      const onSubmit = async (data) => {
        if (!user || !sellerData?.id) {
          toast({ variant: "destructive", title: "Error", description: "User or seller data is missing. Please try again." });
          return;
        }
        setIsSubmitting(true);
        try {
          const { error: agreementError } = await supabase
            .from('seller_agreements')
            .insert({
              seller_id: sellerData.id,
              user_id: user.id,
              agreement_text: agreementText, 
              signed_name: data.typedName,
              signed_date: new Date().toISOString().split('T')[0], 
              ip_address: 'not_collected', 
            });
    
          if (agreementError) throw agreementError;
    
          const { data: updatedSellerData, error: sellerUpdateError } = await supabase
            .from('sellers')
            .update({ 
                status: 'pending_approval', 
                agreed_to_terms_current: true,
                digital_signature: data.typedName,
                signature_date: new Date().toISOString(),
            })
            .eq('id', sellerData.id)
            .select()
            .single();
    
          if (sellerUpdateError) throw sellerUpdateError;
          
          toast({ title: 'Agreement Signed!', description: 'You can now start listing your products.' });
          onNext(updatedSellerData);
        } catch (error) {
          toast({ variant: 'destructive', title: 'Agreement Submission Failed', description: error.message });
        } finally {
          setIsSubmitting(false);
        }
      };
    
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">Digital Marketing & Seller Agreement</h2>
          <div className="paper-document-style max-h-96 overflow-y-auto">
            <pre>{agreementText}</pre>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="agreeToContractTerms" checked={watch('agreeToContractTerms')} onCheckedChange={(checked) => setValue('agreeToContractTerms', checked)} />
                <Label htmlFor="agreeToContractTerms" className="cursor-pointer text-foreground">I agree to the Seller Terms and 25% Commission.</Label>
              </div>
              {errors.agreeToContractTerms && <p className="text-sm text-destructive">{errors.agreeToContractTerms.message}</p>}
            </div>
    
            <div>
              <Label htmlFor="typedName" className="text-foreground">Typed Full Name (Digital Signature)</Label>
              <Input id="typedName" {...register('typedName')} placeholder="Your Full Name" className="bg-input text-foreground border-border" />
              {errors.typedName && <p className="text-sm text-destructive mt-1">{errors.typedName.message}</p>}
            </div>
            
            <div>
              <Label className="text-foreground">Date</Label>
              <Input type="text" value={new Date().toLocaleDateString()} disabled className="bg-muted text-muted-foreground" />
            </div>
    
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Agree & Continue
            </Button>
          </form>
        </div>
      );
    };
    
    export default DigitalMarketingAgreement;