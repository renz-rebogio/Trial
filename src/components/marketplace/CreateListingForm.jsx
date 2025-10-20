import React, { useState, useEffect } from 'react';
    import { useForm, Controller } from 'react-hook-form';
    import { zodResolver } from '@hookform/resolvers/zod';
    import * as z from 'zod';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Textarea } from '@/components/ui/textarea';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Checkbox } from '@/components/ui/checkbox';
    import { useToast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useAuth } from '@/hooks/useAuth';
    import { Loader2, UploadCloud, XCircle } from 'lucide-react';
    import { useListingFormManagement } from './form/useListingFormManagement';
    
    const BUCKET_NAME = 'boogasi';
    
    const listingSchema = z.object({
      title: z.string().min(5, 'Title must be at least 5 characters').max(100),
      description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
      amount_sought: z.preprocess(
        (val) => parseFloat(String(val)),
        z.number({ invalid_type_error: "Amount must be a number"}).positive('Amount must be positive')
      ),
      category_id: z.string().min(1, 'Please select a category'),
      marketing_fee_agreed: z.boolean().refine(val => val === true, { message: 'You must agree to the marketing fee.' }),
    });
    
    const CreateListingForm = ({ onSuccess }) => {
      const { user } = useAuth();
      const { toast } = useToast();
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [categories, setCategories] = useState([]);
      
      const {
        listingImages,
        imagePreviews,
        handleImageUpload,
        removeImage,
        resetImages,
        uploadListingImagesToStorage
      } = useListingFormManagement(BUCKET_NAME, `investment-listings`);
    
    
      const { register, handleSubmit, control, formState: { errors }, setValue, watch, reset: resetForm } = useForm({
        resolver: zodResolver(listingSchema),
        defaultValues: {
          title: '', description: '', amount_sought: '', category_id: '', marketing_fee_agreed: false,
        }
      });
    
      useEffect(() => {
        const fetchCategories = async () => {
          const { data, error } = await supabase.from('categories').select('id, name').order('name');
          if (error) { toast({ variant: 'destructive', title: 'Error fetching categories', description: error.message }); } 
          else { setCategories(data || []); }
        };
        fetchCategories();
      }, [toast]);
    
      const onSubmit = async (data) => {
        if (!user) {
          toast({ variant: 'destructive', title: 'Not Authenticated', description: 'You must be logged in to create a listing.' });
          return;
        }
        setIsSubmitting(true);
        try {
          const { data: listingData, error: listingError } = await supabase
            .from('listings')
            .insert({ 
                user_id: user.profile.id,
                title: data.title,
                description: data.description,
                amount_sought: data.amount_sought,
                category_id: data.category_id,
                status: 'open', 
             })
            .select()
            .single();
    
          if (listingError) throw listingError;
    
          const uploadedImageRecords = await uploadListingImagesToStorage(listingData.id, user.id); 
          
          if (uploadedImageRecords.length > 0) {
            const imageInsertPromises = uploadedImageRecords.map(imgRec => 
              supabase.from('listing_images').insert(imgRec)
            );
            const imageInsertResults = await Promise.all(imageInsertPromises);
            imageInsertResults.forEach(result => {
              if (result.error) console.warn("Error inserting image record:", result.error.message);
            });
          }
          
          toast({ title: 'Listing Created!', description: `${data.title} is now live.` });
          resetForm();
          resetImages();
          if (onSuccess) onSuccess();
        } catch (error) {
          toast({ variant: 'destructive', title: 'Listing Creation Failed', description: error.message });
        } finally {
          setIsSubmitting(false);
        }
      };
    
      return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <Label htmlFor="title" className="text-foreground">Project Title</Label>
            <Input id="title" {...register('title')} className="bg-input border-border focus:border-[hsl(var(--brighter-blue))] focus:ring-[hsl(var(--brighter-blue))]" />
            {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
          </div>
    
          <div>
            <Label htmlFor="description" className="text-foreground">Project Description</Label>
            <Textarea id="description" {...register('description')} rows={5} className="bg-input border-border focus:border-[hsl(var(--brighter-blue))] focus:ring-[hsl(var(--brighter-blue))]" />
            {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
          </div>
    
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="amount_sought" className="text-foreground">Amount Sought (USD)</Label>
              <Input id="amount_sought" type="number" step="100" {...register('amount_sought')} className="bg-input border-border focus:border-[hsl(var(--brighter-blue))] focus:ring-[hsl(var(--brighter-blue))]" />
              {errors.amount_sought && <p className="text-sm text-destructive mt-1">{errors.amount_sought.message}</p>}
            </div>
            <div>
              <Label htmlFor="category_id" className="text-foreground">Category</Label>
              <Controller
                name="category_id"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="bg-input border-border text-foreground focus:border-[hsl(var(--brighter-blue))] focus:ring-[hsl(var(--brighter-blue))]"><SelectValue placeholder="Select project category" /></SelectTrigger>
                    <SelectContent className="bg-popover text-popover-foreground border-[hsl(var(--brighter-teal))]">
                      {categories.map(cat => <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category_id && <p className="text-sm text-destructive mt-1">{errors.category_id.message}</p>}
            </div>
          </div>
          
          <div>
            <Label className="text-foreground">Project Images (up to 5, max 2MB each)</Label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md border-border hover:border-[hsl(var(--brighter-blue))] transition-colors">
              <div className="space-y-1 text-center">
                <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground" />
                <div className="flex text-sm text-muted-foreground">
                  <label htmlFor="listingImages" className="relative cursor-pointer rounded-md font-medium text-[hsl(var(--brighter-pink))] hover:text-[hsl(var(--brighter-pink))]/80">
                    <span>Upload files</span>
                    <Input id="listingImages" type="file" className="sr-only" multiple onChange={handleImageUpload} accept="image/*" />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 2MB</p>
              </div>
            </div>
            {imagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {imagePreviews.map((previewUrl, index) => (
                  <div key={index} className="relative group">
                    <img src={previewUrl} alt={`Preview ${index + 1}`} className="h-24 w-full object-cover rounded-md shadow-md" />
                    <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 bg-[hsl(var(--brighter-pink))] hover:bg-[hsl(var(--brighter-pink))]/80" onClick={() => removeImage(index)}>
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
    
          <div className="space-y-2 p-3 border rounded-md bg-muted/30 border-[hsl(var(--brighter-teal))]/30">
            <p className="text-xs text-muted-foreground font-semibold">Seller's Agreement & Marketing Fee:</p>
            <p className="text-xs text-muted-foreground">
              By creating this listing, you agree that if an offer is accepted, a 25% marketing fee of the accepted offer amount will be payable to Boogasi LLC upon deal commitment.
            </p>
            <div className="flex items-center space-x-2 pt-1">
              <Checkbox id="marketing_fee_agreed" checked={watch('marketing_fee_agreed')} onCheckedChange={(checked) => setValue('marketing_fee_agreed', checked)} className="border-[hsl(var(--brighter-blue))] data-[state=checked]:bg-[hsl(var(--brighter-blue))]" />
              <Label htmlFor="marketing_fee_agreed" className="cursor-pointer text-xs text-foreground">I agree to the 25% marketing fee terms.</Label>
            </div>
            {errors.marketing_fee_agreed && <p className="text-sm text-destructive">{errors.marketing_fee_agreed.message}</p>}
          </div>
    
          <Button type="submit" className="w-full bg-gradient-to-r from-[hsl(var(--brighter-blue))] to-[hsl(var(--brighter-teal))] text-primary-foreground hover:opacity-90" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Listing
          </Button>
        </form>
      );
    };
    
    export default CreateListingForm;