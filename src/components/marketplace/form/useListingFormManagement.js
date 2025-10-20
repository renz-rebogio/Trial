import { useState, useCallback } from 'react';
    import { useToast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/customSupabaseClient';
    
    const MAX_IMAGES = 5;
    const MAX_IMAGE_SIZE_MB = 2;
    const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
    
    export const useListingFormManagement = (bucketName, defaultPathPrefix) => {
      const { toast } = useToast();
      const [listingImages, setListingImages] = useState([]);
      const [imagePreviews, setImagePreviews] = useState([]);
    
      const handleImageUpload = useCallback((e) => {
        const files = Array.from(e.target.files);
        const newImages = []; const newPreviews = [];
        files.forEach(file => {
          if (listingImages.length + newImages.length >= MAX_IMAGES) {
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
        setListingImages(prev => [...prev, ...newImages].slice(0, MAX_IMAGES));
        setImagePreviews(prev => [...prev, ...newPreviews].slice(0, MAX_IMAGES));
        if (e.target) e.target.value = null; 
      }, [listingImages.length, toast]);
    
      const removeImage = useCallback((indexToRemove) => {
        URL.revokeObjectURL(imagePreviews[indexToRemove]);
        setListingImages(prev => prev.filter((_, index) => index !== indexToRemove));
        setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
      }, [imagePreviews]);
    
      const resetImages = useCallback(() => {
        imagePreviews.forEach(url => URL.revokeObjectURL(url));
        setListingImages([]); setImagePreviews([]);
      }, [imagePreviews]);
    
      const uploadListingImagesToStorage = useCallback(async (listingId, userId) => {
        if (listingImages.length === 0) return [];
        
        const pathPrefix = `${defaultPathPrefix}/${userId}`;
        const uploadedImageRecords = [];
    
        for (const imageFile of listingImages) {
          const fileName = `${pathPrefix}/${listingId}/${Date.now()}-${imageFile.name.replace(/\s+/g, '_')}`;
          try {
            const { data: uploadData, error: uploadError } = await supabase.storage.from(bucketName).upload(fileName, imageFile, {
              cacheControl: '3600',
              upsert: false,
              contentType: imageFile.type
            });
            if (uploadError) throw uploadError;
            
            const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(uploadData.path);
            uploadedImageRecords.push({ 
                listing_id: listingId, 
                image_url: publicUrlData.publicUrl,
                alt_text: imageFile.name 
            });
          } catch (error) {
            console.error("Error uploading image to Supabase Storage:", error);
            toast({ variant: 'destructive', title: 'Image Upload Failed', description: `Could not upload ${imageFile.name}. ${error.message}` });
          }
        }
        return uploadedImageRecords;
      }, [listingImages, bucketName, defaultPathPrefix, toast]);
    
      return {
        listingImages, imagePreviews, handleImageUpload, removeImage, resetImages, uploadListingImagesToStorage,
      };
    };