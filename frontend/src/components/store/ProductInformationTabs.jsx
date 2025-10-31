import React from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'; // Assuming these are Radix based shadcn/ui components

const ProductInformationTabs = ({ product }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="mt-12 lg:mt-16"
    >
      <Tabs defaultValue="description" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex mb-6">
          <TabsTrigger value="description">Full Description</TabsTrigger>
          <TabsTrigger value="delivery">Delivery & Access</TabsTrigger>
        </TabsList>
        <TabsContent value="description" className="prose prose-sm max-w-none p-4 border rounded-md bg-card text-card-foreground">
           {product.full_description ? (
              <div dangerouslySetInnerHTML={{ __html: product.full_description.replace(/\n/g, '<br />') }} />
            ) : (
              <p>No detailed description provided.</p>
            )}
        </TabsContent>
        <TabsContent value="delivery" className="p-4 border rounded-md bg-card text-card-foreground">
          <h3 className="font-semibold text-lg mb-2">How You'll Get Your Product:</h3>
          {product.access_link_after_purchase && <p className="mb-2">An access link will be provided: <a href={product.access_link_after_purchase} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{product.access_link_after_purchase}</a></p>}
          {product.product_file_url && <p className="mb-2">A download link for the product file will be available: <a href={product.product_file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Download File</a></p>}
          {product.delivery_instructions && <p className="text-muted-foreground whitespace-pre-line">{product.delivery_instructions}</p>}
          {!product.access_link_after_purchase && !product.product_file_url && !product.delivery_instructions && (
            <p className="text-muted-foreground">Delivery details will be provided by the seller upon purchase.</p>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default ProductInformationTabs;