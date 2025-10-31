import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, ShoppingCart, Star, DownloadCloud, PlayCircle, ShieldCheck, Info, Tag, ExternalLink } from 'lucide-react';

const ProductPrimaryDetails = ({ product, seller, averageRating, reviewsCount, isPurchasing, onPurchase, user }) => {
  const sellerProfile = seller?.profiles;

  return (
    <div className="space-y-6">
      <motion.h1
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="text-4xl font-bold tracking-tight text-foreground leading-tight"
      >
        {product.title}
      </motion.h1>

      {sellerProfile && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <Link to={`/store/${seller.id}`} className="flex items-center group">
            <Avatar className="h-8 w-8 mr-2 border">
              <AvatarImage src={sellerProfile.avatar_url} alt={sellerProfile.screen_name} />
              <AvatarFallback>{sellerProfile.screen_name?.substring(0, 1).toUpperCase() || 'S'}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
              Sold by: {sellerProfile.screen_name || seller.company_name}
            </span>
          </Link>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-center space-x-2">
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => <Star key={i} size={20} className={i < Math.round(averageRating) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"} />)}
        </div>
        <span className="text-sm text-muted-foreground">({reviewsCount} reviews)</span>
        {product.digital_product_categories && <span className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded-full">{product.digital_product_categories.name}</span>}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="text-3xl font-semibold text-primary"
      >
        ${parseFloat(product.price).toFixed(2)}
      </motion.p>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <Button
          size="lg"
          className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg transform hover:scale-105 transition-transform"
          onClick={onPurchase}
          disabled={isPurchasing || !user}
        >
          {isPurchasing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShoppingCart className="mr-2 h-5 w-5" />}
          {isPurchasing ? 'Processing...' : (user ? 'Buy Now / Get Access' : 'Login to Purchase')}
        </Button>
      </motion.div>

      {product.short_description && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-muted-foreground text-sm">
          <p>{product.short_description}</p>
        </motion.div>
      )}

      {product.product_file_url && (
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}>
          <a href={product.product_file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-primary hover:underline">
            <DownloadCloud size={16} className="mr-1.5" /> Downloadable File Included
          </a>
        </motion.div>
      )}
      {product.video_url && (!product.images || product.images.length === 0) && (
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}>
          <a href={product.video_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-primary hover:underline">
            <PlayCircle size={16} className="mr-1.5" /> Preview Video Available
          </a>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="space-y-3 pt-4 border-t border-border">
        {product.guarantee_warranty && (
          <div className="flex items-start text-sm">
            <ShieldCheck size={18} className="mr-2 mt-0.5 text-green-500 flex-shrink-0" />
            <div><strong className="text-foreground">Guarantee/Warranty:</strong> <span className="text-muted-foreground">{product.guarantee_warranty}</span></div>
          </div>
        )}
        {product.delivery_instructions && (
          <div className="flex items-start text-sm">
            <Info size={18} className="mr-2 mt-0.5 text-blue-500 flex-shrink-0" />
            <div><strong className="text-foreground">Delivery:</strong> <span className="text-muted-foreground">{product.delivery_instructions}</span></div>
          </div>
        )}
         {product.tags && product.tags.length > 0 && (
          <div className="flex items-start text-sm">
            <Tag size={18} className="mr-2 mt-0.5 text-purple-500 flex-shrink-0" />
            <div>
              <strong className="text-foreground">Tags:</strong>
              <div className="flex flex-wrap gap-1 mt-1">
                {product.tags.map(tag => <span key={tag} className="px-1.5 py-0.5 bg-muted text-muted-foreground text-xs rounded">{tag}</span>)}
              </div>
            </div>
          </div>
        )}
        {seller?.website_portfolio && (
             <div className="flex items-start text-sm">
                <ExternalLink size={18} className="mr-2 mt-0.5 text-sky-500 flex-shrink-0" />
                <div><strong className="text-foreground">Seller's Site:</strong> <a href={seller.website_portfolio} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{seller.website_portfolio}</a></div>
             </div>
        )}
      </motion.div>
    </div>
  );
};

export default ProductPrimaryDetails;