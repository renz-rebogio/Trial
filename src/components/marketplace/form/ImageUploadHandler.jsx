import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud, XCircle } from 'lucide-react';

const MAX_IMAGES = 10;
const MAX_FILE_SIZE_MB = 5;

const ImageUploadHandler = ({ imagePreviews, handleImageChange, removeImage }) => {
  return (
    <div>
      <Label htmlFor="images-upload-input" className="text-foreground">Project Images (up to {MAX_IMAGES}, max {MAX_FILE_SIZE_MB}MB each)</Label>
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md border-border hover:border-primary transition-colors">
        <div className="space-y-1 text-center">
          <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
          <div className="flex text-sm text-muted-foreground">
            <label
              htmlFor="images-upload-input"
              className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
            >
              <span>Upload files</span>
              <Input id="images-upload-input" name="images" type="file" className="sr-only" multiple onChange={handleImageChange} accept="image/*" />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to {MAX_FILE_SIZE_MB}MB</p>
        </div>
      </div>
      {imagePreviews.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {imagePreviews.map((previewUrl, index) => (
            <div key={index} className="relative group">
              <img-replace src={previewUrl} alt={`Preview ${index + 1}`} className="h-32 w-full object-cover rounded-md shadow-md" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploadHandler;