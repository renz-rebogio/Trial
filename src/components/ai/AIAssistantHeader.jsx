import React from 'react';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';

const AIAssistantHeader = () => {
  return (
    <motion.div 
      className="text-center mb-12"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="inline-block p-3 bg-gradient-to-r from-primary to-secondary rounded-full mb-4 shadow-lg">
        <Brain className="h-10 w-10 text-primary-foreground" />
      </div>
      <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent mb-4">
        Boogasi AI Financial Assistant
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
        Upload your financial documents (statements, invoices) or enter data manually. Our AI will analyze, summarize, and provide actionable insights.
      </p>
    </motion.div>
  );
};

export default AIAssistantHeader;