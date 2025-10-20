import React from 'react';
import NewDealForm from '@/components/deals/NewDealForm';
import { motion } from 'framer-motion';
import { FileSignature } from 'lucide-react';

const NewDealPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto py-8 px-4 md:px-6 lg:px-8 max-w-3xl brighter-theme-area"
    >
      <div className="flex items-center space-x-3 mb-8">
        <FileSignature className="h-10 w-10 text-[hsl(var(--boogasi-pink-val))]" />
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[hsl(var(--boogasi-pink-val))] to-[hsl(var(--boogasi-purple-val))]">
          Create New Deal
        </h1>
      </div>
      <NewDealForm />
    </motion.div>
  );
};

export default NewDealPage;