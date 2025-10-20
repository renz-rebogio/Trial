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
    import { Loader2, UploadCloud, XCircle, PlusCircle, Video } from 'lucide-react';
    
    const productSchema = z.object({
      title: z.string().min(5, 'Title must be at least 5 characters').max(150),
      shortDescription: z.string().min(10, 'Short description is too short').max(500),
      fullDescription: z.string().min(20, 'Full description is too short'),
      price: z.preprocess(
        (val) => parseFloat(String(val)),
        z.number({ invalid_type_error: "Price must be a number." }).positive({ message: "Price must be positive." })
      ),
      discountCode: z.string().optional(),
      guaranteeWarranty: z.string().min(1, 'Please select a guarantee/warranty option'),
      accessLinkAfterPurchase: z.string().url('Must be a valid URL for access/registration').optional().or(z.literal('')),
      categoryId: z.string().min(1, 'Please select a category'),
      tags: z.array(z.string().min(1)).min(1, 'Add at least one tag').max(10, 'Maximum 10 tags'),
      productFileUrl: z.string().url('Must be a valid URL for file download').optional().or(z.literal('')),
      videoUrl: z.string().url('Must be a valid URL for video').optional().or(z.literal('')),
      deliveryInstructions: z.string().optional(),
      agreeToCommission: z.boolean().refine(val => val === true, { message: 'You must agree to the 25% commission terms.' }),
    }).refine(data => data.productFileUrl || data.accessLinkAfterPurchase || data.deliveryInstructions, {
      message: "Please provide either a product file URL, an access link, or delivery instructions.",
      path: ["productFileUrl"], 
    });
    
    const MAX_IMAGES = 5;
    const MAX_IMAGE_SIZE_MB = 2;
    const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
    const MAX_VIDEO_SIZE_MB = 50;
    const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;
    const BUCKET_NAME = 'boogasi';
    
    const ProductSubmissionForm = ({ sellerData, onProductSubmitted }) => {
      const { user } = useAuth();
      const { toast } = useToast();
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [categories, setCategories] = useState([]);
      const [productImages, setProductImages] = useState([]);
      const [imagePreviews, setImagePreviews] = useState([]);
      const [productVideo, setProductVideo] = useState(null);
      const [videoPreviewName, setVideoPreviewName] = useState('');
      const [currentTag, setCurrentTag] = useState('');
    
      const { register, handleSubmit, control, formState: { errors }, setValue, watch, reset: resetForm } = useForm({
        resolver: zodResolver(productSchema),
        defaultValues: {
          title: '', shortDescription: '', fullDescription: '', price: '', discountCode: '',
          guaranteeWarranty: '', accessLinkAfterPurchase: '', categoryId: '', tags: [],
          productFileUrl: '', videoUrl: '', deliveryInstructions: '', agreeToCommission: false,
        }
      });
    
      useEffect(() => {
        const fetchCategories = async () => {
          const { data, error } = await supabase.from('digital_product_categories').select('id, name').order('name');
          if (error) toast({ variant: 'destructive', title: 'Error fetching categories', description: error.message });
          else setCategories(data || []);
        };
        fetchCategories();
      }, [toast]);
    
      const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const newImages = []; const newPreviews = [];
        files.forEach(file => {
          if (productImages.length + newImages.length >= MAX_IMAGES) {
            toast({ variant: 'destructive', title: 'Image Limit', description: `Max ${MAX_IMAGES} images.` }); return;
          }
          if (file.size > MAX_IMAGE_SIZE_BYTES) {
            toast({ variant: 'destructive', title: 'File Too Large', description: `Image "${file.name}" exceeds ${MAX_IMAGE_SIZE_MB}MB.` }); return;
          }
          if (!file.type.startsWith('image/')) {
            toast({ variant: 'destructive', title: 'Invalid File Type', description: `"${file.name}" is not an image.`}); return;
          }
          newImages.push(file); newPreviews.push(URL.createObjectURL(file));
        });
        setProductImages(prev => [...prev, ...newImages].slice(0, MAX_IMAGES));
        setImagePreviews(prev => [...prev, ...newPreviews].slice(0, MAX_IMAGES));
        e.target.value = null; 
      };
    
      const removeImage = (indexToRemove) => {
        URL.revokeObjectURL(imagePreviews[indexToRemove]);
        setProductImages(prev => prev.filter((_, index) => index !== indexToRemove));
        setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
      };
    
      const handleVideoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
          if (file.size > MAX_VIDEO_SIZE_BYTES) {
            toast({ variant: 'destructive', title: 'Video Too Large', description: `Video exceeds ${MAX_VIDEO_SIZE_MB}MB.` });
            setProductVideo(null); setVideoPreviewName(''); e.target.value = null; return;
          }
          if (!file.type.startsWith('video/')) {
            toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please upload a valid video file.' });
            setProductVideo(null); setVideoPreviewName(''); e.target.value = null; return;
          }
          setProductVideo(file); setVideoPreviewName(file.name);
        } else {
          setProductVideo(null); setVideoPreviewName('');
        }
      };
    
      const removeVideo = () => {
        setProductVideo(null); setVideoPreviewName('');
        const videoInput = document.getElementById('productVideo');
        if (videoInput) videoInput.value = null;
      };
    
      const handleAddTag = () => {
        if (currentTag.trim() && !watch('tags').includes(currentTag.trim()) && watch('tags').length < 10) {
          setValue('tags', [...watch('tags'), currentTag.trim()]); setCurrentTag('');
        } else if (watch('tags').length >= 10) {
          toast({ variant: 'destructive', title: 'Tag Limit', description: 'Maximum 10 tags allowed.' });
        }
      };
    
      const handleRemoveTag = (tagToRemove) => {
        setValue('tags', watch('tags').filter(tag => tag !== tagToRemove));
      };
    
      const uploadFileToStorage = async (file, pathPrefix, fileType) => {
        if (!file || !user || !sellerData?.id) {
            console.error("User, sellerData, or file missing for upload.");
            return null;
        }
        const fileName = `${pathPrefix}/${fileType}-${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
        try {
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, file, { cacheControl: '3600', upsert: false, contentType: file.type });
          if (uploadError) throw uploadError;
          const { data: publicURLData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(uploadData.path);
          return publicURLData.publicUrl;
        } catch (error) {
          console.error(`Error uploading ${fileType}:`, error);
          toast({ variant: 'destructive', title: `${fileType} Upload Failed`, description: error.message });
          throw error; 
        }
      };
    
      const onSubmit = async (data) => {
        if (!user || !sellerData?.id) {
          toast({ variant: "destructive", title: "Error", description: "User or seller data is missing. Please try again." });
          return;
        }
        setIsSubmitting(true);
        try {
          const tempProductIdForPath = `temp-${Date.now()}`; // Temporary ID for path construction before product is created
          const videoPathPrefix = `digital-products/${sellerData.id}/${tempProductIdForPath}`;
          
          let uploadedVideoUrl = data.videoUrl || null; 
          if (productVideo) { 
            uploadedVideoUrl = await uploadFileToStorage(productVideo, videoPathPrefix, 'video'); 
            if (!uploadedVideoUrl) throw new Error("Video upload failed and is required if file provided."); 
          }
    
          const { data: productData, error: productError } = await supabase
            .from('digital_products')
            .insert({ 
                seller_id: sellerData.id,
                user_id: user.id,
                title: data.title,
                short_description: data.shortDescription,
                full_description: data.fullDescription,
                price: data.price,
                discount_code: data.discountCode || null,
                guarantee_warranty: data.guaranteeWarranty,
                access_link_after_purchase: data.accessLinkAfterPurchase || null,
                category_id: data.categoryId,
                tags: data.tags,
                status: 'pending_approval', 
                product_file_url: data.productFileUrl || null,
                video_url: uploadedVideoUrl,
                delivery_instructions: data.deliveryInstructions || null,
             })
            .select()
            .single();
    
          if (productError) throw productError;
    
          const uploadedImageRecords = []; 
          const imagePathPrefix = `digital-products/${sellerData.id}/${productData.id}`;
          for (const imageFile of productImages) {
             try {
                const imageUrl = await uploadFileToStorage(imageFile, imagePathPrefix, 'image');
                if (imageUrl) {
                    uploadedImageRecords.push({
                        product_id: productData.id,
                        image_url: imageUrl,
                        alt_text: imageFile.name, 
                    });
                }
             } catch (imgUploadError) {
                console.warn(`Failed to upload image ${imageFile.name}: ${imgUploadError.message}`);
             }
          }
          
          if (uploadedImageRecords.length > 0) {
            const { error: imageInsertError } = await supabase.from('digital_product_images').insert(uploadedImageRecords);
            if (imageInsertError) {
                console.warn("Error inserting image records to DB:", imageInsertError.message);
            }
          }
          
          toast({ title: 'Product Submitted!', description: `${data.title} is pending approval.` });
          resetForm(); 
          imagePreviews.forEach(url => URL.revokeObjectURL(url)); 
          setImagePreviews([]); 
          setProductImages([]);
          removeVideo(); 
          if (onProductSubmitted) onProductSubmitted(productData);
        } catch (error) {
          toast({ variant: 'destructive', title: 'Product Submission Failed', description: error.message });
        } finally {
          setIsSubmitting(false);
        }
      };
    
      const guaranteeOptions = [
        { value: '7-day refund', label: '7-Day Money Back Guarantee' }, { value: '14-day refund', label: '14-Day Money Back Guarantee' },
        { value: '30-day refund', label: '30-Day Money Back Guarantee' }, { value: 'lifetime access', label: 'Lifetime Access (No Refunds)' },
        { value: 'no refund', label: 'No Refunds' }, { value: 'custom', label: 'Custom Policy (detail in description)' },
      ];
    
      return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-2 rounded-lg bg-background shadow-[0_8px_16px_rgba(255,107,0,0.2),_inset_0_0_8px_rgba(255,107,0,0.1)] border border-accent-orange/50">
          <div><Label htmlFor="title">Product Title</Label><Input id="title" {...register('title')} />{errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}</div>
          <div><Label htmlFor="shortDescription">Short Description (max 500 chars)</Label><Textarea id="shortDescription" {...register('shortDescription')} rows={3} maxLength={500} />{errors.shortDescription && <p className="text-sm text-destructive mt-1">{errors.shortDescription.message}</p>}</div>
          <div><Label htmlFor="fullDescription">Full Description</Label><Textarea id="fullDescription" {...register('fullDescription')} rows={6} />{errors.fullDescription && <p className="text-sm text-destructive mt-1">{errors.fullDescription.message}</p>}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><Label htmlFor="price">Price (USD)</Label><Input id="price" type="number" step="0.01" {...register('price')} />{errors.price && <p className="text-sm text-destructive mt-1">{errors.price.message}</p>}</div>
            <div><Label htmlFor="discountCode">Discount or Promo Code (Optional)</Label><Input id="discountCode" {...register('discountCode')} /></div>
          </div>
          <div><Label htmlFor="guaranteeWarranty">Guarantee or Warranty</Label><Controller name="guaranteeWarranty" control={control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select guarantee/warranty" /></SelectTrigger><SelectContent>{guaranteeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select>)} />{errors.guaranteeWarranty && <p className="text-sm text-destructive mt-1">{errors.guaranteeWarranty.message}</p>}</div>
          
          <div><Label>Product Images (up to {MAX_IMAGES}, max {MAX_IMAGE_SIZE_MB}MB each)</Label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md border-accent-orange/30 hover:border-accent-orange transition-colors">
              <div className="space-y-1 text-center"><UploadCloud className="mx-auto h-10 w-10 text-muted-foreground" />
                <div className="flex text-sm text-muted-foreground"><label htmlFor="productImages" className="relative cursor-pointer rounded-md font-medium text-accent-orange hover:text-accent-orange/80"><span>Upload files</span><Input id="productImages" type="file" className="sr-only" multiple onChange={handleImageUpload} accept="image/*" /></label><p className="pl-1">or drag and drop</p></div>
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to {MAX_IMAGE_SIZE_MB}MB</p>
              </div>
            </div>
            {imagePreviews.length > 0 && (<div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">{imagePreviews.map((previewUrl, index) => (<div key={index} className="relative group"><img src={previewUrl} alt={`Preview ${index + 1}`} className="h-32 w-full object-cover rounded-md shadow-md" /><Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100" onClick={() => removeImage(index)}><XCircle className="h-4 w-4" /></Button></div>))}</div>)}
          </div>
    
          <div><Label>Product Video (Optional, max {MAX_VIDEO_SIZE_MB}MB)</Label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md border-accent-orange/30 hover:border-accent-orange transition-colors">
              <div className="space-y-1 text-center"><Video className="mx-auto h-10 w-10 text-muted-foreground" />
                <div className="flex text-sm text-muted-foreground"><label htmlFor="productVideo" className="relative cursor-pointer rounded-md font-medium text-accent-orange hover:text-accent-orange/80"><span>{videoPreviewName || 'Upload a video'}</span><Input id="productVideo" type="file" className="sr-only" onChange={handleVideoUpload} accept="video/*" /></label>{videoPreviewName && <p className="pl-1">selected</p>}</div>
                <p className="text-xs text-muted-foreground">MP4, MOV, AVI up to {MAX_VIDEO_SIZE_MB}MB</p>
              </div>
            </div>
            {videoPreviewName && (<div className="mt-2 flex items-center justify-between p-2 bg-muted rounded-md"><p className="text-sm text-foreground truncate">{videoPreviewName}</p><Button type="button" variant="ghost" size="icon" onClick={removeVideo} className="text-destructive hover:text-destructive/80"><XCircle className="h-4 w-4" /></Button></div>)}
            <Label htmlFor="videoUrl" className="mt-2 block">Or provide video URL (e.g., YouTube, Vimeo)</Label>
            <Input id="videoUrl" {...register('videoUrl')} placeholder="https://youtube.com/watch?v=yourvideo" />
            {errors.videoUrl && <p className="text-sm text-destructive mt-1">{errors.videoUrl.message}</p>}
          </div>
    
          <div><Label htmlFor="accessLinkAfterPurchase">Access Link / Registration Link (Optional)</Label><Input id="accessLinkAfterPurchase" {...register('accessLinkAfterPurchase')} placeholder="https://yourproduct.com/access" />{errors.accessLinkAfterPurchase && <p className="text-sm text-destructive mt-1">{errors.accessLinkAfterPurchase.message}</p>}</div>
          <div><Label htmlFor="categoryId">Category</Label><Controller name="categoryId" control={control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select product category" /></SelectTrigger><SelectContent>{categories.map(cat => <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>)}</SelectContent></Select>)} />{errors.categoryId && <p className="text-sm text-destructive mt-1">{errors.categoryId.message}</p>}</div>
          <div><Label htmlFor="tags">Tags (max 10)</Label><div className="flex items-center gap-2"><Input id="currentTag" value={currentTag} onChange={(e) => setCurrentTag(e.target.value)} placeholder="e.g., AI, SaaS" /><Button type="button" variant="outline" onClick={handleAddTag} className="border-accent-orange text-accent-orange hover:bg-accent-orange/10"><PlusCircle className="h-4 w-4 mr-1" /> Add</Button></div>
            {watch('tags').length > 0 && (<div className="mt-2 flex flex-wrap gap-2">{watch('tags').map(tag => (<span key={tag} className="flex items-center bg-accent-orange/10 text-accent-orange text-xs font-medium px-2.5 py-0.5 rounded-full">{tag}<button type="button" onClick={() => handleRemoveTag(tag)} className="ml-1.5 text-accent-orange/70 hover:text-accent-orange"><XCircle className="h-3 w-3" /></button></span>))}</div>)}
            {errors.tags && <p className="text-sm text-destructive mt-1">{errors.tags.message}</p>}
          </div>
          <div><Label htmlFor="productFileUrl">Product File URL (Optional)</Label><Input id="productFileUrl" {...register('productFileUrl')} placeholder="https://yourstorage.com/product.zip" /><p className="text-xs text-muted-foreground mt-1">If not providing a direct file URL, use access link or delivery instructions.</p>{errors.productFileUrl && errors.productFileUrl.type !== 'refinement' && <p className="text-sm text-destructive mt-1">{errors.productFileUrl.message}</p>}</div>
          <div><Label htmlFor="deliveryInstructions">Access/Delivery Instructions (Optional)</Label><Textarea id="deliveryInstructions" {...register('deliveryInstructions')} rows={3} placeholder="e.g., After purchase, you will receive an email..." />{errors.deliveryInstructions && <p className="text-sm text-destructive mt-1">{errors.deliveryInstructions.message}</p>}</div>
          {errors.productFileUrl && errors.productFileUrl.type === 'refinement' && <p className="text-sm text-destructive mt-1">{errors.productFileUrl.message}</p>}
          <div className="space-y-2 pt-4 border-t border-accent-orange/30"><div className="flex items-center space-x-2"><Checkbox id="agreeToCommission" checked={watch('agreeToCommission')} onCheckedChange={(checked) => setValue('agreeToCommission', checked)} /><Label htmlFor="agreeToCommission" className="cursor-pointer">I agree to Boogasi Seller Terms & 25% Commission.</Label></div>{errors.agreeToCommission && <p className="text-sm text-destructive">{errors.agreeToCommission.message}</p>}</div>
          <Button type="submit" className="w-full bg-accent-orange hover:bg-accent-orange/90 text-accent-orange-foreground" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit Product</Button>
        </form>
      );
    };
    
    export default ProductSubmissionForm;