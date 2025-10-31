import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileImage as ImageIcon } from 'lucide-react';

const ProductImageGallery = ({ images, product, activeImageIndex, setActiveImageIndex }) => {
  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeImageIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="aspect-video bg-muted rounded-lg overflow-hidden shadow-lg border border-border"
        >
          {images.length > 0 && images[activeImageIndex]?.image_url ? (
            <img
              src={images[activeImageIndex]?.image_url}
              alt={images[activeImageIndex]?.alt_text || product.title}
              className="w-full h-full object-contain"
            />
          ) : product.video_url ? (
            <video src={product.video_url} controls className="w-full h-full object-contain"></video>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <ImageIcon size={64} className="text-muted-foreground/50" />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      {images.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {images.map((img, index) => (
            <button
              key={img.id || `img-${index}`}
              onClick={() => setActiveImageIndex(index)}
              className={`w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${activeImageIndex === index ? 'border-primary shadow-md' : 'border-transparent hover:border-muted-foreground/50'}`}
            >
              <img src={img.image_url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;